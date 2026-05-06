import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModule, recordSectionView, recordQuizResult } from '../services/api';
import './ModuleDetail.css';

export default function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [module,        setModule]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeSection, setActive]        = useState(0);
  const [viewedSections,setViewed]        = useState(new Set());
  const [codeTab,       setCodeTab]       = useState({});
  const [checklist,     setChecklist]     = useState({});
  const [quizAnswers,   setQuizAnswers]   = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore,     setQuizScore]     = useState(0);
  const [quizSaved,     setQuizSaved]     = useState(false);

  useEffect(() => {
    getModule(id)
      .then(res => {
        setModule(res.data);
        const cl = {};
        res.data.sections?.forEach(s => {
          if (s.type === 'checklist') s.items.forEach(i => { cl[i.id] = false; });
        });
        setChecklist(cl);
        // Record first section view immediately
        recordSectionView({ module_id: id, section_index: 0 }).catch(() => {});
        setViewed(new Set([0]));
      })
      .catch(() => navigate('/modules'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Record section view whenever tab changes
  function handleSectionChange(idx) {
    setActive(idx);
    if (!viewedSections.has(idx)) {
      setViewed(prev => new Set([...prev, idx]));
      recordSectionView({ module_id: id, section_index: idx }).catch(() => {});
    }
  }

  if (loading) return <div className="page"><div className="loader">Loading module…</div></div>;
  if (!module) return null;

  const sections = module.sections || [];
  const quiz     = module.quiz     || [];

  // ── Quiz handlers ──────────────────────────────────────
  function handleQuizAnswer(qid, idx) {
    if (!quizSubmitted) setQuizAnswers(prev => ({ ...prev, [qid]: idx }));
  }

  async function submitQuiz() {
    let correct = 0;
    quiz.forEach(q => { if (quizAnswers[q.id] === q.correct) correct++; });
    const score  = Math.round((correct / quiz.length) * 100);
    const passed = score >= 66;
    setQuizScore(score);
    setQuizSubmitted(true);

    // Save to backend
    try {
      await recordQuizResult({
        module_id:       id,
        score,
        passed,
        correct,
        total_questions: quiz.length,
      });
      setQuizSaved(true);
    } catch {
      // fail silently — don't disrupt the quiz experience
    }
  }

  function resetQuiz() {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizSaved(false);
  }

  function toggleCheck(itemId) {
    setChecklist(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems   = Object.keys(checklist).length;

  function renderSection(section, idx) {
    switch (section.type) {
      case 'explanation':    return <ExplanationSection key={idx} section={section} />;
      case 'scenario':       return <ScenarioSection    key={idx} section={section} />;
      case 'types':          return <TypesSection       key={idx} section={section} />;
      case 'code_comparison':return <CodeSection        key={idx} section={section} codeTab={codeTab} setCodeTab={setCodeTab} />;
      case 'principles':     return <PrinciplesSection  key={idx} section={section} />;
      case 'checklist':      return <ChecklistSection   key={idx} section={section} checklist={checklist} toggle={toggleCheck} checked={checkedCount} total={totalItems} />;
      case 'ai_warning':     return <AIWarningSection   key={idx} section={section} />;
      default:               return null;
    }
  }

  const diffColour = { Beginner: 'badge-success', Intermediate: 'badge-warning', Advanced: 'badge-danger' };
  const totalTabs  = sections.length + (quiz.length > 0 ? 1 : 0);
  const progressPct = Math.round((viewedSections.size / totalTabs) * 100);

  return (
    <div className="module-detail page">

      <button className="back-btn" onClick={() => navigate('/modules')}>← Back to Modules</button>

      {/* ── Header ── */}
      <div className="module-hero">
        <div className="module-hero-meta">
          <span className={`badge ${diffColour[module.difficulty]}`}>{module.difficulty}</span>
          <span className="badge badge-info">{module.estimated_time}</span>
          {module.cwe?.map(c => <span key={c} className="cwe-tag">{c}</span>)}
        </div>
        <h1>{module.title}</h1>
        <p className="module-owasp-label">{module.owasp_category}</p>
        <p className="module-hero-desc">{module.description}</p>
      </div>

      {/* ── Progress bar ── */}
      <div className="module-progress-wrap">
        <div className="module-progress-track">
          <div className="module-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="module-progress-label">
          {viewedSections.size}/{totalTabs} sections visited
          {quizSaved && <span className="quiz-saved-tag">✅ Quiz saved</span>}
        </span>
      </div>

      {/* ── Learning objectives ── */}
      <div className="objectives-box card">
        <h3>🎯 Learning Objectives</h3>
        <ul className="objectives-list">
          {module.learning_objectives?.map((obj, i) => <li key={i}>{obj}</li>)}
        </ul>
      </div>

      {/* ── Section tabs ── */}
      <div className="section-tabs">
        {sections.map((s, i) => (
          <button
            key={i}
            className={`section-tab ${activeSection === i ? 'active' : ''} ${viewedSections.has(i) ? 'visited' : ''}`}
            onClick={() => handleSectionChange(i)}
          >
            {viewedSections.has(i) && activeSection !== i && <span className="tab-tick">✓ </span>}
            {s.title}
          </button>
        ))}
        {quiz.length > 0 && (
          <button
            className={`section-tab ${activeSection === sections.length ? 'active' : ''} ${quizSubmitted ? 'visited' : ''}`}
            onClick={() => handleSectionChange(sections.length)}
          >
            {quizSubmitted && activeSection !== sections.length && <span className="tab-tick">✓ </span>}
            📝 Quiz
          </button>
        )}
      </div>

      {/* ── Section content ── */}
      <div className="section-content">
        {activeSection < sections.length
          ? renderSection(sections[activeSection], activeSection)
          : <QuizSection
              quiz={quiz}
              answers={quizAnswers}
              submitted={quizSubmitted}
              score={quizScore}
              onAnswer={handleQuizAnswer}
              onSubmit={submitQuiz}
              onReset={resetQuiz}
            />
        }
      </div>

      {/* ── Navigation ── */}
      <div className="section-nav">
        <button
          className="btn btn-outline"
          disabled={activeSection === 0}
          onClick={() => handleSectionChange(activeSection - 1)}
        >
          ← Previous
        </button>
        <span className="section-progress">{activeSection + 1} / {totalTabs}</span>
        <button
          className="btn btn-primary"
          disabled={activeSection === totalTabs - 1}
          onClick={() => handleSectionChange(activeSection + 1)}
        >
          Next →
        </button>
      </div>

    </div>
  );
}

// ── Section components (same as before) ────────────────────────────────────

function ExplanationSection({ section }) {
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      <p className="section-text">{section.content}</p>
      {section.key_concept && (
        <div className="key-concept">
          <span className="key-concept-label">💡 Key Concept</span>
          <p>{section.key_concept}</p>
        </div>
      )}
    </div>
  );
}

function ScenarioSection({ section }) {
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      <div className="scenario-box">
        <div className="scenario-icon">⚠️</div>
        <p>{section.scenario}</p>
      </div>
      {section.impact && (
        <div className="impact-list">
          <h3>Potential Impact</h3>
          <ul>
            {section.impact.map((item, i) => (
              <li key={i} className="impact-item"><span className="impact-dot">🔴</span>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TypesSection({ section }) {
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      <div className="types-grid">
        {section.types?.map((t, i) => (
          <div key={i} className="type-card">
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            {t.example && <pre className="inline-code">{t.example}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeSection({ section, codeTab, setCodeTab }) {
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      {section.examples?.map((ex, i) => {
        const tabKey  = `${section.id}-${i}`;
        const current = codeTab[tabKey] || 'vulnerable';
        return (
          <div key={i} className="code-example">
            <div className="code-example-header">
              <span className="code-label">{ex.label}</span>
              <div className="code-tabs">
                <button className={`code-tab ${current === 'vulnerable' ? 'active-vuln' : ''}`}
                  onClick={() => setCodeTab(p => ({ ...p, [tabKey]: 'vulnerable' }))}>
                  ❌ Vulnerable
                </button>
                <button className={`code-tab ${current === 'secure' ? 'active-secure' : ''}`}
                  onClick={() => setCodeTab(p => ({ ...p, [tabKey]: 'secure' }))}>
                  ✅ Secure
                </button>
              </div>
            </div>
            {current === 'vulnerable' ? (
              <div>
                <pre className="code-block code-vulnerable"><code>{ex.vulnerable.code}</code></pre>
                <div className="code-annotation problem"><strong>⚠️ Why this is vulnerable:</strong> {ex.vulnerable.problem}</div>
              </div>
            ) : (
              <div>
                <pre className="code-block code-secure"><code>{ex.secure.code}</code></pre>
                <div className="code-annotation fix"><strong>✅ Why this is secure:</strong> {ex.secure.fix}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrinciplesSection({ section }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      <p className="section-text">{section.content}</p>
      <div className="principles-list">
        {section.principles?.map((p, i) => (
          <div key={i} className={`principle-item ${open === i ? 'open' : ''}`}>
            <button className="principle-header" onClick={() => setOpen(open === i ? null : i)}>
              <span className="principle-title">{p.title}</span>
              <span className="principle-chevron">{open === i ? '▲' : '▼'}</span>
            </button>
            {open === i && (
              <div className="principle-body">
                <p>{p.detail}</p>
                {p.example && <pre className="inline-code">{p.example}</pre>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistSection({ section, checklist, toggle, checked, total }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      <div className="progress-bar-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-label">{checked}/{total} checked</span>
      </div>
      <div className="checklist">
        {section.items?.map(item => (
          <label key={item.id} className={`checklist-item ${checklist[item.id] ? 'checked' : ''}`}>
            <input type="checkbox" checked={!!checklist[item.id]} onChange={() => toggle(item.id)} />
            <span>{item.text}</span>
          </label>
        ))}
      </div>
      {pct === 100 && <div className="checklist-complete">🎉 All prevention strategies noted!</div>}
    </div>
  );
}

function AIWarningSection({ section }) {
  return (
    <div className="section-block">
      <h2>{section.title}</h2>
      <div className="ai-warning-box">
        <div className="ai-warning-icon">🤖</div>
        <p>{section.content}</p>
      </div>
      {section.red_flags && (
        <div className="red-flags">
          <h3>🚩 Red Flags to Look For</h3>
          {section.red_flags.map((flag, i) => (
            <div key={i} className="red-flag-item"><code>{flag}</code></div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizSection({ quiz, answers, submitted, score, onAnswer, onSubmit, onReset }) {
  const allAnswered = quiz.every(q => answers[q.id] !== undefined);
  return (
    <div className="section-block quiz-section">
      <h2>📝 Knowledge Check</h2>
      <p className="section-text">Test your understanding. Select one answer per question then submit.</p>

      {submitted && (
        <div className={`quiz-result ${score === 100 ? 'perfect' : score >= 66 ? 'pass' : 'fail'}`}>
          <span className="quiz-result-icon">{score === 100 ? '🏆' : score >= 66 ? '✅' : '📖'}</span>
          <div>
            <strong>You scored {score}%</strong>
            <p>{score === 100 ? 'Perfect! Excellent understanding.' : score >= 66 ? 'Good effort — review the explanations below.' : 'Keep studying — revisit the sections above and try again.'}</p>
          </div>
        </div>
      )}

      <div className="quiz-questions">
        {quiz.map((q, qi) => {
          const selected = answers[q.id];
          return (
            <div key={q.id} className="quiz-question">
              <p className="quiz-q-text"><strong>Q{qi + 1}.</strong> {q.question}</p>
              <div className="quiz-options">
                {q.options.map((opt, oi) => {
                  let cls = 'quiz-option';
                  if (submitted) {
                    if (oi === q.correct)                  cls += ' correct';
                    else if (oi === selected)              cls += ' wrong';
                  } else if (oi === selected)              cls += ' selected';
                  return (
                    <button key={oi} className={cls} onClick={() => onAnswer(q.id, oi)} disabled={submitted}>
                      <span className="quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && <div className="quiz-explanation"><strong>Explanation:</strong> {q.explanation}</div>}
            </div>
          );
        })}
      </div>

      <div className="quiz-actions">
        {!submitted
          ? <button className="btn btn-primary" disabled={!allAnswered} onClick={onSubmit}>Submit Answers</button>
          : <button className="btn btn-outline" onClick={onReset}>Try Again</button>
        }
      </div>
    </div>
  );
}
