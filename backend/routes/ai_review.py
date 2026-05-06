import os, json
from flask import Blueprint, jsonify, request
from models.auth import login_required

ai_review_bp = Blueprint("ai_review", __name__)

SUPPORTED_LANGUAGES = ["python","javascript","typescript","java","c","cpp","php","ruby","go"]
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a secure coding educator reviewing student code for security vulnerabilities.
Respond with ONLY a valid JSON object — no markdown fences, no text outside the JSON.

Structure:
{
  "overall_rating": "Poor|Fair|Good|Excellent",
  "rating_score": 0-100,
  "summary": "brief assessment",
  "issues": [
    {
      "id": "issue_1",
      "title": "short title",
      "severity": "Critical|High|Medium|Low|Informational",
      "owasp": "e.g. A03:2021 - Injection",
      "cwe": "e.g. CWE-89",
      "line_reference": "e.g. Line 3 or null",
      "explanation": "why this is a vulnerability",
      "fix": "how to fix it"
    }
  ],
  "secure_version": "full rewritten secure code with comments",
  "learning_note": "one key takeaway"
}
OUTPUT ONLY THE JSON OBJECT."""


def extract_json(raw):
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines).strip()
    if not raw.startswith("{"):
        s, e = raw.find("{"), raw.rfind("}")
        if s != -1 and e != -1:
            raw = raw[s:e+1]
    return json.loads(raw)


def call_groq(code, language):
    from groq import Groq
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f"Review this {language} code:\n\n```{language}\n{code}\n```\n\nJSON only."},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    return extract_json(response.choices[0].message.content)


@ai_review_bp.route("/analyze", methods=["POST"])
@login_required
def analyze():
    data     = request.get_json() or {}
    code     = data.get("code", "").strip()
    language = data.get("language", "python").lower()

    if not code:
        return jsonify({"error": "No code provided."}), 400
    if len(code) > 10000:
        return jsonify({"error": "Code exceeds 10,000 character limit."}), 400
    if language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": f"Unsupported language."}), 400
    if not os.environ.get("GROQ_API_KEY"):
        return jsonify(_demo(code, language)), 200
    try:
        return jsonify(call_groq(code, language)), 200
    except json.JSONDecodeError:
        return jsonify({"error": "Could not parse AI response. Please try again."}), 500
    except Exception as e:
        msg = str(e)
        if "401" in msg or "invalid_api_key" in msg.lower():
            return jsonify({"error": "Invalid Groq API key."}), 500
        if "rate_limit" in msg.lower():
            return jsonify({"error": "Rate limit reached. Wait a moment and try again."}), 429
        return jsonify({"error": f"AI review failed: {msg}"}), 500


def _demo(code, language):
    issues = []
    if ("+" in code or "f'" in code) and "query" in code.lower():
        issues.append({"id":"i1","title":"SQL Injection","severity":"Critical","owasp":"A03:2021","cwe":"CWE-89","line_reference":None,"explanation":"User input concatenated into SQL query.","fix":"Use parameterised queries."})
    if "md5" in code.lower():
        issues.append({"id":"i2","title":"Weak Hashing (MD5)","severity":"High","owasp":"A07:2021","cwe":"CWE-916","line_reference":None,"explanation":"MD5 is too fast for passwords.","fix":"Use bcrypt with rounds=12."})
    if "gets(" in code:
        issues.append({"id":"i3","title":"Buffer Overflow via gets()","severity":"Critical","owasp":"A03:2021","cwe":"CWE-120","line_reference":None,"explanation":"No bounds checking.","fix":"Use fgets(buf, sizeof(buf), stdin)."})
    if "innerHTML" in code:
        issues.append({"id":"i4","title":"XSS via innerHTML","severity":"High","owasp":"A03:2021","cwe":"CWE-79","line_reference":None,"explanation":"User data written to innerHTML.","fix":"Use textContent instead."})
    score  = max(20, 100 - len(issues)*20)
    rating = "Excellent" if score>=90 else "Good" if score>=70 else "Fair" if score>=50 else "Poor"
    return {"overall_rating":rating,"rating_score":score,"summary":f"Demo mode — {len(issues)} issue(s) found.","issues":issues,"secure_version":"# Add GROQ_API_KEY for full secure version.","learning_note":"Always validate user input before use."}
