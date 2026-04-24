import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const emptyForm = {
  name: '', description: '', plan: 'free',
};

const planBadge = (plan) => {
  const map = {
    free: { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
    pro: s.badgePurple,
    enterprise: { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' },
  };
  return { ...s.badge, ...(map[plan] || map.free) };
};

export default function Teams() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/teams');
      setItems(Array.isArray(data) ? data : data.teams || data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormOpen(true);
    setDetailItem(null);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      plan: item.plan || 'free',
    });
    setFormOpen(true);
    setDetailItem(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await api.put(`/teams/${editingId}`, formData);
      } else {
        await api.post('/teams', formData);
      }
      setFormOpen(false);
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
      await api.delete(`/teams/${id}`);
      setConfirmDelete(null);
      setDetailItem(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const field = (label, value) => (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value || '—'}</span>
    </div>
  );

  const input = (key, label, opts = {}) => (
    <div style={s.formGroup}>
      <label style={s.label}>{label}</label>
      {opts.type === 'textarea' ? (
        <textarea
          style={s.textarea}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          rows={opts.rows || 4}
        />
      ) : opts.type === 'select' ? (
        <select
          style={s.select}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        >
          {opts.options.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      ) : (
        <input
          style={s.input}
          type={opts.type || 'text'}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      )}
    </div>
  );

  const members = detailItem?.members || [];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Teams</div>
          <div style={s.subtitle}>Manage teams and collaborate on prompts</div>
        </div>
        <button style={s.addBtn} onClick={openNew}>+ New Team</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.loading}>Loading teams...</div>
      ) : items.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>👥</div>
          <div style={s.emptyText}>No teams yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "New Team" to create your first team.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {items.map((item) => (
            <div
              key={item.id}
              style={hovered === item.id ? { ...s.card, ...s.cardHover } : s.card}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDetailItem(item)}
            >
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{item.name}</div>
                  <div style={s.cardDesc}>
                    {item.description ? (item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description) : 'No description'}
                  </div>
                </div>
                <span style={planBadge(item.plan)}>{item.plan || 'free'}</span>
              </div>

              {/* Owner */}
              {item.owner_name && (
                <div style={s.cardMeta}>
                  <span style={{ ...s.badge, ...s.badgeCyan }}>Owner: {item.owner_name}</span>
                </div>
              )}

              {/* Footer: member count */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.member_count ?? 0}</span>
                  <span>{(item.member_count ?? 0) === 1 ? 'member' : 'members'}</span>
                </div>
                <span style={planBadge(item.plan)}>{item.plan || 'free'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div style={s.overlay} onClick={() => setDetailItem(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{detailItem.name}</span>
              <button style={s.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              {field('Name', detailItem.name)}
              {field('Description', detailItem.description)}
              {field('Plan', <span style={planBadge(detailItem.plan)}>{detailItem.plan || 'free'}</span>)}
              {field('Owner', detailItem.owner_name)}
              {field('Members', (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <span style={{ fontWeight: 600 }}>{detailItem.member_count ?? 0}</span>
                </span>
              ))}

              {/* Members list */}
              {members.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
                  }}>
                    Team Members
                  </div>
                  <div style={{
                    background: '#0f172a', borderRadius: 8, border: '1px solid #334155',
                    overflow: 'hidden',
                  }}>
                    {members.map((member, i) => (
                      <div
                        key={member.id || i}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 16px',
                          borderBottom: i < members.length - 1 ? '1px solid #1e293b' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, color: '#fff',
                          }}>
                            {(member.name || member.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                              {member.name || member.username || 'Unknown'}
                            </div>
                            {member.email && (
                              <div style={{ fontSize: 11, color: '#64748b' }}>{member.email}</div>
                            )}
                          </div>
                        </div>
                        <span style={{
                          ...s.badge,
                          ...(member.role === 'admin' || member.role === 'owner' ? s.badgeAmber : s.badgeBlue),
                        }}>
                          {member.role || 'member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setDetailItem(null)}>Close</button>
              <button style={s.btnDanger} onClick={() => setConfirmDelete(detailItem.id)}>Delete</button>
              <button style={s.btnPrimary} onClick={() => openEdit(detailItem)}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div style={s.overlay} onClick={() => setFormOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editingId ? 'Edit Team' : 'New Team'}</span>
              <button style={s.modalClose} onClick={() => setFormOpen(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {input('name', 'Team Name')}
              {input('description', 'Description', { type: 'textarea', rows: 3 })}
              {input('plan', 'Plan', { type: 'select', options: ['free', 'pro', 'enterprise'] })}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setFormOpen(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
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
                Are you sure you want to delete this team? This action cannot be undone.
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
