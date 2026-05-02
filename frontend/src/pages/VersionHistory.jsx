import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

export default function VersionHistory() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [restored, setRestored] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/prompts').then(d => setPrompts(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  const loadVersions = async (pid) => {
    if (!pid) return;
    setLoading(true); setError('');
    try {
      const r = await api.get(`/prompts/${pid}/versions`);
      setVersions(r.data || r || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { loadVersions(selectedPrompt); }, [selectedPrompt]);

  const restore = async (version) => {
    setRestoring(version.id); setError('');
    try {
      await api.post(`/prompts/${selectedPrompt}/versions/${version.id}/restore`, {});
      setRestored(version.version_number);
      setTimeout(() => setRestored(null), 4000);
      await loadVersions(selectedPrompt);
    } catch (e) { setError(e.message); }
    setRestoring(null);
  };

  const prompt = prompts.find(p => p.id === parseInt(selectedPrompt));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Version History</div>
          <div style={s.subtitle}>Every prompt save creates a version — restore any previous state</div>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {restored && (
        <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', borderRadius: 8, padding: 12, color: '#4ade80', marginBottom: 16, fontSize: 13 }}>
          ✓ Version {restored} restored successfully. A new version was created to track the restoration.
        </div>
      )}

      <div style={s.formGroup}>
        <label style={s.label}>Select Prompt</label>
        <select style={{ ...s.select, maxWidth: 400 }} value={selectedPrompt} onChange={e => setSelectedPrompt(e.target.value)}>
          <option value="">Choose a prompt to view version history...</option>
          {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading version history...</div>
      ) : versions.length === 0 && selectedPrompt ? (
        <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⎇</div>
          <div>No versions found. Versions are created automatically when you save a prompt.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 2fr' : '1fr', gap: 20 }}>
          {/* Timeline */}
          <div>
            {selectedPrompt && (
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                {versions.length} version{versions.length !== 1 ? 's' : ''} for "{prompt?.name}"
              </div>
            )}
            {versions.map((v, i) => (
              <div
                key={v.id}
                style={{
                  display: 'flex', gap: 16, marginBottom: 12, cursor: 'pointer',
                  opacity: selected?.id === v.id ? 1 : 0.85,
                }}
                onClick={() => setSelected(v)}
              >
                {/* Timeline line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b',
                    border: `2px solid ${i === 0 ? '#6366f1' : '#334155'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: i === 0 ? '#fff' : '#64748b',
                  }}>
                    v{v.version_number}
                  </div>
                  {i < versions.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 24, background: '#1e293b', marginTop: 4 }} />
                  )}
                </div>
                {/* Card */}
                <div style={{
                  flex: 1, background: '#1e293b', borderRadius: 10,
                  border: `1px solid ${selected?.id === v.id ? '#6366f1' : '#334155'}`,
                  padding: 14, transition: 'border-color 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                        Version {v.version_number}
                        {i === 0 && <span style={{ ...s.badge, ...s.badgeGreen, marginLeft: 8 }}>Latest</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
                      </div>
                    </div>
                    <button
                      style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11 }}
                      onClick={e => { e.stopPropagation(); restore(v); }}
                      disabled={restoring === v.id || i === 0}
                    >
                      {restoring === v.id ? 'Restoring...' : i === 0 ? 'Current' : 'Restore'}
                    </button>
                  </div>
                  {v.change_notes && (
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{v.change_notes}</div>
                  )}
                  <div style={{
                    marginTop: 8, padding: 8, background: '#0f172a', borderRadius: 6,
                    fontSize: 11, color: '#64748b', fontFamily: 'monospace',
                    overflow: 'hidden', maxHeight: 40, lineHeight: 1.4
                  }}>
                    {v.content?.slice(0, 100)}...
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, position: 'sticky', top: 20, maxHeight: '80vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Version {selected.version_number}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={s.btnSecondary}
                    onClick={() => restore(selected)}
                    disabled={restoring === selected.id || selected.version_number === versions[0]?.version_number}
                  >
                    {restoring === selected.id ? 'Restoring...' : 'Restore This Version'}
                  </button>
                  <button style={s.modalClose} onClick={() => setSelected(null)}>×</button>
                </div>
              </div>
              {selected.change_notes && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                  <strong>Notes:</strong> {selected.change_notes}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Content</div>
              <pre style={{
                background: '#0f172a', borderRadius: 10, padding: 16,
                fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace',
                lineHeight: 1.7, whiteSpace: 'pre-wrap', overflow: 'auto', margin: 0,
              }}>
                {selected.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
