import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [promptComments, setPromptComments] = useState([]);
  const [content, setContent] = useState('');
  const [viewPrompt, setViewPrompt] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [c, p] = await Promise.all([
        api.get('/comments'),
        api.get('/prompts'),
      ]);
      setComments(c);
      setPrompts(p);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const viewComments = async (promptId) => {
    try {
      const data = await api.get(`/comments/prompt/${promptId}`);
      setPromptComments(data);
      setViewPrompt(prompts.find(p => p.id === promptId));
    } catch (err) { console.error(err); }
  };

  const addComment = async () => {
    if (!content.trim()) return;
    const promptId = viewPrompt?.id || selectedPrompt;
    if (!promptId) return;
    try {
      const data = await api.post('/comments', { prompt_id: parseInt(promptId), content });
      if (viewPrompt) {
        setPromptComments([...promptComments, data]);
      }
      setComments([data, ...comments]);
      setContent('');
      if (!viewPrompt) setShowAdd(false);
    } catch (err) { console.error(err); }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter(c => c.id !== id));
      setPromptComments(promptComments.filter(c => c.id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Comments</h1>
          <p style={s.subtitle}>{comments.length} comments across your prompts</p>
        </div>
        <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add Comment</button>
      </div>

      {viewPrompt ? (
        <div>
          <button style={{ ...s.btnSecondary, marginBottom: 16 }} onClick={() => { setViewPrompt(null); setPromptComments([]); }}>
            Back to all comments
          </button>
          <div style={{ ...s.card, marginBottom: 16, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{viewPrompt.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{viewPrompt.description}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {promptComments.map(c => (
              <div key={c.id} style={{ ...s.card, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      {c.author_name?.charAt(0) || '?'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{c.author_name}</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <button style={{ ...s.btnSecondary, padding: '2px 8px', fontSize: 10, color: '#f87171', borderColor: '#ef4444' }} onClick={() => deleteComment(c.id)}>Delete</button>
                </div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{c.content}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <textarea style={{ ...s.textarea, minHeight: 60, flex: 1 }} value={content} onChange={e => setContent(e.target.value)} placeholder="Write a comment..." />
            <button style={{ ...s.btnPrimary, alignSelf: 'flex-end' }} onClick={addComment}>Post</button>
          </div>
        </div>
      ) : (
        <>
          {/* Prompts with comment counts */}
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Prompts</h3>
          <div style={{ ...s.grid, marginBottom: 24 }}>
            {prompts.map(p => {
              const count = comments.filter(c => c.prompt_id === p.id).length;
              return (
                <div key={p.id} style={{ ...s.card, cursor: 'pointer', padding: 14 }} onClick={() => viewComments(p.id)}>
                  <div style={s.cardTitle}>{p.name}</div>
                  <div style={{ ...s.badge, ...s.badgePurple, marginTop: 8 }}>{count} comment{count !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>

          {/* Recent comments */}
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Recent Comments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.slice(0, 20).map(c => (
              <div key={c.id} style={{ ...s.card, padding: 14, cursor: 'pointer' }} onClick={() => viewComments(c.prompt_id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>{c.prompt_name}</span>
                  <span style={{ fontSize: 11, color: '#475569' }}>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 13, color: '#e2e8f0' }}>{c.content.substring(0, 150)}{c.content.length > 150 ? '...' : ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <div style={s.overlay} onClick={() => setShowAdd(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Add Comment</span>
              <button style={s.modalClose} onClick={() => setShowAdd(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Prompt</label>
                <select style={s.select} value={selectedPrompt} onChange={e => setSelectedPrompt(e.target.value)}>
                  <option value="">Select prompt...</option>
                  {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Comment</label>
                <textarea style={s.textarea} value={content} onChange={e => setContent(e.target.value)} placeholder="Write your comment..." />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowAdd(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={addComment}>Post Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
