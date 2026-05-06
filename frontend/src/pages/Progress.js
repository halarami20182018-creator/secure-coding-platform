import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProgressSummary } from '../services/api';
import './Progress.css';

const MODULES = [
  { id: 'sql-injection',   icon: '💉', title: 'SQL Injection',           difficulty: 'Beginner',     sections: 6, quizCount: 3 },
  { id: 'xss',             icon: '📜', title: 'Cross-Site Scripting',    difficulty: 'Beginner',     sections: 7, quizCount: 3 },
  { id: 'insecure-auth',   icon: '🔐', title: 'Insecure Authentication', difficulty: 'Intermediate', sections: 6, quizCount: 3 },
  { id: 'path-traversal',  icon: '📂', title: 'Path Traversal',          difficulty: 'Intermediate', sections: 6, quizCount: 3 },
  { id: 'buffer-overflow', icon: '💾', title: 'Buffer Overflow',         difficulty: 'Advanced',     sections: 6, quizCount: 3 },
];

const CHALLENGES = [
  { id: 'ch1', title: 'Fix the Login Query',           module: 'SQL Injection',           icon: '💉' },
  { id: 'ch2', title: 'Sanitise the Comment Display',  module: 'XSS',                     icon: '📜' },
  { id: 'ch3', title: 'Upgrade Password Storage',      module: 'Insecure Authentication', icon: '🔐' },
  { id: 'ch4', title: 'Secure the File Download',      module: 'Path Traversal',          icon: '📂' },
  { id: 'ch5', title: 'Replace Unsafe Input Function', module: 'Buffer Overflow',         icon: '💾' },
];

