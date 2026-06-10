import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { DeploymentPage } from './pages/DeploymentPage';
import { Navbar } from './components/Navbar';
import { useAuth } from './hooks/useAuth';
import './index.css';

const queryClient = new QueryClient();

function TokenCatcher() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      // Remove token from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  return <AppRoutes />;
}

function AppRoutes() {
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProjectsPage />} />
        <Route path="/deployments/:id" element={<DeploymentPage />} />
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TokenCatcher />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);