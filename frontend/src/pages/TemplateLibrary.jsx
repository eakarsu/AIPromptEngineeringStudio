import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const categoryColors = {
  writing: '#6366f1', coding: '#10b981', analysis: '#f59e0b',
  roleplay: '#ec4899', default: '#94a3b8',
};

const difficultyBadge = (d) => {
  const map = { beginner: s.badgeGreen, intermediate: s.badgeAmber, advanced: s.badgeRed };
  return { ...s.badge, ...(map[d] || s.badgePurple) };
};

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(null);
  const [forked, setForked] = useState({});
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const load = async (cat = 'all') => {
    setLoading(true);
    try {
      const r = await api.get(`/templates${cat !== 'all' ? `?category=${cat}` : ''}`);
      setTemplates(r.data || r || []);
      setCategories(['all', ...(r.categories || [])]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(activeCategory); }, [activeCategory]);

  const fork = async (templateId) => {
    setForking(templateId);
    setError('');
    try {
      await api.post(`/templates/${templateId}/fork`, {});
      setForked(f => ({ ...f, [templateId]: true }));
      setTimeout(() => setForked(f => { const n = { ...f }; delete n[templateId]; return n; }), 3000);
    } catch (e) { setError(e.message); }
    setForking(null);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Template Library</div>
          <div style={s.subtitle}>Curated prompt templates — fork to your collection to customize</div>
        </div>
      </div>

      {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:12,color:'#f87171',marginBottom:16,fontSize:13}}>{error}</div>}

      {/* Category filter */}
      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:500, transition:'all 0.15s',
              background: activeCategory===cat ? (categoryColors[cat]||'#6366f1') : '#1e293b',
              color: activeCategory===cat ? '#fff' : '#94a3b8',
              boxShadow: activeCategory===cat ? `0 4px 12px ${categoryColors[cat]||'#6366f1'}40` : 'none',
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:'center',color:'#64748b',padding:60}}>Loading templates...</div>
      ) : (
        <div style={s.grid}>
          {templates.map(t => (
            <div
              key={t.id}
              style={{...s.card, borderColor: selected?.id===t.id ? categoryColors[t.category]||'#6366f1' : '#334155'}}
              onClick={() => setSelected(t)}
            >
              <div style={{...s.cardHeader}}>
                <div style={{flex:1}}>
                  <div style={{...s.cardTitle}}>{t.name}</div>
                  <div style={{...s.cardDesc,marginTop:4}}>{t.description}</div>
                </div>
                <span style={{...s.badge, background:`${categoryColors[t.category]||'#94a3b8'}20`, color:categoryColors[t.category]||'#94a3b8'}}>
                  {t.category}
                </span>
              </div>
              <div style={{...s.cardMeta}}>
                <span style={difficultyBadge(t.difficulty)}>{t.difficulty}</span>
                {(t.tags||[]).slice(0,3).map(tag => (
                  <span key={tag} style={{...s.badge,...s.badgePurple}}>{tag}</span>
                ))}
              </div>
              <div style={{marginTop:12,padding:12,background:'#0f172a',borderRadius:8,fontSize:11,color:'#64748b',fontFamily:'monospace',lineHeight:1.5,maxHeight:60,overflow:'hidden'}}>
                {t.content?.slice(0,120)}...
              </div>
              <button
                style={{
                  ...s.addBtn, width:'100%', justifyContent:'center', marginTop:14,
                  background: forked[t.id] ? 'rgba(74,222,128,0.2)' : undefined,
                  color: forked[t.id] ? '#4ade80' : undefined,
                }}
                onClick={e => { e.stopPropagation(); fork(t.id); }}
                disabled={forking===t.id}
              >
                {forked[t.id] ? '✓ Forked to My Prompts' : forking===t.id ? 'Forking...' : '⑂ Fork Template'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{selected.name}</span>
              <button style={s.modalClose} onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={s.modalBody}>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <span style={{...s.badge,background:`${categoryColors[selected.category]||'#94a3b8'}20`,color:categoryColors[selected.category]||'#94a3b8'}}>{selected.category}</span>
                <span style={difficultyBadge(selected.difficulty)}>{selected.difficulty}</span>
                {(selected.tags||[]).map(tag=><span key={tag} style={{...s.badge,...s.badgePurple}}>{tag}</span>)}
              </div>
              <div style={{fontSize:14,color:'#94a3b8',marginBottom:16,lineHeight:1.6}}>{selected.description}</div>
              <div style={{fontSize:13,fontWeight:600,color:'#94a3b8',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Prompt Content</div>
              <pre style={{background:'#0f172a',borderRadius:10,padding:16,fontSize:13,color:'#e2e8f0',fontFamily:'monospace',lineHeight:1.7,whiteSpace:'pre-wrap',overflow:'auto',maxHeight:350}}>
                {selected.content}
              </pre>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setSelected(null)}>Close</button>
              <button
                style={{...s.btnPrimary, background: forked[selected.id] ? 'rgba(74,222,128,0.2)' : undefined, color: forked[selected.id] ? '#4ade80' : undefined}}
                onClick={() => fork(selected.id)}
                disabled={forking===selected.id}
              >
                {forked[selected.id] ? '✓ Forked!' : forking===selected.id ? 'Forking...' : '⑂ Fork to My Prompts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
