import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const eventOptions = [
  'prompt.created', 'prompt.updated', 'prompt.deleted',
  'deployment.created', 'deployment.status_changed',
  'chain.executed', 'evaluation.completed',
  'ab_test.completed', 'export.completed',
];

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', url: '', events: [] });
  const [testResult, setTestResult] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/webhooks');
      setWebhooks(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const save = async () => {
    try {
      if (editing) {
        const data = await api.put(`/webhooks/${editing.id}`, form);
        setWebhooks(webhooks.map(w => w.id === editing.id ? data : w));
      } else {
        const data = await api.post('/webhooks', form);
        setWebhooks([data, ...webhooks]);
      }
      setShowModal(false);
      setForm({ name: '', url: '', events: [] });
      setEditing(null);
    } catch (err) { alert(err.message); }
  };

  const toggleActive = async (webhook) => {
    try {
      const data = await api.put(`/webhooks/${webhook.id}`, { is_active: !webhook.is_active });
      setWebhooks(webhooks.map(w => w.id === webhook.id ? data : w));
    } catch (err) { console.error(err); }
  };

  const testWebhook = async (id) => {
    try {
      setTestResult({ id, loading: true });
      const data = await api.post(`/webhooks/${id}/test`);
      setTestResult({ id, ...data, loading: false });
      setTimeout(() => setTestResult(null), 5000);
    } catch (err) {
      setTestResult({ id, success: false, error: err.message, loading: false });
    }
  };

  const regenerateSecret = async (id) => {
    try {
      const data = await api.post(`/webhooks/${id}/regenerate-secret`);
      setWebhooks(webhooks.map(w => w.id === id ? data : w));
      alert('Secret regenerated! Check webhook details for new secret.');
    } catch (err) { console.error(err); }
  };

  const deleteWebhook = async (id) => {
    try {
      await api.delete(`/webhooks/${id}`);
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (err) { console.error(err); }
  };

  const toggleEvent = (event) => {
    const events = form.events.includes(event)
      ? form.events.filter(e => e !== event)
      : [...form.events, event];
    setForm({ ...form, events });
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, url: w.url, events: w.events || [] });
    setShowModal(true);
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Webhooks</h1>
          <p style={s.subtitle}>Configure HTTP callbacks for events</p>
        </div>
        <button style={s.addBtn} onClick={() => { setEditing(null); setForm({ name: '', url: '', events: [] }); setShowModal(true); }}>+ New Webhook</button>
      </div>

      {webhooks.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔗</div>
          <div style={s.emptyText}>No webhooks configured</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Create webhooks to get notified when events happen</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {webhooks.map(w => (
            <div key={w.id} style={{
              ...s.card, ...(hoveredCard === w.id ? s.cardHover : {}), padding: 20,
            }} onMouseEnter={() => setHoveredCard(w.id)} onMouseLeave={() => setHoveredCard(null)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={s.cardTitle}>{w.name}</div>
                    <span style={{ ...s.badge, ...(w.is_active ? s.badgeGreen : s.badgeRed) }}>
                      {w.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>{w.url}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {(w.events || []).map(e => (
                  <span key={e} style={{ ...s.badge, ...s.badgePurple }}>{e}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {w.last_triggered_at && (
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    Last: {new Date(w.last_triggered_at).toLocaleString()}
                    {w.last_status_code && ` (${w.last_status_code})`}
                  </span>
                )}
                {w.failure_count > 0 && (
                  <span style={{ ...s.badge, ...s.badgeRed }}>{w.failure_count} failures</span>
                )}
              </div>

              {testResult?.id === w.id && !testResult.loading && (
                <div style={{
                  marginTop: 8, padding: 8, borderRadius: 6, fontSize: 12,
                  background: testResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: testResult.success ? '#4ade80' : '#f87171',
                }}>
                  {testResult.success ? `Test passed (${testResult.status})` : `Test failed: ${testResult.error || 'Unknown error'}`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11 }} onClick={() => toggleActive(w)}>
                  {w.is_active ? 'Disable' : 'Enable'}
                </button>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11 }} onClick={() => testWebhook(w.id)}>
                  {testResult?.id === w.id && testResult.loading ? 'Testing...' : 'Test'}
                </button>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11 }} onClick={() => openEdit(w)}>Edit</button>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11 }} onClick={() => regenerateSecret(w.id)}>Regen Secret</button>
                <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: 11, color: '#f87171', borderColor: '#ef4444' }} onClick={() => deleteWebhook(w.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editing ? 'Edit Webhook' : 'New Webhook'}</span>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Webhook" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>URL</label>
                <input style={s.input} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Events</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {eventOptions.map(e => (
                    <button key={e} onClick={() => toggleEvent(e)} style={{
                      ...s.badge, padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: 11,
                      ...(form.events.includes(e) ? s.badgePurple : { background: '#0f172a', color: '#94a3b8' }),
                    }}>{e}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={save}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
