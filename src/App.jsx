import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage.jsx';
import { AuthPage } from './components/AuthPage.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import { CasesView } from './components/CasesView.jsx';
import { CaseDetail } from './components/CaseDetail.jsx';
import './app.css';

// Pages: landing | auth | app
export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('cases'); // cases | closed | case-detail
  const [activeCase, setActiveCase] = useState(null); // { id, title }

  // Restore session
  useEffect(() => {
    const stored = localStorage.getItem('ai_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setPage('app');
      } catch { localStorage.removeItem('ai_user'); }
    }
  }, []);

  const handleAuth = (u) => {
    setUser(u);
    setPage('app');
    setView('cases');
  };

  const handleLogout = () => {
    localStorage.removeItem('ai_user');
    setUser(null);
    setPage('landing');
    setActiveCase(null);
  };

  const openCase = (c) => {
    setActiveCase({ id: c.id, title: c.title });
    setView('case-detail');
  };

  const handleNav = (id) => {
    if (id === 'closed') {
      setActiveCase(null);
      setView('closed');
    } else {
      setActiveCase(null);
      setView('cases');
    }
  };

  if (page === 'landing') {
    return <LandingPage user={user} onGetStarted={() => setPage(user ? 'app' : 'auth')} />;
  }

  if (page === 'auth') {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <AppLayout
      user={user}
      view={view === 'case-detail' ? 'cases' : view}
      activeCaseTitle={activeCase?.title}
      onNav={handleNav}
      onLogout={handleLogout}
      onGoHome={() => setPage('landing')}
    >
      {view === 'cases' && (
        <CasesView user={user} onOpenCase={openCase} />
      )}
      {view === 'closed' && (
        <CasesView user={user} onOpenCase={openCase} defaultFilter="closed" />
      )}
      {view === 'case-detail' && activeCase && (
        <CaseDetail caseId={activeCase.id} onBack={() => { setActiveCase(null); setView('cases'); }} />
      )}
    </AppLayout>
  );
}
