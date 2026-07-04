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

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.username[0].toUpperCase()}</div>
          <span className="sidebar-user-name">{user.username}</span>
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
          <button className="sidebar-nav-item" style={{ width: '100%', color: 'var(--text-3)' }} onClick={onLogout}>
            <span className="sidebar-nav-item-icon">⎋</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
