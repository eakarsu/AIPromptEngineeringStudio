export const pageStyles = {
  page: { maxWidth: 1400, margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 700, color: '#f1f5f9' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  addBtn: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
    padding: 20, cursor: 'pointer', transition: 'all 0.2s',
    position: 'relative', overflow: 'hidden',
  },
  cardHover: {
    borderColor: '#6366f1', transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#94a3b8', lineHeight: 1.5 },
  cardMeta: {
    display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12,
  },
  badge: {
    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
  },
  badgePurple: { background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' },
  badgeGreen: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
  badgeAmber: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
  badgeRed: { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
  badgeBlue: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
  badgeCyan: { background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' },
  // Modal styles
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
    width: '90%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    padding: '20px 24px', borderBottom: '1px solid #334155',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, background: '#1e293b', zIndex: 10,
    borderRadius: '16px 16px 0 0',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  modalClose: {
    width: 32, height: 32, borderRadius: 8, border: '1px solid #475569',
    background: 'transparent', color: '#94a3b8', fontSize: 18,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: 24 },
  modalFooter: {
    padding: '16px 24px', borderTop: '1px solid #334155',
    display: 'flex', justifyContent: 'flex-end', gap: 12,
  },
  // Form styles
  formGroup: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #475569', background: '#0f172a',
    color: '#e2e8f0', fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #475569', background: '#0f172a',
    color: '#e2e8f0', fontSize: 13, outline: 'none',
    minHeight: 100, resize: 'vertical', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #475569', background: '#0f172a',
    color: '#e2e8f0', fontSize: 13, outline: 'none',
  },
  // Button styles
  btnPrimary: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  btnDanger: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 20px', borderRadius: 8,
    border: '1px solid #475569', background: 'transparent',
    color: '#94a3b8', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  btnSuccess: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  // Detail view
  detailRow: {
    display: 'flex', gap: 12, marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12, fontWeight: 600, color: '#64748b', minWidth: 120,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  detailValue: { fontSize: 13, color: '#e2e8f0', flex: 1 },
  // Table styles
  table: {
    width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px',
  },
  th: {
    padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left',
    borderBottom: '1px solid #1e293b',
  },
  td: {
    padding: '12px 16px', fontSize: 13, color: '#e2e8f0',
    background: '#1e293b', cursor: 'pointer',
  },
  // Stats
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginBottom: 24,
  },
  statCard: {
    background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
    padding: 20,
  },
  statValue: { fontSize: 28, fontWeight: 800, color: '#f1f5f9' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  statChange: { fontSize: 12, fontWeight: 600, marginTop: 8 },
  // Loading
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 60, color: '#64748b', fontSize: 14,
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8, padding: 16, color: '#f87171', fontSize: 13, marginBottom: 16,
  },
  empty: {
    textAlign: 'center', padding: 60, color: '#64748b',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#94a3b8' },
};
