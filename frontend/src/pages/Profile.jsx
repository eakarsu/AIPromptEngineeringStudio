import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/profile');
      setProfile(data);
      setEditName(data.name);
      setEditAvatar(data.avatar_url || '');
      const s = await api.get('/profile/settings');
      setSettings(s);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const saveProfile = async () => {
    try {
      const data = await api.put('/profile', { name: editName, avatar_url: editAvatar || null });
      setProfile({ ...profile, ...data });
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await api.put('/profile/password', { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setMessage('Password changed successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const saveSettings = async (updates) => {
    try {
      const data = await api.put('/profile/settings', { ...settings, ...updates });
      setSettings(data);
      setMessage('Settings saved');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'defaults', label: 'AI Defaults' },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Profile & Settings</h1>
          <p style={s.subtitle}>Manage your account and preferences</p>
        </div>
      </div>
      {message && <div style={{ ...s.error, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80', marginBottom: 16 }}>{message}</div>}
      {error && <div style={s.error} onClick={() => setError('')}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            ...s.btnSecondary, ...(tab === t.id ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderColor: '#6366f1' } : {}),
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff' }}>
              {profile?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{profile?.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{profile?.email}</div>
              <div style={{ ...s.badge, ...s.badgePurple, marginTop: 4, display: 'inline-block' }}>{profile?.role}</div>
            </div>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Name</label>
            <input style={s.input} value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Avatar URL</label>
            <input style={s.input} value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://example.com/avatar.png" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Email</label>
            <input style={{ ...s.input, opacity: 0.6 }} value={profile?.email || ''} disabled />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Member Since</label>
            <input style={{ ...s.input, opacity: 0.6 }} value={new Date(profile?.created_at).toLocaleDateString()} disabled />
          </div>
          <button style={s.btnPrimary} onClick={saveProfile}>Save Changes</button>
        </div>
      )}

      {tab === 'password' && (
        <div style={s.card}>
          <div style={s.formGroup}>
            <label style={s.label}>Current Password</label>
            <input style={s.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>New Password</label>
            <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Confirm New Password</label>
            <input style={s.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button style={s.btnPrimary} onClick={changePassword}>Change Password</button>
        </div>
      )}

      {tab === 'preferences' && settings && (
        <div style={s.card}>
          <div style={s.formGroup}>
            <label style={s.label}>Theme</label>
            <select style={s.select} value={settings.theme} onChange={e => saveSettings({ theme: e.target.value })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Language</label>
            <select style={s.select} value={settings.language} onChange={e => saveSettings({ language: e.target.value })}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Timezone</label>
            <select style={s.select} value={settings.timezone} onChange={e => saveSettings({ timezone: e.target.value })}>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={settings.notifications_enabled} onChange={e => saveSettings({ notifications_enabled: e.target.checked })} />
              Enable In-App Notifications
            </label>
          </div>
          <div style={s.formGroup}>
            <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={settings.email_notifications} onChange={e => saveSettings({ email_notifications: e.target.checked })} />
              Enable Email Notifications
            </label>
          </div>
        </div>
      )}

      {tab === 'defaults' && settings && (
        <div style={s.card}>
          <div style={s.formGroup}>
            <label style={s.label}>Default Model</label>
            <select style={s.select} value={settings.default_model} onChange={e => saveSettings({ default_model: e.target.value })}>
              <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5</option>
              <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
              <option value="anthropic/claude-opus-4">Claude Opus 4</option>
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Default Temperature: {settings.default_temperature}</label>
            <input type="range" min="0" max="1" step="0.1" value={settings.default_temperature}
              onChange={e => saveSettings({ default_temperature: parseFloat(e.target.value) })}
              style={{ width: '100%' }} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Default Max Tokens</label>
            <input style={s.input} type="number" value={settings.default_max_tokens}
              onChange={e => saveSettings({ default_max_tokens: parseInt(e.target.value) || 1024 })} />
          </div>
        </div>
      )}
    </div>
  );
}
