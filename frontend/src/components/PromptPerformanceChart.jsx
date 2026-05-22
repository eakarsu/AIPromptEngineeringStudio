import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function PromptPerformanceChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/custom-views/prompt-performance')
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setErr(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const styles = {
    wrap: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 },
    title: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
    sub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    chart: { display: 'flex', flexDirection: 'column', gap: 10 },
    row: { display: 'grid', gridTemplateColumns: '180px 1fr 80px', alignItems: 'center', gap: 12 },
    label: { fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    barTrack: { background: '#0f172a', borderRadius: 6, height: 18, overflow: 'hidden', border: '1px solid #334155' },
    barFill: (rate) => ({
      height: '100%',
      width: `${Math.max(2, rate * 100)}%`,
      background: rate >= 0.8 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : rate >= 0.6 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)',
      transition: 'width 0.4s ease',
    }),
    val: { fontSize: 12, color: '#a5b4fc', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    summary: { display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #334155', flexWrap: 'wrap' },
    stat: { fontSize: 12, color: '#94a3b8' },
    statVal: { fontWeight: 700, color: '#e2e8f0', fontSize: 14 },
  };

  if (loading) return <div style={styles.wrap}>Loading prompt performance...</div>;
  if (err) return <div style={styles.wrap}>Error: {err}</div>;
  if (!data || !data.prompts || !data.prompts.length) return <div style={styles.wrap}>No prompts yet.</div>;

  return (
    <div style={styles.wrap} data-testid="prompt-performance-chart">
      <div style={styles.title}>Prompt Performance Chart</div>
      <div style={styles.sub}>Success rate per prompt (higher is better)</div>
      <div style={styles.chart}>
        {data.prompts.map((p) => (
          <div key={p.prompt_id} style={styles.row}>
            <div style={styles.label} title={p.prompt_name}>{p.prompt_name}</div>
            <div style={styles.barTrack}><div style={styles.barFill(p.success_rate)} /></div>
            <div style={styles.val}>{(p.success_rate * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
      <div style={styles.summary}>
        <div style={styles.stat}>Prompts: <span style={styles.statVal}>{data.summary.prompt_count}</span></div>
        <div style={styles.stat}>Avg success: <span style={styles.statVal}>{(data.summary.avg_success_rate * 100).toFixed(1)}%</span></div>
        <div style={styles.stat}>Total runs: <span style={styles.statVal}>{data.summary.total_runs}</span></div>
      </div>
    </div>
  );
}
