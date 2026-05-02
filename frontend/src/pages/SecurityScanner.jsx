import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const severityColor = (sev) => {
  if (sev === 'critical') return '#f87171';
  if (sev === 'high') return '#fb923c';
  if (sev === 'medium') return '#fbbf24';
  return '#4ade80';
};

const riskBadge = (level) => {
  const colors = { critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#4ade80' };
  return { ...s.badge, background: `${colors[level] || '#94a3b8'}20`, color: colors[level] || '#94a3b8' };
};

export default function SecurityScanner() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/prompts').then(d => setPrompts(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  const runScan = async () => {
    if (!selectedPrompt) return;
    setScanning(true);
    setError('');
    setResult(null);
    try {
      const r = await api.post(`/prompts/${selectedPrompt}/security-scan`, { additional_context: additionalContext });
      setResult(r);
    } catch (e) {
      setError(e.message);
    }
    setScanning(false);
  };

  const report = result?.result;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Security Scanner</div>
          <div style={s.subtitle}>AI-powered prompt injection and vulnerability detection</div>
        </div>
      </div>

      {error && <div style={{ ...s.error, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Config */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Scan Configuration</div>

          <div style={s.formGroup}>
            <label style={s.label}>Select Prompt</label>
            <select
              style={s.select}
              value={selectedPrompt}
              onChange={e => setSelectedPrompt(e.target.value)}
            >
              <option value="">Choose a prompt...</option>
              {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Additional Context (optional)</label>
            <textarea
              style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="Describe the use case, intended audience, or security requirements..."
            />
          </div>

          <button
            style={{ ...s.addBtn, width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={runScan}
            disabled={!selectedPrompt || scanning}
          >
            {scanning ? '🔍 Scanning...' : '🛡 Run Security Scan'}
          </button>

          <div style={{ marginTop: 20, padding: 16, background: '#0f172a', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>What we check:</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Prompt injection attacks', 'Jailbreak vectors', 'PII exposure risks', 'Instruction override', 'Role confusion attacks'].map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span style={{ color: '#6366f1' }}>•</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Results */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          {scanning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
              <div style={{ fontSize: 40 }}>🔍</div>
              <div style={{ color: '#94a3b8', fontSize: 14 }}>AI is analyzing your prompt for security vulnerabilities...</div>
            </div>
          ) : report ? (
            <>
              {/* Summary */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#0f172a', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Overall Risk</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: severityColor(report.overall_risk) }}>{report.overall_risk?.toUpperCase() || '—'}</div>
                </div>
                <div style={{ flex: 1, background: '#0f172a', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Score</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: severityColor(report.overall_risk) }}>{report.risk_score}/10</div>
                </div>
                <div style={{ flex: 1, background: '#0f172a', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Safe to Deploy</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: report.safe_to_deploy ? '#4ade80' : '#f87171' }}>
                    {report.safe_to_deploy ? '✓ YES' : '✗ NO'}
                  </div>
                </div>
                <div style={{ flex: 1, background: '#0f172a', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vulnerabilities</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: (report.vulnerabilities?.length || 0) > 0 ? '#f87171' : '#4ade80' }}>
                    {report.vulnerabilities?.length || 0}
                  </div>
                </div>
              </div>

              {/* Vulnerabilities */}
              {(report.vulnerabilities || []).length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>Vulnerabilities Found</div>
                  {report.vulnerabilities.map((v, i) => (
                    <div key={i} style={{ background: '#0f172a', borderRadius: 10, padding: 16, marginBottom: 12, borderLeft: `4px solid ${severityColor(v.severity)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{v.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                        <span style={riskBadge(v.severity)}>{v.severity}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{v.description}</div>
                      {v.example_attack && (
                        <div style={{ background: '#1e293b', borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 12, color: '#f87171', fontFamily: 'monospace' }}>
                          Example attack: {v.example_attack}
                        </div>
                      )}
                      {v.fix && (
                        <div style={{ fontSize: 12, color: '#4ade80' }}>
                          <strong>Fix: </strong>{v.fix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', borderRadius: 10, padding: 16, marginBottom: 20, color: '#4ade80', textAlign: 'center' }}>
                  ✓ No vulnerabilities detected. This prompt appears safe to use.
                </div>
              )}

              {/* Recommendations */}
              {(report.recommendations || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>Recommendations</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {report.recommendations.map((r, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13, color: '#94a3b8' }}>
                        <span style={{ color: '#6366f1', flexShrink: 0 }}>→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#64748b' }}>
              <div style={{ fontSize: 40 }}>🛡</div>
              <div style={{ fontSize: 14 }}>Select a prompt and run the security scan to identify vulnerabilities.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
