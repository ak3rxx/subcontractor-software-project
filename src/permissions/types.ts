
export type UserRole = 
  | 'developer' 
  | 'org_admin' 
  | 'project_manager' 
  | 'estimator' 
  | 'admin' 
  | 'site_supervisor' 
  | 'subcontractor' 
  | 'client';

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export type Module = 
  | 'admin_panel'
  | 'organization_panel'
  | 'projects'
  | 'tasks'
  | 'rfis'
  | 'qa_itp'
  | 'variations'
  | 'finance'
  | 'documents'
  | 'programme'
  | 'deliveries'
  | 'handovers'
  | 'notes'
  | 'onboarding'
  | 'diagnostics';

export interface UserProfile {
  id: string;
  role: UserRole;
  is_developer: boolean;
  email: string;
  full_name?: string;
  company?: string;
  phone?: string;
}

export interface RolePermission {
  role: UserRole;
  module: Module;
  permission_level: PermissionLevel;
}

export interface PermissionContext {
  userProfile: UserProfile | null;
  permissions: RolePermission[];
  loading: boolean;
}
