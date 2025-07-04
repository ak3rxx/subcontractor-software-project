import React from 'react';

interface RoleProtectedAppProps {
  children: React.ReactNode;
}

const RoleProtectedApp: React.FC<RoleProtectedAppProps> = ({ children }) => {
  // Simply pass through - let ProtectedRoute handle all auth logic
  return <>{children}</>;
};

export default RoleProtectedApp;