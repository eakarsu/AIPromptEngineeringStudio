import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles } from '../styles';
import AIOutput from '../components/AIOutput';

const s = pageStyles;

const MODEL_COLORS = {
  'gpt-4': '#a78bfa',
  'gpt-4o': '#818cf8',
  'gpt-4-turbo': '#c084fc',
  'gpt-3.5-turbo': '#60a5fa',
  'claude-3-opus': '#f472b6',
  'claude-3-sonnet': '#fb923c',
  'claude-3-haiku': '#34d399',
};

const getModelColor = (model) => {
  if (!model) return '#94a3b8';
  const lower = model.toLowerCase();
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (lower.includes(key)) return color;
  }
  // Deterministic fallback color
  let hash = 0;
  for (let i = 0; i < model.length; i++) hash = model.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
};

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, recordsData] = await Promise.all([
        api.get('/analytics/summary').catch(() => null),
        api.get('/analytics'),
      ]);
      setSummary(summaryData);
      const list = Array.isArray(recordsData) ? recordsData : recordsData.analytics || [];
      // Sort newest first
      list.sort((a, b) => new Date(b.recorded_at || b.created_at || 0) - new Date(a.recorded_at || a.created_at || 0));
      setRecords(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analytics record?')) return;
    try {
      await api.delete(`/analytics/${id}`);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatNumber = (n) => {
    if (n == null) return '--';
    if (typeof n === 'number') return n.toLocaleString();
    return String(n);
  };

  const formatCost = (c) => {
    if (c == null) return '--';
    return `$${Number(c).toFixed(4)}`;
  };

  const formatLatency = (ms) => {
    if (ms == null) return '--';
    return `${Number(ms).toFixed(0)}ms`;
  };

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleString();
  };

  if (loading) return <div style={s.loading}>Loading analytics...</div>;

  return (
    <div style={s.page}>
      {error && <div style={s.error}>{error}</div>}

      <div style={s.header}>
        <div>
          <div style={s.title}>Analytics</div>
          <div style={s.subtitle}>Usage metrics and performance data</div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, color: '#818cf8' }}>
              {formatNumber(summary.total_requests)}
            </div>
            <div style={s.statLabel}>Total Requests</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, color: '#60a5fa' }}>
              {formatNumber(summary.total_tokens)}
            </div>
            <div style={s.statLabel}>Total Tokens</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, color: '#f59e0b' }}>
              {summary.avg_latency != null ? `${Number(summary.avg_latency).toFixed(0)}ms` : '--'}
            </div>
            <div style={s.statLabel}>Avg Latency</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, color: '#22c55e' }}>
              {summary.total_cost != null ? formatCost(summary.total_cost) : '--'}
            </div>
            <div style={s.statLabel}>Total Cost</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, color: summary.success_rate >= 90 ? '#22c55e' : summary.success_rate >= 70 ? '#f59e0b' : '#ef4444' }}>
              {summary.success_rate != null ? `${Number(summary.success_rate).toFixed(1)}%` : '--'}
            </div>
            <div style={s.statLabel}>Success Rate</div>
          </div>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>&#128200;</div>
          <div style={s.emptyText}>No analytics data yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Analytics are recorded automatically as you use the platform.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #334155', background: '#0f172a' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Prompt</th>
                <th style={s.th}>Metric Type</th>
                <th style={s.th}>Tokens</th>
                <th style={s.th}>Latency</th>
                <th style={s.th}>Cost</th>
                <th style={s.th}>Model</th>
                <th style={s.th}>Success</th>
                <th style={s.th}>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr
                  key={rec.id}
                  onClick={() => setSelected(rec)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    Array.from(e.currentTarget.children).forEach((td) => {
                      td.style.background = '#1e293b';
                      td.style.borderColor = '#6366f1';
                    });
                  }}
                  onMouseLeave={(e) => {
                    Array.from(e.currentTarget.children).forEach((td) => {
                      td.style.background = '#1e293b';
                      td.style.borderColor = 'transparent';
                    });
                  }}
                >
                  <td style={{ ...s.td, fontWeight: 600, borderRadius: '8px 0 0 8px' }}>
                    {rec.prompt_name || `#${rec.prompt_id || rec.id}`}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...s.badgePurple }}>{rec.metric_type || '--'}</span>
                  </td>
                  <td style={s.td}>{formatNumber(rec.tokens_used)}</td>
                  <td style={s.td}>{formatLatency(rec.latency_ms)}</td>
                  <td style={s.td}>{formatCost(rec.cost)}</td>
                  <td style={s.td}>
                    <span style={{
                      color: getModelColor(rec.model),
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {rec.model || '--'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: rec.success ? '#22c55e' : '#ef4444',
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: rec.success ? '#22c55e' : '#ef4444',
                        display: 'inline-block',
                        boxShadow: rec.success ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
                      }} />
                      {rec.success ? 'OK' : 'Fail'}
                    </span>
                  </td>
                  <td style={{ ...s.td, borderRadius: '0 8px 8px 0', fontSize: 12, color: '#94a3b8' }}>
                    {formatDate(rec.recorded_at || rec.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Analytics Detail</div>
              <button style={s.modalClose} onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>ID</span>
                <span style={s.detailValue}>{selected.id}</span>
              </div>
              {selected.prompt_name && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Prompt</span>
                  <span style={s.detailValue}>{selected.prompt_name}</span>
                </div>
              )}
              {selected.prompt_id && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Prompt ID</span>
                  <span style={s.detailValue}>{selected.prompt_id}</span>
                </div>
              )}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Metric Type</span>
                <span style={s.detailValue}>
                  <span style={{ ...s.badge, ...s.badgePurple }}>{selected.metric_type || '--'}</span>
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Tokens Used</span>
                <span style={s.detailValue}>{formatNumber(selected.tokens_used)}</span>
              </div>
              {selected.prompt_tokens != null && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Prompt Tokens</span>
                  <span style={s.detailValue}>{formatNumber(selected.prompt_tokens)}</span>
                </div>
              )}
              {selected.completion_tokens != null && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Completion Tokens</span>
                  <span style={s.detailValue}>{formatNumber(selected.completion_tokens)}</span>
                </div>
              )}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Latency</span>
                <span style={s.detailValue}>{formatLatency(selected.latency_ms)}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Cost</span>
                <span style={s.detailValue}>{formatCost(selected.cost)}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Model</span>
                <span style={{ ...s.detailValue, color: getModelColor(selected.model), fontFamily: 'monospace', fontWeight: 600 }}>
                  {selected.model || '--'}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Success</span>
                <span style={s.detailValue}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: selected.success ? '#22c55e' : '#ef4444', fontWeight: 600,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: selected.success ? '#22c55e' : '#ef4444',
                      display: 'inline-block',
                    }} />
                    {selected.success ? 'Success' : 'Failed'}
                  </span>
                </span>
              </div>
              {selected.error_message && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Error</span>
                  <span style={{ ...s.detailValue, color: '#f87171', fontFamily: 'monospace', fontSize: 12 }}>
                    {selected.error_message}
                  </span>
                </div>
              )}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Recorded At</span>
                <span style={s.detailValue}>{formatDate(selected.recorded_at || selected.created_at)}</span>
              </div>
              {selected.metadata && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Metadata</span>
                  <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap', background: '#0f172a', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
                    {typeof selected.metadata === 'string' ? selected.metadata : JSON.stringify(selected.metadata, null, 2)}
                  </span>
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnDanger} onClick={() => handleDelete(selected.id)}>Delete</button>
              <button style={s.btnSecondary} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
