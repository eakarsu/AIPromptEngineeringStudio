import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { pageStyles } from '../styles';

const featureCards = [
  {
    key: 'prompts',
    path: '/prompts',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Prompt Templates',
    description: 'Create and manage reusable prompt templates with variables and version control.',
    countKey: 'prompts',
    color: '#6366f1',
  },
  {
    key: 'versions',
    path: '/versions',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6" />
        <path d="M21 12h-6m-6 0H3" />
      </svg>
    ),
    title: 'Versions',
    description: 'Track prompt iterations and compare performance across different versions.',
    countKey: 'versions',
    color: '#8b5cf6',
  },
  {
    key: 'ab-tests',
    path: '/ab-tests',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
    title: 'A/B Tests',
    description: 'Run controlled experiments to find the best-performing prompt variants.',
    countKey: 'abTests',
    color: '#06b6d4',
  },
  {
    key: 'optimization',
    path: '/optimization',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Optimization',
    description: 'AI-powered suggestions to improve prompt quality, speed, and cost efficiency.',
    countKey: 'optimizations',
    color: '#f59e0b',
  },
  {
    key: 'playground',
    path: '/playground',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Playground',
    description: 'Interactive workspace to test prompts in real time with instant results.',
    countKey: 'playground',
    color: '#22c55e',
  },
  {
    key: 'chains',
    path: '/chains',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: 'Chains',
    description: 'Build multi-step prompt workflows by chaining prompts together.',
    countKey: 'chains',
    color: '#ec4899',
  },
  {
    key: 'evaluations',
    path: '/evaluations',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Evaluations',
    description: 'Score and evaluate prompt outputs using automated quality metrics.',
    countKey: 'evaluations',
    color: '#14b8a6',
  },
  {
    key: 'analytics',
    path: '/analytics',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    title: 'Analytics',
    description: 'Detailed performance dashboards with usage trends and insights.',
    countKey: 'analytics',
    color: '#3b82f6',
  },
  {
    key: 'library',
    path: '/library',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    title: 'Library',
    description: 'Browse and reuse community-shared prompts from the shared library.',
    countKey: 'library',
    color: '#a855f7',
  },
  {
    key: 'categories',
    path: '/categories',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Categories',
    description: 'Organize prompts into categories and tags for easy discovery.',
    countKey: 'categories',
    color: '#f97316',
  },
  {
    key: 'variables',
    path: '/variables',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    title: 'Variables',
    description: 'Define dynamic variables and parameter sets for prompt templates.',
    countKey: 'variables',
    color: '#0ea5e9',
  },
  {
    key: 'teams',
    path: '/teams',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Teams',
    description: 'Collaborate with team members on shared prompt projects.',
    countKey: 'teams',
    color: '#64748b',
  },
  {
    key: 'costs',
    path: '/costs',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Cost Tracking',
    description: 'Monitor API usage costs and set budgets across all your prompts.',
    countKey: 'costs',
    color: '#ef4444',
  },
  {
    key: 'deployments',
    path: '/deployments',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.65 14.39l-2.3-2.3a1 1 0 0 0-1.4 0l-7.6 7.6v3.3h3.3l7.6-7.6a1 1 0 0 0 .4-1z" />
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: 'Deployments',
    description: 'Deploy prompts to production endpoints with monitoring and rollback.',
    countKey: 'deployments',
    color: '#10b981',
  },
  {
    key: 'exports',
    path: '/exports',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: 'Export / Import',
    description: 'Bulk export and import prompts, templates, and configurations.',
    countKey: 'exports',
    color: '#84cc16',
  },
  {
    key: 'folders',
    path: '/folders',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    title: 'Folders',
    description: 'Organize prompts into folders for better project structure.',
    countKey: 'folders',
    color: '#f97316',
  },
  {
    key: 'favorites',
    path: '/favorites',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    title: 'Favorites',
    description: 'Quick access to your bookmarked and starred prompts.',
    countKey: 'favorites',
    color: '#eab308',
  },
  {
    key: 'snippets',
    path: '/snippets',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12L12 12"/><path d="M20 4L8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8L20 20"/></svg>,
    title: 'Snippets',
    description: 'Reusable text snippets to quickly compose prompts.',
    countKey: 'snippets',
    color: '#06b6d4',
  },
  {
    key: 'tags',
    path: '/tags',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    title: 'Tags',
    description: 'Manage and organize tags across all your prompts.',
    countKey: 'tags',
    color: '#d946ef',
  },
  {
    key: 'comments',
    path: '/comments',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    title: 'Comments',
    description: 'Add notes and comments to your prompts for collaboration.',
    countKey: 'comments',
    color: '#0ea5e9',
  },
  {
    key: 'search',
    path: '/search',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    title: 'Search',
    description: 'Global search across all prompts, chains, snippets, and more.',
    countKey: null,
    color: '#64748b',
  },
  {
    key: 'activity',
    path: '/activity',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: 'Activity Log',
    description: 'Track all actions and changes in your workspace.',
    countKey: 'activities',
    color: '#475569',
  },
  {
    key: 'webhooks',
    path: '/webhooks',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    title: 'Webhooks',
    description: 'Configure HTTP callbacks for automated integrations.',
    countKey: 'webhooks',
    color: '#7c3aed',
  },
  {
    key: 'api-keys',
    path: '/api-keys',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    title: 'API Keys',
    description: 'Generate and manage API keys for programmatic access.',
    countKey: 'api_keys',
    color: '#be185d',
  },
  {
    key: 'notifications',
    path: '/notifications',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    title: 'Notifications',
    description: 'Stay updated with alerts on your workspace activity.',
    countKey: 'unread_notifications',
    color: '#e11d48',
  },
  {
    key: 'trash',
    path: '/trash',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    title: 'Trash',
    description: 'Recover recently deleted items within 30 days.',
    countKey: null,
    color: '#78716c',
  },
  {
    key: 'profile',
    path: '/profile',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    title: 'Profile & Settings',
    description: 'Manage your profile, password, preferences, and AI defaults.',
    countKey: null,
    color: '#6366f1',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPrompts: 0,
    activeTests: 0,
    deployments: 0,
    totalCost: 0,
  });
  const [counts, setCounts] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get('/dashboard/stats');
        setStats({
          totalPrompts: data.prompts || 0,
          activeTests: data.ab_tests || 0,
          deployments: data.deployments || 0,
          totalCost: data.total_cost || 0,
        });
        setCounts({
          prompts: data.prompts || 0,
          versions: data.versions || 0,
          abTests: data.ab_tests || 0,
          optimizations: data.optimization || 0,
          playground: data.playground || 0,
          chains: data.chains || 0,
          evaluations: data.evaluations || 0,
          analytics: data.analytics || 0,
          library: data.library || 0,
          categories: data.categories || 0,
          variables: data.variables || 0,
          teams: data.teams || 0,
          costs: data.costs || 0,
          deployments: data.deployments || 0,
          exports: data.exports || 0,
          favorites: data.favorites || 0,
          folders: data.folders || 0,
          snippets: data.snippets || 0,
          tags: data.tags || 0,
          webhooks: data.webhooks || 0,
          api_keys: data.api_keys || 0,
          comments: data.comments || 0,
          unread_notifications: data.unread_notifications || 0,
          activities: data.activities || 0,
        });
      } catch (err) {
        // Silently handle - dashboard will show zeros
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Prompts',
      value: stats.totalPrompts,
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: 'Active Tests',
      value: stats.activeTests,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      ),
    },
    {
      label: 'Deployments',
      value: stats.deployments,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      ),
    },
    {
      label: 'Total Cost',
      value: `$${(stats.totalCost || 0).toFixed(2)}`,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const styles = {
    page: {
      ...pageStyles.page,
      padding: '32px 24px',
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: 800,
      color: '#f1f5f9',
      letterSpacing: '-0.03em',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: '#64748b',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
      marginBottom: 36,
    },
    statCard: {
      background: '#1e293b',
      borderRadius: 14,
      border: '1px solid #334155',
      padding: '20px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'all 0.2s',
      cursor: 'default',
    },
    statCardHover: {
      borderColor: '#475569',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    statValue: {
      fontSize: 26,
      fontWeight: 800,
      color: '#f1f5f9',
      lineHeight: 1.2,
    },
    statLabel: {
      fontSize: 12,
      color: '#64748b',
      fontWeight: 500,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: '#e2e8f0',
      marginBottom: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    sectionDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
    },
    featureCard: {
      background: '#1e293b',
      borderRadius: 14,
      border: '1px solid #334155',
      padding: '22px 20px',
      cursor: 'pointer',
      transition: 'all 0.25s',
      position: 'relative',
      overflow: 'hidden',
    },
    featureCardHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
    },
    featureCardGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      borderRadius: '14px 14px 0 0',
    },
    featureIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 11,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: '#f1f5f9',
      marginBottom: 6,
    },
    featureDesc: {
      fontSize: 12,
      color: '#94a3b8',
      lineHeight: 1.6,
      marginBottom: 12,
    },
    featureCount: {
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 20,
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>Dashboard</div>
        <div style={styles.subtitle}>Welcome back. Here is an overview of your prompt engineering workspace.</div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <div
            key={i}
            style={{
              ...styles.statCard,
              ...(hoveredStat === i ? styles.statCardHover : {}),
            }}
            onMouseEnter={() => setHoveredStat(i)}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div style={{ ...styles.statIcon, background: stat.bgColor }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div style={styles.sectionTitle}>
        <div style={styles.sectionDot} />
        Features
      </div>
      <div style={styles.featureGrid}>
        {featureCards.map((card) => {
          const isHovered = hoveredCard === card.key;
          const count = counts[card.countKey] ?? 0;
          return (
            <div
              key={card.key}
              style={{
                ...styles.featureCard,
                ...(isHovered ? {
                  ...styles.featureCardHover,
                  borderColor: card.color,
                } : {}),
              }}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                style={{
                  ...styles.featureCardGlow,
                  background: isHovered
                    ? `linear-gradient(90deg, ${card.color}, transparent)`
                    : 'transparent',
                }}
              />
              <div
                style={{
                  ...styles.featureIconWrap,
                  background: `${card.color}18`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
              <div style={styles.featureTitle}>{card.title}</div>
              <div style={styles.featureDesc}>{card.description}</div>
              <span
                style={{
                  ...styles.featureCount,
                  background: `${card.color}18`,
                  color: card.color,
                }}
              >
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
