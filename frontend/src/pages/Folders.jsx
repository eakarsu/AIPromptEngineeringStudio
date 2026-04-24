import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
const iconOptions = ['folder', 'star', 'heart', 'code', 'book', 'zap', 'globe', 'lock'];
const iconMap = { folder: '📁', star: '⭐', heart: '❤️', code: '💻', book: '📖', zap: '⚡', globe: '🌐', lock: '🔒' };

export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewFolder, setViewFolder] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: 'folder' });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [f, p] = await Promise.all([api.get('/folders'), api.get('/prompts')]);
      setFolders(f);
      setPrompts(p);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openFolder = async (id) => {
    try {
      const data = await api.get(`/folders/${id}`);
      setViewFolder(data);
    } catch (err) { console.error(err); }
  };

  const save = async () => {
    try {
      if (editing) {
        const data = await api.put(`/folders/${editing.id}`, form);
        setFolders(folders.map(f => f.id === editing.id ? { ...data, prompt_count: editing.prompt_count } : f));
      } else {
        const data = await api.post('/folders', form);
        setFolders([...folders, { ...data, prompt_count: 0 }]);
      }
      setShowModal(false);
      setForm({ name: '', description: '', color: '#6366f1', icon: 'folder' });
      setEditing(null);
    } catch (err) { alert(err.message); }
  };

  const deleteFolder = async (id) => {
    try {
      await api.delete(`/folders/${id}`);
      setFolders(folders.filter(f => f.id !== id));
      if (viewFolder?.id === id) setViewFolder(null);
    } catch (err) { console.error(err); }
  };

  const addPromptToFolder = async (promptId) => {
    if (!viewFolder) return;
    try {
      await api.post(`/folders/${viewFolder.id}/prompts`, { prompt_id: promptId });
      openFolder(viewFolder.id);
      setShowAddPrompt(false);
    } catch (err) { console.error(err); }
  };

  const removeFromFolder = async (promptId) => {
    if (!viewFolder) return;
    try {
      await api.delete(`/folders/${viewFolder.id}/prompts/${promptId}`);
      setViewFolder({ ...viewFolder, prompts: viewFolder.prompts.filter(p => p.id !== promptId) });
    } catch (err) { console.error(err); }
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({ name: f.name, description: f.description || '', color: f.color, icon: f.icon });
    setShowModal(true);
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Folders</h1>
          <p style={s.subtitle}>Organize your prompts into folders</p>
        </div>
        <button style={s.addBtn} onClick={() => { setEditing(null); setForm({ name: '', description: '', color: '#6366f1', icon: 'folder' }); setShowModal(true); }}>+ New Folder</button>
      </div>

      {viewFolder ? (
        <div>
          <button style={{ ...s.btnSecondary, marginBottom: 16 }} onClick={() => setViewFolder(null)}>Back to Folders</button>
          <div style={{ ...s.card, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{iconMap[viewFolder.icon] || '📁'}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{viewFolder.name}</div>
                {viewFolder.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{viewFolder.description}</div>}
              </div>
            </div>
            <button style={{ ...s.btnSecondary, marginTop: 12, fontSize: 12 }} onClick={() => setShowAddPrompt(true)}>+ Add Prompt</button>
          </div>
          {viewFolder.prompts?.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyText}>No prompts in this folder</div>
            </div>
          ) : (
            <div style={s.grid}>
              {viewFolder.prompts?.map(p => (
                <div key={p.id} style={{ ...s.card, padding: 14 }}>
                  <div style={s.cardTitle}>{p.name}</div>
                  <div style={s.cardDesc}>{p.description || 'No description'}</div>
                  <div style={s.cardMeta}>
                    <span style={{ ...s.badge, ...(p.status === 'active' ? s.badgeGreen : s.badgeAmber) }}>{p.status}</span>
                    <span style={{ ...s.badge, ...s.badgePurple }}>{p.model?.split('/').pop()}</span>
                  </div>
                  <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11, marginTop: 10, color: '#f87171', borderColor: '#ef4444' }}
                    onClick={() => removeFromFolder(p.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {showAddPrompt && (
            <div style={s.overlay} onClick={() => setShowAddPrompt(false)}>
              <div style={s.modal} onClick={e => e.stopPropagation()}>
                <div style={s.modalHeader}>
                  <span style={s.modalTitle}>Add Prompt to Folder</span>
                  <button style={s.modalClose} onClick={() => setShowAddPrompt(false)}>x</button>
                </div>
                <div style={s.modalBody}>
                  {prompts.filter(p => !viewFolder.prompts?.find(fp => fp.id === p.id)).map(p => (
                    <div key={p.id} style={{ ...s.card, padding: 12, marginBottom: 8, cursor: 'pointer' }} onClick={() => addPromptToFolder(p.id)}>
                      <div style={s.cardTitle}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {folders.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📁</div>
              <div style={s.emptyText}>No folders yet</div>
              <p style={{ color: '#64748b', fontSize: 13 }}>Create folders to organize your prompts</p>
            </div>
          ) : (
            <div style={s.grid}>
              {folders.map(f => (
                <div key={f.id} style={{
                  ...s.card, ...(hoveredCard === f.id ? s.cardHover : {}), cursor: 'pointer',
                }} onMouseEnter={() => setHoveredCard(f.id)} onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => openFolder(f.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: f.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {iconMap[f.icon] || '📁'}
                    </div>
                    <div>
                      <div style={s.cardTitle}>{f.name}</div>
                      {f.description && <div style={s.cardDesc}>{f.description}</div>}
                    </div>
                  </div>
                  <div style={s.cardMeta}>
                    <span style={{ ...s.badge, ...s.badgePurple }}>{f.prompt_count || 0} prompts</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                    <button style={{ ...s.btnSecondary, padding: '4px 12px', fontSize: 11 }} onClick={() => openEdit(f)}>Edit</button>
                    <button style={{ ...s.btnSecondary, padding: '4px 12px', fontSize: 11, color: '#f87171', borderColor: '#ef4444' }} onClick={() => deleteFolder(f.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editing ? 'Edit Folder' : 'New Folder'}</span>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <textarea style={s.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                <label style={s.label}>Icon</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {iconOptions.map(i => (
                    <div key={i} onClick={() => setForm({ ...form, icon: i })} style={{
                      width: 40, height: 40, borderRadius: 8, background: form.icon === i ? 'rgba(99,102,241,0.2)' : '#0f172a',
                      border: form.icon === i ? '2px solid #6366f1' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer',
                    }}>{iconMap[i]}</div>
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
