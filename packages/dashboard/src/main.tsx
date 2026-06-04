// packages/dashboard/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsPage } from './pages/ProjectsPage';
import { DeploymentPage } from './pages/DeploymentPage';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950">
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/deployments/:id" element={<DeploymentPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);