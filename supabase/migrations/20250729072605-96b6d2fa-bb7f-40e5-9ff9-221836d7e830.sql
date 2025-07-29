-- Fix project organization linking by updating existing projects to have organization_id
-- First, let's add a NOT NULL constraint after setting default values

-- Get the first organization for each user and link their projects to it
UPDATE public.projects 
SET organization_id = (
  SELECT organization_id 
  FROM organization_users 
  WHERE user_id = projects.project_manager_id 
  AND status = 'active' 
  ORDER BY joined_at ASC 
  LIMIT 1
)
WHERE organization_id IS NULL AND project_manager_id IS NOT NULL;

-- For any remaining projects without organization, create a default one
-- This handles edge cases where users might not have organizations
DO $$
DECLARE
  orphan_project RECORD;
  default_org_id UUID;
BEGIN
  FOR orphan_project IN 
    SELECT DISTINCT project_manager_id 
    FROM projects 
    WHERE organization_id IS NULL AND project_manager_id IS NOT NULL
  LOOP
    -- Create default organization for this user if they don't have one
    INSERT INTO organizations (name, slug, license_count, created_by)
    VALUES (
      'Default Organization',
      'default-org-' || orphan_project.project_manager_id::text,
      5,
      orphan_project.project_manager_id
    )
    RETURNING id INTO default_org_id;
    
    -- Add user as org admin
    INSERT INTO organization_users (organization_id, user_id, role, status, joined_at, approved_at, approved_by)
    VALUES (default_org_id, orphan_project.project_manager_id, 'org_admin', 'active', NOW(), NOW(), orphan_project.project_manager_id);
    
    -- Update projects to use this organization
    UPDATE projects 
    SET organization_id = default_org_id 
    WHERE project_manager_id = orphan_project.project_manager_id AND organization_id IS NULL;
  END LOOP;
END $$;