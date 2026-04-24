import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  model: '', input_tokens: 0, output_tokens: 0, total_cost: 0,
  request_type: 'playground',
};

const requestTypes = ['playground', 'optimization', 'evaluation', 'ab_test', 'chain'];

const costColor = (cost) => {
  if (cost < 0.01) return { color: '#4ade80' };
  if (cost <= 0.05) return { color: '#fbbf24' };
  return { color: '#f87171' };
};

const costBadgeStyle = (cost) => {
  if (cost < 0.01) return { ...s.badge, ...s.badgeGreen };
  if (cost <= 0.05) return { ...s.badge, ...s.badgeAmber };
  return { ...s.badge, ...s.badgeRed };
};

const requestTypeBadge = (type) => {
  const map = {
    playground: s.badgePurple,
    optimization: s.badgeBlue,
    evaluation: s.badgeGreen,
    ab_test: s.badgeAmber,
    chain: s.badgeCyan,
  };
  return { ...s.badge, ...(map[type] || s.badgePurple) };
};

export default function CostTracking() {
  const [costs, setCosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [costsData, summaryData] = await Promise.all([
        api.get('/costs'),
        api.get('/costs/summary'),
      ]);
      setCosts(Array.isArray(costsData) ? costsData : costsData.costs || costsData.data || []);
      setSummary(summaryData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setFormData(emptyForm);
    setFormOpen(true);
    setDetailItem(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const payload = {
        ...formData,
        input_tokens: parseInt(formData.input_tokens, 10),
        output_tokens: parseInt(formData.output_tokens, 10),
        total_cost: parseFloat(formData.total_cost),
      };
      await api.post('/costs', payload);
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
      await api.delete(`/costs/${id}`);
      setConfirmDelete(null);
      setDetailItem(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
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
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')}</option>
          ))}
        </select>
      ) : (
        <input
          style={s.input}
          type={opts.type || 'text'}
          step={opts.step}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      )}
    </div>
  );

  // Model distribution from summary
  const modelDistribution = summary?.requests_per_model || summary?.model_distribution || {};

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Cost Tracking</div>
          <div style={s.subtitle}>Monitor API usage costs and token consumption</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Cost Record</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Summary Stats */}
      {summary && (
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, ...costColor(summary.total_cost || 0) }}>
              ${(summary.total_cost || 0).toFixed(4)}
            </div>
            <div style={s.statLabel}>Total Cost</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>
              {(summary.total_input_tokens || 0).toLocaleString()}
            </div>
            <div style={s.statLabel}>Total Input Tokens</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>
              {(summary.total_output_tokens || 0).toLocaleString()}
            </div>
            <div style={s.statLabel}>Total Output Tokens</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>
              {costs.length}
            </div>
            <div style={s.statLabel}>Total Requests</div>
          </div>
        </div>
      )}

      {/* Model Distribution */}
      {Object.keys(modelDistribution).length > 0 && (
        <div style={{ ...s.statCard, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
            Model Distribution
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(modelDistribution).map(([model, count]) => (
              <div key={model} style={{
                background: '#0f172a', borderRadius: 8, padding: '8px 14px',
                border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{model}</span>
                <span style={{ ...s.badge, ...s.badgePurple }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Records Table */}
      {loading ? (
        <div style={s.loading}>Loading cost records...</div>
      ) : costs.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>💰</div>
          <div style={s.emptyText}>No cost records yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Cost Record" to track your first API cost.</div>
        </div>
      ) : (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Prompt</th>
                <th style={s.th}>Model</th>
                <th style={s.th}>Input Tokens</th>
                <th style={s.th}>Output Tokens</th>
                <th style={s.th}>Cost</th>
                <th style={s.th}>Type</th>
                <th style={s.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((c) => (
                <tr
                  key={c.id}
                  style={hovered === c.id ? { background: '#334155' } : {}}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setDetailItem(c)}
                >
                  <td style={s.td}>{c.prompt_name || '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...s.badgeBlue }}>{c.model || '—'}</span>
                  </td>
                  <td style={s.td}>{(c.input_tokens || 0).toLocaleString()}</td>
                  <td style={s.td}>{(c.output_tokens || 0).toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={costBadgeStyle(c.total_cost || 0)}>
                      ${(c.total_cost || 0).toFixed(4)}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={requestTypeBadge(c.request_type)}>
                      {(c.request_type || '—').replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: '#94a3b8', fontSize: 12 }}>
                    {c.recorded_at ? new Date(c.recorded_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div style={s.overlay} onClick={() => setDetailItem(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Cost Record Details</span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('ID', detailItem.id)}
              {field('Prompt Name', detailItem.prompt_name)}
              {field('Model', <span style={{ ...s.badge, ...s.badgeBlue }}>{detailItem.model}</span>)}
              {field('Input Tokens', (detailItem.input_tokens || 0).toLocaleString())}
              {field('Output Tokens', (detailItem.output_tokens || 0).toLocaleString())}
              {field('Total Cost', <span style={costBadgeStyle(detailItem.total_cost || 0)}>${(detailItem.total_cost || 0).toFixed(4)}</span>)}
              {field('Request Type', <span style={requestTypeBadge(detailItem.request_type)}>{(detailItem.request_type || '').replace('_', ' ')}</span>)}
              {field('Recorded At', detailItem.recorded_at ? new Date(detailItem.recorded_at).toLocaleString() : '—')}
              {field('Prompt ID', detailItem.prompt_id)}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setDetailItem(null)}>Close</button>
              <button style={s.btnDanger} onClick={() => setConfirmDelete(detailItem.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div style={s.overlay} onClick={() => setFormOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>New Cost Record</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('model', 'Model')}
              {input('input_tokens', 'Input Tokens', { type: 'number' })}
              {input('output_tokens', 'Output Tokens', { type: 'number' })}
              {input('total_cost', 'Total Cost ($)', { type: 'number', step: '0.0001' })}
              {input('request_type', 'Request Type', { type: 'select', options: requestTypes })}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setFormOpen(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Create'}
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
                Are you sure you want to delete this cost record? This action cannot be undone.
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
