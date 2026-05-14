import React, { useState } from 'react';
import { api } from '../api';
import { pageStyles as s } from '../styles';

export default function ClassifyPrompt() {
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runClassify = async () => {
    setError('');
    if (!promptText.trim()) {
      setError('Enter prompt text to classify');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post('/ai/classify-prompt', { prompt: promptText });
      setResult(r);
    } catch (e) {
      setError(e.message || 'Classification failed');
    }
    setLoading(false);
  };

  const parsed = result?.parsed || result;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Classify Prompt</div>
          <div style={s.subtitle}>
            AI-extracted domain, task type, intent, tone, audience, complexity, format, language and tags
          </div>
        </div>
      </div>

      {error && <div style={{ ...s.error, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div
          style={{
            background: '#1e293b',
            borderRadius: 12,
            border: '1px solid #334155',
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>
            Prompt Input
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Prompt Text</label>
            <textarea
              style={{ ...s.input, minHeight: 220, resize: 'vertical', fontFamily: 'inherit' }}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste your prompt here..."
            />
          </div>
          <button onClick={runClassify} style={s.addBtn} disabled={loading}>
            {loading ? 'Classifying...' : 'Classify'}
          </button>
        </div>

        <div
          style={{
            background: '#1e293b',
            borderRadius: 12,
            border: '1px solid #334155',
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>
            Classification
          </div>
          {loading && (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>AI is classifying your prompt...</div>
          )}
          {!loading && !parsed && (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Run a classification to see structured tags here.
            </div>
          )}
          {parsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Domain', parsed.domain],
                ['Task Type', parsed.task_type],
                ['Intent', parsed.intent],
                ['Tone', parsed.tone],
                ['Audience', parsed.audience],
                ['Complexity', parsed.complexity],
                ['Format', parsed.format],
                ['Language', parsed.language],
              ].map(([k, v]) =>
                v ? (
                  <div key={k}>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        color: '#64748b',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 2 }}>
                      {typeof v === 'string' ? v : JSON.stringify(v)}
                    </div>
                  </div>
                ) : null
              )}

              {Array.isArray(parsed.subjects) && parsed.subjects.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      letterSpacing: '0.05em',
                      marginBottom: 6,
                    }}
                  >
                    Subjects
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.subjects.map((sub, i) => (
                      <span key={i} style={{ ...s.badge, ...s.badgeBlue }}>
                        {typeof sub === 'string' ? sub : JSON.stringify(sub)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(parsed.tags) && parsed.tags.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      letterSpacing: '0.05em',
                      marginBottom: 6,
                    }}
                  >
                    Tags
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.tags.map((t, i) => (
                      <span key={i} style={{ ...s.badge, ...s.badgePurple }}>
                        {typeof t === 'string' ? t : JSON.stringify(t)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <details style={{ marginTop: 4 }}>
                <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: 12 }}>
                  Raw response
                </summary>
                <pre
                  style={{
                    fontSize: 11,
                    color: '#cbd5e1',
                    background: '#0f172a',
                    padding: 10,
                    borderRadius: 6,
                    overflow: 'auto',
                    marginTop: 8,
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
