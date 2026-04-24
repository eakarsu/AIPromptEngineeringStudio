import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const languageOptions = ['text', 'prompt', 'system-prompt', 'json', 'markdown', 'xml', 'yaml', 'python', 'javascript'];

export default function Snippets() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', description: '', language: 'text', tags: '', is_pinned: false });
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/snippets');
      setSnippets(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const save = async () => {
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (editing) {
        const data = await api.put(`/snippets/${editing.id}`, payload);
        setSnippets(snippets.map(s => s.id === editing.id ? data : s));
      } else {
        const data = await api.post('/snippets', payload);
        setSnippets([data, ...snippets]);
      }
      setShowModal(false);
      setForm({ title: '', content: '', description: '', language: 'text', tags: '', is_pinned: false });
      setEditing(null);
    } catch (err) { alert(err.message); }
  };

  const togglePin = async (snippet) => {
    try {
      const data = await api.put(`/snippets/${snippet.id}/pin`);
      setSnippets(snippets.map(s => s.id === snippet.id ? data : s));
    } catch (err) { console.error(err); }
  };

  const copySnippet = async (snippet) => {
    navigator.clipboard.writeText(snippet.content);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
    try { await api.post(`/snippets/${snippet.id}/use`); } catch (err) { /* ok */ }
  };

  const deleteSnippet = async (id) => {
    try {
      await api.delete(`/snippets/${id}`);
      setSnippets(snippets.filter(s => s.id !== id));
      if (viewing?.id === id) setViewing(null);
    } catch (err) { console.error(err); }
  };

  const openEdit = (snippet) => {
    setEditing(snippet);
    setForm({
      title: snippet.title, content: snippet.content, description: snippet.description || '',
      language: snippet.language, tags: (snippet.tags || []).join(', '), is_pinned: snippet.is_pinned,
    });
    setShowModal(true);
  };

  const filtered = snippets
    .filter(sn => !filterLang || sn.language === filterLang)
    .filter(sn => !search || sn.title.toLowerCase().includes(search.toLowerCase()) || sn.content.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Snippets</h1>
          <p style={s.subtitle}>{snippets.length} reusable text snippets</p>
        </div>
        <button style={s.addBtn} onClick={() => {
          setEditing(null); setForm({ title: '', content: '', description: '', language: 'text', tags: '', is_pinned: false }); setShowModal(true);
        }}>+ New Snippet</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...s.input, maxWidth: 300 }} placeholder="Search snippets..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...s.select, maxWidth: 200 }} value={filterLang} onChange={e => setFilterLang(e.target.value)}>
          <option value="">All languages</option>
          {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {viewing ? (
        <div>
          <button style={{ ...s.btnSecondary, marginBottom: 16 }} onClick={() => setViewing(null)}>Back</button>
          <div style={{ ...s.card, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{viewing.title}</div>
                {viewing.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{viewing.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.btnSuccess} onClick={() => copySnippet(viewing)}>
                  {copiedId === viewing.id ? 'Copied!' : 'Copy'}
                </button>
                <button style={s.btnSecondary} onClick={() => openEdit(viewing)}>Edit</button>
              </div>
            </div>
            <div style={s.cardMeta}>
              <span style={{ ...s.badge, ...s.badgePurple }}>{viewing.language}</span>
              {viewing.is_pinned && <span style={{ ...s.badge, ...s.badgeAmber }}>Pinned</span>}
              <span style={{ ...s.badge, ...s.badgeBlue }}>Used {viewing.usage_count}x</span>
            </div>
            <pre style={{
              marginTop: 16, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #334155',
              color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 500,
            }}>{viewing.content}</pre>
            {viewing.tags?.length > 0 && (
              <div style={{ ...s.cardMeta, marginTop: 12 }}>
                {viewing.tags.map(t => <span key={t} style={{ ...s.badge, background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{t}</span>)}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>✂</div>
              <div style={s.emptyText}>No snippets yet</div>
              <p style={{ color: '#64748b', fontSize: 13 }}>Create reusable text snippets for your prompts</p>
            </div>
          ) : (
            <div style={s.grid}>
              {filtered.map(sn => (
                <div key={sn.id} style={{
                  ...s.card, ...(hoveredCard === sn.id ? s.cardHover : {}),
                }} onMouseEnter={() => setHoveredCard(sn.id)} onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setViewing(sn)}>
                  <div style={s.cardHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {sn.is_pinned && <span>📌</span>}
                        <div style={s.cardTitle}>{sn.title}</div>
                      </div>
                      {sn.description && <div style={s.cardDesc}>{sn.description}</div>}
                    </div>
                  </div>
                  <pre style={{
                    margin: '8px 0', padding: 10, background: '#0f172a', borderRadius: 6,
                    fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', maxHeight: 80, overflow: 'hidden',
                    whiteSpace: 'pre-wrap', border: '1px solid #1e293b',
                  }}>{sn.content.substring(0, 200)}</pre>
                  <div style={s.cardMeta}>
                    <span style={{ ...s.badge, ...s.badgePurple }}>{sn.language}</span>
                    <span style={{ ...s.badge, ...s.badgeBlue }}>Used {sn.usage_count}x</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <button style={{ ...s.btnSuccess, padding: '4px 12px', fontSize: 11 }} onClick={() => copySnippet(sn)}>
                      {copiedId === sn.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11 }} onClick={() => togglePin(sn)}>
                      {sn.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11 }} onClick={() => openEdit(sn)}>Edit</button>
                    <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11, color: '#f87171', borderColor: '#ef4444' }} onClick={() => deleteSnippet(sn.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={{ ...s.modal, maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editing ? 'Edit Snippet' : 'New Snippet'}</span>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Title</label>
                <input style={s.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Content</label>
                <textarea style={{ ...s.textarea, minHeight: 200, fontFamily: 'monospace' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <input style={s.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...s.formGroup, flex: 1 }}>
                  <label style={s.label}>Language</label>
                  <select style={s.select} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                    {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ ...s.formGroup, flex: 1 }}>
                  <label style={s.label}>Tags (comma separated)</label>
                  <input style={s.input} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" />
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} />
                  Pin to top
                </label>
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
