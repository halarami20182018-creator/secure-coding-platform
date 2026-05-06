import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModules } from '../services/api';
import './Modules.css';

const DIFFICULTY_COLOUR = {
  Beginner:     'badge-success',
  Intermediate: 'badge-warning',
  Advanced:     'badge-danger',
};

const OWASP_ICONS = {
  'sql-injection':  '💉',
  'xss':            '📜',
  'insecure-auth':  '🔐',
  'path-traversal': '📂',
  'buffer-overflow':'💾',
};

export default function Modules() {
  const [modules, setModules]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    getModules()
      .then(res => setModules(res.data.modules))
      .catch(() => setError('Could not load modules. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const visible = filter === 'All'
    ? modules
    : modules.filter(m => m.difficulty === filter);

  if (loading) return <div className="page"><div className="loader">Loading modules…</div></div>;
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>;

  return (
    <div className="page modules-page">
      <div className="modules-header">
        <div>
          <h1>Learning Modules</h1>
          <p className="text-muted">
            Five OWASP Top 10 vulnerability types — each with explanations, code examples, and a quiz.
          </p>
        </div>
        <div className="filter-bar">
          {difficulties.map(d => (
            <button
              key={d}
              className={`filter-btn ${filter === d ? 'active' : ''}`}
              onClick={() => setFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="modules-grid">
        {visible.map((mod, i) => (
          <div
            key={mod.id}
            className="module-card"
            onClick={() => navigate(`/modules/${mod.id}`)}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="module-card-icon">{OWASP_ICONS[mod.id] || '🛡️'}</div>
            <div className="module-card-body">
              <div className="module-card-meta">
                <span className={`badge ${DIFFICULTY_COLOUR[mod.difficulty]}`}>
                  {mod.difficulty}
                </span>
                <span className="text-muted module-time">⏱ {mod.estimated_time}</span>
              </div>
              <h3 className="module-card-title">{mod.title}</h3>
              <p className="module-card-owasp">{mod.owasp_category}</p>
              <p className="module-card-desc">{mod.description}</p>
              <div className="module-card-stats">
                <span>📚 {mod.section_count} sections</span>
                <span>❓ {mod.quiz_count} quiz questions</span>
              </div>
              <div className="module-card-cwe">
                {mod.cwe?.map(c => (
                  <span key={c} className="cwe-tag">{c}</span>
                ))}
              </div>
            </div>
            <div className="module-card-arrow">→</div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty-state">No modules match this filter.</div>
      )}
    </div>
  );
}
