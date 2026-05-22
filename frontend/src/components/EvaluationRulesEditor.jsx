import React, { useEffect, useState } from 'react';
import { api } from '../api';

const blankRule = { name: '', metric: 'success_rate', operator: '>=', threshold: 0.8, weight: 1, active: true, description: '' };

const METRICS = ['success_rate', 'avg_latency_ms', 'avg_cost_usd', 'avg_tokens', 'error_rate', 'rating'];
const OPS = ['>=', '<=', '>', '<', '=='];

export default function EvaluationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(blankRule);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/evaluation-rules')
      .then((r) => setRules(r.rules || []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(blankRule); setEditingId(null); setErr(''); };

  const save = async () => {
    if (!form.name) { setErr('name required'); return; }
    setSaving(true); setErr('');
    try {
      if (editingId) {
        await api.put('/custom-views/evaluation-rules', { id: editingId, ...form });
      } else {
        await api.post('/custom-views/evaluation-rules', form);
      }
      reset();
      load();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const edit = (r) => { setForm({ ...r }); setEditingId(r.id); };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await api.delete(`/custom-views/evaluation-rules?id=${id}`);
      load();
    } catch (e) { setErr(e.message); }
  };

  const styles = {
    wrap: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 },
    title: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
    sub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 },
    label: { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' },
    input: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0', fontSize: 12, outline: 'none' },
    btn: { padding: '8px 14px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    btnGhost: { padding: '8px 14px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    btnDanger: { padding: '6px 10px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    list: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 },
    ruleRow: { display: 'grid', gridTemplateColumns: '2fr 1.4fr 0.6fr 0.8fr 0.6fr 0.6fr auto', gap: 10, alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px' },
    ruleName: { fontSize: 13, color: '#e2e8f0', fontWeight: 600 },
    ruleDesc: { fontSize: 11, color: '#64748b' },
    pill: { padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, display: 'inline-block' },
    err: { color: '#f87171', marginTop: 8, fontSize: 12 },
  };

  return (
    <div style={styles.wrap} data-testid="evaluation-rules-editor">
      <div style={styles.title}>Evaluation Rules Editor</div>
      <div style={styles.sub}>CRUD for success metrics applied to prompt evaluations.</div>

      <div style={styles.grid}>
        <div>
          <label style={styles.label}>Name</label>
          <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label style={styles.label}>Metric</label>
          <select style={styles.input} value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
            {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Operator</label>
          <select style={styles.input} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })}>
            {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Threshold</label>
          <input style={styles.input} type="number" step="0.01" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
        </div>
        <div>
          <label style={styles.label}>Weight</label>
          <input style={styles.input} type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
        </div>
        <div>
          <label style={styles.label}>Active</label>
          <select style={styles.input} value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={styles.label}>Description</label>
        <input style={styles.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={styles.btn} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : editingId ? 'Update Rule' : 'Add Rule'}
        </button>
        {editingId && <button style={styles.btnGhost} onClick={reset}>Cancel</button>}
      </div>

      {err && <div style={styles.err}>Error: {err}</div>}

      <div style={styles.list}>
        {loading && <div style={{ color: '#94a3b8' }}>Loading rules...</div>}
        {!loading && rules.length === 0 && <div style={{ color: '#64748b' }}>No rules defined.</div>}
        {rules.map((r) => (
          <div key={r.id} style={styles.ruleRow}>
            <div>
              <div style={styles.ruleName}>{r.name}</div>
              <div style={styles.ruleDesc}>{r.description}</div>
            </div>
            <div style={{ fontSize: 12, color: '#a5b4fc' }}>{r.metric}</div>
            <div style={{ fontSize: 12, color: '#fbbf24', textAlign: 'center' }}>{r.operator}</div>
            <div style={{ fontSize: 12, color: '#e2e8f0', textAlign: 'right' }}>{r.threshold}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>w={r.weight}</div>
            <div>
              <span style={{ ...styles.pill, background: r.active ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)', color: r.active ? '#4ade80' : '#94a3b8' }}>
                {r.active ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={styles.btnGhost} onClick={() => edit(r)}>Edit</button>
              <button style={styles.btnDanger} onClick={() => remove(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
