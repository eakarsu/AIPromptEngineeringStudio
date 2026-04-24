import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  name: '', description: '', content: '', tags: '', model: '',
  temperature: 0.7, max_tokens: 1024, status: 'draft',
};

const statusBadge = (status) => {
  const map = {
    active: s.badgeGreen,
    draft: s.badgeAmber,
    archived: s.badgeRed,
  };
  return { ...s.badge, ...(map[status] || s.badgePurple) };
};

export default function PromptTemplates() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
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
      const data = await api.get('/prompts');
      setPrompts(Array.isArray(data) ? data : data.prompts || data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // --- handlers ---
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
      description: item.description || '',
      content: item.content || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      model: item.model || '',
      temperature: item.temperature ?? 0.7,
      max_tokens: item.max_tokens ?? 1024,
      status: item.status || 'draft',
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
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        temperature: parseFloat(formData.temperature),
        max_tokens: parseInt(formData.max_tokens, 10),
      };
      if (editingId) {
        await api.put(`/prompts/${editingId}`, payload);
      } else {
        await api.post('/prompts', payload);
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
      await api.delete(`/prompts/${id}`);
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
      {opts.type === 'textarea' ? (
        <textarea
          style={s.textarea}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          rows={opts.rows || 4}
        />
      ) : opts.type === 'select' ? (
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
          step={opts.step}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      )}
    </div>
  );

  // --- render ---
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Prompt Templates</div>
          <div style={s.subtitle}>Manage and organize your AI prompt templates</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Prompt</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading prompt templates...</div>
      ) : prompts.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📝</div>
          <div style={s.emptyText}>No prompt templates yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Prompt" to create your first template.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {prompts.map((p) => (
            <div
              key={p.id}
              style={hovered === p.id ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(p)}
            >
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{p.name}</div>
                  <div style={s.cardDesc}>
                    {p.description ? (p.description.length > 100 ? p.description.slice(0, 100) + '...' : p.description) : 'No description'}
                  </div>
                </div>
                <span style={statusBadge(p.status)}>{p.status || 'draft'}</span>
              </div>

              {/* Tags */}
              {p.tags && (Array.isArray(p.tags) ? p.tags : p.tags.split(',')).length > 0 && (
                <div style={s.cardMeta}>
                  {(Array.isArray(p.tags) ? p.tags : p.tags.split(',')).map((t, i) => (
                    <span key={i} style={{ ...s.badge, ...s.badgePurple }}>{String(t).trim()}</span>
                  ))}
                </div>
              )}

              {/* Footer stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {p.category && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      <span style={{ ...s.badge, ...s.badgeBlue }}>{p.category}</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
                  {p.usage_count != null && <span>Uses: {p.usage_count}</span>}
                  {p.avg_rating != null && (
                    <span style={{ color: '#fbbf24' }}>
                      {'★'} {Number(p.avg_rating).toFixed(1)}
                    </span>
                  )}
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
              {field('Description', detailItem.description)}
              {field('Status', <span style={statusBadge(detailItem.status)}>{detailItem.status || 'draft'}</span>)}
              {field('Content', (
                <pre style={{ background: '#0f172a', padding: 12, borderRadius: 8, fontSize: 12, color: '#e2e8f0', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {detailItem.content}
                </pre>
              ))}
              {field('Model', detailItem.model)}
              {field('Temperature', detailItem.temperature)}
              {field('Max Tokens', detailItem.max_tokens)}
              {field('Tags', Array.isArray(detailItem.tags) ? detailItem.tags.join(', ') : detailItem.tags)}
              {field('Category', detailItem.category)}
              {field('Usage Count', detailItem.usage_count)}
              {field('Avg Rating', detailItem.avg_rating != null ? `${Number(detailItem.avg_rating).toFixed(1)} / 5` : '—')}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setDetailItem(null)}>Close</button>
              <button style={s.btnDanger} onClick={() => { setConfirmDelete(detailItem.id); }}>Delete</button>
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
              <span style={s.modalTitle}>{editingId ? 'Edit Prompt' : 'New Prompt'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('name', 'Name')}
              {input('description', 'Description')}
              {input('content', 'Content', { type: 'textarea', rows: 6 })}
              {input('tags', 'Tags (comma separated)')}
              {input('model', 'Model')}
              {input('temperature', 'Temperature', { type: 'number', step: '0.1' })}
              {input('max_tokens', 'Max Tokens', { type: 'number' })}
              {input('status', 'Status', { type: 'select', options: ['draft', 'active', 'archived'] })}
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
                Are you sure you want to delete this prompt template? This action cannot be undone.
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
