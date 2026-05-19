import React from 'react';
import PromptPerformanceChart from '../components/PromptPerformanceChart';
import ModelComparisonHeatmap from '../components/ModelComparisonHeatmap';
import PromptLibraryPDF from '../components/PromptLibraryPDF';
import EvaluationRulesEditor from '../components/EvaluationRulesEditor';

export default function CustomViewsPage() {
  const styles = {
    page: { maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 },
    header: { marginBottom: 8 },
    title: { fontSize: 24, fontWeight: 700, color: '#f1f5f9' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
    sectionTitle: {
      fontSize: 11, fontWeight: 700, color: '#818cf8',
      letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 10,
    },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: 20 },
  };

  return (
    <div style={styles.page} data-testid="custom-views-page">
      <div style={styles.header}>
        <div style={styles.title}>Prompt Views</div>
        <div style={styles.subtitle}>
          Custom analytical views: performance chart, model heatmap, library PDF, evaluation rules.
        </div>
      </div>

      <div style={styles.sectionTitle}>Visualizations</div>
      <div style={styles.grid}>
        <PromptPerformanceChart />
        <ModelComparisonHeatmap />
      </div>

      <div style={styles.sectionTitle}>Tools</div>
      <div style={styles.grid}>
        <PromptLibraryPDF />
        <EvaluationRulesEditor />
      </div>
    </div>
  );
}
