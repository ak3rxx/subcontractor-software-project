import {
  LayoutDashboard,
  Building,
  CheckSquare,
  Calculator,
  BarChart3,
  Settings,
  Users,
  Shield,
  Code
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  roles?: string[];
}

export const mainNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Project overview and key metrics'
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: Building,
    description: 'Manage construction projects and timelines'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Task management and workflow tracking'
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: Calculator,
    description: 'Budget tracking and financial management'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Project insights and performance analytics'
  },
];

export const adminNavigationItems: NavigationItem[] = [
  {
    name: 'Organization',
    href: '/organization-panel',
    icon: Users,
    description: 'Organization settings and team management',
    roles: ['org_admin']
  },
  {
    name: 'Admin Panel',
    href: '/admin-panel',
    icon: Shield,
    description: 'System administration and user management',
    roles: ['admin', 'org_admin']
  },
  {
    name: 'Developer',
    href: '/developer-admin',
    icon: Code,
    description: 'Developer tools and system diagnostics',
    roles: ['developer']
  },
];

export const settingsNavigationItems: NavigationItem[] = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account and application settings'
  },
];

// Legacy export for backward compatibility
export interface NavigationItemLegacy {
  name: string;
  path: string;
}

export const navigationItems: NavigationItemLegacy[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Projects', path: '/projects' },
  { name: 'Tasks', path: '/tasks' },
  { name: 'Finance', path: '/finance' },
  { name: 'Analytics', path: '/analytics' },
];