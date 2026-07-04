import React, { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_FILTERS = ['all', 'active', 'closed', 'archived'];
const PRIORITY_OPTS = ['low', 'medium', 'high', 'critical'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function NewCaseModal({ userId, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true); setError('');
    try {
      const c = await api.createCase(userId, title.trim(), description.trim(), priority);
      onCreate(c); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Open New Case</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: 14 }}>{error}</div>}
        <form className="modal-form" onSubmit={submit}>
          <div>
            <label className="input-label">Case Title</label>
            <input className="input" placeholder="e.g. Meridian Capital Fraud — Q3 2024" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="input-label">Brief Description</label>
            <textarea className="input" rows={3} placeholder="What is this case about?" value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="input-label">Priority</label>
            <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-dark" disabled={loading}>
              {loading ? 'Creating...' : 'Open Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CasesView({ user, onOpenCase, defaultFilter }) {
  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState(defaultFilter || 'all');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getCases(user.id, filter === 'all' ? undefined : filter)
      .then(setCases).catch(console.error).finally(() => setLoading(false));
  }, [user.id, filter]);

  const filtered = cases.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active: cases.filter(c => c.status === 'active').length,
    closed: cases.filter(c => c.status === 'closed').length,
    total: cases.length,
  };

  return (
    <>
      {showNew && (
        <NewCaseModal userId={user.id} onClose={() => setShowNew(false)} onCreate={c => setCases(prev => [c, ...prev])} />
      )}

      <div className="cases-page">
        <div className="cases-stats">
          {[
            { label: 'Total Cases', value: stats.total, color: 'var(--text-primary)' },
            { label: 'Active',      value: stats.active, color: 'var(--green)' },
            { label: 'Closed',      value: stats.closed, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="cases-topbar">
          <h1>My Cases</h1>
          <button className="btn btn-dark" onClick={() => setShowNew(true)}>+ Open New Case</button>
        </div>

        <div className="cases-toolbar">
          <input className="input" placeholder="Search by title or case number..." value={search} onChange={e => setSearch(e.target.value)} />
          {STATUS_FILTERS.map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No cases found</h3>
            <p>Open a new case to start building your investigation.</p>
            <button className="btn btn-dark" style={{ marginTop: 20 }} onClick={() => setShowNew(true)}>Open New Case</button>
          </div>
        ) : (
          <div className="cases-grid">
            {filtered.map(c => (
              <button key={c.id} className="case-card" onClick={() => onOpenCase(c)}>
                <div className="case-card-header">
                  <div>
                    <div className="case-card-title">{c.title}</div>
                    <div className="case-card-number">{c.caseNumber}</div>
                  </div>
                  <div className="case-card-badges">
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                    <span className={`badge badge-${c.priority}`}>{c.priority}</span>
                  </div>
                </div>
                {c.description && <div className="case-card-desc">{c.description}</div>}
                <div className="case-card-foot">
                  <span className="case-card-foot-item">Opened {formatDate(c.createdAt)}</span>
                  {c.evidence?.length > 0 && (
                    <span className="case-card-foot-item">
                      {c.evidence.length} evidence item{c.evidence.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
