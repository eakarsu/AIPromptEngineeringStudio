import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'];

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#6366f1', description: '' });
  const [search, setSearch] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/tags');
      setTags(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const save = async () => {
    try {
      if (editing) {
        const data = await api.put(`/tags/${editing.id}`, form);
        setTags(tags.map(t => t.id === editing.id ? data : t));
      } else {
        const data = await api.post('/tags', form);
        setTags([...tags, data]);
      }
      setShowModal(false);
      setForm({ name: '', color: '#6366f1', description: '' });
      setEditing(null);
    } catch (err) { alert(err.message); }
  };

  const deleteTag = async (id) => {
    try {
      await api.delete(`/tags/${id}`);
      setTags(tags.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const syncTags = async () => {
    try {
      await api.post('/tags/sync');
      load();
    } catch (err) { console.error(err); }
  };

  const openEdit = (tag) => {
    setEditing(tag);
    setForm({ name: tag.name, color: tag.color, description: tag.description || '' });
    setShowModal(true);
  };

  const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tags</h1>
          <p style={s.subtitle}>{tags.length} tags managing your prompts</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnSecondary} onClick={syncTags}>Sync from Prompts</button>
          <button style={s.addBtn} onClick={() => { setEditing(null); setForm({ name: '', color: '#6366f1', description: '' }); setShowModal(true); }}>+ New Tag</button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input style={{ ...s.input, maxWidth: 400 }} placeholder="Search tags..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🏷</div>
          <div style={s.emptyText}>No tags yet</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Create tags or sync from existing prompts</p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(tag => (
            <div key={tag.id} style={{
              ...s.card, ...(hoveredCard === tag.id ? s.cardHover : {}),
            }} onMouseEnter={() => setHoveredCard(tag.id)} onMouseLeave={() => setHoveredCard(null)}>
              <div style={s.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                  <div>
                    <div style={s.cardTitle}>{tag.name}</div>
                    {tag.description && <div style={s.cardDesc}>{tag.description}</div>}
                  </div>
                </div>
              </div>
              <div style={s.cardMeta}>
                <span style={{ ...s.badge, ...s.badgePurple }}>Used {tag.usage_count}x</span>
                <span style={{ fontSize: 11, color: '#475569' }}>{new Date(tag.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ ...s.btnSecondary, padding: '4px 12px', fontSize: 11 }} onClick={() => openEdit(tag)}>Edit</button>
                <button style={{ ...s.btnSecondary, padding: '4px 12px', fontSize: 11, color: '#f87171', borderColor: '#ef4444' }} onClick={() => deleteTag(tag.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editing ? 'Edit Tag' : 'New Tag'}</span>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {colorOptions.map(c => (
                    <div key={c} onClick={() => setForm({ ...form, color: c })} style={{
                      width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                      border: form.color === c ? '3px solid #fff' : '3px solid transparent',
                    }} />
                  ))}
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <textarea style={s.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
