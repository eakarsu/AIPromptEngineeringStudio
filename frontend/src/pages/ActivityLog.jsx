import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const actionIcons = {
  created: '➕', updated: '✏️', deleted: '🗑', executed: '▶', deployed: '🚀',
  exported: '📦', imported: '📥', shared: '🔗', cloned: '📋', rated: '⭐',
};

const entityColors = {
  prompt: s.badgePurple, chain: s.badgeBlue, team: s.badgeGreen,
  deployment: s.badgeCyan, evaluation: s.badgeAmber, snippet: s.badgeRed,
};

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  useEffect(() => { load(); loadStats(); }, [filter, page]);

  const load = async () => {
    try {
      const params = `?limit=${limit}&offset=${page * limit}${filter ? `&entity_type=${filter}` : ''}`;
      const data = await api.get(`/activity${params}`);
      setActivities(data.activities);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const data = await api.get('/activity/stats');
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const clearLog = async () => {
    try {
      await api.delete('/activity');
      setActivities([]);
      setTotal(0);
      loadStats();
    } catch (err) { console.error(err); }
  };

  const logActivity = async (action, entityType, entityName) => {
    try {
      await api.post('/activity', { action, entity_type: entityType, entity_name: entityName });
      load();
      loadStats();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Activity Log</h1>
          <p style={s.subtitle}>Track all actions in your workspace</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...s.btnSecondary, borderColor: '#ef4444', color: '#f87171' }} onClick={clearLog}>Clear Log</button>
        </div>
      </div>

      {stats && (
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={s.statValue}>{stats.today}</div>
            <div style={s.statLabel}>Today</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>{stats.this_week}</div>
            <div style={s.statLabel}>This Week</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>{stats.by_type?.length || 0}</div>
            <div style={s.statLabel}>Entity Types</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>{total}</div>
            <div style={s.statLabel}>Total Activities</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => { setFilter(''); setPage(0); }} style={{
          ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
          ...(!filter ? s.badgePurple : { background: '#1e293b', color: '#94a3b8' }),
        }}>All</button>
        {['prompt', 'chain', 'team', 'deployment', 'snippet', 'evaluation'].map(t => (
          <button key={t} onClick={() => { setFilter(t); setPage(0); }} style={{
            ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
            ...(filter === t ? (entityColors[t] || s.badgePurple) : { background: '#1e293b', color: '#94a3b8' }),
          }}>{t}</button>
        ))}
      </div>

      {activities.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyText}>No activity logged yet</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Activities will appear here as you use the platform</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activities.map(a => (
            <div key={a.id} style={{
              ...s.card, padding: '12px 16px', cursor: 'default',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 16 }}>{actionIcons[a.action] || '📝'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e2e8f0' }}>
                  <span style={{ fontWeight: 600 }}>{a.action}</span>
                  {' '}
                  <span style={{ ...s.badge, ...(entityColors[a.entity_type] || s.badgePurple), fontSize: 10 }}>{a.entity_type}</span>
                  {a.entity_name && <span style={{ color: '#a5b4fc', marginLeft: 4 }}>"{a.entity_name}"</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button style={s.btnSecondary} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>
            Page {page + 1} of {Math.ceil(total / limit)}
          </span>
          <button style={s.btnSecondary} disabled={(page + 1) * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
