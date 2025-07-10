
import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/navigation/Logo';
import DesktopNavigation from '@/components/navigation/DesktopNavigation';
import UserMenu from '@/components/navigation/UserMenu';
import MobileMenu from '@/components/navigation/MobileMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

const TopNav = memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-7xl">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <DesktopNavigation />

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <UserMenu />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-10 w-10 p-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </nav>
  );
});

TopNav.displayName = 'TopNav';

export default TopNav;