const DIFF = {
  Beginner:     { color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  Intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  Advanced:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
};

export default function Progress() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [activeTab,setActiveTab]= useState('overview');

  useEffect(() => {
    getProgressSummary()
      .then(res => setData(res.data))
      .catch(() => setError('Could not load progress. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="prog-page">
      <div className="prog-loading"><div className="prog-spinner"/><p>Loading your progress…</p></div>
    </div>
  );
  if (error) return (
    <div className="prog-page"><div className="prog-error">{error}</div></div>
  );

  const mods  = data?.modules    || {};
  const chals = data?.challenges || {};
  const completedMods  = data?.completed_modules    || 0;
  const completedChals = data?.completed_challenges || 0;
  const avgQuiz        = data?.avg_quiz_score       ?? null;
  const quizzesTaken   = data?.quizzes_taken        || 0;
  const overallPct     = Math.round(((completedMods/5)*60) + ((completedChals/5)*40));
  const initials       = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || '??';

  const levelLabel =
    overallPct === 0   ? { text: '🌱 Just Starting', cls: 'lvl-new'       } :
    overallPct < 40    ? { text: '📘 Learning',       cls: 'lvl-learning'  } :
    overallPct < 80    ? { text: '⚡ Progressing',    cls: 'lvl-mid'       } :
    overallPct < 100   ? { text: '🔥 Advanced',       cls: 'lvl-advanced'  } :
                         { text: '🏆 Complete!',       cls: 'lvl-complete'  };

  const circumference = 2 * Math.PI * 50; // r=50
  const dash = (overallPct / 100) * circumference;

  return (
    <div className="prog-page">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <div className="prog-hero">
        <div className="prog-hero-left">
          <div className="prog-avatar">{initials}</div>
          <div className="prog-hero-info">
            <h1 className="prog-name">{user?.name}</h1>
            <p className="prog-email">{user?.email}</p>
            <span className={`prog-level ${levelLabel.cls}`}>{levelLabel.text}</span>
          </div>
        </div>

        <div className="prog-donut-wrap">
          <svg viewBox="0 0 120 120" className="prog-donut">
            <circle cx="60" cy="60" r="50" className="donut-track"/>
            <circle
              cx="60" cy="60" r="50"
              className="donut-progress"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
            />
          </svg>
          <div className="donut-center">
            <span className="donut-pct">{overallPct}%</span>
            <span className="donut-label">done</span>
          </div>
        </div>
      </div>

      {/* ══ STAT CARDS ════════════════════════════════════════════════ */}
      <div className="prog-stats-row">
        {[
          { icon:'📚', val:`${completedMods}/5`,   lbl:'Modules',       sub:`${5-completedMods} left`,          color:'#3b82f6' },
          { icon:'💪', val:`${completedChals}/5`,  lbl:'Challenges',    sub:`${5-completedChals} left`,         color:'#10b981' },
          { icon:'🎯', val: avgQuiz!==null?`${avgQuiz}%`:'—', lbl:'Avg Quiz', sub:quizzesTaken>0?`${quizzesTaken} taken`:'None yet', color:'#f59e0b' },
          { icon:'⏱',  val:`${completedMods*25+completedChals*12}m`, lbl:'Est. Time', sub:'Based on completions', color:'#8b5cf6' },
        ].map((s,i) => (
          <div key={i} className="prog-stat-card" style={{'--c':s.color}}>
            <div className="psc-icon">{s.icon}</div>
            <div className="psc-val">{s.val}</div>
            <div className="psc-lbl">{s.lbl}</div>
            <div className="psc-sub">{s.sub}</div>
            <div className="psc-glow"/>
          </div>
        ))}
      </div>

      {/* ══ TABS ══════════════════════════════════════════════════════ */}
      <div className="prog-tabs">
        {['overview','modules','challenges'].map(t => (
          <button key={t} className={`prog-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>
            {t==='overview'?'📊 Overview':t==='modules'?'📚 Modules':'💪 Challenges'}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
      {activeTab==='overview' && (
        <div className="prog-tab-content">

          <div className="ov-section">
            <div className="ov-section-head">
              <h3>Modules</h3>
              <button className="ov-link" onClick={()=>navigate('/modules')}>Go to modules →</button>
            </div>
            <div className="ov-module-grid">
              {MODULES.map(m => {
                const p   = mods[m.id]||{};
                const done= !!p.completed;
                const pct = done?100:Math.min(100,Math.round(((p.sections_viewed||[]).length/m.sections)*100));
                return (
                  <div key={m.id} className={`ov-mod-card ${done?'done':pct>0?'started':''}`}
                    onClick={()=>navigate(`/modules/${m.id}`)}>
                    <div className="ov-mod-top">
                      <span className="ov-mod-icon">{m.icon}</span>
                      <span className="ov-mod-status">{done?'✅':pct>0?'🔄':'⏳'}</span>
                    </div>
                    <div className="ov-mod-name">{m.title}</div>
                    <div className="ov-mod-diff" style={{color:DIFF[m.difficulty].color,background:DIFF[m.difficulty].bg}}>
                      {m.difficulty}
                    </div>
                    <div className="ov-bar"><div className="ov-bar-fill" style={{width:`${pct}%`}}/></div>
                    <div className="ov-mod-pct">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ov-section">
            <div className="ov-section-head">
              <h3>Challenges</h3>
              <button className="ov-link" onClick={()=>navigate('/challenges')}>Go to challenges →</button>
            </div>
            <div className="ov-chal-list">
              {CHALLENGES.map(c => {
                const p=chals[c.id]||{};
                const passed=!!p.passed;
                const score=p.score||0;
                const tries=p.attempts||0;
                return (
                  <div key={c.id} className={`ov-chal-row ${passed?'passed':tries>0?'tried':''}`}>
                    <span className="ov-chal-icon">{c.icon}</span>
                    <div className="ov-chal-info">
                      <span className="ov-chal-name">{c.title}</span>
                      <span className="ov-chal-mod">{c.module}</span>
                    </div>
                    <div className="ov-chal-right">
                      {score>0 && <span className={`ov-score ${passed?'pass':'fail'}`}>{score}%</span>}
                      <span className="ov-chal-status">{passed?'✅':tries>0?'🔄':'⏳'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {overallPct===0 && (
            <div className="prog-empty">
              <div className="prog-empty-icon">🚀</div>
              <h3>Ready to begin?</h3>
              <p>Start a module — your progress is tracked automatically.</p>
              <button className="prog-cta" onClick={()=>navigate('/modules')}>Start Learning →</button>
            </div>
          )}
        </div>
      )}

      {/* ══ MODULES TAB ═══════════════════════════════════════════════ */}
      {activeTab==='modules' && (
        <div className="prog-tab-content">
          {MODULES.map((m,i) => {
            const p    = mods[m.id]||{};
            const done = !!p.completed;
            const views= (p.sections_viewed||[]).length;
            const pct  = done?100:Math.min(100,Math.round((views/m.sections)*100));
            const quiz = p.quiz_score??null;
            const tries= p.quiz_attempts||0;
            const diff = DIFF[m.difficulty];
            return (
              <div key={m.id} className={`mod-row-card ${done?'done':pct>0?'started':''}`}
                style={{animationDelay:`${i*0.07}s`}}>
                <div className="mrc-icon">{m.icon}</div>
                <div className="mrc-body">
                  <div className="mrc-title">{m.title}</div>
                  <div className="mrc-meta">
                    <span className="mrc-diff" style={{color:diff.color,background:diff.bg}}>{m.difficulty}</span>
                    <span className="mrc-stat">{views}/{m.sections} sections</span>
                    {tries>0 && <span className="mrc-stat">{tries} quiz attempt{tries>1?'s':''}</span>}
                  </div>
                  <div className="mrc-bar-wrap">
                    <div className="mrc-bar"><div className="mrc-bar-fill" style={{width:`${pct}%`}}/></div>
                    <span className="mrc-pct">{pct}%</span>
                  </div>
                </div>
                <div className="mrc-right">
                  {quiz!==null
                    ? <div className={`mrc-quiz ${quiz>=66?'good':'low'}`}>
                        <span className="mrc-quiz-val">{quiz}%</span>
                        <span className="mrc-quiz-lbl">Quiz</span>
                      </div>
                    : <div className="mrc-quiz none">
                        <span className="mrc-quiz-val">—</span>
                        <span className="mrc-quiz-lbl">Quiz</span>
                      </div>
                  }
                  <span className={`mrc-pill ${done?'done':pct>0?'started':'not'}`}>
                    {done?'✅ Complete':pct>0?'🔄 In Progress':'⏳ Not Started'}
                  </span>
                  <button className="mrc-btn" onClick={()=>navigate(`/modules/${m.id}`)}>
                    {done?'Review':pct>0?'Continue':'Start'} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ CHALLENGES TAB ════════════════════════════════════════════ */}
      {activeTab==='challenges' && (
        <div className="prog-tab-content">
          {CHALLENGES.map((c,i) => {
            const p     = chals[c.id]||{};
            const passed= !!p.passed;
            const score = p.score||0;
            const tries = p.attempts||0;
            return (
              <div key={c.id} className={`chal-row-card ${passed?'passed':tries>0?'tried':''}`}
                style={{animationDelay:`${i*0.07}s`}}>
                <div className="crc-icon">{c.icon}</div>
                <div className="crc-body">
                  <div className="crc-title">{c.title}</div>
                  <div className="crc-module">{c.module}</div>
                </div>
                {tries>0 && (
                  <div className="crc-stats">
                    <div className="crc-stat">
                      <span className="crc-stat-val">{tries}</span>
                      <span className="crc-stat-lbl">Attempt{tries>1?'s':''}</span>
                    </div>
                    {score>0 && (
                      <div className="crc-stat">
                        <span className={`crc-stat-val ${passed?'good':'low'}`}>{score}%</span>
                        <span className="crc-stat-lbl">Best</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="crc-right">
                  <span className={`mrc-pill ${passed?'done':tries>0?'started':'not'}`}>
                    {passed?'✅ Passed':tries>0?'🔄 Attempted':'⏳ Not Started'}
                  </span>
                  <button className="mrc-btn" onClick={()=>navigate('/challenges')}>
                    {passed?'Review':tries>0?'Retry':'Start'} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
