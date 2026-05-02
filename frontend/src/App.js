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
