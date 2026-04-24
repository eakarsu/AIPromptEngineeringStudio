import React from 'react';

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)',
    borderRadius: 12, border: '1px solid #312e81', padding: 24, marginTop: 16,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
    paddingBottom: 12, borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
  },
  aiIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: '#fff',
  },
  title: { fontSize: 14, fontWeight: 600, color: '#a5b4fc' },
  model: { fontSize: 11, color: '#6366f1', marginLeft: 'auto', fontFamily: 'monospace' },
  content: { fontSize: 14, lineHeight: 1.8, color: '#e2e8f0' },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 6,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  sectionContent: {
    fontSize: 13, lineHeight: 1.7, color: '#cbd5e1',
    padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  stats: {
    display: 'flex', gap: 16, marginTop: 16, paddingTop: 12,
    borderTop: '1px solid rgba(99, 102, 241, 0.15)',
    flexWrap: 'wrap',
  },
  stat: { textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: 700, color: '#a5b4fc' },
  statLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  bulletList: { paddingLeft: 20, margin: '8px 0', listStyle: 'none' },
  bulletItem: {
    fontSize: 13, color: '#cbd5e1', padding: '4px 0', position: 'relative',
    paddingLeft: 16,
  },
  score: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 20,
    background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc',
    fontSize: 14, fontWeight: 700,
  },
};

function parseAIResponse(text) {
  if (!text) return [];

  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: trimmed.replace(/\*\*/g, ''), items: [] };
    } else if (trimmed.match(/^\*\*(.+?)\*\*/)) {
      if (currentSection) sections.push(currentSection);
      const titleMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
      currentSection = { title: titleMatch[1], items: titleMatch[2] ? [titleMatch[2]] : [] };
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!currentSection) currentSection = { title: 'Response', items: [] };
      currentSection.items.push(trimmed.substring(2));
    } else if (trimmed.match(/^\d+\./)) {
      if (!currentSection) currentSection = { title: 'Response', items: [] };
      currentSection.items.push(trimmed);
    } else {
      if (!currentSection) currentSection = { title: 'Response', items: [] };
      if (currentSection.items.length > 0) {
        const lastIdx = currentSection.items.length - 1;
        currentSection.items[lastIdx] += ' ' + trimmed;
      } else {
        currentSection.items.push(trimmed);
      }
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

export default function AIOutput({ response, usage, model, latency, cost, title }) {
  if (!response) return null;

  const sections = parseAIResponse(response);
  const hasStructuredContent = sections.length > 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.aiIcon}>AI</div>
        <div>
          <div style={styles.title}>{title || 'AI Response'}</div>
        </div>
        {model && <div style={styles.model}>{model}</div>}
      </div>

      {hasStructuredContent ? (
        sections.map((section, i) => (
          <div key={i} style={styles.section}>
            <div style={styles.sectionTitle}>
              {section.title.includes('Score') && '📊 '}
              {section.title.includes('Strength') && '💪 '}
              {section.title.includes('Weakness') && '⚠️ '}
              {section.title.includes('Recommend') && '💡 '}
              {section.title.includes('Optimized') && '✨ '}
              {section.title.includes('Changes') && '🔄 '}
              {section.title.includes('Suggestion') && '🎯 '}
              {section.title}
            </div>
            {section.items.length === 1 && section.title.includes('Score') ? (
              <div style={styles.score}>{section.items[0]}</div>
            ) : (
              <div style={styles.sectionContent}>
                {section.items.map((item, j) => (
                  <div key={j} style={{ marginBottom: 4 }}>
                    {(item.startsWith('-') || item.match(/^\d+\./)) ? (
                      <span>{'  '}{item}</span>
                    ) : item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div style={styles.sectionContent}>{response}</div>
      )}

      {(usage || latency || cost) && (
        <div style={styles.stats}>
          {usage?.total_tokens != null && (
            <div style={styles.stat}>
              <div style={styles.statValue}>{usage.total_tokens.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Tokens</div>
            </div>
          )}
          {usage?.prompt_tokens != null && (
            <div style={styles.stat}>
              <div style={styles.statValue}>{usage.prompt_tokens.toLocaleString()}</div>
              <div style={styles.statLabel}>Input Tokens</div>
            </div>
          )}
          {usage?.completion_tokens != null && (
            <div style={styles.stat}>
              <div style={styles.statValue}>{usage.completion_tokens.toLocaleString()}</div>
              <div style={styles.statLabel}>Output Tokens</div>
            </div>
          )}
          {latency != null && (
            <div style={styles.stat}>
              <div style={styles.statValue}>{(latency / 1000).toFixed(2)}s</div>
              <div style={styles.statLabel}>Latency</div>
            </div>
          )}
          {cost != null && (
            <div style={styles.stat}>
              <div style={styles.statValue}>${Number(cost).toFixed(4)}</div>
              <div style={styles.statLabel}>Cost</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
