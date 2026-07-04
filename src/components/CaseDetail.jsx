import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function safeJSON(str, fallback = []) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

function EvidencePanel({ caseFile, onEvidenceAdded }) {
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const submit = async () => {
    if (files.length === 0 && !url.trim()) return;
    setLoading(true); setError('');
    try {
      const result = await api.uploadEvidence(caseFile.id, files, url.trim() || null);
      if (result.error) throw new Error(result.error);
      setFiles([]); setUrl('');
      onEvidenceAdded(result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="section-card">
      <div className="section-card-header"><span className="section-card-title">Add Evidence</span></div>
      <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div className="auth-error">{error}</div>}
        <div
          className={`upload-zone ${drag ? 'drag-over' : ''}`}
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <div className="upload-zone-icon">+</div>
          <div className="upload-zone-text">{files.length > 0 ? `${files.length} file(s) selected` : 'Drop any file or click to browse'}</div>
          <div className="upload-zone-sub">PDF, Word, images, audio, video, text, CSV</div>
          <input ref={fileRef} type="file" multiple accept="*/*" style={{ display: 'none' }} onChange={e => setFiles(Array.from(e.target.files))} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or paste a URL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <input className="input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
        <button
          className="btn btn-dark"
          onClick={submit}
          disabled={loading || (files.length === 0 && !url.trim())}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Analysing evidence...' : 'Submit Evidence'}
        </button>
      </div>
    </div>
  );
}

function InvestigationChat({ caseId }) {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    setLoading(true);
    api.getMessages(caseId).then(msgs => {
      setMessages(msgs.map(m => ({ role: m.role, text: m.text })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      const result = await api.investigate(caseId, q, history);
      setMessages(prev => [...prev, { role: 'ai', text: result.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="section-card">
      <div className="section-card-header"><span className="section-card-title">Ask the Case</span></div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40, lineHeight: 1.6 }}>
              Ask anything about this case — suspects, timelines, contradictions.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role === 'user' ? 'user' : 'ai'}`}>
              <div className="chat-bubble markdown-body">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-msg-ai">
              <div className="chat-bubble">
                <div className="chat-thinking"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input
            placeholder="e.g. Who had access to the building that night?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="chat-send-btn" onClick={send} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen = true, children, rightHeader }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-card">
      <div 
        className="section-card-header" 
        style={{ cursor: 'pointer', userSelect: 'none' }} 
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            fontSize: 10, 
            color: 'var(--text-muted)', 
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            display: 'inline-block'
          }}>
            ▶
          </span>
          <span className="section-card-title">{title}</span>
        </div>
        {rightHeader && <span>{rightHeader}</span>}
      </div>
      {open && <div className="section-card-body">{children}</div>}
    </div>
  );
}

export function CaseDetail({ caseId, onBack }) {
  const [caseFile, setCaseFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const reload = () => {
    setLoading(true);
    api.getCase(caseId).then(setCaseFile).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [caseId]);

  const setStatus = async (status) => {
    setUpdating(true);
    try {
      const updated = await api.updateCase(caseId, { status });
      setCaseFile(prev => ({ ...prev, ...updated }));
    } finally { setUpdating(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!caseFile) return <div className="page-error">Case not found.</div>;

  const keyFacts = safeJSON(caseFile.keyFacts);
  const persons   = safeJSON(caseFile.persons);
  const locations = safeJSON(caseFile.locations);
  const leads     = safeJSON(caseFile.leads);

  return (
    <div className="case-detail">
      <div className="case-detail-header">
        <div className="breadcrumb">
          <button onClick={onBack}>My Cases</button>
          <span>/</span>
          <span>{caseFile.caseNumber}</span>
        </div>
        <div className="case-title-row">
          <h1 className="case-title">{caseFile.title}</h1>
          <div className="case-actions">
            {caseFile.status === 'active'
              ? <button className="btn btn-secondary btn-sm" onClick={() => setStatus('closed')} disabled={updating}>Close Case</button>
              : <button className="btn btn-secondary btn-sm" onClick={() => setStatus('active')} disabled={updating}>Reopen</button>
            }
            <button className="btn btn-danger btn-sm" onClick={async () => { await api.deleteCase(caseId); onBack(); }}>
              Delete
            </button>
          </div>
        </div>
        <div className="case-meta">
          <span className={`badge badge-${caseFile.status}`}>{caseFile.status}</span>
          <span className={`badge badge-${caseFile.priority}`}>{caseFile.priority}</span>
          <span className="case-meta-item">Opened {formatDate(caseFile.createdAt)}</span>
          <span className="case-meta-item">Updated {formatDate(caseFile.updatedAt)}</span>
          {caseFile.description && <span className="case-meta-item" style={{ color: 'var(--text-secondary)' }}>{caseFile.description}</span>}
        </div>
      </div>

      <div className="case-dashboard">
        <div className="case-dashboard-main">

          {caseFile.summary ? (
            <CollapsibleSection title="Case Summary" defaultOpen={true}>
              <p className="summary-text">{caseFile.summary}</p>
            </CollapsibleSection>
          ) : (
            <CollapsibleSection title="Case Summary" defaultOpen={true}>
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <h3>No summary yet</h3>
                <p>Upload evidence to generate an automatic case summary.</p>
              </div>
            </CollapsibleSection>
          )}

          {keyFacts.length > 0 && (
            <CollapsibleSection 
              title="Key Facts" 
              defaultOpen={true}
              rightHeader={<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{keyFacts.length} data points</span>}
            >
              <div className="key-facts-list">
                {keyFacts.map((f, i) => (
                  <div key={i} className="key-fact"><div className="key-fact-dot" /><span>{f}</span></div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {(persons.length > 0 || locations.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {persons.length > 0 && (
                <CollapsibleSection title="Persons of Interest" defaultOpen={true}>
                  <div className="entity-tags">
                    {persons.map((p, i) => <span key={i} className="entity-tag">{p}</span>)}
                  </div>
                </CollapsibleSection>
              )}
              {locations.length > 0 && (
                <CollapsibleSection title="Locations" defaultOpen={true}>
                  <div className="entity-tags">
                    {locations.map((l, i) => <span key={i} className="entity-tag">{l}</span>)}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          )}

          {leads.length > 0 && (
            <CollapsibleSection title="Recommended Leads" defaultOpen={true}>
              <div className="leads-list">
                {leads.map((l, i) => (
                  <div key={i} className="lead-item"><span className="lead-arrow">-&gt;</span><span>{l}</span></div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          <InvestigationChat caseId={caseId} />
        </div>

        <div className="case-dashboard-side">
          <EvidencePanel caseFile={caseFile} onEvidenceAdded={reload} />

          <CollapsibleSection 
            title="Evidence Log" 
            defaultOpen={true}
            rightHeader={<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{caseFile.evidence?.length || 0} items</span>}
          >
            {(!caseFile.evidence || caseFile.evidence.length === 0) ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                No evidence uploaded yet.
              </div>
            ) : (
              <div className="evidence-list">
                {caseFile.evidence.map(ev => (
                  <div key={ev.id} className="evidence-item">
                    <span className="evidence-type-icon">{ev.type === 'url' ? 'URL' : 'FILE'}</span>
                    <span className="evidence-label">{ev.label}</span>
                    <span className="evidence-date">{formatDate(ev.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
