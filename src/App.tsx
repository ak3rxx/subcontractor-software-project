
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import Finance from '@/pages/Finance';
import Analytics from '@/pages/Analytics';
import SubcontractorOnboarding from '@/pages/SubcontractorOnboarding';
import AdminPanel from '@/pages/AdminPanel';
import DeveloperAdmin from '@/pages/DeveloperAdmin';
import OrganizationPanel from '@/pages/OrganizationPanel';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedApp from '@/components/RoleProtectedApp';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import InvitationAcceptance from '@/pages/InvitationAcceptance';
import OrganizationOnboarding from '@/components/organization/OrganizationOnboarding';
import { ProtectedOnboardingProvider } from '@/components/onboarding/ProtectedOnboardingProvider';
// AuthProvider removed - using direct useAuth hook instead

// Add these imports for the new routes
import Tasks from '@/pages/Tasks';
import Settings from '@/pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <RoleProtectedApp>
        <Routes>
          {/* Public routes - no onboarding provider */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/subcontractor-onboarding" element={<SubcontractorOnboarding />} />
          
          {/* Protected routes - wrapped with onboarding provider */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <Dashboard />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <Projects />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <Finance />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <Analytics />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <Tasks />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <Settings />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/admin-panel" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <AdminPanel />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/developer-admin" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <DeveloperAdmin />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/organization-panel" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <OrganizationPanel />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/invitation" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <InvitationAcceptance />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          <Route path="/organization-onboarding" element={
            <ProtectedRoute>
              <ProtectedOnboardingProvider>
                <OrganizationOnboarding />
              </ProtectedOnboardingProvider>
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </RoleProtectedApp>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
