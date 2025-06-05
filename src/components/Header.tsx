
import React from 'react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-construction-blue">
            <span className="text-xl font-bold text-white">CB</span>
          </div>
          <h1 className="text-xl font-bold">ConstructBuild</h1>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <NavLink to="/" className={({isActive}) => 
            isActive ? "text-construction-blue font-medium" : "text-gray-600 hover:text-construction-blue transition-colors"
          }>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={({isActive}) => 
            isActive ? "text-construction-blue font-medium" : "text-gray-600 hover:text-construction-blue transition-colors"
          }>
            Dashboard
          </NavLink>
          <NavLink to="/subcontractor-onboarding" className={({isActive}) => 
            isActive ? "text-construction-blue font-medium" : "text-gray-600 hover:text-construction-blue transition-colors"
          }>
            Subcontractors
          </NavLink>
          <NavLink to="/features" className={({isActive}) => 
            isActive ? "text-construction-blue font-medium" : "text-gray-600 hover:text-construction-blue transition-colors"
          }>
            Features
          </NavLink>
          <NavLink to="/pricing" className={({isActive}) => 
            isActive ? "text-construction-blue font-medium" : "text-gray-600 hover:text-construction-blue transition-colors"
          }>
            Pricing
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">Log In</Button>
          <Button className="bg-construction-blue hover:bg-blue-700">Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
