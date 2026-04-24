import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const typeColors = {
  info: s.badgeBlue,
  success: s.badgeGreen,
  warning: s.badgeAmber,
  error: s.badgeRed,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const createNotif = async () => {
    try {
      const data = await api.post('/notifications', form);
      setNotifications([data, ...notifications]);
      setShowCreate(false);
      setForm({ title: '', message: '', type: 'info' });
    } catch (err) { console.error(err); }
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Notifications {unreadCount > 0 && <span style={{ ...s.badge, ...s.badgeRed, marginLeft: 8 }}>{unreadCount} unread</span>}</h1>
          <p style={s.subtitle}>Stay updated with your activity</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnSecondary} onClick={markAllRead}>Mark All Read</button>
          <button style={{ ...s.btnSecondary, borderColor: '#ef4444', color: '#f87171' }} onClick={clearAll}>Clear All</button>
          <button style={s.addBtn} onClick={() => setShowCreate(true)}>+ Create</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'unread', 'info', 'success', 'warning', 'error'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...s.badge, ...(f === filter ? s.badgePurple : { background: '#1e293b', color: '#94a3b8' }),
            cursor: 'pointer', padding: '6px 14px', border: 'none', fontSize: 12,
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔔</div>
          <div style={s.emptyText}>No notifications</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(n => (
            <div key={n.id} style={{
              ...s.card, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'default',
              opacity: n.is_read ? 0.7 : 1, borderLeft: n.is_read ? undefined : '3px solid #6366f1',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{n.title}</span>
                  <span style={{ ...s.badge, ...(typeColors[n.type] || s.badgeBlue) }}>{n.type}</span>
                </div>
                {n.message && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{n.message}</div>}
                <div style={{ fontSize: 11, color: '#475569' }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {!n.is_read && <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11 }} onClick={() => markRead(n.id)}>Read</button>}
                <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11, color: '#f87171', borderColor: '#ef4444' }} onClick={() => deleteNotif(n.id)}>x</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={s.overlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Create Notification</span>
              <button style={s.modalClose} onClick={() => setShowCreate(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Title</label>
                <input style={s.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Message</label>
                <textarea style={s.textarea} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Type</label>
                <select style={s.select} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={createNotif}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
