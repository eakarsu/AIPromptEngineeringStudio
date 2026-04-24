import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  prompt_id: '', content: '', change_notes: '', performance_score: '',
};

const scoreColor = (score) => {
  const n = Number(score);
  if (n >= 80) return { bg: 'rgba(34, 197, 94, 0.15)', fg: '#4ade80' };
  if (n >= 60) return { bg: 'rgba(59, 130, 246, 0.15)', fg: '#60a5fa' };
  if (n >= 40) return { bg: 'rgba(245, 158, 11, 0.15)', fg: '#fbbf24' };
  return { bg: 'rgba(239, 68, 68, 0.15)', fg: '#f87171' };
};

const ScoreBadge = ({ score }) => {
  if (score == null || score === '') return <span style={{ color: '#64748b', fontSize: 12 }}>—</span>;
  const n = Number(score);
  const c = scoreColor(n);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#334155', maxWidth: 120, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(n, 100)}%`, height: '100%', borderRadius: 3, background: c.fg, transition: 'width 0.3s' }} />
      </div>
      <span style={{ ...s.badge, background: c.bg, color: c.fg, minWidth: 36, textAlign: 'center' }}>
        {n}
      </span>
    </div>
  );
};

export default function PromptVersions() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  // modals
  const [detailItem, setDetailItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/versions');
      setVersions(Array.isArray(data) ? data : data.versions || data.data || []);
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
      prompt_id: item.prompt_id ?? '',
      content: item.content || '',
      change_notes: item.change_notes || '',
      performance_score: item.performance_score ?? '',
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
        performance_score: formData.performance_score !== '' ? parseFloat(formData.performance_score) : null,
      };
      if (editingId) {
        await api.put(`/versions/${editingId}`, payload);
      } else {
        await api.post('/versions', payload);
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
      await api.delete(`/versions/${id}`);
      setConfirmDelete(null);
      setDetailItem(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString(); } catch { return d; }
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
      {opts.type === 'textarea' ? (
        <textarea
          style={s.textarea}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          rows={opts.rows || 4}
        />
      ) : (
        <input
          style={s.input}
          type={opts.type || 'text'}
          step={opts.step}
          min={opts.min}
          max={opts.max}
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
          <div style={s.title}>Prompt Versions</div>
          <div style={s.subtitle}>Track and manage prompt version history</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Version</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading versions...</div>
      ) : versions.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔄</div>
          <div style={s.emptyText}>No versions yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Version" to create your first prompt version.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {versions.map((v) => (
            <div
              key={v.id}
              style={hovered === v.id ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(v)}
            >
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{v.prompt_name || `Prompt #${v.prompt_id}`}</div>
                  <div style={s.cardDesc}>
                    {v.change_notes ? (v.change_notes.length > 100 ? v.change_notes.slice(0, 100) + '...' : v.change_notes) : 'No change notes'}
                  </div>
                </div>
                {v.version_number != null && (
                  <span style={{ ...s.badge, ...s.badgeCyan }}>v{v.version_number}</span>
                )}
              </div>

              {/* Performance Score */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Performance
                </div>
                <ScoreBadge score={v.performance_score} />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{formatDate(v.created_at)}</span>
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
              <span style={s.modalTitle}>
                {detailItem.prompt_name || `Prompt #${detailItem.prompt_id}`}
                {detailItem.version_number != null && ` — v${detailItem.version_number}`}
              </span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('Prompt', detailItem.prompt_name || `#${detailItem.prompt_id}`)}
              {field('Version', detailItem.version_number != null ? `v${detailItem.version_number}` : '—')}
              {field('Change Notes', detailItem.change_notes)}
              {field('Content', (
                <pre style={{ background: '#0f172a', padding: 12, borderRadius: 8, fontSize: 12, color: '#e2e8f0', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {detailItem.content}
                </pre>
              ))}
              {field('Performance', <ScoreBadge score={detailItem.performance_score} />)}
              {field('Created At', formatDate(detailItem.created_at))}
              {detailItem.updated_at && field('Updated At', formatDate(detailItem.updated_at))}
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
              <span style={s.modalTitle}>{editingId ? 'Edit Version' : 'New Version'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('prompt_id', 'Prompt ID', { type: 'number', min: '1' })}
              {input('content', 'Content', { type: 'textarea', rows: 6 })}
              {input('change_notes', 'Change Notes', { type: 'textarea', rows: 3 })}
              {input('performance_score', 'Performance Score (0-100)', { type: 'number', min: '0', max: '100', step: '0.1' })}
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
                Are you sure you want to delete this version? This action cannot be undone.
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
