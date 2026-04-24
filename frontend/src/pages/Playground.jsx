import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles } from '../styles';
import AIOutput from '../components/AIOutput';

const s = pageStyles;

const localStyles = {
  splitLayout: {
    display: 'flex', gap: 20, minHeight: 'calc(100vh - 160px)',
  },
  sidebar: {
    width: 280, minWidth: 280, background: '#1e293b', borderRadius: 12,
    border: '1px solid #334155', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px 16px 12px', borderBottom: '1px solid #334155',
    fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionList: {
    flex: 1, overflowY: 'auto', padding: 8,
  },
  sessionItem: {
    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
    marginBottom: 4, transition: 'all 0.15s', border: '1px solid transparent',
  },
  sessionItemActive: {
    background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  sessionItemInactive: {
    background: 'transparent',
  },
  sessionName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 },
  sessionDate: { fontSize: 11, color: '#64748b' },
  sessionDelete: {
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    fontSize: 14, padding: '2px 6px', borderRadius: 4, lineHeight: 1,
  },
  mainArea: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
  },
  editorPanel: {
    background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
    padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
  },
  controlsRow: {
    display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
  },
  controlGroup: {
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  controlLabel: {
    fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  systemPromptArea: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #475569', background: '#0f172a',
    color: '#e2e8f0', fontSize: 13, outline: 'none', minHeight: 70,
    resize: 'vertical', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    transition: 'border-color 0.2s', lineHeight: 1.6,
  },
  userPromptArea: {
    width: '100%', padding: '14px 16px', borderRadius: 8,
    border: '1px solid #475569', background: '#0f172a',
    color: '#f1f5f9', fontSize: 14, outline: 'none', minHeight: 120,
    resize: 'vertical', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    transition: 'border-color 0.2s', lineHeight: 1.6,
  },
  modelSelect: {
    padding: '10px 14px', borderRadius: 8, border: '1px solid #475569',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none',
    minWidth: 220,
  },
  slider: {
    width: 140, accentColor: '#6366f1',
  },
  sliderValue: {
    fontSize: 13, fontWeight: 700, color: '#a5b4fc', minWidth: 32, textAlign: 'center',
  },
  tokensInput: {
    padding: '10px 14px', borderRadius: 8, border: '1px solid #475569',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none',
    width: 100,
  },
  runBtn: {
    padding: '12px 32px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
    transition: 'all 0.2s', letterSpacing: '0.02em',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  runBtnDisabled: {
    opacity: 0.5, cursor: 'not-allowed',
  },
  responseArea: {
    flex: 1, minHeight: 0, overflowY: 'auto',
  },
  loadingOverlay: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 48, gap: 16,
  },
  loadingDots: {
    display: 'flex', gap: 8,
  },
  loadingDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: '#6366f1',
  },
  loadingText: {
    fontSize: 14, color: '#94a3b8', fontWeight: 500,
  },
  emptyPlayground: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 48, color: '#475569',
  },
  emptyIcon: {
    fontSize: 48, marginBottom: 16, opacity: 0.4,
  },
};

const MODELS = [
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-opus-4',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash',
];

