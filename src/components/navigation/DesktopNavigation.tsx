
import React, { memo, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { navigationItems } from './NavigationItems';

const DesktopNavigation = memo(() => {
  const { user } = useAuth();
  
  // Memoize permission checks for performance
  const permissions = useMemo(() => ({
    isDeveloper: user?.email === 'huy.nguyen@dcsquared.com.au',
    isOrgAdmin: false // Simplified for emergency recovery
  }), [user?.email]);

  return (
    <div className="hidden md:flex items-center space-x-1">
      {navigationItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-blue-100 text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            }`
          }
        >
          {item.name}
        </NavLink>
      ))}
      
      {/* Settings - All users */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-blue-100 text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
          }`
        }
      >
        Settings
      </NavLink>

      {/* Admin Panel - Developer only (emergency bypass) */}
      {permissions.isDeveloper && (
        <NavLink
          to="/admin-panel"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-purple-100 text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`
          }
        >
          Admin
        </NavLink>
      )}
    </div>
  );
});

DesktopNavigation.displayName = 'DesktopNavigation';

export default DesktopNavigation;
