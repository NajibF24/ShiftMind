import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingNav from './components/FloatingNav';
import NeuralBackground from './components/NeuralBackground';
import ConnectionStatus from './components/ConnectionStatus';
import ParticleTrail from './components/ParticleTrail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CaptureKnowledge from './pages/CaptureKnowledge';
import AskAI from './pages/AskAI';
import KnowledgeManager from './pages/KnowledgeManager';
import KnowledgeHealth from './pages/KnowledgeHealth';
import Interactive3DHome from './pages/Interactive3DHome';
import WorkJournal from './pages/WorkJournal';
import WorkflowRecorder from './pages/WorkflowRecorder';
import ExpertFinder from './pages/ExpertFinder';
import Checklists from './pages/Checklists';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';

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

// ─── Page Transition Wrapper ──────────────────────────────────────────────────
const pageVariants = {
  initial: {
    clipPath: 'inset(0 0 100% 0)',
    opacity: 0,
  },
  animate: {
    clipPath: 'inset(0 0 0% 0)',
    opacity: 1,
    transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
  },
  exit: {
    clipPath: 'inset(100% 0 0 0)',
    opacity: 0,
    transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] },
  },
};

const PageTransition = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ width: '100%', minHeight: '100vh' }}
  >
    {children}
  </motion.div>
);

// ─── Animated Routes ─────────────────────────────────────────────────────────
function AnimatedRoutes({ role }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/explore" />} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        {(role === 'admin' || role === 'user') && (
          <Route path="/capture" element={<PageTransition><CaptureKnowledge /></PageTransition>} />
        )}
        <Route path="/ask" element={<PageTransition><AskAI /></PageTransition>} />
        <Route path="/journal" element={<PageTransition><WorkJournal /></PageTransition>} />
        <Route path="/workflows" element={<PageTransition><WorkflowRecorder /></PageTransition>} />
        <Route path="/experts" element={<PageTransition><ExpertFinder /></PageTransition>} />
        <Route path="/checklists" element={<PageTransition><Checklists /></PageTransition>} />
        <Route path="/approvals" element={<PageTransition><Approvals /></PageTransition>} />
        {role === 'admin' && (
          <>
            <Route path="/knowledge-manager" element={<PageTransition><KnowledgeManager /></PageTransition>} />
            <Route path="/knowledge-health" element={<PageTransition><KnowledgeHealth /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          </>
        )}
        <Route path="/explore" element={<Interactive3DHome />} />
        <Route path="*" element={<Navigate to="/explore" />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent({ role, handleLogout }) {
  const location = useLocation();
  const isExplore = location.pathname === '/explore';

  return (
    <div className="app-shell">
      <ConnectionStatus />
      {!isExplore && <FloatingNav role={role} onLogout={handleLogout} />}
      <ParticleTrail />
      <main style={{ padding: isExplore ? '0' : undefined }}>
        <AnimatedRoutes role={role} />
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