export default function Playground() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [model, setModel] = useState('anthropic/claude-haiku-4.5');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hoveredSession, setHoveredSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await api.get('/playground');
      setSessions(Array.isArray(data) ? data : data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const name = `Session ${sessions.length + 1}`;
      const data = await api.post('/playground', { name, description: '' });
      const newSession = data.session || data;
      setSessions((prev) => [newSession, ...prev]);
      selectSession(newSession);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/playground/${sessionId}`);
      setSessions((prev) => prev.filter((ses) => (ses.id || ses._id) !== sessionId));
      if (activeSession && (activeSession.id || activeSession._id) === sessionId) {
        setActiveSession(null);
        setUserPrompt('');
        setSystemPrompt('You are a helpful assistant.');
        setAiResponse(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const selectSession = (session) => {
    setActiveSession(session);
    setSystemPrompt(session.system_prompt || session.systemPrompt || 'You are a helpful assistant.');
    setUserPrompt(session.last_prompt || session.lastPrompt || '');
    setModel(session.model || 'anthropic/claude-haiku-4.5');
    setTemperature(session.temperature ?? 0.7);
    setMaxTokens(session.max_tokens || session.maxTokens || 1024);
    setAiResponse(session.last_response || session.lastResponse || null);
    setError('');
  };

  const runPrompt = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError('');
    setAiResponse(null);
    try {
      const payload = {
        prompt_text: userPrompt,
        system_prompt: systemPrompt,
        model,
        temperature,
        max_tokens: maxTokens,
        session_id: activeSession ? (activeSession.id || activeSession._id) : undefined,
      };
      const data = await api.post('/ai/playground/run', payload);
      setAiResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSessionId = (ses) => ses.id || ses._id;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>AI Playground</div>
          <div style={s.subtitle}>Interactive prompt testing and experimentation</div>
        </div>
        <button
          style={s.addBtn}
          onClick={createSession}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.45)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }}
        >
          + New Session
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Split layout */}
      <div style={localStyles.splitLayout}>
        {/* Sidebar - Sessions */}
        <div style={localStyles.sidebar}>
          <div style={localStyles.sidebarHeader}>
            <span>Sessions</span>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{sessions.length}</span>
          </div>
          <div style={localStyles.sessionList}>
            {sessionsLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading...</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                No sessions yet. Click "New Session" to start.
              </div>
            ) : (
              sessions.map((ses) => {
                const id = getSessionId(ses);
                const isActive = activeSession && getSessionId(activeSession) === id;
                const isHovered = hoveredSession === id;
                return (
                  <div
                    key={id}
                    style={{
                      ...localStyles.sessionItem,
                      ...(isActive ? localStyles.sessionItemActive : localStyles.sessionItemInactive),
                      ...(isHovered && !isActive ? { background: 'rgba(255,255,255,0.03)' } : {}),
                    }}
                    onClick={() => selectSession(ses)}
                    onMouseEnter={() => setHoveredSession(id)}
                    onMouseLeave={() => setHoveredSession(null)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={localStyles.sessionName}>{ses.name || `Session ${id}`}</div>
                        <div style={localStyles.sessionDate}>{formatDate(ses.created_at || ses.createdAt)}</div>
                      </div>
                      <button
                        style={localStyles.sessionDelete}
                        onClick={(e) => deleteSession(e, id)}
                        onMouseEnter={(e) => { e.target.style.color = '#f87171'; }}
                        onMouseLeave={(e) => { e.target.style.color = '#64748b'; }}
                        title="Delete session"
                      >
                        x
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main playground area */}
        <div style={localStyles.mainArea}>
          {/* Editor panel */}
          <div style={localStyles.editorPanel}>
            {/* System prompt */}
            <div style={localStyles.controlGroup}>
              <label style={localStyles.controlLabel}>System Prompt</label>
              <textarea
                style={localStyles.systemPromptArea}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Set the AI's behavior and role..."
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
              />
            </div>

            {/* User prompt */}
            <div style={localStyles.controlGroup}>
              <label style={localStyles.controlLabel}>User Prompt</label>
              <textarea
                style={localStyles.userPromptArea}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    runPrompt();
                  }
                }}
              />
            </div>

            {/* Controls row */}
            <div style={localStyles.controlsRow}>
              <div style={localStyles.controlGroup}>
                <label style={localStyles.controlLabel}>Model</label>
                <select
                  style={localStyles.modelSelect}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div style={localStyles.controlGroup}>
                <label style={localStyles.controlLabel}>Temperature: {temperature.toFixed(2)}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={localStyles.slider}
                  />
                  <span style={{ fontSize: 11, color: '#475569' }}>1</span>
                </div>
              </div>

              <div style={localStyles.controlGroup}>
                <label style={localStyles.controlLabel}>Max Tokens</label>
                <input
                  type="number"
                  style={localStyles.tokensInput}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 256)}
                  min={1}
                  max={8192}
                />
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <button
                  style={{
                    ...localStyles.runBtn,
                    ...(loading ? localStyles.runBtnDisabled : {}),
                  }}
                  onClick={runPrompt}
                  disabled={loading}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.55)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>&#8635;</span>
                      Running...
                    </>
                  ) : (
                    <>&#9654; Run Prompt</>
                  )}
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#475569', textAlign: 'right' }}>
              Press Ctrl+Enter / Cmd+Enter to run
            </div>
          </div>

          {/* Response area */}
          <div style={localStyles.responseArea}>
            {loading && (
              <div style={localStyles.loadingOverlay}>
                <div style={localStyles.loadingDots}>
                  <div style={{ ...localStyles.loadingDot, animation: 'pulse 1.4s ease-in-out infinite' }} />
                  <div style={{ ...localStyles.loadingDot, animation: 'pulse 1.4s ease-in-out 0.2s infinite' }} />
                  <div style={{ ...localStyles.loadingDot, animation: 'pulse 1.4s ease-in-out 0.4s infinite' }} />
                </div>
                <div style={localStyles.loadingText}>Generating response...</div>
                <style>{`
                  @keyframes pulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.2); }
                  }
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {!loading && aiResponse && (
              <AIOutput
                response={aiResponse.response || aiResponse.result || aiResponse.text || ''}
                usage={aiResponse.usage}
                model={aiResponse.model || model}
                latency={aiResponse.latency_ms || aiResponse.latency}
                cost={aiResponse.cost}
                title="Playground Response"
              />
            )}

            {!loading && !aiResponse && (
              <div style={localStyles.emptyPlayground}>
                <div style={localStyles.emptyIcon}>&#9881;</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                  Ready to experiment
                </div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  Write a prompt and click "Run Prompt" to get started
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
