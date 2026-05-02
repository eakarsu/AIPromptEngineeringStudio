import React, { useState } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

const tc = { name:'#f59e0b',email:'#6366f1',phone:'#22d3ee',ssn:'#f87171',credit_card:'#f87171',address:'#a78bfa',ip:'#4ade80',dob:'#fb923c',other:'#94a3b8' };

export default function PIIChecker() {
  const [text, setText] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showAnon, setShowAnon] = useState(false);

  const check = async () => {
    if (!text.trim()) return;
    setChecking(true); setError(''); setResult(null);
    try {
      const r = await api.post('/prompts/check-pii', { prompt_text: text });
      setResult(r.result || null);
    } catch (e) { setError(e.message); }
    setChecking(false);
  };

  const d = result;
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><div style={s.title}>PII Detector</div><div style={s.subtitle}>AI-powered PII detection and anonymization</div></div>
      </div>
      {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:12,color:'#f87171',marginBottom:16,fontSize:13}}>{error}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={{background:'#1e293b',borderRadius:12,border:'1px solid #334155',padding:20}}>
          <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:16}}>Prompt Text</div>
          <textarea style={{...s.input,minHeight:280,resize:'vertical',fontFamily:'monospace',fontSize:13}} value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your prompt text here to scan for PII..."/>
          <button style={{...s.addBtn,width:'100%',justifyContent:'center',marginTop:16}} onClick={check} disabled={!text.trim()||checking}>
            {checking ? '🔍 Detecting...' : '🔒 Check for PII'}
          </button>
          {d?.anonymized_version && (
            <div style={{marginTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:600,color:'#94a3b8'}}>Anonymized Version</div>
                <button style={{...s.btnSecondary,padding:'4px 10px',fontSize:11}} onClick={()=>setShowAnon(!showAnon)}>{showAnon?'Hide':'Show'}</button>
              </div>
              {showAnon && <div style={{background:'#0f172a',borderRadius:8,padding:12,fontSize:12,color:'#4ade80',fontFamily:'monospace',whiteSpace:'pre-wrap',lineHeight:1.6}}>{d.anonymized_version}</div>}
            </div>
          )}
        </div>
        <div style={{background:'#1e293b',borderRadius:12,border:'1px solid #334155',padding:20}}>
          {checking ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:300,gap:12}}>
              <div style={{fontSize:40}}>🔍</div><div style={{color:'#94a3b8',fontSize:14}}>Scanning for PII patterns...</div>
            </div>
          ) : d ? (
            <>
              <div style={{display:'flex',gap:12,marginBottom:20}}>
                {[
                  {label:'PII Found',val:d.pii_found?'YES':'NO',color:d.pii_found?'#f87171':'#4ade80'},
                  {label:'Risk Level',val:(d.risk_level||'low').toUpperCase(),color:d.risk_level==='high'?'#f87171':d.risk_level==='medium'?'#fbbf24':'#4ade80'},
                  {label:'Items',val:d.pii_items?.length||0,color:(d.pii_items?.length||0)>0?'#f87171':'#4ade80'},
                ].map((m,i)=>(
                  <div key={i} style={{flex:1,background:'#0f172a',borderRadius:10,padding:14,textAlign:'center'}}>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>{m.label}</div>
                    <div style={{fontSize:22,fontWeight:700,color:m.color}}>{m.val}</div>
                  </div>
                ))}
              </div>
              {(d.pii_items||[]).length > 0 ? (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:12}}>Detected PII</div>
                  {d.pii_items.map((item,i)=>(
                    <div key={i} style={{background:'#0f172a',borderRadius:10,padding:12,marginBottom:8,borderLeft:`4px solid ${tc[item.type]||'#94a3b8'}`}}>
                      <div style={{display:'flex',gap:8,marginBottom:6}}>
                        <span style={{...s.badge,background:`${tc[item.type]||'#94a3b8'}20`,color:tc[item.type]||'#94a3b8'}}>{item.type}</span>
                        <span style={{...s.badge,background:'rgba(239,68,68,0.1)',color:'#f87171'}}>{item.severity}</span>
                      </div>
                      <div style={{fontSize:13,color:'#f87171',fontFamily:'monospace',marginBottom:4}}>"{item.value}"</div>
                      {item.position && <div style={{fontSize:11,color:'#64748b'}}>Location: {item.position}</div>}
                    </div>
                  ))}
                </div>
              ) : d.pii_found === false ? (
                <div style={{background:'rgba(74,222,128,0.1)',borderRadius:10,padding:16,color:'#4ade80',textAlign:'center',fontSize:14}}>✓ No PII detected.</div>
              ) : null}
              {(d.recommendations||[]).length > 0 && (
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:10}}>Recommendations</div>
                  {d.recommendations.map((r,i)=>(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:8,fontSize:13,color:'#94a3b8'}}><span style={{color:'#6366f1'}}>→</span>{r}</div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:300,gap:12,color:'#64748b'}}>
              <div style={{fontSize:40}}>🔒</div>
              <div style={{fontSize:14}}>Enter prompt text and click "Check for PII" to analyze.</div>
              <div style={{fontSize:12,textAlign:'center',lineHeight:1.6}}>Detects: Names, Emails, Phones, SSNs, Credit Cards, Addresses, IPs, DoB</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
