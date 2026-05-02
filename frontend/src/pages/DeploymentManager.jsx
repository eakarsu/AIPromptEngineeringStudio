import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

export default function DeploymentManager() {
  const [prompts, setPrompts] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ prompt_id: '', name: '', environment: 'production', rate_limit: 100 });
  const [lastDeploy, setLastDeploy] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState('');
  const [detail, setDetail] = useState(null);
  const [showKey, setShowKey] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([
        api.get('/prompts').then(r => Array.isArray(r) ? r : r.data || []),
        api.get('/deployments').then(r => Array.isArray(r) ? r : r.data || []),
      ]);
      setPrompts(p);
      setDeployments(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deploy = async () => {
    if (!form.prompt_id) { setError('Select a prompt to deploy.'); return; }
    setDeploying(true); setError('');
    try {
      const r = await api.post(`/prompts/${form.prompt_id}/deploy`, {
        name: form.name || undefined,
        environment: form.environment,
        rate_limit: parseInt(form.rate_limit),
      });
      setLastDeploy(r);
      setShowForm(false);
      await load();
    } catch (e) { setError(e.message); }
    setDeploying(false);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const CopyBtn = ({ text, id }) => (
    <button
      style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11, marginLeft: 8 }}
      onClick={() => copy(text, id)}
    >
      {copied === id ? '✓ Copied' : 'Copy'}
    </button>
  );

  const statusColor = { active: '#4ade80', paused: '#fbbf24', pending: '#60a5fa' };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Prompt Deployments</div>
          <div style={s.subtitle}>Deploy prompts as standalone APIs with unique endpoints and API keys</div>
        </div>
        <button style={s.addBtn} onClick={() => setShowForm(true)}>🚀 Deploy Prompt</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Last deploy success panel */}
      {lastDeploy && (
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid #6366f1', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#a5b4fc', marginBottom: 16 }}>🎉 Deployment Successful: {lastDeploy.name}</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Endpoint URL</div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 13, color: '#4ade80' }}>
                <span style={{ flex: 1, overflow: 'auto' }}>{lastDeploy.endpoint_url}</span>
                <CopyBtn text={lastDeploy.endpoint_url} id="url" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>API Key</div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 13, color: '#fbbf24' }}>
                <span style={{ flex: 1 }}>{lastDeploy.api_key_plain}</span>
                <CopyBtn text={lastDeploy.api_key_plain} id="key" />
              </div>
              <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>⚠ Save this key — it won't be shown again.</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>HMAC Secret</div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                <span style={{ flex: 1, overflow: 'auto' }}>{lastDeploy.hmac_secret}</span>
                <CopyBtn text={lastDeploy.hmac_secret} id="hmac" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>cURL Example</div>
              <pre style={{ background: '#0f172a', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', overflow: 'auto', margin: 0, position: 'relative' }}>
                {lastDeploy.curl_example}
                <CopyBtn text={lastDeploy.curl_example} id="curl" />
              </pre>
            </div>
          </div>
          <button style={{ ...s.btnSecondary, marginTop: 12 }} onClick={() => setLastDeploy(null)}>Dismiss</button>
        </div>
      )}

      {/* Deployments grid */}
      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading deployments...</div>
      ) : deployments.length === 0 ? (
        <div style={{ ...s.empty || {}, textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No deployments yet</div>
          <div style={{ fontSize: 13 }}>Click "Deploy Prompt" to create your first deployment.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {deployments.map(dep => (
            <div key={dep.id} style={s.card} onClick={() => setDetail(dep)}>
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{dep.name}</div>
                  <div style={s.cardDesc}>{dep.prompt_name || `Prompt #${dep.prompt_id}`}</div>
                </div>
                <span style={{ ...s.badge, color: statusColor[dep.status] || '#94a3b8', background: `${statusColor[dep.status] || '#94a3b8'}20` }}>{dep.status}</span>
              </div>
              <div style={s.cardMeta}>
                <span style={{ ...s.badge, ...s.badgeAmber }}>{dep.environment}</span>
                <span style={{ ...s.badge, ...s.badgeCyan }}>{dep.rate_limit} req/min</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155' }}>
                {[
                  { label: 'Requests', val: (dep.total_requests || 0).toLocaleString() },
                  { label: 'Avg Latency', val: dep.avg_latency_ms ? `${dep.avg_latency_ms}ms` : '—' },
                  { label: 'Error Rate', val: dep.error_rate != null ? `${dep.error_rate}%` : '—' },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{m.val}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deploy form modal */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Deploy Prompt as API</span>
              <button style={s.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.label}>Prompt to Deploy</label>
                <select style={s.select} value={form.prompt_id} onChange={e => setForm({ ...form, prompt_id: e.target.value })}>
                  <option value="">Select prompt...</option>
                  {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Deployment Name (optional)</label>
                <input style={s.input} type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Prompt API" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Environment</label>
                <select style={s.select} value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Rate Limit (req/min)</label>
                <input style={s.input} type="number" value={form.rate_limit} onChange={e => setForm({ ...form, rate_limit: e.target.value })} />
              </div>
              <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                <strong style={{ color: '#94a3b8' }}>What you'll get:</strong><br />
                • Unique endpoint URL<br />
                • API key for authentication<br />
                • HMAC secret for webhook signature verification<br />
                • curl example for immediate testing
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={deploy} disabled={deploying}>
                {deploying ? 'Deploying...' : '🚀 Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={s.overlay} onClick={() => setDetail(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{detail.name}</span>
              <button style={s.modalClose} onClick={() => setDetail(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {[
                ['Status', detail.status],
                ['Environment', detail.environment],
                ['Rate Limit', `${detail.rate_limit} req/min`],
                ['Total Requests', (detail.total_requests || 0).toLocaleString()],
                ['Avg Latency', detail.avg_latency_ms ? `${detail.avg_latency_ms}ms` : '—'],
                ['Deployed', detail.deployed_at ? new Date(detail.deployed_at).toLocaleString() : '—'],
              ].map(([label, val]) => (
                <div key={label} style={s.detailRow || { display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>{val}</span>
                </div>
              ))}
              {detail.endpoint_url && (
                <div style={s.formGroup}>
                  <label style={s.label}>Endpoint URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>
                    <span style={{ flex: 1, overflow: 'auto' }}>{detail.endpoint_url}</span>
                    <CopyBtn text={detail.endpoint_url} id={`url-${detail.id}`} />
                  </div>
                </div>
              )}
              <div style={s.formGroup}>
                <label style={s.label}>API Key</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ background: '#0f172a', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0', flex: 1, overflow: 'auto' }}>
                    {showKey[detail.id] ? (detail.api_key || '—') : (detail.api_key ? detail.api_key.slice(0, 8) + '••••••••' + detail.api_key.slice(-4) : '—')}
                  </code>
                  <button style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: 11 }} onClick={() => setShowKey(k => ({ ...k, [detail.id]: !k[detail.id] }))}>
                    {showKey[detail.id] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
