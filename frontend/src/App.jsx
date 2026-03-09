import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import GraphInput from './pages/GraphInput';
import ResultViewer from './pages/ResultViewer';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register' | 'forgot'
  const [appPage, setAppPage] = useState('dashboard'); // 'dashboard' | 'new' | 'result'
  const [activeSheetId, setActiveSheetId] = useState(null);

  if (loading) return <div className="loading-screen">Chargement...</div>;

  // ── Non connecté ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-brand">
          <h1>Demoucron</h1>
          <p>Chemin de valeur optimale</p>
        </div>
        {authPage === 'login' && (
          <Login
            onSwitch={() => setAuthPage('register')}
            onForgot={() => setAuthPage('forgot')}
          />
        )}
        {authPage === 'register' && (
          <Register onSwitch={() => setAuthPage('login')} />
        )}
        {authPage === 'forgot' && (
          <ForgotPassword onBack={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  // ── Connecté ──────────────────────────────────────────────────────────
  return (
    <div className="app">
      {appPage === 'dashboard' && (
        <Dashboard
          onOpen={(id) => { setActiveSheetId(id); setAppPage('result'); }}
          onCreate={() => setAppPage('new')}
        />
      )}
      {appPage === 'new' && (
        <GraphInput
          onBack={() => setAppPage('dashboard')}
          onResult={(sheet) => { setActiveSheetId(sheet.id); setAppPage('result'); }}
        />
      )}
      {appPage === 'result' && (
        <ResultViewer
          sheetId={activeSheetId}
          onBack={() => setAppPage('dashboard')}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}