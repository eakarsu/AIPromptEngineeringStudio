import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  name: '', prompt_id: '', environment: 'staging', rate_limit: 100,
};

const environments = ['staging', 'production'];

const statusBadge = (status) => {
  const map = {
    active: s.badgeGreen,
    testing: s.badgeAmber,
    paused: s.badgeRed,
    pending: s.badgeBlue,
  };
  return { ...s.badge, ...(map[status] || s.badgePurple) };
};

const envBadge = (env) => {
  const map = {
    production: s.badgeRed,
    staging: s.badgeAmber,
  };
  return { ...s.badge, ...(map[env] || s.badgePurple) };
};

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/deployments');
      setDeployments(Array.isArray(data) ? data : data.deployments || data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormOpen(true);
    setDetailItem(null);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      prompt_id: item.prompt_id || '',
      environment: item.environment || 'staging',
      rate_limit: item.rate_limit ?? 100,
    });
    setFormOpen(true);
    setDetailItem(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const payload = {
        ...formData,
        prompt_id: parseInt(formData.prompt_id, 10),
        rate_limit: parseInt(formData.rate_limit, 10),
      };
      if (editingId) {
        await api.put(`/deployments/${editingId}`, payload);
      } else {
        await api.post('/deployments', payload);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await api.delete(`/deployments/${id}`);
      setConfirmDelete(null);
      setDetailItem(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const maskKey = (key) => {
    if (!key) return '—';
    return key.slice(0, 8) + '••••••••' + key.slice(-4);
  };

  const field = (label, value) => (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value || '—'}</span>
    </div>
  );

  const input = (key, label, opts = {}) => (
    <div style={s.formGroup}>
      <label style={s.label}>{label}</label>
      {opts.type === 'select' ? (
        <select
          style={s.select}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        >
          {opts.options.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      ) : (
        <input
          style={s.input}
          type={opts.type || 'text'}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Deployments</div>
          <div style={s.subtitle}>Manage prompt deployments across environments</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Deployment</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading deployments...</div>
      ) : deployments.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🚀</div>
          <div style={s.emptyText}>No deployments yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Deployment" to deploy your first prompt.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {deployments.map((dep) => (
            <div
              key={dep.id}
              style={hovered === dep.id ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(dep.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { setDetailItem(dep); setShowApiKey(false); }}
            >
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{dep.name}</div>
                  <div style={s.cardDesc}>{dep.prompt_name || `Prompt #${dep.prompt_id}`}</div>
                </div>
                <span style={statusBadge(dep.status)}>{dep.status || 'pending'}</span>
              </div>

              <div style={s.cardMeta}>
                <span style={envBadge(dep.environment)}>{dep.environment || 'staging'}</span>
                {dep.rate_limit != null && (
                  <span style={{ ...s.badge, ...s.badgeCyan }}>{dep.rate_limit} req/min</span>
                )}
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                    {(dep.total_requests || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Requests</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                    {dep.avg_latency_ms != null ? `${dep.avg_latency_ms}ms` : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Avg Latency</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: (dep.error_rate || 0) > 5 ? '#f87171' : (dep.error_rate || 0) > 1 ? '#fbbf24' : '#4ade80',
                  }}>
                    {dep.error_rate != null ? `${dep.error_rate}%` : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Error Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div style={s.overlay} onClick={() => setDetailItem(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{detailItem.name}</span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('Name', detailItem.name)}
              {field('Prompt', detailItem.prompt_name || `Prompt #${detailItem.prompt_id}`)}
              {field('Status', <span style={statusBadge(detailItem.status)}>{detailItem.status || 'pending'}</span>)}
              {field('Environment', <span style={envBadge(detailItem.environment)}>{detailItem.environment || 'staging'}</span>)}
              {field('Rate Limit', detailItem.rate_limit != null ? `${detailItem.rate_limit} req/min` : '—')}
              {field('Total Requests', (detailItem.total_requests || 0).toLocaleString())}
              {field('Avg Latency', detailItem.avg_latency_ms != null ? `${detailItem.avg_latency_ms}ms` : '—')}
              {field('Error Rate', detailItem.error_rate != null ? `${detailItem.error_rate}%` : '—')}
              {field('API Key', (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{
                    background: '#0f172a', padding: '4px 8px', borderRadius: 4,
                    fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0',
                  }}>
                    {showApiKey ? (detailItem.api_key || '—') : maskKey(detailItem.api_key)}
                  </code>
                  {detailItem.api_key && (
                    <button
                      style={{
                        ...s.btnSecondary, padding: '4px 10px', fontSize: 11,
                      }}
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              ))}
              {field('Created At', detailItem.created_at ? new Date(detailItem.created_at).toLocaleString() : '—')}
              {field('Updated At', detailItem.updated_at ? new Date(detailItem.updated_at).toLocaleString() : '—')}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setDetailItem(null)}>Close</button>
              <button style={s.btnDanger} onClick={() => setConfirmDelete(detailItem.id)}>Delete</button>
              <button style={s.btnPrimary} onClick={() => openEdit(detailItem)}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div style={s.overlay} onClick={() => setFormOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editingId ? 'Edit Deployment' : 'New Deployment'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('name', 'Name')}
              {input('prompt_id', 'Prompt ID', { type: 'number' })}
              {input('environment', 'Environment', { type: 'select', options: environments })}
              {input('rate_limit', 'Rate Limit (req/min)', { type: 'number' })}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setFormOpen(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div style={s.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...s.modal, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Confirm Delete</span>
              <button style={s.modalClose} onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: '#e2e8f0', fontSize: 14, margin: 0 }}>
                Are you sure you want to delete this deployment? This action cannot be undone.
              </p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={s.btnDanger} onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
