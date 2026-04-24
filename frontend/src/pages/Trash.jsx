import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const typeIcons = { prompt: '✎', chain: '⛓', snippet: '✂', folder: '📁', variable: '{ }' };
const typeColors = { prompt: s.badgePurple, chain: s.badgeBlue, snippet: s.badgeCyan, folder: s.badgeAmber, variable: s.badgeGreen };

export default function Trash() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/trash');
      setItems(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const restore = async (id) => {
    try {
      await api.post(`/trash/${id}/restore`);
      setItems(items.filter(i => i.id !== id));
    } catch (err) { alert(err.message); }
  };

  const deletePermanently = async (id) => {
    try {
      await api.delete(`/trash/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (err) { console.error(err); }
  };

  const emptyTrash = async () => {
    if (!window.confirm('Permanently delete all items in trash? This cannot be undone.')) return;
    try {
      await api.delete('/trash');
      setItems([]);
    } catch (err) { console.error(err); }
  };

  const filtered = filter ? items.filter(i => i.entity_type === filter) : items;

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Trash</h1>
          <p style={s.subtitle}>{items.length} items - auto-deleted after 30 days</p>
        </div>
        {items.length > 0 && (
          <button style={{ ...s.btnDanger }} onClick={emptyTrash}>Empty Trash</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setFilter('')} style={{
          ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
          ...(!filter ? s.badgePurple : { background: '#1e293b', color: '#94a3b8' }),
        }}>All ({items.length})</button>
        {Object.entries(typeIcons).map(([type, icon]) => {
          const count = items.filter(i => i.entity_type === type).length;
          return (
            <button key={type} onClick={() => setFilter(type)} style={{
              ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
              ...(filter === type ? (typeColors[type] || s.badgePurple) : { background: '#1e293b', color: '#94a3b8' }),
            }}>{icon} {type} ({count})</button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🗑</div>
          <div style={s.emptyText}>Trash is empty</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Deleted items will appear here for 30 days</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              ...s.card, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'default',
            }}>
              <span style={{ fontSize: 20 }}>{typeIcons[item.entity_type] || '📄'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{item.entity_name || 'Unnamed'}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={{ ...s.badge, ...(typeColors[item.entity_type] || s.badgePurple) }}>{item.entity_type}</span>
                  <span style={{ fontSize: 11, color: '#475569' }}>Deleted: {new Date(item.deleted_at).toLocaleString()}</span>
                  <span style={{ fontSize: 11, color: '#ef4444' }}>Expires: {new Date(item.expires_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.btnSuccess} onClick={() => restore(item.id)}>Restore</button>
                <button style={{ ...s.btnDanger, fontSize: 12 }} onClick={() => deletePermanently(item.id)}>Delete Forever</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
