import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

export default function ABTestRunner() {
  const [prompts, setPrompts] = useState([]);
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [testInput, setTestInput] = useState('');
  const [numRuns, setNumRuns] = useState(3);
  const [usePrompts, setUsePrompts] = useState(false);
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/prompts').then(d => setPrompts(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  const run = async () => {
    const va = usePrompts ? (prompts.find(p=>p.id===parseInt(promptA))?.content || '') : variantA;
    const vb = usePrompts ? (prompts.find(p=>p.id===parseInt(promptB))?.content || '') : variantB;
    if (!va || !vb || !testInput) { setError('Provide both variants and test input.'); return; }

    setRunning(true); setError(''); setResult(null);
    try {
      // Use a reference prompt ID if available
      const refId = usePrompts && promptA ? promptA : (prompts[0]?.id || '1');
      const r = await api.post(`/prompts/${refId}/ab-test`, {
        variant_a: va, variant_b: vb, test_input: testInput, num_runs: numRuns,
      });
      setResult(r);
    } catch (e) { setError(e.message); }
    setRunning(false);
  };

  const ev = result?.evaluation;
  const winner = ev?.winner;

  const scoreBar = (score, maxScore) => {
    const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
    return (
      <div style={{height:6,background:'#1e293b',borderRadius:3,marginTop:4}}>
        <div style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,#6366f1,#8b5cf6)`,width:`${pct}%`,transition:'width 0.5s ease'}}/>
      </div>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><div style={s.title}>A/B Test Runner</div><div style={s.subtitle}>Compare prompt variants with AI evaluation across multiple runs</div></div>
      </div>
      {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:12,color:'#f87171',marginBottom:16,fontSize:13}}>{error}</div>}

      {/* Config */}
      <div style={{background:'#1e293b',borderRadius:12,border:'1px solid #334155',padding:20,marginBottom:20}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9'}}>Test Configuration</div>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#94a3b8',cursor:'pointer',marginLeft:'auto'}}>
            <input type="checkbox" checked={usePrompts} onChange={e=>setUsePrompts(e.target.checked)} style={{width:14,height:14}}/>
            Use saved prompts
          </label>
          <div style={s.formGroup} style={{margin:0}}>
            <label style={{...s.label,marginBottom:0,marginRight:8}}>Runs:</label>
            <select style={{...s.select,width:80}} value={numRuns} onChange={e=>setNumRuns(parseInt(e.target.value))}>
              {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div>
            <label style={s.label}>Variant A {winner==='A'&&<span style={{color:'#4ade80',marginLeft:8}}>🏆 WINNER</span>}</label>
            {usePrompts ? (
              <select style={s.select} value={promptA} onChange={e=>setPromptA(e.target.value)}>
                <option value="">Select prompt...</option>
                {prompts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <textarea style={{...s.input,minHeight:120,resize:'vertical',fontFamily:'monospace',fontSize:12}} value={variantA} onChange={e=>setVariantA(e.target.value)} placeholder="Paste prompt variant A here..."/>
            )}
          </div>
          <div>
            <label style={s.label}>Variant B {winner==='B'&&<span style={{color:'#4ade80',marginLeft:8}}>🏆 WINNER</span>}</label>
            {usePrompts ? (
              <select style={s.select} value={promptB} onChange={e=>setPromptB(e.target.value)}>
                <option value="">Select prompt...</option>
                {prompts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <textarea style={{...s.input,minHeight:120,resize:'vertical',fontFamily:'monospace',fontSize:12}} value={variantB} onChange={e=>setVariantB(e.target.value)} placeholder="Paste prompt variant B here..."/>
            )}
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={s.label}>Test Input</label>
          <textarea style={{...s.input,minHeight:80,resize:'vertical'}} value={testInput} onChange={e=>setTestInput(e.target.value)} placeholder="Enter the test input that will be sent to both variants..."/>
        </div>
        <button style={{...s.addBtn,justifyContent:'center',width:'100%'}} onClick={run} disabled={running}>
          {running ? `⚡ Running ${numRuns}x${2} tests...` : `▶ Run A/B Test (${numRuns} runs each)`}
        </button>
      </div>

      {/* Results */}
      {running && (
        <div style={{background:'#1e293b',borderRadius:12,border:'1px solid #334155',padding:40,textAlign:'center'}}>
          <div style={{fontSize:36,marginBottom:12}}>⚡</div>
          <div style={{color:'#94a3b8',fontSize:14}}>Running {numRuns} iterations of each variant and evaluating with AI...</div>
          <div style={{color:'#64748b',fontSize:12,marginTop:8}}>This may take 30-60 seconds</div>
        </div>
      )}

      {result && !running && (
        <>
          {/* Winner banner */}
          {winner && (
            <div style={{background:winner==='A'?'rgba(99,102,241,0.15)':'rgba(139,92,246,0.15)',border:`1px solid ${winner==='A'?'#6366f1':'#8b5cf6'}`,borderRadius:12,padding:20,marginBottom:20,textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:8}}>🏆</div>
              <div style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Variant {winner} Wins!</div>
              <div style={{fontSize:13,color:'#94a3b8',marginTop:8,maxWidth:600,margin:'8px auto 0'}}>{ev?.winner_reason}</div>
            </div>
          )}

          {/* Score comparison */}
          {ev && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
              {['A','B'].map(v=>{
                const avg = v==='A' ? ev.variant_a_avg : ev.variant_b_avg;
                const scores = v==='A' ? ev.variant_a_scores : ev.variant_b_scores;
                const maxPossible = (scores?.[0]?.total || 30);
                return (
                  <div key={v} style={{background:'#1e293b',borderRadius:12,border:`2px solid ${winner===v?'#6366f1':'#334155'}`,padding:20}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <div style={{fontSize:15,fontWeight:600,color:'#f1f5f9'}}>Variant {v}</div>
                      {winner===v && <span style={{...s.badge,...s.badgeGreen}}>🏆 Winner</span>}
                      <div style={{fontSize:22,fontWeight:700,color:winner===v?'#4ade80':'#94a3b8'}}>{avg?.toFixed(1)||'—'}</div>
                    </div>
                    {(scores||[]).map((sc,i)=>(
                      <div key={i} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#64748b'}}>
                          <span>Run {sc.run}</span>
                          <span>{sc.total} pts (C:{sc.consistency} Q:{sc.quality} H:{sc.helpfulness})</span>
                        </div>
                        {scoreBar(sc.total, maxPossible)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Statistical summary */}
          {ev?.statistical_summary && (
            <div style={{background:'#1e293b',borderRadius:12,border:'1px solid #334155',padding:20,marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:8}}>Statistical Summary</div>
              <div style={{fontSize:13,color:'#94a3b8',lineHeight:1.7}}>{ev.statistical_summary}</div>
            </div>
          )}

          {/* Side-by-side responses */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {['A','B'].map((v,idx)=>{
              const responses = idx===0 ? result.responses_a : result.responses_b;
              return (
                <div key={v} style={{background:'#1e293b',borderRadius:12,border:`2px solid ${winner===v?'#6366f1':'#334155'}`,padding:20}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#f1f5f9',marginBottom:12}}>
                    Variant {v} Responses ({responses?.length||0} runs)
                    {winner===v && ' 🏆'}
                  </div>
                  {(responses||[]).map((r,i)=>(
                    <div key={i} style={{marginBottom:12,padding:12,background:'#0f172a',borderRadius:8}}>
                      <div style={{fontSize:11,color:'#6366f1',marginBottom:6}}>Run {i+1}</div>
                      <div style={{fontSize:12,color:'#94a3b8',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{r}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
