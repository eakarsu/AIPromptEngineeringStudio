import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles } from '../styles';
import AIOutput from '../components/AIOutput';

const s = pageStyles;

const defaultForm = {
  name: '',
  prompt_id: '',
  input_text: '',
  output_text: '',
  score: '',
  evaluation_type: 'manual',
  feedback: '',
};

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  // Modals
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  // AI evaluation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/evaluations');
      setEvaluations(Array.isArray(data) ? data : data.evaluations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setForm({
      name: ev.name || '',
      prompt_id: ev.prompt_id || '',
      input_text: ev.input_text || '',
      output_text: ev.output_text || '',
      score: ev.score != null ? ev.score : '',
      evaluation_type: ev.evaluation_type || 'manual',
      feedback: ev.feedback || '',
    });
    setEditing(ev);
    setSelected(null);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        prompt_id: form.prompt_id ? Number(form.prompt_id) : undefined,
        score: form.score !== '' ? Number(form.score) : undefined,
      };
      if (editing) {
        await api.put(`/evaluations/${editing.id}`, payload);
      } else {
        await api.post('/evaluations', payload);
      }
      setShowForm(false);
      fetchEvaluations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evaluation?')) return;
    try {
      await api.delete(`/evaluations/${id}`);
      setSelected(null);
      fetchEvaluations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAiEvaluate = async (ev) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/evaluate', {
        prompt: ev.input_text,
        output: ev.output_text,
        criteria: ev.feedback || 'Evaluate the quality, relevance, and accuracy of this output.',
        evaluation_id: ev.id,
      });
      setAiResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score == null) return '#64748b';
    if (score > 80) return '#22c55e';
    if (score > 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreBarBg = (score) => {
    if (score == null) return 'rgba(100,116,139,0.2)';
    if (score > 80) return 'rgba(34,197,94,0.15)';
    if (score > 60) return 'rgba(245,158,11,0.15)';
    return 'rgba(239,68,68,0.15)';
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'automated': return s.badgeBlue;
      case 'ai': return s.badgePurple;
      default: return s.badgeCyan;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return s.badgeGreen;
      case 'failed': return s.badgeRed;
      default: return s.badgeAmber;
    }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div style={s.loading}>Loading evaluations...</div>;

  return (
    <div style={s.page}>
      {error && <div style={s.error}>{error}</div>}

      <div style={s.header}>
        <div>
          <div style={s.title}>Evaluations</div>
          <div style={s.subtitle}>{evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}</div>
        </div>
        <button style={s.addBtn} onClick={openCreate}>+ New Evaluation</button>
      </div>

      {evaluations.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>&#128202;</div>
          <div style={s.emptyText}>No evaluations yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Create your first evaluation to get started.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {evaluations.map((ev) => (
            <div
              key={ev.id}
              style={{ ...s.card, ...(hoveredId === ev.id ? s.cardHover : {}) }}
              onClick={() => { setSelected(ev); setAiResult(null); }}
              onMouseEnter={() => setHoveredId(ev.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>{ev.name || `Evaluation #${ev.id}`}</div>
              </div>
              {ev.prompt_name && <div style={s.cardDesc}>Prompt: {ev.prompt_name}</div>}

              {/* Score bar */}
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Score</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(ev.score) }}>
                    {ev.score != null ? ev.score : '--'}/100
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: getScoreBarBg(ev.score), overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${ev.score != null ? ev.score : 0}%`,
                    background: getScoreColor(ev.score),
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>

              <div style={s.cardMeta}>
                <span style={{ ...s.badge, ...getTypeBadge(ev.evaluation_type) }}>
                  {ev.evaluation_type || 'manual'}
                </span>
                <span style={{ ...s.badge, ...getStatusBadge(ev.status) }}>
                  {ev.status || 'pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{selected.name || `Evaluation #${selected.id}`}</div>
              <button style={s.modalClose} onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>ID</span>
                <span style={s.detailValue}>{selected.id}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Name</span>
                <span style={s.detailValue}>{selected.name}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Prompt ID</span>
                <span style={s.detailValue}>{selected.prompt_id || '--'}</span>
              </div>
              {selected.prompt_name && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Prompt Name</span>
                  <span style={s.detailValue}>{selected.prompt_name}</span>
                </div>
              )}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Type</span>
                <span style={s.detailValue}>
                  <span style={{ ...s.badge, ...getTypeBadge(selected.evaluation_type) }}>
                    {selected.evaluation_type || 'manual'}
                  </span>
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Status</span>
                <span style={s.detailValue}>
                  <span style={{ ...s.badge, ...getStatusBadge(selected.status) }}>
                    {selected.status || 'pending'}
                  </span>
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Score</span>
                <span style={s.detailValue}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: getScoreColor(selected.score) }}>
                      {selected.score != null ? selected.score : '--'}/100
                    </span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: getScoreBarBg(selected.score), overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${selected.score || 0}%`, background: getScoreColor(selected.score) }} />
                    </div>
                  </div>
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Input Text</span>
                <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap', background: '#0f172a', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
                  {selected.input_text || '--'}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Output Text</span>
                <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap', background: '#0f172a', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
                  {selected.output_text || '--'}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Feedback</span>
                <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap' }}>{selected.feedback || '--'}</span>
              </div>
              {selected.created_at && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Created</span>
                  <span style={s.detailValue}>{new Date(selected.created_at).toLocaleString()}</span>
                </div>
              )}

              {/* AI Evaluate */}
              {aiLoading && (
                <div style={{ ...s.loading, padding: 24 }}>Running AI Evaluation...</div>
              )}
              {aiResult && (
                <AIOutput
                  response={aiResult.response || aiResult.analysis || aiResult.result}
                  usage={aiResult.usage}
                  model={aiResult.model}
                  latency={aiResult.latency_ms}
                  cost={aiResult.cost}
                  title="AI Evaluation"
                />
              )}
            </div>
            <div style={s.modalFooter}>
              <button
                style={{ ...s.btnSuccess, opacity: aiLoading ? 0.6 : 1 }}
                disabled={aiLoading}
                onClick={() => handleAiEvaluate(selected)}
              >
                {aiLoading ? 'Evaluating...' : 'Evaluate with AI'}
              </button>
              <button style={s.btnPrimary} onClick={() => openEdit(selected)}>Edit</button>
              <button style={s.btnDanger} onClick={() => handleDelete(selected.id)}>Delete</button>
              <button style={s.btnSecondary} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{editing ? 'Edit Evaluation' : 'New Evaluation'}</div>
              <button style={s.modalClose} onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={s.modalBody}>
                <div style={s.formGroup}>
                  <label style={s.label}>Name</label>
                  <input
                    style={s.input}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Evaluation name"
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Prompt ID</label>
                  <input
                    style={s.input}
                    type="number"
                    value={form.prompt_id}
                    onChange={(e) => set('prompt_id', e.target.value)}
                    placeholder="Linked prompt ID"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Input Text</label>
                  <textarea
                    style={s.textarea}
                    value={form.input_text}
                    onChange={(e) => set('input_text', e.target.value)}
                    placeholder="The prompt / input text that was sent"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Output Text</label>
                  <textarea
                    style={s.textarea}
                    value={form.output_text}
                    onChange={(e) => set('output_text', e.target.value)}
                    placeholder="The AI-generated output to evaluate"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Score (0-100)</label>
                  <input
                    style={s.input}
                    type="number"
                    min="0"
                    max="100"
                    value={form.score}
                    onChange={(e) => set('score', e.target.value)}
                    placeholder="0 - 100"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Evaluation Type</label>
                  <select
                    style={s.select}
                    value={form.evaluation_type}
                    onChange={(e) => set('evaluation_type', e.target.value)}
                  >
                    <option value="manual">Manual</option>
                    <option value="automated">Automated</option>
                    <option value="ai">AI</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Feedback</label>
                  <textarea
                    style={s.textarea}
                    value={form.feedback}
                    onChange={(e) => set('feedback', e.target.value)}
                    placeholder="Additional feedback or evaluation criteria"
                  />
                </div>
              </div>
              <div style={s.modalFooter}>
                <button type="submit" style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }} disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" style={s.btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
