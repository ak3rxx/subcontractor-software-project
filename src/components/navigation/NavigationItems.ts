
import { Module } from '@/permissions/types';

export interface NavigationItem {
  name: string;
  path: string;
  module: Module | null;
}

export const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', path: '/dashboard', module: null },
  { name: 'Projects', path: '/projects', module: 'projects' as const },
  { name: 'Tasks', path: '/tasks', module: 'tasks' as const },
  { name: 'Finance', path: '/finance', module: 'finance' as const },
];
