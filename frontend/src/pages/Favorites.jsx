import React, { useState, useEffect } from 'react';
import { pageStyles } from '../styles';
import { api } from '../api';

const s = pageStyles;

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get('/favorites');
      setFavorites(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const removeFavorite = async (promptId) => {
    try {
      await api.delete(`/favorites/${promptId}`);
      setFavorites(favorites.filter(f => f.prompt_id !== promptId));
    } catch (err) { console.error(err); }
  };

  const filtered = favorites.filter(f =>
    f.prompt_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.prompt_description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Favorites</h1>
          <p style={s.subtitle}>{favorites.length} bookmarked prompts</p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input style={{ ...s.input, maxWidth: 400 }} placeholder="Search favorites..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>⭐</div>
          <div style={s.emptyText}>{search ? 'No matching favorites' : 'No favorites yet'}</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Star your favorite prompts to find them quickly</p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(f => (
            <div key={f.id} style={{
              ...s.card, ...(hoveredCard === f.id ? s.cardHover : {}),
            }}
              onMouseEnter={() => setHoveredCard(f.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={s.cardHeader}>
                <div>
                  <div style={s.cardTitle}>{f.prompt_name}</div>
                  <div style={s.cardDesc}>{f.prompt_description || 'No description'}</div>
                </div>
                <button onClick={() => removeFavorite(f.prompt_id)} style={{
                  background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#fbbf24',
                }} title="Remove favorite">★</button>
              </div>
              <div style={s.cardMeta}>
                <span style={{ ...s.badge, ...s.badgePurple }}>{f.model?.split('/').pop() || 'default'}</span>
                <span style={{ ...s.badge, ...(f.status === 'active' ? s.badgeGreen : s.badgeAmber) }}>{f.status}</span>
                {f.avg_rating > 0 && <span style={{ ...s.badge, ...s.badgeCyan }}>Rating: {f.avg_rating}</span>}
                <span style={{ ...s.badge, ...s.badgeBlue }}>Used {f.usage_count}x</span>
              </div>
              {f.tags && f.tags.length > 0 && (
                <div style={{ ...s.cardMeta, marginTop: 8 }}>
                  {f.tags.map(tag => (
                    <span key={tag} style={{ ...s.badge, background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{tag}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#475569', marginTop: 12 }}>
                Favorited: {new Date(f.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
