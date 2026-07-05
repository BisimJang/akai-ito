import React, { useState } from 'react';

const FAQS = [
  { q: 'What file types can I upload?', a: 'Anything — PDF, Word documents, images, audio, video, CSV, plain text, and more. If it has content, we can extract it.' },
  { q: 'Is my case data private?', a: 'All case data is stored locally on your machine using SQLite. Nothing is sent to third-party servers except for AI analysis via your own API keys.' },
  { q: 'How does the AI analysis work?', a: 'When you upload evidence, the AI extracts structured data — key facts, persons, locations, timelines, and leads. Cognee builds a knowledge graph so you can ask questions about any uploaded evidence.' },
  { q: 'Can I reopen a closed case?', a: 'Yes. Cases can be toggled between active, closed, and archived at any time. All evidence and analysis is preserved.' },
  { q: 'Is this suitable for real legal cases?', a: 'Akai Ito is a research and organisation tool. It does not provide legal advice. All AI-generated findings should be independently verified.' },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)}>
        {q}
        <span className={`faq-chevron ${open ? 'open' : ''}`}>+</span>
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
}

// Static node-graph SVG — Obsidian style, no animation
function NodeGraph() {
  const nodes = [
    { id: 'center', x: 260, y: 160, r: 10, label: 'Case File', primary: true },
    { id: 'n1', x: 100, y: 60,  r: 7,  label: 'Witness Statement' },
    { id: 'n2', x: 380, y: 50,  r: 7,  label: 'Financial Records' },
    { id: 'n3', x: 60,  y: 220, r: 6,  label: 'Location' },
    { id: 'n4', x: 420, y: 230, r: 8,  label: 'Suspect A' },
    { id: 'n5', x: 200, y: 290, r: 6,  label: 'Timeline' },
    { id: 'n6', x: 360, y: 300, r: 6,  label: 'Motive' },
    { id: 'n7', x: 130, y: 170, r: 5,  label: 'Email Thread' },
    { id: 'n8', x: 300, y: 130, r: 5,  label: 'Phone Records' },
  ];

  const edges = [
    ['center', 'n1'], ['center', 'n2'], ['center', 'n3'],
    ['center', 'n4'], ['center', 'n5'], ['center', 'n6'],
    ['n1', 'n7'], ['n2', 'n8'], ['n4', 'n6'],
    ['n7', 'n3'], ['n8', 'n2'], ['n5', 'n6'],
    ['n1', 'n4'],
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <svg viewBox="0 0 480 350" width="100%" style={{ maxWidth: 480, display: 'block' }}>
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d1d1f" stopOpacity="1" />
          <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* Edges */}
      {edges.map(([a, b], i) => {
        const na = nodeMap[a];
        const nb = nodeMap[b];
        return (
          <line
            key={i}
            x1={na.x} y1={na.y}
            x2={nb.x} y2={nb.y}
            stroke="#c8c8cc"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => (
        <g key={n.id}>
          <circle
            cx={n.x} cy={n.y} r={n.r}
            fill={n.primary ? '#1d1d1f' : '#6e6e73'}
            opacity={n.primary ? 1 : 0.75}
          />
          <text
            x={n.x}
            y={n.y + n.r + 11}
            textAnchor="middle"
            fontSize="9"
            fill="#6e6e73"
            fontFamily="Inter, sans-serif"
            letterSpacing="0.02em"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function LandingPage({ user, onGetStarted }) {
  return (
    <div className="landing">

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="landing-nav-brand-dot" />
          Akai Ito
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#faq" className="landing-nav-link">FAQ</a>
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <button className="btn btn-dark" onClick={onGetStarted}>Go to Dashboard</button>
          ) : (
            <>
              <button className="btn btn-ghost-dark" onClick={onGetStarted}>Sign In</button>
              <button className="btn btn-dark" onClick={onGetStarted}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-eyebrow">AI Investigation Platform</div>
        <h1 className="landing-hero-title">
          When Memory Fails,<br />Evidence Speaks.
        </h1>
        <p className="landing-hero-sub">
          Upload case files, transcripts, and web evidence. Akai Ito builds a
          living knowledge graph — so you can ask any question and get answers, instantly.
        </p>
        <div className="landing-hero-ctas">
          <button className="btn btn-dark btn-lg" onClick={onGetStarted}>
            {user ? 'Go to Dashboard' : 'Start Free — No Credit Card'}
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
          >
            See How It Works
          </button>
        </div>
        <p className="landing-hero-note">
          Ideal for use cases like:
        </p>
      </section>

      {/* Social proof bar */}
      <div className="landing-proof">
        <p className="landing-proof-label">Designed for professionals who deal with complex cases</p>
        <div className="landing-proof-tags">
          {[
            'Defense Counsel',
            'Prosecution Teams',
            'Private Investigators',
            'Investigative Journalists',
            'Compliance Officers',
            'Insurance Analysts',
          ].map(t => (
            <span key={t} className="landing-proof-tag">{t}</span>
          ))}
        </div>
      </div>

      {/* Problem — node graph layout */}
      <section className="landing-problem-section">
        <div className="landing-problem-inner">
          <div className="landing-problem-text">
            <p className="landing-section-label">The Problem</p>
            <h2 className="landing-section-title">
              Cases are complex.<br />Memory is not enough.
            </h2>
            <p className="landing-section-body">
              Investigators and lawyers deal with hundreds of documents, dozens
              of witnesses, and timelines that span years. Critical connections
              get missed. Evidence gets buried. Crucial details fade.
            </p>
            <div className="landing-problem-points">
              <div className="landing-problem-point">
                <div className="landing-problem-point-line" />
                <div>
                  <h4>Evidence Overload</h4>
                  <p>Thousands of pages of documents, emails, and transcripts — no system to connect them.</p>
                </div>
              </div>
              <div className="landing-problem-point">
                <div className="landing-problem-point-line" />
                <div>
                  <h4>Memory Gaps</h4>
                  <p>You cannot hold every detail in your head. Witnesses contradict each other and the gaps become cracks.</p>
                </div>
              </div>
              <div className="landing-problem-point">
                <div className="landing-problem-point-line" />
                <div>
                  <h4>Time Pressure</h4>
                  <p>Deadlines, hearings, and court dates do not wait. You need answers fast, not days into document review.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-problem-graph">
            <NodeGraph />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features-section">
        <div className="landing-section-inner">
          <div className="landing-features-header">
            <p className="landing-section-label">Features</p>
            <h2 className="landing-section-title">Everything you need to break a case</h2>
          </div>
          <div className="landing-features-grid">
            {[
              { title: 'AI Evidence Analysis', desc: 'Upload any file type and get structured extraction — key facts, persons of interest, locations, and timelines — automatically.' },
              { title: 'Knowledge Graph Memory', desc: 'Evidence is stored in a hybrid graph-vector memory. Ask questions weeks later and the system recalls exact connections.' },
              { title: 'Case Chat Interface', desc: 'Ask anything about your case in plain language. Get precise answers drawn directly from your uploaded evidence.' },
              { title: 'Web Evidence Scraping', desc: 'Paste any URL — news articles, court filings, reports — and it is instantly ingested and mapped into your case.' },
              { title: 'Case Management', desc: 'Organise investigations with statuses, priorities, case numbers, and a searchable evidence log.' },
              { title: 'Locally Stored Data', desc: 'All case data lives on your machine. No cloud syncing, no third-party servers. Your cases stay yours.' },
            ].map(f => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-card-dot" />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="landing-how-section">
        <div className="landing-section-inner">
          <div className="landing-how-header">
            <p className="landing-section-label">How It Works</p>
            <h2 className="landing-section-title">From evidence to answers in four steps</h2>
          </div>
          <div className="landing-steps">
            {[
              { n: '01', title: 'Open a Case', desc: 'Create a new case file with a title, description, and priority level. Each case gets a unique case number.' },
              { n: '02', title: 'Upload Evidence', desc: 'Drop in any file — PDFs, Word docs, images, audio, video — or paste a URL. The AI reads and extracts everything.' },
              { n: '03', title: 'Review the Analysis', desc: 'Key facts, persons of interest, locations, timelines, and recommended next leads — surfaced automatically.' },
              { n: '04', title: 'Ask Your Questions', desc: 'Use the investigation chat to ask precise questions. The system searches the full knowledge graph of your case to answer.' },
            ].map((s, i, arr) => (
              <div key={s.n} className="landing-step">
                <div className="landing-step-left">
                  <div className="landing-step-num">{s.n}</div>
                  {i < arr.length - 1 && <div className="landing-step-connector" />}
                </div>
                <div className="landing-step-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="landing-faq-section">
        <div className="landing-faq-inner">
          <div className="landing-faq-header">
            <p className="landing-section-label">FAQ</p>
            <h2 className="landing-section-title">Common questions</h2>
          </div>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final-cta">
        <h2>Ready to connect the dots?</h2>
        <p>Start with any case file. Be operational in minutes.</p>
        <button className="btn btn-dark btn-lg" onClick={onGetStarted}>
          Open Your First Case
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">Akai Ito</div>
        <div className="landing-footer-copy">
          {new Date().getFullYear()} Akai Ito. All case data is stored locally.
        </div>
      </footer>
    </div>
  );
}
