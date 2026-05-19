import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuSections = [
  { label: 'CORE', items: [
    { path: '/', label: 'Dashboard', icon: '⊞' },
    { path: '/prompts', label: 'Prompt Templates', icon: '✎' },
    { path: '/folders', label: 'Folders', icon: '📁' },
    { path: '/favorites', label: 'Favorites', icon: '⭐' },
    { path: '/search', label: 'Search', icon: '🔍' },
  ]},
  { label: 'BUILD', items: [
    { path: '/versions', label: 'Versions', icon: '⎇' },
    { path: '/playground', label: 'Playground', icon: '▶' },
    { path: '/chains', label: 'Prompt Chains', icon: '⛓' },
    { path: '/snippets', label: 'Snippets', icon: '✂' },
    { path: '/variables', label: 'Variables', icon: '{ }' },
  ]},
  { label: 'TEST & DEPLOY', items: [
    { path: '/ab-tests', label: 'A/B Tests', icon: '⇄' },
    { path: '/ab-test-runner', label: 'A/B Runner', icon: '▶' },
    { path: '/optimization', label: 'Optimization', icon: '⚡' },
    { path: '/evaluations', label: 'Evaluations', icon: '✓' },
    { path: '/deployments', label: 'Deployments', icon: '🚀' },
    { path: '/deployment-manager', label: 'Deploy Prompt', icon: '🔗' },
  ]},
  { label: 'ORGANIZE', items: [
    { path: '/categories', label: 'Categories', icon: '🏷' },
    { path: '/tags', label: 'Tags', icon: '🏷' },
    { path: '/library', label: 'Library', icon: '📚' },
    { path: '/template-library', label: 'Template Library', icon: '📋' },
    { path: '/comments', label: 'Comments', icon: '💬' },
    { path: '/version-history', label: 'Version History', icon: '⎇' },
  ]},
  { label: 'INSIGHTS', items: [
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/costs', label: 'Cost Tracking', icon: '💰' },
    { path: '/activity', label: 'Activity Log', icon: '📋' },
    { path: '/custom-views', label: 'Prompt Views', icon: '📈' },
  ]},
  { label: 'SECURITY', items: [
    { path: '/security-scanner', label: 'Security Scanner', icon: '🛡' },
    { path: '/pii-checker', label: 'PII Checker', icon: '🔒' },
    { path: '/classify-prompt', label: 'Classify Prompt', icon: '🏷️' },
  ]},
  { label: 'SETTINGS', items: [
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/webhooks', label: 'Webhooks', icon: '🔗' },
    { path: '/api-keys', label: 'API Keys', icon: '🔑' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/exports', label: 'Export/Import', icon: '📦' },
    { path: '/trash', label: 'Trash', icon: '🗑' },
    { path: '/profile', label: 'Profile & Settings', icon: '⚙' },
  ]},
];

const menuItems = menuSections.flatMap(s => s.items);

const styles = {
  container: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 260, background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
    borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    overflowY: 'auto',
  },
  sidebarCollapsed: { width: 70 },
  logo: {
    padding: '20px 16px', borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  logoIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  logoText: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 },
  logoSub: { fontSize: 10, color: '#818cf8', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
    color: '#94a3b8', transition: 'all 0.15s', border: 'none', background: 'none',
    width: '100%', textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc',
    boxShadow: 'inset 3px 0 0 #6366f1',
  },
  navItemHover: { background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' },
  navIcon: { width: 24, textAlign: 'center', fontSize: 15, flexShrink: 0 },
  main: { flex: 1, marginLeft: 260, minHeight: '100vh' },
  topBar: {
    height: 60, background: '#0f172a', borderBottom: '1px solid #1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
  },
  topBarTitle: { fontSize: 16, fontWeight: 600, color: '#e2e8f0' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 16 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, color: '#fff',
  },
  userName: { fontSize: 13, fontWeight: 500, color: '#e2e8f0' },
  userRole: { fontSize: 11, color: '#64748b' },
  logoutBtn: {
    padding: '6px 14px', borderRadius: 6, border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  content: { padding: 24 },
};

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const currentPage = menuItems.find(item => item.path === location.pathname);

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>AI</div>
          <div>
            <div style={styles.logoText}>Prompt Studio</div>
            <div style={styles.logoSub}>Engineering Platform</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {menuSections.map(section => (
            <div key={section.label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', padding: '12px 12px 4px', letterSpacing: 1.5 }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = location.pathname === item.path;
                const isHovered = hoveredItem === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      ...styles.navItem,
                      ...(isActive ? styles.navItemActive : {}),
                      ...(!isActive && isHovered ? styles.navItemHover : {}),
                    }}
                  >
                    <span style={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <main style={styles.main}>
        <header style={styles.topBar}>
          <div style={styles.topBarTitle}>{currentPage?.label || 'Dashboard'}</div>
          <div style={styles.topBarRight}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
              <div>
                <div style={styles.userName}>{user?.name || 'Admin'}</div>
                <div style={styles.userRole}>{user?.role || 'admin'}</div>
              </div>
            </div>
            <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
          </div>
        </header>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}
