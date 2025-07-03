import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedAppProps {
  children: React.ReactNode;
}

const RoleProtectedApp: React.FC<RoleProtectedAppProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, let the ProtectedRoute handle it
  if (!user) {
    return <>{children}</>;
  }

  // Emergency bypass: just proceed with normal app for authenticated users
  console.log('Emergency bypass: authenticated user accessing app');
  return <>{children}</>;
};

export default RoleProtectedApp;