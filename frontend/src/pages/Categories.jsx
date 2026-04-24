import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  name: '', description: '', color: '#6366f1', icon: '',
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
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
      const data = await api.get('/categories');
      setCategories(Array.isArray(data) ? data : data.categories || data.data || []);
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
      description: item.description || '',
      color: item.color || '#6366f1',
      icon: item.icon || '',
    });
    setFormOpen(true);
    setDetailItem(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
      } else {
        await api.post('/categories', formData);
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
      await api.delete(`/categories/${id}`);
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
      {opts.type === 'color' ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="color"
            value={formData[key]}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            style={{ width: 48, height: 38, border: '1px solid #475569', borderRadius: 8, background: '#0f172a', cursor: 'pointer', padding: 2 }}
          />
          <input
            style={{ ...s.input, flex: 1 }}
            type="text"
            value={formData[key]}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            placeholder="#6366f1"
          />
        </div>
      ) : (
        <input
          style={s.input}
          type={opts.type || 'text'}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          placeholder={opts.placeholder}
        />
      )}
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Categories</div>
          <div style={s.subtitle}>Organize your prompts into categories</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Category</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📂</div>
          <div style={s.emptyText}>No categories yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Category" to create your first category.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                ...(hovered === cat.id ? { ...s.card, ...s.cardHover } : s.card),
                borderLeft: `4px solid ${cat.color || '#6366f1'}`,
              }}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(cat)}
            >
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {cat.icon && <span style={{ fontSize: 18 }}>{cat.icon}</span>}
                    <div style={s.cardTitle}>{cat.name}</div>
                  </div>
                  <div style={s.cardDesc}>
                    {cat.description ? (cat.description.length > 120 ? cat.description.slice(0, 120) + '...' : cat.description) : 'No description'}
                  </div>
                </div>
                {/* Color swatch */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: cat.color || '#6366f1', flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.1)',
                }} />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155',
              }}>
                <span style={{ ...s.badge, ...s.badgePurple }}>
                  {cat.prompt_count ?? 0} prompt{(cat.prompt_count ?? 0) !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                  {cat.color || '#6366f1'}
                </span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {detailItem.icon && <span style={{ fontSize: 22 }}>{detailItem.icon}</span>}
                <span style={s.modalTitle}>{detailItem.name}</span>
              </div>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('Name', detailItem.name)}
              {field('Description', detailItem.description)}
              {field('Color', (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: detailItem.color || '#6366f1',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }} />
                  <span style={{ fontFamily: 'monospace' }}>{detailItem.color || '#6366f1'}</span>
                </div>
              ))}
              {field('Icon', detailItem.icon)}
              {field('Prompt Count', detailItem.prompt_count ?? 0)}
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
              <span style={s.modalTitle}>{editingId ? 'Edit Category' : 'New Category'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('name', 'Name')}
              {input('description', 'Description')}
              {input('color', 'Color', { type: 'color' })}
              {input('icon', 'Icon', { placeholder: 'e.g. an emoji or icon name' })}
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
                Are you sure you want to delete this category? This action cannot be undone.
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
