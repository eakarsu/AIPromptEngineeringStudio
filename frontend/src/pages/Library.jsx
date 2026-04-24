import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  title: '', description: '', category: '', difficulty: 'beginner',
  use_case: '', example_output: '', is_featured: false,
};

const difficultyBadge = (d) => {
  const map = {
    beginner: s.badgeGreen,
    intermediate: s.badgeAmber,
    advanced: s.badgeRed,
  };
  return { ...s.badge, ...(map[d] || s.badgePurple) };
};

const renderStars = (rating) => {
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#fbbf24', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>{r.toFixed(1)}</span>
    </span>
  );
};

export default function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

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
      const data = await api.get('/library');
      setItems(Array.isArray(data) ? data : data.library || data.data || []);
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
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      difficulty: item.difficulty || 'beginner',
      use_case: item.use_case || '',
      example_output: item.example_output || '',
      is_featured: item.is_featured || false,
    });
    setFormOpen(true);
    setDetailItem(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await api.put(`/library/${editingId}`, formData);
      } else {
        await api.post('/library', formData);
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
      await api.delete(`/library/${id}`);
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
      ) : opts.type === 'checkbox' ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData[key]}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: '#6366f1' }}
          />
          <span style={{ fontSize: 13, color: '#e2e8f0' }}>{opts.checkboxLabel || 'Yes'}</span>
        </label>
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
          <div style={s.title}>Prompt Library</div>
          <div style={s.subtitle}>Browse and manage reusable prompt templates</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ Add to Library</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading library...</div>
      ) : items.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📚</div>
          <div style={s.emptyText}>No library items yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "Add to Library" to create your first entry.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                ...(hovered === item.id ? { ...s.card, ...s.cardHover } : s.card),
                ...(item.is_featured ? { borderColor: '#fbbf24', boxShadow: '0 0 16px rgba(251,191,36,0.15)' } : {}),
              }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(item)}
            >
              {/* Featured indicator */}
              {item.is_featured && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 16, color: '#fbbf24', lineHeight: 1,
                }}>
                  ★
                </div>
              )}

              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{item.title}</div>
                  <div style={s.cardDesc}>
                    {item.description ? (item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description) : 'No description'}
                  </div>
                </div>
                <span style={difficultyBadge(item.difficulty)}>{item.difficulty || 'beginner'}</span>
              </div>

              {/* Category & use case */}
              <div style={s.cardMeta}>
                {item.category && (
                  <span style={{ ...s.badge, ...s.badgeBlue }}>{item.category}</span>
                )}
                {item.use_case && (
                  <span style={{ ...s.badge, ...s.badgeCyan }}>{item.use_case}</span>
                )}
              </div>

              {/* Footer: downloads, rating */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ fontSize: 14 }}>↓</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.downloads ?? 0}</span>
                  <span>downloads</span>
                </div>
                <div>{renderStars(item.rating)}</div>
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
                {detailItem.is_featured && <span style={{ color: '#fbbf24', marginRight: 8 }}>★</span>}
                {detailItem.title}
              </span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('Title', detailItem.title)}
              {field('Description', detailItem.description)}
              {field('Category', detailItem.category)}
              {field('Difficulty', <span style={difficultyBadge(detailItem.difficulty)}>{detailItem.difficulty || 'beginner'}</span>)}
              {field('Use Case', detailItem.use_case)}
              {field('Example Output', detailItem.example_output ? (
                <pre style={{ background: '#0f172a', padding: 12, borderRadius: 8, fontSize: 12, color: '#e2e8f0', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {detailItem.example_output}
                </pre>
              ) : null)}
              {field('Featured', detailItem.is_featured ? 'Yes' : 'No')}
              {field('Downloads', detailItem.downloads ?? 0)}
              {field('Rating', renderStars(detailItem.rating))}
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
              <span style={s.modalTitle}>{editingId ? 'Edit Library Item' : 'Add to Library'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('title', 'Title')}
              {input('description', 'Description', { type: 'textarea', rows: 3 })}
              {input('category', 'Category')}
              {input('difficulty', 'Difficulty', { type: 'select', options: ['beginner', 'intermediate', 'advanced'] })}
              {input('use_case', 'Use Case')}
              {input('example_output', 'Example Output', { type: 'textarea', rows: 5 })}
              {input('is_featured', 'Featured', { type: 'checkbox', checkboxLabel: 'Mark as featured' })}
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
                Are you sure you want to delete this library item? This action cannot be undone.
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
