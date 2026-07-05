import React, { useState } from 'react';

const NAV = [
  { id: 'cases', label: 'My Cases', icon: '🗂' },
  { id: 'closed', label: 'Closed Cases', icon: '✓' },
];

export function AppLayout({ user, view, activeCaseTitle, onNav, onLogout, onGoHome, children }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <div className="sidebar-brand-dot" />
          <span className="sidebar-brand">Akai Ito</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Workspace</div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className="sidebar-nav-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {activeCaseTitle && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 8 }}>Active Case</div>
              <div className="sidebar-nav-item active" style={{ cursor: 'default', fontSize: 12 }}>
                <span className="sidebar-nav-item-icon">📋</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeCaseTitle}
                </span>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ padding: 0, border: 'none', background: 'transparent' }}>
            <div className="sidebar-user-avatar">{user.username[0].toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <span className="sidebar-user-name">{user.username}</span>
              <button 
                onClick={onLogout} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11, textAlign: 'left', cursor: 'pointer', padding: 0, marginTop: 2 }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
