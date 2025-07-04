
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
import OrganizationPanel from '@/pages/OrganizationPanel';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedApp from '@/components/RoleProtectedApp';
import InvitationAcceptance from '@/pages/InvitationAcceptance';
import OrganizationOnboarding from '@/components/organization/OrganizationOnboarding';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
// AuthProvider removed - using direct useAuth hook instead

// Add these imports for the new routes
import Tasks from '@/pages/Tasks';
import Settings from '@/pages/Settings';

function App() {
  return (
    <Router>
      <RoleProtectedApp>
        <OnboardingProvider>
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
          <Route path="/invitation" element={
            <ProtectedRoute>
              <InvitationAcceptance />
            </ProtectedRoute>
          } />
          <Route path="/organization-onboarding" element={
            <ProtectedRoute>
              <OrganizationOnboarding />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingProvider>
      </RoleProtectedApp>
    </Router>
  );
}

export default App;
