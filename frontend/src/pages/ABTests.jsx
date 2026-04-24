import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles } from '../styles';
import AIOutput from '../components/AIOutput';

const s = pageStyles;

const statusBadge = (status) => {
  const map = {
    running: s.badgeGreen,
    completed: s.badgeBlue,
    draft: s.badgeAmber,
  };
  return { ...s.badge, ...(map[status] || s.badgePurple) };
};

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center' }}>
    <div style={{
      width: 24, height: 24, border: '3px solid #334155', borderTopColor: '#6366f1',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
    <span style={{ color: '#94a3b8', fontSize: 13 }}>Running AI test...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function ABTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  // Modals
  const [detailModal, setDetailModal] = useState(null);
  const [formModal, setFormModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form
  const emptyForm = { name: '', description: '', prompt_a_id: '', prompt_b_id: '', prompt_a_content: '', prompt_b_content: '', prompt_a_name: '', prompt_b_name: '', test_input: '', evaluation_criteria: '' };
  const [form, setForm] = useState(emptyForm);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await api.get('/ab-tests');
      setTests(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      prompt_a_id: item.prompt_a_id || '',
      prompt_b_id: item.prompt_b_id || '',
      prompt_a_content: item.prompt_a_content || '',
      prompt_b_content: item.prompt_b_content || '',
      prompt_a_name: item.prompt_a_name || '',
      prompt_b_name: item.prompt_b_name || '',
      test_input: item.test_input || '',
      evaluation_criteria: item.evaluation_criteria || '',
    });
    setDetailModal(null);
    setFormModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/ab-tests/${editItem.id || editItem._id}`, form);
      } else {
        await api.post('/ab-tests', form);
      }
      setFormModal(false);
      fetchTests();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this A/B test?')) return;
    try {
      await api.delete(`/ab-tests/${item.id || item._id}`);
      setDetailModal(null);
      fetchTests();
    } catch (e) {
      setError(e.message);
    }
  };

  const runTest = async (item) => {
    try {
      setAiLoading(true);
      setAiResult(null);
      const res = await api.post('/ai/ab-test/run', {
        prompt_a: item.prompt_a_content,
        prompt_b: item.prompt_b_content,
        test_input: item.test_input,
        test_id: item.id || item._id,
      });
      setAiResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div style={s.loading}>Loading A/B tests...</div>;

  return (
    <div style={s.page}>
      {error && <div style={s.error}>{error}<button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>Dismiss</button></div>}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>A/B Tests</div>
          <div style={s.subtitle}>Compare prompts side-by-side with AI evaluation</div>
        </div>
        <button style={s.addBtn} onClick={openCreate}>+ New A/B Test</button>
      </div>

      {/* Grid */}
      {tests.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>A/B</div>
          <div style={s.emptyText}>No A/B tests yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Create your first test to compare prompts</div>
        </div>
      ) : (
        <div style={s.grid}>
          {tests.map((t, i) => (
            <div
              key={t.id || t._id || i}
              style={hovered === i ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { setDetailModal(t); setAiResult(null); }}
            >
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>{t.name || 'Untitled'}</div>
                <span style={statusBadge(t.status)}>{t.status || 'draft'}</span>
              </div>
              {t.description && <div style={s.cardDesc}>{t.description}</div>}
              <div style={s.cardMeta}>
                {t.prompt_a_name && <span style={{ ...s.badge, ...s.badgePurple }}>A: {t.prompt_a_name}</span>}
                {t.prompt_b_name && <span style={{ ...s.badge, ...s.badgeCyan }}>B: {t.prompt_b_name}</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#64748b' }}>
                {t.total_runs != null && <span>Runs: {t.total_runs}</span>}
                {t.winner && <span style={{ color: '#4ade80', fontWeight: 600 }}>Winner: {t.winner}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={s.overlay} onClick={() => setDetailModal(null)}>
          <div style={{ ...s.modal, maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{detailModal.name || 'A/B Test Detail'}</div>
              <button style={s.modalClose} onClick={() => setDetailModal(null)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Status</div>
                <div style={s.detailValue}><span style={statusBadge(detailModal.status)}>{detailModal.status || 'draft'}</span></div>
              </div>
              {detailModal.description && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Description</div>
                  <div style={s.detailValue}>{detailModal.description}</div>
                </div>
              )}
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Prompt A</div>
                <div style={s.detailValue}>
                  {detailModal.prompt_a_name && <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: 4 }}>{detailModal.prompt_a_name}</strong>}
                  {detailModal.prompt_a_content && (
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, fontSize: 12, color: '#cbd5e1', whiteSpace: 'pre-wrap', marginTop: 4 }}>
                      {detailModal.prompt_a_content}
                    </div>
                  )}
                </div>
              </div>
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Prompt B</div>
                <div style={s.detailValue}>
                  {detailModal.prompt_b_name && <strong style={{ color: '#22d3ee', display: 'block', marginBottom: 4 }}>{detailModal.prompt_b_name}</strong>}
                  {detailModal.prompt_b_content && (
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, fontSize: 12, color: '#cbd5e1', whiteSpace: 'pre-wrap', marginTop: 4 }}>
                      {detailModal.prompt_b_content}
                    </div>
                  )}
                </div>
              </div>
              {detailModal.test_input && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Test Input</div>
                  <div style={{ ...s.detailValue, background: '#0f172a', borderRadius: 8, padding: 12, fontSize: 12, whiteSpace: 'pre-wrap' }}>{detailModal.test_input}</div>
                </div>
              )}
              {detailModal.evaluation_criteria && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Criteria</div>
                  <div style={s.detailValue}>{detailModal.evaluation_criteria}</div>
                </div>
              )}
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Total Runs</div>
                <div style={s.detailValue}>{detailModal.total_runs ?? 0}</div>
              </div>
              {detailModal.winner && (
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Winner</div>
                  <div style={{ ...s.detailValue, color: '#4ade80', fontWeight: 700 }}>{detailModal.winner}</div>
                </div>
              )}

              {/* AI Run Results */}
              {aiLoading && <Spinner />}
              {aiResult && (
                <div style={{ marginTop: 20 }}>
                  {/* Output A */}
                  {aiResult.output_a && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                        Output A
                      </div>
                      <AIOutput
                        response={aiResult.output_a}
                        title="Prompt A Output"
                        usage={aiResult.usage_a}
                        model={aiResult.model}
                        latency={aiResult.latency_a}
                        cost={aiResult.cost_a}
                      />
                    </div>
                  )}
                  {/* Output B */}
                  {aiResult.output_b && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
                        Output B
                      </div>
                      <AIOutput
                        response={aiResult.output_b}
                        title="Prompt B Output"
                        usage={aiResult.usage_b}
                        model={aiResult.model}
                        latency={aiResult.latency_b}
                        cost={aiResult.cost_b}
                      />
                    </div>
                  )}
                  {/* Judge Analysis */}
                  {aiResult.judge_analysis && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                        Judge Analysis
                      </div>
                      <AIOutput
                        response={aiResult.judge_analysis}
                        title="AI Judge Evaluation"
                        usage={aiResult.usage_judge}
                        model={aiResult.model}
                      />
                    </div>
                  )}
                  {/* Fallback: show full response text if no structured fields */}
                  {!aiResult.output_a && !aiResult.output_b && !aiResult.judge_analysis && aiResult.response && (
                    <AIOutput
                      response={aiResult.response}
                      title="A/B Test Result"
                      usage={aiResult.usage}
                      model={aiResult.model}
                      latency={aiResult.latency}
                      cost={aiResult.cost}
                    />
                  )}
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSuccess} onClick={() => runTest(detailModal)} disabled={aiLoading}>
                {aiLoading ? 'Running...' : 'Run Test'}
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
              <div style={s.modalTitle}>{editItem ? 'Edit A/B Test' : 'New A/B Test'}</div>
              <button style={s.modalClose} onClick={() => setFormModal(false)}>x</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tone comparison test" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <input style={s.input} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What this test is about" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={s.formGroup}>
                  <label style={s.label}>Prompt A ID</label>
                  <input style={s.input} value={form.prompt_a_id} onChange={(e) => set('prompt_a_id', e.target.value)} placeholder="Prompt A identifier" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Prompt B ID</label>
                  <input style={s.input} value={form.prompt_b_id} onChange={(e) => set('prompt_b_id', e.target.value)} placeholder="Prompt B identifier" />
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Test Input</label>
                <textarea style={s.textarea} value={form.test_input} onChange={(e) => set('test_input', e.target.value)} placeholder="The input that will be used to test both prompts..." />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Evaluation Criteria</label>
                <input style={s.input} value={form.evaluation_criteria} onChange={(e) => set('evaluation_criteria', e.target.value)} placeholder="e.g. accuracy, creativity, helpfulness" />
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
