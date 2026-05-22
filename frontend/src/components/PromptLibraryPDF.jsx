import React, { useState } from 'react';
import { api } from '../api';

export default function PromptLibraryPDF() {
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = {
    wrap: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 },
    title: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
    sub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    btn: {
      padding: '10px 16px', borderRadius: 8, border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
    },
    btnRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
    meta: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
    preview: {
      background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
      padding: 16, maxHeight: 420, overflow: 'auto',
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 11, color: '#cbd5e1', whiteSpace: 'pre-wrap',
    },
    err: { color: '#f87171', marginTop: 12 },
  };

  const fetchDoc = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.get('/custom-views/prompt-library-pdf');
      setDoc(r);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const downloadDoc = () => {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = doc.filename || 'prompt-library.pdf.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.wrap} data-testid="prompt-library-pdf">
      <div style={styles.title}>Prompt Library PDF</div>
      <div style={styles.sub}>Generate a printable PDF-style export of your full prompt library.</div>
      <div style={styles.btnRow}>
        <button style={styles.btn} onClick={fetchDoc} disabled={loading}>
          {loading ? 'Generating...' : doc ? 'Regenerate' : 'Generate PDF'}
        </button>
        {doc && <button style={{ ...styles.btn, background: '#334155' }} onClick={downloadDoc}>Download</button>}
      </div>
      {doc && (
        <>
          <div style={styles.meta}>
            <strong>{doc.title}</strong> &middot; {doc.filename} &middot; {doc.prompt_count} prompts &middot; {doc.page_count} pages
          </div>
          <pre style={styles.preview}>{doc.content}</pre>
        </>
      )}
      {err && <div style={styles.err}>Error: {err}</div>}
    </div>
  );
}
