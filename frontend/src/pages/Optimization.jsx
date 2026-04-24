import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles } from '../styles';
import AIOutput from '../components/AIOutput';

const s = pageStyles;

const statusBadge = (status) => {
  const map = {
    running: s.badgeGreen,
    completed: s.badgeBlue,
    pending: s.badgeAmber,
    failed: s.badgeRed,
  };
  return { ...s.badge, ...(map[status] || s.badgePurple) };
};

const scoreColor = (score) => {
  const n = Number(score);
  if (n > 80) return '#4ade80';
  if (n > 60) return '#fbbf24';
  return '#f87171';
};

const scoreBadgeStyle = (score) => {
  const color = scoreColor(score);
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
    color,
    background: color === '#4ade80' ? 'rgba(34,197,94,0.15)' : color === '#fbbf24' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
  };
};

const OPTIMIZATION_TYPES = ['general', 'clarity', 'precision', 'tone', 'creativity', 'conciseness'];

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center' }}>
    <div style={{
      width: 24, height: 24, border: '3px solid #334155', borderTopColor: '#6366f1',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
    <span style={{ color: '#94a3b8', fontSize: 13 }}>Optimizing with AI...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function Optimization() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  // Modals
  const [detailModal, setDetailModal] = useState(null);
  const [formModal, setFormModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form
  const emptyForm = { name: '', original_prompt: '', optimization_type: 'general', strategy: '' };
  const [form, setForm] = useState(emptyForm);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/optimization');
      setJobs(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      original_prompt: item.original_prompt || '',
      optimization_type: item.optimization_type || 'general',
      strategy: item.strategy || '',
    });
    setDetailModal(null);
    setFormModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/optimization/${editItem.id || editItem._id}`, form);
      } else {
        await api.post('/optimization', form);
      }
      setFormModal(false);
      fetchJobs();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this optimization job?')) return;
    try {
      await api.delete(`/optimization/${item.id || item._id}`);
      setDetailModal(null);
      fetchJobs();
    } catch (e) {
      setError(e.message);
    }
  };

  const runOptimize = async (item) => {
    try {
      setAiLoading(true);
      setAiResult(null);
      const res = await api.post('/ai/optimize', {
        prompt: item.original_prompt,
        optimization_type: item.optimization_type,
        job_id: item.id || item._id,
      });
      setAiResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const truncate = (text, len = 80) => {
    if (!text) return '';
    return text.length > len ? text.slice(0, len) + '...' : text;
  };

  if (loading) return <div style={s.loading}>Loading optimization jobs...</div>;

  return (
    <div style={s.page}>
      {error && <div style={s.error}>{error}<button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>Dismiss</button></div>}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Optimization</div>
          <div style={s.subtitle}>Optimize your prompts with AI-powered analysis</div>
        </div>
        <button style={s.addBtn} onClick={openCreate}>+ New Optimization</button>
      </div>

      {/* Grid */}
      {jobs.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>OPT</div>
          <div style={s.emptyText}>No optimization jobs yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Create your first job to optimize a prompt</div>
        </div>
      ) : (
        <div style={s.grid}>
          {jobs.map((j, i) => (
            <div
              key={j.id || j._id || i}
              style={hovered === i ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { setDetailModal(j); setAiResult(null); }}
            >
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>{j.name || 'Untitled'}</div>
                <span style={statusBadge(j.status)}>{j.status || 'pending'}</span>
              </div>
              {j.original_prompt && (
                <div style={{ ...s.cardDesc, fontFamily: 'monospace', background: '#0f172a', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                  {truncate(j.original_prompt)}
                </div>
              )}
              <div style={s.cardMeta}>
                {j.optimization_type && <span style={{ ...s.badge, ...s.badgePurple }}>{j.optimization_type}</span>}
                {j.strategy && <span style={{ ...s.badge, ...s.badgeCyan }}>{j.strategy}</span>}
              </div>
              {j.improvement_score != null && (
                <div style={{ marginTop: 12 }}>
                  <span style={scoreBadgeStyle(j.improvement_score)}>
                    {Number(j.improvement_score).toFixed(0)}% improvement
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={s.overlay} onClick={() => setDetailModal(null)}>
          <div style={{ ...s.modal, maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{detailModal.name || 'Optimization Detail'}</div>
              <button style={s.modalClose} onClick={() => setDetailModal(null)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Status</div>
                <div style={s.detailValue}><span style={statusBadge(detailModal.status)}>{detailModal.status || 'pending'}</span></div>
              </div>
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Type</div>
                <div style={s.detailValue}><span style={{ ...s.badge, ...s.badgePurple }}>{detailModal.optimization_type || 'general'}</span></div>
              </div>
              {detailModal.strategy && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Strategy</div>
                  <div style={s.detailValue}>{detailModal.strategy}</div>
                </div>
              )}
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Original Prompt</div>
                <div style={{ ...s.detailValue, background: '#0f172a', borderRadius: 8, padding: 12, fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {detailModal.original_prompt || 'N/A'}
                </div>
              </div>
              {detailModal.optimized_prompt && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Optimized Prompt</div>
                  <div style={{ ...s.detailValue, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: 12, fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {detailModal.optimized_prompt}
                  </div>
                </div>
              )}
              {detailModal.improvement_score != null && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Improvement</div>
                  <div style={s.detailValue}>
                    <span style={scoreBadgeStyle(detailModal.improvement_score)}>
                      {Number(detailModal.improvement_score).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              {/* AI Optimization Result */}
              {aiLoading && <Spinner />}
              {aiResult && (
                <div style={{ marginTop: 20 }}>
                  <AIOutput
                    response={aiResult.optimized_prompt || aiResult.response || JSON.stringify(aiResult, null, 2)}
                    title="Optimized Prompt"
                    usage={aiResult.usage}
                    model={aiResult.model}
                    latency={aiResult.latency}
                    cost={aiResult.cost}
                  />
                  {aiResult.improvement_score != null && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>Improvement Score:</span>
                      <span style={scoreBadgeStyle(aiResult.improvement_score)}>
                        {Number(aiResult.improvement_score).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {aiResult.suggestions && (
                    <div style={{ marginTop: 12, background: '#0f172a', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suggestions</div>
                      <AIOutput response={aiResult.suggestions} title="Improvement Suggestions" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSuccess} onClick={() => runOptimize(detailModal)} disabled={aiLoading}>
                {aiLoading ? 'Optimizing...' : 'Optimize with AI'}
              </button>
              <button style={s.btnPrimary} onClick={() => openEdit(detailModal)}>Edit</button>
              <button style={s.btnDanger} onClick={() => handleDelete(detailModal)}>Delete</button>
              <button style={s.btnSecondary} onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formModal && (
        <div style={s.overlay} onClick={() => setFormModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{editItem ? 'Edit Optimization' : 'New Optimization'}</div>
              <button style={s.modalClose} onClick={() => setFormModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Improve chatbot greeting" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Original Prompt</label>
                <textarea style={s.textarea} value={form.original_prompt} onChange={(e) => set('original_prompt', e.target.value)} placeholder="Paste the prompt you want to optimize..." />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Optimization Type</label>
                <select style={s.select} value={form.optimization_type} onChange={(e) => set('optimization_type', e.target.value)}>
                  {OPTIMIZATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Strategy</label>
                <input style={s.input} value={form.strategy} onChange={(e) => set('strategy', e.target.value)} placeholder="e.g. chain-of-thought, few-shot, role-play" />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setFormModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave}>{editItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
