
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import Finance from '@/pages/Finance';
import SubcontractorOnboarding from '@/pages/SubcontractorOnboarding';
import AdminPanel from '@/pages/AdminPanel';
import DeveloperAdmin from '@/pages/DeveloperAdmin';
import OrganizationPanel from '@/components/organization/OrganizationPanelDashboard';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedApp from '@/components/RoleProtectedApp';
import { AuthProvider } from '@/contexts/AuthContext';

// Add these imports for the new routes
import Tasks from '@/pages/Tasks';
import Settings from '@/pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <RoleProtectedApp>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute>
                <Finance />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/subcontractor-onboarding" element={<SubcontractorOnboarding />} />
            <Route path="/admin-panel" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/developer-admin" element={
              <ProtectedRoute>
                <DeveloperAdmin />
              </ProtectedRoute>
            } />
            <Route path="/organization-panel" element={
              <ProtectedRoute>
                <OrganizationPanel />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RoleProtectedApp>
      </Router>
    </AuthProvider>
  );
}

export default App;
