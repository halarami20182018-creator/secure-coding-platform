import React, { useEffect, useState, useCallback } from 'react';
import { getChallenges, submitChallenge, recordChallengeResult } from '../services/api';
import './Challenges.css';

const DIFFICULTY_CONFIG = {
  Beginner:     { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Beginner'     },
  Intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Intermediate' },
  Advanced:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Advanced'     },
};

const MODULE_META = {
  'sql-injection':   { icon: '💉', color: '#3b82f6' },
  'xss':             { icon: '📜', color: '#8b5cf6' },
  'insecure-auth':   { icon: '🔐', color: '#f59e0b' },
  'path-traversal':  { icon: '📂', color: '#10b981' },
  'buffer-overflow': { icon: '💾', color: '#ef4444' },
};

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    getChallenges()
      .then(res => setChallenges(res.data.challenges || []))
      .catch(() => setError('Could not load challenges. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="ch-page">
      <div className="ch-loading"><div className="ch-spinner" /><p>Loading challenges…</p></div>
    </div>
  );

  return (
    <div className="ch-page">
      {selected
        ? <Workspace challengeId={selected} onBack={() => setSelected(null)} />
        : <ChallengeList challenges={challenges} error={error} onSelect={setSelected} />
      }
    </div>
  );
}

/* ── Challenge list ─────────────────────────────────────────────────── */

function ChallengeList({ challenges, error, onSelect }) {
  return (
    <>
      {/* Header */}
      <div className="ch-header">
        <div className="ch-header-text">
          <h1>💪 Coding Challenges</h1>
          <p>Apply what you've learned — each challenge presents vulnerable code and asks you to rewrite it securely.</p>
        </div>
        <div className="ch-header-stats">
          <div className="ch-stat"><span className="ch-stat-val">{challenges.length}</span><span className="ch-stat-lbl">Challenges</span></div>
          <div className="ch-stat"><span className="ch-stat-val">5</span><span className="ch-stat-lbl">Modules</span></div>
        </div>
      </div>

      {error && <div className="ch-error">{error}</div>}

      {/* Grid */}
      <div className="ch-grid">
        {challenges.map((ch, i) => {
          const diff = DIFFICULTY_CONFIG[ch.difficulty] || DIFFICULTY_CONFIG.Beginner;
          const meta = MODULE_META[ch.module_id] || { icon: '🛡️', color: '#64748b' };
          return (
            <div
              key={ch.id}
              className="ch-card"
              style={{ '--accent': meta.color, animationDelay: `${i * 0.07}s` }}
              onClick={() => onSelect(ch.id)}
            >
              <div className="ch-card-accent" />
              <div className="ch-card-top">
                <span className="ch-card-icon">{meta.icon}</span>
                <span className="ch-card-diff" style={{ color: diff.color, background: diff.bg }}>
                  {diff.label}
                </span>
              </div>
              <h3 className="ch-card-title">{ch.title}</h3>
              <p className="ch-card-desc">{ch.description}</p>
              <div className="ch-card-footer">
                <span className="ch-card-time">⏱ {ch.estimated_time}</span>
                <span className="ch-card-lang">{ch.language}</span>
              </div>
              <button className="ch-card-btn">Start Challenge →</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Challenge workspace ────────────────────────────────────────────── */

function Workspace({ challengeId, onBack }) {
  const [challenge,  setChallenge]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [userCode,   setUserCode]   = useState('');
  const [result,     setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hintIdx,    setHintIdx]    = useState(-1);   // -1 = no hints shown
  const [saved,      setSaved]      = useState(false);
  const [view,       setView]       = useState('split'); // 'split' | 'editor' | 'reference'

  useEffect(() => {
    import('../services/api').then(({ getChallenge }) => {
      getChallenge(challengeId)
        .then(res => { setChallenge(res.data); setUserCode(''); })
        .catch(() => setLoading(false))
        .finally(() => setLoading(false));
    });
  }, [challengeId]);

  const handleSubmit = useCallback(async () => {
    if (!userCode.trim()) return;
    setSubmitting(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await submitChallenge({ challenge_id: challengeId, code: userCode });
      setResult(res.data);
      // Save progress
      try {
        await recordChallengeResult({
          challenge_id: challengeId,
          passed: res.data.passed,
          score:  res.data.score,
        });
        setSaved(true);
      } catch { /* fail silently */ }
    } catch {
      setResult({ passed: false, feedback: 'Submission failed. Please try again.', score: 0 });
    } finally {
      setSubmitting(false);
    }
  }, [challengeId, userCode]);

  const showNextHint = () => setHintIdx(i => Math.min(i + 1, (challenge?.hints?.length || 1) - 1));

  if (loading) return <div className="ch-loading"><div className="ch-spinner" /><p>Loading…</p></div>;
  if (!challenge) return null;

  const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.Beginner;
  const meta = MODULE_META[challenge.module_id] || { icon: '🛡️', color: '#64748b' };
  const hints = challenge.hints || [];
  const allHintsShown = hintIdx >= hints.length - 1;

  return (
    <div className="ws-root">

      {/* ── Top bar ── */}
      <div className="ws-topbar">
        <button className="ws-back" onClick={onBack}>← All Challenges</button>
        <div className="ws-topbar-center">
          <span className="ws-icon">{meta.icon}</span>
          <span className="ws-title">{challenge.title}</span>
          <span className="ws-diff" style={{ color: diff.color, background: diff.bg }}>{diff.label}</span>
          <span className="ws-lang">{challenge.language}</span>
        </div>
        <div className="ws-view-toggle">
          {['split','reference','editor'].map(v => (
            <button key={v} className={`ws-vbtn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v === 'split' ? '⬛⬛' : v === 'reference' ? '◧' : '◨'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Instructions banner ── */}
      <div className="ws-instructions">
        <span className="ws-inst-icon">📋</span>
        <span>{challenge.instructions}</span>
      </div>

      {/* ── Main workspace ── */}
      <div className={`ws-layout ws-${view}`}>

        {/* Left panel — reference code */}
        {view !== 'editor' && (
          <div className="ws-panel ws-panel-left">
            <div className="ws-panel-header">
              <span className="ws-panel-label vuln-label">⚠️ Vulnerable Code</span>
              <span className="ws-panel-hint">Read only — for reference</span>
            </div>
            <div className="ws-code-wrap">
              <pre className="ws-code vuln-code">{challenge.vulnerable_code}</pre>
            </div>

            {/* Hints */}
            <div className="ws-hints">
              {hints.slice(0, hintIdx + 1).map((h, i) => (
                <div key={i} className="ws-hint" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="ws-hint-num">Hint {i + 1}</span>
                  <span className="ws-hint-text">{h}</span>
                </div>
              ))}
              {!allHintsShown && (
                <button className="ws-hint-btn" onClick={showNextHint}>
                  💡 {hintIdx === -1 ? 'Show first hint' : `Show hint ${hintIdx + 2} of ${hints.length}`}
                </button>
              )}
              {allHintsShown && hints.length > 0 && (
                <div className="ws-hints-done">✅ All hints shown</div>
              )}
            </div>
          </div>
        )}

        {/* Right panel — student editor */}
        {view !== 'reference' && (
          <div className="ws-panel ws-panel-right">
            <div className="ws-panel-header">
              <span className="ws-panel-label secure-label">✏️ Your Secure Solution</span>
              <span className="ws-char-count">{userCode.length} chars</span>
            </div>

            <textarea
              className="ws-editor"
              value={userCode}
              onChange={e => { setUserCode(e.target.value); setResult(null); setSaved(false); }}
              spellCheck={false}
              placeholder="Write your secure solution here…"
            />

            {/* Submit area */}
            <div className="ws-submit-row">
              <button
                className={`ws-submit-btn ${submitting ? 'loading' : ''}`}
                onClick={handleSubmit}
                disabled={submitting || !userCode.trim()}
              >
                {submitting
                  ? <><span className="ws-btn-spinner" /> Checking…</>
                  : '✅ Submit Solution'
                }
              </button>
              <button
                className="ws-reset-btn"
                onClick={() => { setUserCode(challenge.vulnerable_code); setResult(null); }}
              >
                ↺ Reset
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`ws-result ${result.passed ? 'passed' : 'failed'}`}>
                <div className="ws-result-header">
                  <div className="ws-result-left">
                    <span className="ws-result-emoji">{result.passed ? '🎉' : '❌'}</span>
                    <div>
                      <div className="ws-result-title">
                        {result.passed ? 'Challenge Passed!' : 'Not quite right'}
                      </div>
                      {result.score !== undefined && (
                        <div className="ws-result-score">
                          Score: <strong>{result.score}%</strong>
                          {saved && <span className="ws-saved-tag">📊 Saved</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  {result.score !== undefined && (
                    <div className="ws-score-ring">
                      <svg viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" className="ring-track" />
                        <circle
                          cx="20" cy="20" r="16"
                          className={`ring-fill ${result.passed ? 'ring-pass' : 'ring-fail'}`}
                          strokeDasharray={`${result.score * 1.005} 100`}
                          strokeDashoffset="25"
                        />
                      </svg>
                      <span className="ring-label">{result.score}%</span>
                    </div>
                  )}
                </div>

                <p className="ws-result-feedback">{result.feedback}</p>

                {result.explanation && (
                  <div className="ws-result-explanation">
                    <span className="ws-expl-icon">💡</span>
                    <div>
                      <strong>Why this matters:</strong>
                      <p>{result.explanation}</p>
                    </div>
                  </div>
                )}

                {!result.passed && (
                  <button
                    className="ws-retry-btn"
                    onClick={() => { setResult(null); setUserCode(challenge.vulnerable_code); }}
                  >
                    ↺ Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}