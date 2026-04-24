import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const permissionOptions = ['read', 'write', 'execute', 'deploy', 'admin'];

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: ['read'], rate_limit: 100, expires_in_days: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/api-keys');
      setKeys(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const createKey = async () => {
    try {
      const data = await api.post('/api-keys', {
        ...form,
        expires_in_days: form.expires_in_days ? parseInt(form.expires_in_days) : null,
      });
      setNewKey(data.key);
      setKeys([data, ...keys]);
      setForm({ name: '', permissions: ['read'], rate_limit: 100, expires_in_days: '' });
    } catch (err) { alert(err.message); }
  };

  const toggleActive = async (key) => {
    try {
      const data = await api.put(`/api-keys/${key.id}`, { is_active: !key.is_active });
      setKeys(keys.map(k => k.id === key.id ? data : k));
    } catch (err) { console.error(err); }
  };

  const revokeKey = async (id) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
    } catch (err) { console.error(err); }
  };

  const togglePermission = (perm) => {
    const perms = form.permissions.includes(perm)
      ? form.permissions.filter(p => p !== perm)
      : [...form.permissions, perm];
    setForm({ ...form, permissions: perms });
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      alert('API key copied to clipboard!');
    }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>API Keys</h1>
          <p style={s.subtitle}>Manage personal API keys for programmatic access</p>
        </div>
        <button style={s.addBtn} onClick={() => { setNewKey(null); setShowModal(true); }}>+ Generate Key</button>
      </div>

      {newKey && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>New API Key Created</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Copy this key now. You won't be able to see it again.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...s.input, flex: 1, fontFamily: 'monospace', fontSize: 12 }} value={newKey} readOnly />
            <button style={s.btnSuccess} onClick={copyKey}>Copy</button>
          </div>
          <button style={{ ...s.btnSecondary, marginTop: 8 }} onClick={() => setNewKey(null)}>Dismiss</button>
        </div>
      )}

      {keys.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔑</div>
          <div style={s.emptyText}>No API keys</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Generate API keys for programmatic access</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {keys.map(key => (
            <div key={key.id} style={{ ...s.card, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{key.name}</span>
                    <span style={{ ...s.badge, ...(key.is_active ? s.badgeGreen : s.badgeRed) }}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 4 }}>{key.key_prefix}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {(key.permissions || []).map(p => (
                  <span key={p} style={{ ...s.badge, ...s.badgePurple }}>{p}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569', marginBottom: 10 }}>
                <span>Rate limit: {key.rate_limit}/hr</span>
                <span>Used: {key.usage_count} times</span>
                {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleString()}</span>}
                {key.expires_at && <span style={{ color: new Date(key.expires_at) < new Date() ? '#f87171' : '#475569' }}>
                  Expires: {new Date(key.expires_at).toLocaleDateString()}
                </span>}
                <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11 }} onClick={() => toggleActive(key)}>
                  {key.is_active ? 'Disable' : 'Enable'}
                </button>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11, color: '#f87171', borderColor: '#ef4444' }} onClick={() => revokeKey(key.id)}>
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && !newKey && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Generate API Key</span>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Key Name</label>
                <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My API Key" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Permissions</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {permissionOptions.map(p => (
                    <button key={p} onClick={() => togglePermission(p)} style={{
                      ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
                      ...(form.permissions.includes(p) ? s.badgePurple : { background: '#0f172a', color: '#94a3b8' }),
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Rate Limit (requests/hour)</label>
                <input style={s.input} type="number" value={form.rate_limit} onChange={e => setForm({ ...form, rate_limit: parseInt(e.target.value) || 100 })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Expires In (days, leave empty for no expiry)</label>
                <input style={s.input} type="number" value={form.expires_in_days} onChange={e => setForm({ ...form, expires_in_days: e.target.value })} placeholder="90" />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={createKey}>Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
