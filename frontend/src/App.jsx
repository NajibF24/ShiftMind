import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import FloatingNav from './components/FloatingNav';
import NeuralBackground from './components/NeuralBackground';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CaptureKnowledge from './pages/CaptureKnowledge';
import AskAI from './pages/AskAI';
import KnowledgeManager from './pages/KnowledgeManager';
import Interactive3DHome from './pages/Interactive3DHome';
import WorkJournal from './pages/WorkJournal';
import WorkflowRecorder from './pages/WorkflowRecorder';
import ExpertFinder from './pages/ExpertFinder';
import Checklists from './pages/Checklists';
import Approvals from './pages/Approvals';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '20px', background: 'white' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error.toString()}</pre>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent({ role, handleLogout }) {
  const location = useLocation();
  const isExplore = location.pathname === '/explore';

  return (
    <div className="app-shell">
      {!isExplore && <FloatingNav role={role} onLogout={handleLogout} />}
      <main style={{ padding: isExplore ? '0' : undefined }}>
        <Routes>
          <Route path="/" element={<Navigate to="/explore" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {(role === 'admin' || role === 'user') && (
            <Route path="/capture" element={<CaptureKnowledge />} />
          )}
          <Route path="/ask" element={<AskAI />} />
          <Route path="/journal" element={<WorkJournal />} />
          <Route path="/workflows" element={<WorkflowRecorder />} />
          <Route path="/experts" element={<ExpertFinder />} />
          <Route path="/checklists" element={<Checklists />} />
          <Route path="/approvals" element={<Approvals />} />
          {role === 'admin' && (
            <Route path="/knowledge-manager" element={<KnowledgeManager />} />
          )}
          <Route path="/explore" element={<Interactive3DHome />} />
          <Route path="*" element={<Navigate to="/explore" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = (newToken, newRole) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('display_name');
    setToken(null);
    setRole(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Global 3D background */}
        <div className="global-bg">
          <NeuralBackground />
          <div className="global-bg__grid" />
          <div className="global-bg__glow-1" />
          <div className="global-bg__glow-2" />
        </div>
        <AppContent role={role} handleLogout={handleLogout} />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
