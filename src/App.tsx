import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import SubcontractorOnboarding from '@/pages/SubcontractorOnboarding';
import AdminPanel from '@/pages/AdminPanel';
import DeveloperAdmin from '@/pages/DeveloperAdmin';
import OrganizationPanel from '@/components/organization/OrganizationPanelDashboard';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';

// Add these imports for the new routes
import Tasks from '@/pages/Tasks';
import Settings from '@/pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
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
              <RoleProtectedRoute module="projects">
                <Projects />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <RoleProtectedRoute module="tasks">
                <Tasks />
              </RoleProtectedRoute>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
