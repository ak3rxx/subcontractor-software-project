
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavLink } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/PermissionGate';

const TopNav = () => {
  const { user, signOut } = useAuth();
  const { isDeveloper, isOrgAdmin } = usePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', module: null },
    { name: 'Projects', path: '/projects', module: 'projects' as const },
    { name: 'Tasks', path: '/tasks', module: 'tasks' as const },
  ];

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-600">
            <span className="text-xl font-bold text-white">GS</span>
          </div>
          <h1 className="text-xl font-bold hidden sm:block">Grandscale</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            item.module ? (
              <PermissionGate key={item.name} module={item.module} fallback={null}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                      : "text-gray-600 hover:text-blue-600 transition-colors"
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
                  isActive
                    ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                    : "text-gray-600 hover:text-blue-600 transition-colors"
                }
              >
                {item.name}
              </NavLink>
            )
          ))}
          
          {/* Settings - Only for Developer + Org Admin */}
          {(isDeveloper() || isOrgAdmin()) && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                  : "text-gray-600 hover:text-blue-600 transition-colors"
              }
            >
              Settings
            </NavLink>
          )}

          {/* Admin Panel - Developer Only */}
          {isDeveloper() && (
            <NavLink
              to="/admin-panel"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                  : "text-gray-600 hover:text-blue-600 transition-colors"
              }
            >
              Admin Panel
            </NavLink>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-500">
                    {isDeveloper() ? 'Developer' : isOrgAdmin() ? 'Organization Admin' : 'User'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {(isDeveloper() || isOrgAdmin()) && (
                <DropdownMenuItem asChild>
                  <NavLink to="/settings">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </NavLink>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              item.module ? (
                <PermissionGate key={item.name} module={item.module} fallback={null}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      isActive
                        ? "block px-3 py-2 text-blue-600 font-medium bg-blue-50 rounded-md"
                        : "block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                </PermissionGate>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "block px-3 py-2 text-blue-600 font-medium bg-blue-50 rounded-md"
                      : "block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </NavLink>
              )
            ))}
            
            {(isDeveloper() || isOrgAdmin()) && (
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive
                    ? "block px-3 py-2 text-blue-600 font-medium bg-blue-50 rounded-md"
                    : "block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </NavLink>
            )}

            {isDeveloper() && (
              <NavLink
                to="/admin-panel"
                className={({ isActive }) =>
                  isActive
                    ? "block px-3 py-2 text-blue-600 font-medium bg-blue-50 rounded-md"
                    : "block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNav;
