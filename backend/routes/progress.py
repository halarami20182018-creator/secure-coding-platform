import time
import json
import os
from flask import Blueprint, jsonify, request
from models.auth import login_required, get_current_user

progress_bp = Blueprint("progress", __name__)

DATA_DIR      = os.path.join(os.path.dirname(__file__), '..', 'data')
PROGRESS_FILE = os.path.join(DATA_DIR, 'progress.json')

os.makedirs(DATA_DIR, exist_ok=True)


def _load():
    if not os.path.exists(PROGRESS_FILE):
        return {}
    try:
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save(data):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def _user_progress(all_data, user_id):
    if user_id not in all_data:
        all_data[user_id] = {"modules": {}, "challenges": {}}
    return all_data[user_id]


# ── Get summary ────────────────────────────────────────────────────────────

@progress_bp.route("/summary", methods=["GET"])
@login_required
def get_summary():
    user     = get_current_user()
    all_data = _load()
    data     = _user_progress(all_data, user["user_id"])

    modules    = data["modules"]
    challenges = data["challenges"]

    completed_modules    = sum(1 for m in modules.values()    if m.get("completed"))
    completed_challenges = sum(1 for c in challenges.values() if c.get("passed"))
    quiz_scores          = [m["quiz_score"] for m in modules.values() if m.get("quiz_score") is not None]
    avg_quiz             = round(sum(quiz_scores) / len(quiz_scores)) if quiz_scores else None

    return jsonify({
        "completed_modules":    completed_modules,
        "total_modules":        5,
        "completed_challenges": completed_challenges,
        "total_challenges":     5,
        "avg_quiz_score":       avg_quiz,
        "quizzes_taken":        len(quiz_scores),
        "modules":              modules,
        "challenges":           challenges,
    }), 200


# ── Record section view ────────────────────────────────────────────────────

@progress_bp.route("/section", methods=["POST"])
@login_required
def record_section():
    user      = get_current_user()
    body      = request.get_json() or {}
    module_id = body.get("module_id", "")
    section_i = body.get("section_index")

    if not module_id or section_i is None:
        return jsonify({"error": "module_id and section_index required"}), 400

    all_data = _load()
    data     = _user_progress(all_data, user["user_id"])
    mdata    = data["modules"].setdefault(module_id, {
        "sections_viewed": [], "quiz_score": None,
        "quiz_attempts": 0, "completed": False,
        "started_at": time.time(), "completed_at": None,
    })

    if section_i not in mdata["sections_viewed"]:
        mdata["sections_viewed"].append(section_i)

    _save(all_data)
    return jsonify({"ok": True, "sections_viewed": mdata["sections_viewed"]}), 200


# ── Record quiz result ─────────────────────────────────────────────────────

@progress_bp.route("/quiz", methods=["POST"])
@login_required
def record_quiz():
    user      = get_current_user()
    body      = request.get_json() or {}
    module_id = body.get("module_id", "")
    score     = body.get("score")
    passed    = body.get("passed", False)
    correct   = body.get("correct", 0)
    total_q   = body.get("total_questions", 0)

    if not module_id or score is None:
        return jsonify({"error": "module_id and score required"}), 400

    all_data = _load()
    data     = _user_progress(all_data, user["user_id"])
    mdata    = data["modules"].setdefault(module_id, {
        "sections_viewed": [], "quiz_score": None,
        "quiz_attempts": 0, "completed": False,
        "started_at": time.time(), "completed_at": None,
    })

    mdata["quiz_attempts"] += 1
    if mdata["quiz_score"] is None or score > mdata["quiz_score"]:
        mdata["quiz_score"]   = score
        mdata["quiz_correct"] = correct
        mdata["quiz_total"]   = total_q

    if passed and not mdata["completed"]:
        mdata["completed"]    = True
        mdata["completed_at"] = time.time()

    _save(all_data)
    return jsonify({"ok": True, "quiz_score": mdata["quiz_score"], "completed": mdata["completed"]}), 200


# ── Record challenge result ────────────────────────────────────────────────

@progress_bp.route("/challenge", methods=["POST"])
@login_required
def record_challenge():
    user         = get_current_user()
    body         = request.get_json() or {}
    challenge_id = body.get("challenge_id", "")
    passed       = body.get("passed", False)
    score        = body.get("score", 0)

    if not challenge_id:
        return jsonify({"error": "challenge_id required"}), 400

    all_data = _load()
    data     = _user_progress(all_data, user["user_id"])
    cdata    = data["challenges"].setdefault(challenge_id, {
        "attempts": 0, "passed": False, "score": 0,
        "first_attempted_at": time.time(), "passed_at": None,
    })

    cdata["attempts"] += 1
    if score > cdata["score"]:
        cdata["score"] = score
    if passed and not cdata["passed"]:
        cdata["passed"]    = True
        cdata["passed_at"] = time.time()

    _save(all_data)
    return jsonify({"ok": True, "passed": cdata["passed"], "score": cdata["score"]}), 200
