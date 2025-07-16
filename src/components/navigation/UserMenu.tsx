
import React, { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavLink } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const UserMenu = memo(() => {
  const { user, signOut } = useAuth();
  
  // Memoize permission checks and user data for performance
  const userData = useMemo(() => ({
    isDeveloper: user?.email === 'huy.nguyen@dcsquared.com.au',
    isOrgAdmin: false, // Simplified for emergency recovery
    initials: user?.email ? user.email.substring(0, 2).toUpperCase() : 'U',
    avatarUrl: user?.user_metadata?.avatar_url
  }), [user?.email, user?.user_metadata?.avatar_url]);

  const handleSignOut = useCallback(async () => {
    console.log('Sign out button clicked');
    await signOut();
  }, [signOut]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-blue-200 transition-all">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userData.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
              {userData.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <div className="flex items-center justify-start gap-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userData.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              {userData.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-gray-500">
              {userData.isDeveloper ? 'Developer' : userData.isOrgAdmin ? 'Organization Admin' : 'User'}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavLink to="/settings" className="flex items-center">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;
