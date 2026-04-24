import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  name: '', description: '', default_value: '', variable_type: 'text',
  validation_regex: '', required: false,
};

const typeBadge = (type) => {
  const map = {
    text: s.badgeBlue,
    number: s.badgeGreen,
    select: s.badgePurple,
    textarea: s.badgeCyan,
  };
  return { ...s.badge, ...(map[type] || s.badgeAmber) };
};

export default function Variables() {
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
      const data = await api.get('/variables');
      setItems(Array.isArray(data) ? data : data.variables || data.data || []);
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
      default_value: item.default_value || '',
      variable_type: item.variable_type || 'text',
      validation_regex: item.validation_regex || '',
      required: item.required || false,
    });
    setFormOpen(true);
    setDetailItem(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await api.put(`/variables/${editingId}`, formData);
      } else {
        await api.post('/variables', formData);
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
      await api.delete(`/variables/${id}`);
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
      <label style={s.label}>
        {label}
        {opts.requiredField && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
      </label>
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
          <div style={s.title}>Prompt Variables</div>
          <div style={s.subtitle}>Define and manage dynamic variables for your prompts</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Variable</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading variables...</div>
      ) : items.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>{'{x}'}</div>
          <div style={s.emptyText}>No variables yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Variable" to create your first variable.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {items.map((item) => (
            <div
              key={item.id}
              style={hovered === item.id ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(item)}
            >
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                      fontSize: 15, fontWeight: 600, color: '#f1f5f9',
                      background: '#0f172a', padding: '2px 8px', borderRadius: 4,
                    }}>
                      {item.name}
                    </span>
                    {item.required && (
                      <span style={{ color: '#f87171', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>*</span>
                    )}
                  </div>
                  <div style={s.cardDesc}>
                    {item.description ? (item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description) : 'No description'}
                  </div>
                </div>
                <span style={typeBadge(item.variable_type)}>{item.variable_type || 'text'}</span>
              </div>

              {/* Default value & prompt name */}
              <div style={s.cardMeta}>
                {item.default_value && (
                  <span style={{
                    ...s.badge, background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8',
                  }}>
                    default: {item.default_value.length > 20 ? item.default_value.slice(0, 20) + '...' : item.default_value}
                  </span>
                )}
                {item.prompt_name && (
                  <span style={{ ...s.badge, ...s.badgePurple }}>{item.prompt_name}</span>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155',
              }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {item.required
                    ? <span style={{ color: '#f87171', fontWeight: 600 }}>Required</span>
                    : <span>Optional</span>
                  }
                </div>
                <span style={typeBadge(item.variable_type)}>
                  {item.variable_type || 'text'}
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
              <span style={s.modalTitle}>
                <span style={{
                  fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                  marginRight: 8,
                }}>
                  {detailItem.name}
                </span>
                {detailItem.required && <span style={{ color: '#f87171', fontSize: 18 }}>*</span>}
              </span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('Name', (
                <span style={{ fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace' }}>
                  {detailItem.name}
                </span>
              ))}
              {field('Description', detailItem.description)}
              {field('Variable Type', <span style={typeBadge(detailItem.variable_type)}>{detailItem.variable_type || 'text'}</span>)}
              {field('Default Value', detailItem.default_value)}
              {field('Validation Regex', detailItem.validation_regex ? (
                <code style={{ background: '#0f172a', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: '#fbbf24' }}>
                  {detailItem.validation_regex}
                </code>
              ) : null)}
              {field('Required', detailItem.required ? (
                <span style={{ color: '#f87171', fontWeight: 600 }}>Yes</span>
              ) : 'No')}
              {field('Prompt Name', detailItem.prompt_name)}
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
              <span style={s.modalTitle}>{editingId ? 'Edit Variable' : 'New Variable'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('name', 'Name', { requiredField: true })}
              {input('description', 'Description', { type: 'textarea', rows: 3 })}
              {input('default_value', 'Default Value')}
              {input('variable_type', 'Variable Type', { type: 'select', options: ['text', 'number', 'select', 'textarea'] })}
              {input('validation_regex', 'Validation Regex')}
              {input('required', 'Required', { type: 'checkbox', checkboxLabel: 'This variable is required' })}
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
                Are you sure you want to delete this variable? This action cannot be undone.
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
