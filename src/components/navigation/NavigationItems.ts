
export interface NavigationItem {
  name: string;
  path: string;
}

export const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Projects', path: '/projects' },
  { name: 'Tasks', path: '/tasks' },
  { name: 'Finance', path: '/finance' },
];
