import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

const typeConfig = {
  prompts: { icon: '✎', color: s.badgePurple, path: '/prompts' },
  categories: { icon: '🏷', color: s.badgeAmber, path: '/categories' },
  chains: { icon: '⛓', color: s.badgeBlue, path: '/chains' },
  teams: { icon: '👥', color: s.badgeGreen, path: '/teams' },
  snippets: { icon: '✂', color: s.badgeCyan, path: '/snippets' },
  variables: { icon: '{ }', color: s.badgeRed, path: '/variables' },
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const search = async (q = query) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    try {
      const data = await api.get(`/search?q=${encodeURIComponent(q)}${filter ? `&type=${filter}` : ''}`);
      setResults(data.results);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') search();
  };

  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Global Search</h1>
          <p style={s.subtitle}>Search across all your prompts, chains, snippets, and more</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input style={{ ...s.input, flex: 1, fontSize: 15, padding: '14px 18px' }}
          placeholder="Type to search..."
          value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} autoFocus />
        <button style={{ ...s.addBtn, padding: '14px 28px' }} onClick={() => search()}>Search</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => { setFilter(''); if (query) search(); }} style={{
          ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
          ...(!filter ? s.badgePurple : { background: '#1e293b', color: '#94a3b8' }),
        }}>All</button>
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => { setFilter(key); if (query) search(); }} style={{
            ...s.badge, padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
            ...(filter === key ? cfg.color : { background: '#1e293b', color: '#94a3b8' }),
          }}>{cfg.icon} {key}</button>
        ))}
      </div>

      {loading && <div style={s.loading}>Searching...</div>}

      {results && !loading && (
        <>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Found {totalResults} result{totalResults !== 1 ? 's' : ''}
          </div>
          {totalResults === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🔍</div>
              <div style={s.emptyText}>No results found</div>
              <p style={{ color: '#64748b', fontSize: 13 }}>Try a different search term</p>
            </div>
          ) : (
            Object.entries(results).map(([type, items]) => items.length > 0 && (
              <div key={type} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 12, textTransform: 'capitalize' }}>
                  {typeConfig[type]?.icon} {type} ({items.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => (
                    <div key={item.id} style={{
                      ...s.card, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    }} onClick={() => navigate(typeConfig[type]?.path || '/')}>
                      <span style={{ fontSize: 18 }}>{typeConfig[type]?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.description.substring(0, 100)}</div>}
                      </div>
                      <span style={{ ...s.badge, ...(typeConfig[type]?.color || s.badgePurple) }}>{type.slice(0, -1)}</span>
                      {item.status && <span style={{ ...s.badge, ...(item.status === 'active' ? s.badgeGreen : s.badgeAmber) }}>{item.status}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
