import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyExportForm = { format: 'json', file_name: '' };
const emptyImportForm = { format: 'json', file_name: '' };

const formats = ['json', 'csv'];

const jobTypeBadge = (type) => {
  const map = { export: s.badgeBlue, import: s.badgeGreen };
  return { ...s.badge, ...(map[type] || s.badgePurple) };
};

const statusBadge = (status) => {
  const map = {
    completed: s.badgeGreen,
    pending: s.badgeAmber,
    processing: s.badgeAmber,
    failed: s.badgeRed,
  };
  return { ...s.badge, ...(map[status] || s.badgePurple) };
};

export default function ExportImport() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const [exportFormOpen, setExportFormOpen] = useState(false);
  const [importFormOpen, setImportFormOpen] = useState(false);
  const [exportForm, setExportForm] = useState(emptyExportForm);
  const [importForm, setImportForm] = useState(emptyImportForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/exports');
      setJobs(Array.isArray(data) ? data : data.exports || data.jobs || data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openExport = () => {
    setExportForm(emptyExportForm);
    setExportFormOpen(true);
    setDetailItem(null);
  };

  const openImport = () => {
    setImportForm(emptyImportForm);
    setImportFormOpen(true);
    setDetailItem(null);
  };

  const handleExport = async () => {
    try {
      setSaving(true);
      setError('');
      await api.post('/exports', { ...exportForm, job_type: 'export' });
      setExportFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    try {
      setSaving(true);
      setError('');
      await api.post('/exports', { ...importForm, job_type: 'import' });
      setImportFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await api.delete(`/exports/${id}`);
      setConfirmDelete(null);
      setDetailItem(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const progressPercent = (job) => {
    if (!job.items_count || job.items_count === 0) return 0;
    return Math.round(((job.items_processed || 0) / job.items_count) * 100);
  };

  const progressBar = (job) => {
    const pct = progressPercent(job);
    const barColor = job.status === 'failed' ? '#ef4444' : job.status === 'completed' ? '#22c55e' : '#6366f1';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1, height: 6, background: '#0f172a', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%', background: barColor,
            borderRadius: 3, transition: 'width 0.3s',
          }} />
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 36, textAlign: 'right' }}>
          {pct}%
        </span>
      </div>
    );
  };

  const field = (label, value) => (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value || '—'}</span>
    </div>
  );

  const formInput = (form, setForm, key, label, opts = {}) => (
    <div style={s.formGroup}>
      <label style={s.label}>{label}</label>
      {opts.type === 'select' ? (
        <select
          style={s.select}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          {opts.options.map((o) => (
            <option key={o} value={o}>{o.toUpperCase()}</option>
          ))}
        </select>
      ) : (
        <input
          style={s.input}
          type={opts.type || 'text'}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={opts.placeholder}
        />
      )}
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Export / Import</div>
          <div style={s.subtitle}>Export and import your prompts and data</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btnSuccess} onClick={openImport}>+ New Import</button>
          <button style={s.addBtn} onClick={openExport}>+ New Export</button>
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading export/import jobs...</div>
      ) : jobs.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📦</div>
          <div style={s.emptyText}>No export/import jobs yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Export" or "New Import" to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 70px 1fr 120px 1fr 100px 140px',
            gap: 12, padding: '10px 20px',
            fontSize: 11, fontWeight: 600, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <span>Type</span>
            <span>Format</span>
            <span>File Name</span>
            <span>Progress</span>
            <span>Progress Bar</span>
            <span>Status</span>
            <span>Created</span>
          </div>

          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                ...(hovered === job.id
                  ? { ...s.card, ...s.cardHover, padding: '14px 20px' }
                  : { ...s.card, padding: '14px 20px' }),
                display: 'grid',
                gridTemplateColumns: '80px 70px 1fr 120px 1fr 100px 140px',
                gap: 12, alignItems: 'center',
              }}
              onMouseEnter={() => setHovered(job.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(job)}
            >
              <span style={jobTypeBadge(job.job_type)}>
                {job.job_type || '—'}
              </span>
              <span style={{ ...s.badge, ...s.badgeCyan }}>
                {(job.format || '—').toUpperCase()}
              </span>
              <span style={{ fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.file_name || '—'}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {job.items_processed ?? 0} / {job.items_count ?? 0}
              </span>
              <div>{progressBar(job)}</div>
              <span style={statusBadge(job.status)}>
                {job.status || 'pending'}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {job.created_at ? new Date(job.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div style={s.overlay} onClick={() => setDetailItem(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Job Details</span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('ID', detailItem.id)}
              {field('Job Type', <span style={jobTypeBadge(detailItem.job_type)}>{detailItem.job_type}</span>)}
              {field('Format', <span style={{ ...s.badge, ...s.badgeCyan }}>{(detailItem.format || '').toUpperCase()}</span>)}
              {field('File Name', detailItem.file_name)}
              {field('Status', <span style={statusBadge(detailItem.status)}>{detailItem.status}</span>)}
              {field('Items Count', detailItem.items_count ?? 0)}
              {field('Items Processed', detailItem.items_processed ?? 0)}
              {field('Progress', (
                <div style={{ maxWidth: 300 }}>
                  {progressBar(detailItem)}
                </div>
              ))}
              {field('Created At', detailItem.created_at ? new Date(detailItem.created_at).toLocaleString() : '—')}
              {field('Updated At', detailItem.updated_at ? new Date(detailItem.updated_at).toLocaleString() : '—')}
              {detailItem.error_message && field('Error', (
                <span style={{ color: '#f87171' }}>{detailItem.error_message}</span>
              ))}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setDetailItem(null)}>Close</button>
              <button style={s.btnDanger} onClick={() => setConfirmDelete(detailItem.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Form Modal */}
      {exportFormOpen && (
        <div style={s.overlay} onClick={() => setExportFormOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>New Export</span>
              <button style={s.modalClose} onClick={() => setExportFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {formInput(exportForm, setExportForm, 'format', 'Format', { type: 'select', options: formats })}
              {formInput(exportForm, setExportForm, 'file_name', 'File Name', { placeholder: 'e.g. prompts-backup.json' })}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setExportFormOpen(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleExport} disabled={saving}>
                {saving ? 'Exporting...' : 'Start Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Form Modal */}
      {importFormOpen && (
        <div style={s.overlay} onClick={() => setImportFormOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>New Import</span>
              <button style={s.modalClose} onClick={() => setImportFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {formInput(importForm, setImportForm, 'format', 'Format', { type: 'select', options: formats })}
              {formInput(importForm, setImportForm, 'file_name', 'File Name', { placeholder: 'e.g. prompts-backup.json' })}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setImportFormOpen(false)}>Cancel</button>
              <button style={s.btnSuccess} onClick={handleImport} disabled={saving}>
                {saving ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div style={s.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...s.modal, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Confirm Delete</span>
              <button style={s.modalClose} onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: '#e2e8f0', fontSize: 14, margin: 0 }}>
                Are you sure you want to delete this job record? This action cannot be undone.
              </p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={s.btnDanger} onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
