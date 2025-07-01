
import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/PermissionGate';
import { navigationItems } from './NavigationItems';

const DesktopNavigation = () => {
  const { isDeveloper, isOrgAdmin } = usePermissions();

  return (
    <div className="hidden md:flex items-center space-x-1">
      {navigationItems.map((item) => (
        item.module ? (
          <PermissionGate key={item.name} module={item.module} fallback={null}>
            <NavLink
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
          </PermissionGate>
        ) : (
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
        )
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

      {/* Admin Panel - Developer + Org Admin */}
      {(isDeveloper() || isOrgAdmin()) && (
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
};

export default DesktopNavigation;
