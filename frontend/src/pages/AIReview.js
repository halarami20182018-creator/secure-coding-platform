import React, { useState } from 'react';
import { analyzeCode } from '../services/api';
import './AIReview.css';

const LANGUAGES = [
  { value: 'python',     label: 'Python'     },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java',       label: 'Java'       },
  { value: 'c',          label: 'C'          },
  { value: 'cpp',        label: 'C++'        },
  { value: 'php',        label: 'PHP'        },
  { value: 'go',         label: 'Go'         },
];

const SEVERITY_CONFIG = {
  Critical:      { colour: '#9b2335', bg: '#fff5f5', icon: '🔴' },
  High:          { colour: '#c05621', bg: '#fffaf0', icon: '🟠' },
  Medium:        { colour: '#744210', bg: '#fffbeb', icon: '🟡' },
  Low:           { colour: '#276749', bg: '#f0fff4', icon: '🟢' },
  Informational: { colour: '#2b6cb0', bg: '#ebf8ff', icon: '🔵' },
};

const RATING_CONFIG = {
  Poor:      { colour: '#9b2335', bg: '#fff5f5', emoji: '❌' },
  Fair:      { colour: '#744210', bg: '#fffbeb', emoji: '⚠️' },
  Good:      { colour: '#276749', bg: '#f0fff4', emoji: '✅' },
  Excellent: { colour: '#2b6cb0', bg: '#ebf8ff', emoji: '🏆' },
};

const DEMO_SNIPPETS = [
  {
    label: 'SQL Injection (Python)',
    language: 'python',
    code: `def get_user(username):
    query = "SELECT * FROM users WHERE username='" + username + "'"
    cursor.execute(query)
    return cursor.fetchone()

def login(username, password):
    user = get_user(username)
    if user and user['password'] == password:
        return True
    return False`,
  },
  {
    label: 'XSS (JavaScript)',
    language: 'javascript',
    code: `app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(\`
    <h1>Results for: \${query}</h1>
    <div id="results"></div>
    <script>
      document.getElementById('results').innerHTML = '\${query}';
    </script>
  \`);
});`,
  },
  {
    label: 'Weak Auth (Python)',
    language: 'python',
    code: `import hashlib
import time

def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()

def create_session(user_id):
    token = hashlib.md5(f"{user_id}{time.time()}".encode()).hexdigest()
    return token

def store_user(username, password):
    hashed = hash_password(password)
    db.execute(f"INSERT INTO users VALUES ('{username}', '{hashed}')")`,
  },
];

