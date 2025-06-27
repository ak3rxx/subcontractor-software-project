
-- Fix role permissions for variations module approval workflow
-- Update org_admin role to have admin permission for variations
INSERT INTO public.role_permissions (role, module, permission_level)
VALUES ('org_admin', 'variations', 'admin')
ON CONFLICT (role, module) 
DO UPDATE SET permission_level = 'admin';

-- Update admin role to have admin permission for variations  
INSERT INTO public.role_permissions (role, module, permission_level)
VALUES ('admin', 'variations', 'admin')
ON CONFLICT (role, module) 
DO UPDATE SET permission_level = 'admin';

-- Ensure project_manager has admin permission for variations
INSERT INTO public.role_permissions (role, module, permission_level)
VALUES ('project_manager', 'variations', 'admin')
ON CONFLICT (role, module) 
DO UPDATE SET permission_level = 'admin';

-- Add manager role with admin permission for variations
INSERT INTO public.role_permissions (role, module, permission_level)
VALUES ('manager', 'variations', 'admin')
ON CONFLICT (role, module) 
DO UPDATE SET permission_level = 'admin';
