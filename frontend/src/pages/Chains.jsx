import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles } from '../styles';
import AIOutput from '../components/AIOutput';

const s = pageStyles;

const localStyles = {
  // Pipeline visualization
  pipelineContainer: {
    display: 'flex', alignItems: 'center', padding: '24px 0', overflowX: 'auto',
    gap: 0, flexWrap: 'nowrap', justifyContent: 'center',
  },
  stepNode: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    minWidth: 100,
  },
  stepCircle: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, color: '#fff',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
    border: '2px solid #818cf8',
  },
  stepCircleActive: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: '2px solid #fbbf24',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
    animation: 'pulseGlow 1.5s ease-in-out infinite',
  },
  stepCircleDone: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: '2px solid #34d399',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
  },
  stepLabel: {
    fontSize: 11, fontWeight: 600, color: '#94a3b8', textAlign: 'center',
    maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  connector: {
    width: 40, height: 2, background: '#334155', flexShrink: 0,
    position: 'relative', top: -12,
  },
  connectorActive: {
    background: 'linear-gradient(90deg, #10b981, #6366f1)',
  },
  // Step form
  stepFormCard: {
    background: '#0f172a', borderRadius: 10, border: '1px solid #334155',
    padding: 16, marginBottom: 12, position: 'relative',
  },
  stepFormHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  stepFormNumber: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff',
  },
  removeStepBtn: {
    background: 'none', border: '1px solid #475569', borderRadius: 6,
    color: '#f87171', cursor: 'pointer', padding: '4px 10px', fontSize: 11,
    fontWeight: 600, transition: 'all 0.15s',
  },
  addStepBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10,
    border: '2px dashed #334155', background: 'transparent',
    color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  // Run results
  stepResultCard: {
    background: '#0f172a', borderRadius: 10, border: '1px solid #334155',
    padding: 20, marginBottom: 16,
  },
  stepResultHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  // Chain card extras
  cardStats: {
    display: 'flex', gap: 16, marginTop: 12, paddingTop: 12,
    borderTop: '1px solid rgba(51, 65, 85, 0.5)',
  },
  cardStat: {
    textAlign: 'center', flex: 1,
  },
  cardStatValue: { fontSize: 16, fontWeight: 700, color: '#e2e8f0' },
  cardStatLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  // Loading animation
  loadingBar: {
    height: 3, background: '#1e293b', borderRadius: 3, overflow: 'hidden', marginTop: 8,
  },
  loadingBarFill: {
    height: '100%', borderRadius: 3,
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
    animation: 'loadingSlide 1.5s ease-in-out infinite',
  },
  wideModal: {
    background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
    width: '90%', maxWidth: 900, maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
};