export default function AIReview() {
  const [code,     setCode]     = useState('');
  const [language, setLanguage] = useState('python');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showSecure, setShowSecure] = useState(false);

  async function handleAnalyze() {
    if (!code.trim()) { setError('Please paste some code to analyse.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    setShowSecure(false);
    try {
      const res = await analyzeCode(code, language);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  function loadSnippet(snippet) {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setResult(null);
    setError('');
  }

  function handleClear() {
    setCode('');
    setResult(null);
    setError('');
  }

  const rating = result ? RATING_CONFIG[result.overall_rating] : null;

  return (
    <div className="page ai-review-page">

      {/* ── Header ── */}
      <div className="ai-header">
        <div>
          <h1>🤖 AI Code Security Review</h1>
          <p className="text-muted">
            Paste code — AI powered by Claude will identify security vulnerabilities,
            explain why they matter, and suggest secure alternatives.
          </p>
        </div>
      </div>

      <div className="ai-layout">

        {/* ── Left: Input panel ── */}
        <div className="ai-input-panel">

          {/* Demo snippets */}
          <div className="demo-snippets">
            <span className="demo-label">Try an example:</span>
            {DEMO_SNIPPETS.map((s, i) => (
              <button key={i} className="demo-btn" onClick={() => loadSnippet(s)}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Language selector */}
          <div className="lang-row">
            <label htmlFor="language">Language:</label>
            <select
              id="language"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="lang-select"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <span className="char-count">{code.length} / 10,000</span>
          </div>

          {/* Code editor */}
          <textarea
            className="code-editor"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`Paste your ${language} code here…\n\nThe AI will analyse it for security vulnerabilities including:\n• SQL Injection\n• Cross-Site Scripting (XSS)\n• Insecure Authentication\n• Path Traversal\n• Buffer Overflows\n• And more…`}
            spellCheck={false}
          />

          {error && <div className="ai-error">{error}</div>}

          {/* Actions */}
          <div className="ai-actions">
            <button
              className="btn btn-primary analyze-btn"
              onClick={handleAnalyze}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <><span className="spinner" /> Analysing…</>
              ) : (
                '🔍 Analyse Code'
              )}
            </button>
            {code && (
              <button className="btn btn-outline" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Results panel ── */}
        <div className="ai-results-panel">
          {!result && !loading && (
            <div className="results-placeholder">
              <div className="placeholder-icon">🔐</div>
              <h3>Your analysis will appear here</h3>
              <p>Paste code on the left and click Analyse Code to receive a detailed security review.</p>
              <div className="placeholder-features">
                <div className="placeholder-feature">🎯 Identifies OWASP Top 10 vulnerabilities</div>
                <div className="placeholder-feature">📖 Explains why each issue matters</div>
                <div className="placeholder-feature">✅ Provides secure code alternatives</div>
                <div className="placeholder-feature">🤖 Spots AI-generated code pitfalls</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="results-loading">
              <div className="loading-spinner" />
              <p>Analysing your code for security vulnerabilities…</p>
            </div>
          )}

          {result && (
            <div className="results-content">

              {/* Overall rating */}
              <div className="rating-card" style={{ background: rating.bg, borderColor: rating.colour }}>
                <div className="rating-left">
                  <span className="rating-emoji">{rating.emoji}</span>
                  <div>
                    <div className="rating-label">Security Rating</div>
                    <div className="rating-value" style={{ color: rating.colour }}>
                      {result.overall_rating}
                    </div>
                  </div>
                </div>
                <div className="rating-score" style={{ color: rating.colour }}>
                  {result.rating_score}<span>/100</span>
                </div>
              </div>

              {/* Summary */}
              <p className="result-summary">{result.summary}</p>

              {/* Issues */}
              {result.issues?.length > 0 ? (
                <div className="issues-section">
                  <h3>🚨 Issues Found ({result.issues.length})</h3>
                  <div className="issues-list">
                    {result.issues.map((issue, i) => {
                      const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Informational;
                      return (
                        <IssueCard key={issue.id || i} issue={issue} sev={sev} />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="no-issues">
                  🎉 No security issues detected in this code.
                </div>
              )}

              {/* Secure version toggle */}
              {result.secure_version && (
                <div className="secure-version-section">
                  <button
                    className="secure-toggle-btn"
                    onClick={() => setShowSecure(s => !s)}
                  >
                    {showSecure ? '▲ Hide' : '▼ Show'} Secure Version
                  </button>
                  {showSecure && (
                    <pre className="secure-code-block">
                      <code>{result.secure_version}</code>
                    </pre>
                  )}
                </div>
              )}

              {/* Learning note */}
              {result.learning_note && (
                <div className="learning-note">
                  <span className="learning-icon">💡</span>
                  <div>
                    <strong>Key Takeaway</strong>
                    <p>{result.learning_note}</p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function IssueCard({ issue, sev }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="issue-card" style={{ borderLeftColor: sev.colour }}>
      <button className="issue-header" onClick={() => setOpen(o => !o)}>
        <div className="issue-header-left">
          <span className="sev-icon">{sev.icon}</span>
          <div>
            <div className="issue-title">{issue.title}</div>
            <div className="issue-meta">
              <span className="issue-badge" style={{ background: sev.bg, color: sev.colour }}>
                {issue.severity}
              </span>
              {issue.owasp && <span className="issue-owasp">{issue.owasp}</span>}
              {issue.cwe   && <span className="issue-cwe">{issue.cwe}</span>}
            </div>
          </div>
        </div>
        <span className="issue-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="issue-body">
          {issue.line_reference && (
            <p className="issue-line"><strong>Location:</strong> {issue.line_reference}</p>
          )}
          <div className="issue-explanation">
            <strong>Why this is a vulnerability:</strong>
            <p>{issue.explanation}</p>
          </div>
          <div className="issue-fix">
            <strong>How to fix it:</strong>
            <p>{issue.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}
