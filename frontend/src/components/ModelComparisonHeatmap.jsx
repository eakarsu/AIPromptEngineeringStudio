import React, { useEffect, useState } from 'react';
import { api } from '../api';

const cellColor = (score) => {
  // 0 -> red, 0.5 -> amber, 1 -> green
  const s = Math.max(0, Math.min(1, score));
  const r = s < 0.5 ? 239 : Math.round(239 - (s - 0.5) * 2 * (239 - 34));
  const g = s < 0.5 ? Math.round(68 + s * 2 * (197 - 68)) : 197;
  const b = s < 0.5 ? 68 : Math.round(94 - (s - 0.5) * 2 * 34);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
};

export default function ModelComparisonHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/custom-views/model-comparison-heatmap')
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setErr(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const styles = {
    wrap: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20, overflowX: 'auto' },
    title: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
    sub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: 4 },
    th: { fontSize: 11, color: '#94a3b8', padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap' },
    rowHead: { fontSize: 12, color: '#cbd5e1', padding: '6px 8px', textAlign: 'left', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    cell: (score) => ({
      background: cellColor(score),
      color: '#0f172a',
      fontWeight: 700,
      fontSize: 12,
      padding: '10px 8px',
      borderRadius: 6,
      textAlign: 'center',
      minWidth: 70,
    }),
    legend: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 11, color: '#94a3b8' },
    bar: { display: 'inline-block', width: 140, height: 12, borderRadius: 6, background: 'linear-gradient(90deg, rgba(239,68,68,0.55), rgba(245,158,11,0.55), rgba(34,197,94,0.55))' },
  };

  if (loading) return <div style={styles.wrap}>Loading model comparison heatmap...</div>;
  if (err) return <div style={styles.wrap}>Error: {err}</div>;
  if (!data || !data.prompts.length) return <div style={styles.wrap}>No prompts to compare.</div>;

  const byPrompt = new Map();
  data.cells.forEach((c) => {
    if (!byPrompt.has(c.prompt_id)) byPrompt.set(c.prompt_id, new Map());
    byPrompt.get(c.prompt_id).set(c.model, c);
  });

  return (
    <div style={styles.wrap} data-testid="model-comparison-heatmap">
      <div style={styles.title}>Model Comparison Heatmap</div>
      <div style={styles.sub}>Prompt x Model success score</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Prompt \ Model</th>
            {data.models.map((m) => (
              <th key={m} style={styles.th}>{m.split('/').pop()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.prompts.map((p) => (
            <tr key={p.id}>
              <td style={styles.rowHead} title={p.name}>{p.name}</td>
              {data.models.map((m) => {
                const cell = byPrompt.get(p.id)?.get(m);
                const score = cell ? cell.score : 0;
                return (
                  <td key={m} style={styles.cell(score)} title={`${(score * 100).toFixed(1)}%  runs:${cell?.runs ?? 0}`}>
                    {(score * 100).toFixed(0)}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.legend}>
        <span>low</span><span style={styles.bar} /><span>high</span>
      </div>
    </div>
  );
}
