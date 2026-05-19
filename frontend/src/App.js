import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PromptTemplates from './pages/PromptTemplates';
import PromptVersions from './pages/PromptVersions';
import ABTests from './pages/ABTests';
import Optimization from './pages/Optimization';
import Analytics from './pages/Analytics';
import Library from './pages/Library';
import Variables from './pages/Variables';
import Teams from './pages/Teams';
import Chains from './pages/Chains';
import Evaluations from './pages/Evaluations';
import CostTracking from './pages/CostTracking';
import Categories from './pages/Categories';
import Playground from './pages/Playground';
import Deployments from './pages/Deployments';
import ExportImport from './pages/ExportImport';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Favorites from './pages/Favorites';
import Search from './pages/Search';
import Comments from './pages/Comments';
import ActivityLog from './pages/ActivityLog';
import Tags from './pages/Tags';
import Trash from './pages/Trash';
import Webhooks from './pages/Webhooks';
import ApiKeys from './pages/ApiKeys';
import Folders from './pages/Folders';
import Snippets from './pages/Snippets';
import Layout from './components/Layout';
import ABTestRunner from './pages/ABTestRunner';
import SecurityScanner from './pages/SecurityScanner';
import PIIChecker from './pages/PIIChecker';
import DeploymentManager from './pages/DeploymentManager';
import VersionHistory from './pages/VersionHistory';
import TemplateLibrary from './pages/TemplateLibrary';
import ClassifyPrompt from './pages/ClassifyPrompt';
import CustomViewsPage from './pages/CustomViewsPage';

// === Batch 07 Gaps & Frontend Mounts ===
import CfRegressionTestSuiteForPrompts from './pages/CfRegressionTestSuiteForPrompts';
import CfModelspecificPromptCompilation from './pages/CfModelspecificPromptCompilation';
import CfCostPredictionByVolume from './pages/CfCostPredictionByVolume';
import CfPromptLineageGraph from './pages/CfPromptLineageGraph';
import CfAbTestMarketplace from './pages/CfAbTestMarketplace';
import CfAgenticPromptRefinement from './pages/CfAgenticPromptRefinement';
import GapNoAiPromptClassificationAutotagByDomai from './pages/GapNoAiPromptClassificationAutotagByDomai';
import GapNoMultilanguagePromptTranslation from './pages/GapNoMultilanguagePromptTranslation';
import GapNoAiPiiinjectionSecurityScanningUiStub from './pages/GapNoAiPiiinjectionSecurityScanningUiStub';
import GapNoAiRegressionTestingAgainstGoldenOutp from './pages/GapNoAiRegressionTestingAgainstGoldenOutp';
import GapNoAiModelspecificPromptRewriterClaudeV from './pages/GapNoAiModelspecificPromptRewriterClaudeV';
import GapNoPublicPromptMarketplaceDiscoveryForki from './pages/GapNoPublicPromptMarketplaceDiscoveryForki';
import GapNoProductionModelRegistryBeyondDeployme from './pages/GapNoProductionModelRegistryBeyondDeployme';
import GapLimitedRealtimeCollaborativeEditingNoCr from './pages/GapLimitedRealtimeCollaborativeEditingNoCr';
import GapNoGitstyleVisualDiffForPromptVersions from './pages/GapNoGitstyleVisualDiffForPromptVersions';
import GapNoSsoenterpriseAuthProviderIntegration from './pages/GapNoSsoenterpriseAuthProviderIntegration';
// === End Batch 07 ===


const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #64748b; }
  input, textarea, select {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) handleLogout(); })
        .catch(() => handleLogout());
    }
  }, [token]);

  return (
    <>
      <style>{globalStyles}</style>
      <Router>
        <Routes>
          <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/*" element={
            token ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/prompts" element={<PromptTemplates />} />
                  <Route path="/versions" element={<PromptVersions />} />
                  <Route path="/ab-tests" element={<ABTests />} />
                  <Route path="/optimization" element={<Optimization />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/variables" element={<Variables />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/chains" element={<Chains />} />
                  <Route path="/evaluations" element={<Evaluations />} />
                  <Route path="/costs" element={<CostTracking />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="/deployments" element={<Deployments />} />
                  <Route path="/exports" element={<ExportImport />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/comments" element={<Comments />} />
                  <Route path="/activity" element={<ActivityLog />} />
                  <Route path="/tags" element={<Tags />} />
                  <Route path="/trash" element={<Trash />} />
                  <Route path="/webhooks" element={<Webhooks />} />
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="/folders" element={<Folders />} />
                  <Route path="/snippets" element={<Snippets />} />
                  <Route path="/ab-test-runner" element={<ABTestRunner />} />
                  <Route path="/security-scanner" element={<SecurityScanner />} />
                  <Route path="/pii-checker" element={<PIIChecker />} />
                  <Route path="/deployment-manager" element={<DeploymentManager />} />
                  <Route path="/version-history" element={<VersionHistory />} />
                  <Route path="/template-library" element={<TemplateLibrary />} />
                  <Route path="/classify-prompt" element={<ClassifyPrompt />} />
                  <Route path="/custom-views" element={<CustomViewsPage />} />
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-regression-test-suite-for-prompts' element={<CfRegressionTestSuiteForPrompts />} />
          <Route path='/cf-modelspecific-prompt-compilation' element={<CfModelspecificPromptCompilation />} />
          <Route path='/cf-cost-prediction-by-volume' element={<CfCostPredictionByVolume />} />
          <Route path='/cf-prompt-lineage-graph' element={<CfPromptLineageGraph />} />
          <Route path='/cf-ab-test-marketplace' element={<CfAbTestMarketplace />} />
          <Route path='/cf-agentic-prompt-refinement' element={<CfAgenticPromptRefinement />} />
          <Route path='/gap-no-ai-prompt-classification-autotag-by-domai' element={<GapNoAiPromptClassificationAutotagByDomai />} />
          <Route path='/gap-no-multilanguage-prompt-translation' element={<GapNoMultilanguagePromptTranslation />} />
          <Route path='/gap-no-ai-piiinjection-security-scanning-ui-stub' element={<GapNoAiPiiinjectionSecurityScanningUiStub />} />
          <Route path='/gap-no-ai-regression-testing-against-golden-outp' element={<GapNoAiRegressionTestingAgainstGoldenOutp />} />
          <Route path='/gap-no-ai-modelspecific-prompt-rewriter-claude-v' element={<GapNoAiModelspecificPromptRewriterClaudeV />} />
          <Route path='/gap-no-public-prompt-marketplace-discovery-forki' element={<GapNoPublicPromptMarketplaceDiscoveryForki />} />
          <Route path='/gap-no-production-model-registry-beyond-deployme' element={<GapNoProductionModelRegistryBeyondDeployme />} />
          <Route path='/gap-limited-realtime-collaborative-editing-no-cr' element={<GapLimitedRealtimeCollaborativeEditingNoCr />} />
          <Route path='/gap-no-gitstyle-visual-diff-for-prompt-versions' element={<GapNoGitstyleVisualDiffForPromptVersions />} />
          <Route path='/gap-no-ssoenterprise-auth-provider-integration' element={<GapNoSsoenterpriseAuthProviderIntegration />} />
          // === End Batch 07 ===
                </Routes>
              </Layout>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </>
  );
}

export default App;