const statusColors = {
  active: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
  draft: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
  archived: { background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' },
};

const emptyStep = () => ({ name: '', prompt: '', system_prompt: '' });

export default function Chains() {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  // Detail modal
  const [detailChain, setDetailChain] = useState(null);
  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingChain, setEditingChain] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', steps: [emptyStep()] });
  const [saving, setSaving] = useState(false);
  // Run state
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [currentRunStep, setCurrentRunStep] = useState(-1);

  useEffect(() => {
    loadChains();
  }, []);

  const loadChains = async () => {
    setLoading(true);
    try {
      const data = await api.get('/chains');
      setChains(Array.isArray(data) ? data : data.chains || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getId = (c) => c.id || c._id;

  const openCreate = () => {
    setEditingChain(null);
    setFormData({ name: '', description: '', steps: [emptyStep()] });
    setFormOpen(true);
  };

  const openEdit = (chain) => {
    setEditingChain(chain);
    setFormData({
      name: chain.name || '',
      description: chain.description || '',
      steps: (chain.steps && chain.steps.length > 0)
        ? chain.steps.map((st) => ({ name: st.name || '', prompt: st.prompt || '', system_prompt: st.system_prompt || '' }))
        : [emptyStep()],
    });
    setFormOpen(true);
    setDetailChain(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingChain(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Chain name is required.'); return; }
    if (formData.steps.some((st) => !st.name.trim() || !st.prompt.trim())) {
      setError('All steps must have a name and prompt.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingChain) {
        const data = await api.put(`/chains/${getId(editingChain)}`, formData);
        const updated = data.chain || data;
        setChains((prev) => prev.map((c) => getId(c) === getId(editingChain) ? updated : c));
      } else {
        const data = await api.post('/chains', formData);
        const created = data.chain || data;
        setChains((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chain) => {
    if (!window.confirm(`Delete chain "${chain.name}"?`)) return;
    try {
      await api.delete(`/chains/${getId(chain)}`);
      setChains((prev) => prev.filter((c) => getId(c) !== getId(chain)));
      setDetailChain(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const runChain = async (chain) => {
    setRunning(true);
    setRunResults(null);
    setCurrentRunStep(0);
    setError('');
    try {
      const data = await api.post('/ai/chain/run', {
        steps: chain.steps,
        chain_id: getId(chain),
      });
      setRunResults(data);
      setCurrentRunStep(-1);
    } catch (err) {
      setError(err.message);
      setCurrentRunStep(-1);
    } finally {
      setRunning(false);
    }
  };

  const updateStep = (index, field, value) => {
    setFormData((prev) => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  };

  const addStep = () => {
    setFormData((prev) => ({ ...prev, steps: [...prev.steps, emptyStep()] }));
  };

  const removeStep = (index) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const formatDuration = (ms) => {
    if (!ms) return '--';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  // Render pipeline visualization
  const renderPipeline = (steps, activeStep) => {
    if (!steps || steps.length === 0) return null;
    return (
      <div style={localStyles.pipelineContainer}>
        <style>{`
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); } 50% { box-shadow: 0 4px 24px rgba(245, 158, 11, 0.7); } }
          @keyframes loadingSlide { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
        `}</style>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={localStyles.stepNode}>
              <div style={{
                ...localStyles.stepCircle,
                ...(activeStep === i ? localStyles.stepCircleActive : {}),
                ...(activeStep > i || (runResults && !running) ? localStyles.stepCircleDone : {}),
              }}>
                {(activeStep > i || (runResults && !running)) ? '\u2713' : i + 1}
              </div>
              <div style={localStyles.stepLabel}>{step.name || `Step ${i + 1}`}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                ...localStyles.connector,
                ...(activeStep > i || (runResults && !running) ? localStyles.connectorActive : {}),
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Prompt Chains</div>
          <div style={s.subtitle}>Build and execute multi-step prompt workflows</div>
        </div>
        <button
          style={s.addBtn}
          onClick={openCreate}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.45)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }}
        >
          + New Chain
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Loading */}
      {loading && <div style={s.loading}>Loading chains...</div>}

      {/* Empty state */}
      {!loading && chains.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>&#9734;</div>
          <div style={s.emptyText}>No chains yet</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Create your first prompt chain to get started</div>
        </div>
      )}

      {/* Grid of chain cards */}
      {!loading && chains.length > 0 && (
        <div style={s.grid}>
          {chains.map((chain) => {
            const id = getId(chain);
            const isHovered = hoveredCard === id;
            const status = chain.status || 'draft';
            const statusStyle = statusColors[status] || statusColors.draft;
            return (
              <div
                key={id}
                style={{
                  ...s.card,
                  ...(isHovered ? s.cardHover : {}),
                }}
                onClick={() => { setDetailChain(chain); setRunResults(null); setCurrentRunStep(-1); }}
                onMouseEnter={() => setHoveredCard(id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={s.cardHeader}>
                  <div>
                    <div style={s.cardTitle}>{chain.name}</div>
                    <div style={s.cardDesc}>{chain.description || 'No description'}</div>
                  </div>
                  <span style={{ ...s.badge, ...statusStyle }}>{status}</span>
                </div>

                <div style={s.cardMeta}>
                  <span style={{ ...s.badge, ...s.badgePurple }}>
                    {chain.total_steps || chain.steps?.length || 0} steps
                  </span>
                  {chain.execution_count > 0 && (
                    <span style={{ ...s.badge, ...s.badgeBlue }}>
                      {chain.execution_count} runs
                    </span>
                  )}
                </div>

                <div style={localStyles.cardStats}>
                  <div style={localStyles.cardStat}>
                    <div style={localStyles.cardStatValue}>{chain.total_steps || chain.steps?.length || 0}</div>
                    <div style={localStyles.cardStatLabel}>Steps</div>
                  </div>
                  <div style={localStyles.cardStat}>
                    <div style={localStyles.cardStatValue}>{chain.execution_count || 0}</div>
                    <div style={localStyles.cardStatLabel}>Executions</div>
                  </div>
                  <div style={localStyles.cardStat}>
                    <div style={localStyles.cardStatValue}>{formatDuration(chain.avg_duration_ms)}</div>
                    <div style={localStyles.cardStatLabel}>Avg Duration</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailChain && (
        <div style={s.overlay} onClick={() => { setDetailChain(null); setRunResults(null); }}>
          <div style={localStyles.wideModal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{detailChain.name}</div>
              <button style={s.modalClose} onClick={() => { setDetailChain(null); setRunResults(null); }}>x</button>
            </div>

            <div style={s.modalBody}>
              {/* Description */}
              {detailChain.description && (
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
                  {detailChain.description}
                </div>
              )}

              {/* Pipeline visualization */}
              {renderPipeline(detailChain.steps, running ? currentRunStep : (runResults ? detailChain.steps?.length : -1))}

              {/* Loading bar during run */}
              {running && (
                <div style={localStyles.loadingBar}>
                  <div style={localStyles.loadingBarFill} />
                </div>
              )}

              {/* Run results */}
              {runResults && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc', marginBottom: 16 }}>
                    Execution Results
                  </div>
                  {(runResults.results || runResults.steps || []).map((stepResult, i) => (
                    <div key={i} style={localStyles.stepResultCard}>
                      <div style={localStyles.stepResultHeader}>
                        <div style={{
                          ...localStyles.stepFormNumber,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                          {stepResult.name || stepResult.step_name || `Step ${i + 1}`}
                        </div>
                      </div>
                      {stepResult.input && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            Input
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
                            {typeof stepResult.input === 'string' ? stepResult.input : JSON.stringify(stepResult.input, null, 2)}
                          </div>
                        </div>
                      )}
                      <AIOutput
                        response={stepResult.response || stepResult.output || stepResult.result || ''}
                        usage={stepResult.usage}
                        model={stepResult.model}
                        latency={stepResult.latency_ms || stepResult.latency}
                        cost={stepResult.cost}
                        title={`Step ${i + 1}: ${stepResult.name || stepResult.step_name || 'Output'}`}
                      />
                    </div>
                  ))}
                  {/* Summary stats */}
                  {(runResults.total_cost != null || runResults.total_latency_ms != null) && (
                    <div style={{
                      display: 'flex', gap: 20, padding: '16px 20px', background: '#0f172a',
                      borderRadius: 10, border: '1px solid #334155', marginTop: 12,
                    }}>
                      {runResults.total_latency_ms != null && (
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#a5b4fc' }}>
                            {(runResults.total_latency_ms / 1000).toFixed(2)}s
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Total Time</div>
                        </div>
                      )}
                      {runResults.total_cost != null && (
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#a5b4fc' }}>
                            ${Number(runResults.total_cost).toFixed(4)}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Total Cost</div>
                        </div>
                      )}
                      {runResults.total_tokens != null && (
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#a5b4fc' }}>
                            {runResults.total_tokens.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Total Tokens</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step details table */}
              {!runResults && detailChain.steps && detailChain.steps.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>
                    Chain Steps
                  </div>
                  {detailChain.steps.map((step, i) => (
                    <div key={i} style={{ ...localStyles.stepResultCard, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={localStyles.stepFormNumber}>{i + 1}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{step.name || `Step ${i + 1}`}</div>
                      </div>
                      {step.system_prompt && (
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          <strong>System:</strong> {step.system_prompt}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                        <strong style={{ color: '#64748b' }}>Prompt:</strong> {step.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnDanger} onClick={() => handleDelete(detailChain)}>Delete</button>
              <button style={s.btnSecondary} onClick={() => openEdit(detailChain)}>Edit</button>
              <button
                style={{ ...s.btnSuccess, opacity: running ? 0.5 : 1, cursor: running ? 'not-allowed' : 'pointer' }}
                onClick={() => !running && runChain(detailChain)}
                disabled={running}
              >
                {running ? 'Running...' : '\u25B6 Run Chain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal (create/edit) */}
      {formOpen && (
        <div style={s.overlay} onClick={closeForm}>
          <div style={localStyles.wideModal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{editingChain ? 'Edit Chain' : 'Create New Chain'}</div>
              <button style={s.modalClose} onClick={closeForm}>x</button>
            </div>

            <div style={s.modalBody}>
              {error && <div style={{ ...s.error, marginBottom: 16 }}>{error}</div>}

              <div style={s.formGroup}>
                <label style={s.label}>Chain Name</label>
                <input
                  style={s.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Content Generation Pipeline"
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <textarea
                  style={s.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this chain does..."
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
                />
              </div>

              {/* Pipeline preview */}
              {formData.steps.length > 0 && renderPipeline(
                formData.steps.map((st, i) => ({ name: st.name || `Step ${i + 1}` })),
                -1
              )}

              {/* Steps */}
              <div style={{ marginTop: 8 }}>
                <label style={{ ...s.label, marginBottom: 12 }}>Steps</label>
                {formData.steps.map((step, i) => (
                  <div key={i} style={localStyles.stepFormCard}>
                    <div style={localStyles.stepFormHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={localStyles.stepFormNumber}>{i + 1}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Step {i + 1}</span>
                      </div>
                      {formData.steps.length > 1 && (
                        <button
                          style={localStyles.removeStepBtn}
                          onClick={() => removeStep(i)}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'none'; }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ ...s.formGroup, marginBottom: 10 }}>
                      <label style={{ ...s.label, fontSize: 10 }}>Step Name</label>
                      <input
                        style={s.input}
                        value={step.name}
                        onChange={(e) => updateStep(i, 'name', e.target.value)}
                        placeholder="e.g., Generate Outline"
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
                      />
                    </div>

                    <div style={{ ...s.formGroup, marginBottom: 10 }}>
                      <label style={{ ...s.label, fontSize: 10 }}>System Prompt (optional)</label>
                      <textarea
                        style={{ ...s.textarea, minHeight: 60 }}
                        value={step.system_prompt}
                        onChange={(e) => updateStep(i, 'system_prompt', e.target.value)}
                        placeholder="System instructions for this step..."
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
                      />
                    </div>

                    <div style={{ ...s.formGroup, marginBottom: 0 }}>
                      <label style={{ ...s.label, fontSize: 10 }}>Prompt</label>
                      <textarea
                        style={{ ...s.textarea, minHeight: 80 }}
                        value={step.prompt}
                        onChange={(e) => updateStep(i, 'prompt', e.target.value)}
                        placeholder="The prompt for this step. Use {{previous_output}} to reference the prior step's output."
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  style={localStyles.addStepBtn}
                  onClick={addStep}
                  onMouseEnter={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.color = '#a5b4fc'; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = '#334155'; e.target.style.color = '#64748b'; }}
                >
                  + Add Step
                </button>
              </div>
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={closeForm}>Cancel</button>
              <button
                style={{ ...s.btnPrimary, opacity: saving ? 0.5 : 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : (editingChain ? 'Update Chain' : 'Create Chain')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
