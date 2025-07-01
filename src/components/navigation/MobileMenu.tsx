
import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/PermissionGate';
import { navigationItems } from './NavigationItems';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { isDeveloper, isOrgAdmin } = usePermissions();

  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
      <div className="px-4 pt-4 pb-6 space-y-2">
        {navigationItems.map((item) => (
          item.module ? (
            <PermissionGate key={item.name} module={item.module} fallback={null}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`
                }
                onClick={onClose}
              >
                {item.name}
              </NavLink>
            </PermissionGate>
          ) : (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`
              }
              onClick={onClose}
            >
              {item.name}
            </NavLink>
          )
        ))}
        
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            }`
          }
          onClick={onClose}
        >
          Settings
        </NavLink>

        {(isDeveloper() || isOrgAdmin()) && (
          <NavLink
            to="/admin-panel"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              }`
            }
            onClick={onClose}
          >
            Admin Panel
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
