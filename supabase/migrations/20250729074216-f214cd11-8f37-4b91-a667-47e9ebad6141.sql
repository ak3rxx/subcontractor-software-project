-- Phase 1: Add NOT NULL constraint to projects.organization_id
-- First, update any existing projects without organization_id to use their creator's primary organization
UPDATE public.projects 
SET organization_id = (
  SELECT get_user_primary_org(projects.project_manager_id)
)
WHERE organization_id IS NULL;

-- Add NOT NULL constraint
ALTER TABLE public.projects 
ALTER COLUMN organization_id SET NOT NULL;

-- Phase 2: Create reusable function for associating user projects to organization
CREATE OR REPLACE FUNCTION public.associate_user_projects_to_org(user_email TEXT, target_org_id UUID)
RETURNS TABLE(updated_count INTEGER, project_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_user_id UUID;
  updated_projects UUID[];
  update_count INTEGER;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Verify the user has access to the target organization
  IF NOT check_organization_access(target_org_id, target_user_id) THEN
    RAISE EXCEPTION 'User does not have access to organization %', target_org_id;
  END IF;
  
  -- Update projects and collect IDs
  UPDATE public.projects 
  SET organization_id = target_org_id,
      updated_at = NOW()
  WHERE project_manager_id = target_user_id
    AND (organization_id IS NULL OR organization_id != target_org_id)
  RETURNING id INTO updated_projects;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Log the operation
  INSERT INTO public.system_diagnostics (
    check_type, status, message, details
  ) VALUES (
    'project_org_association',
    'success',
    'Associated ' || update_count || ' projects to organization for user ' || user_email,
    jsonb_build_object(
      'user_id', target_user_id,
      'organization_id', target_org_id,
      'updated_projects', updated_projects
    )
  );
  
  RETURN QUERY SELECT update_count, updated_projects;
END;
$function$;

-- Phase 3: Create trigger to auto-assign organization on project creation
CREATE OR REPLACE FUNCTION public.auto_assign_project_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_primary_org UUID;
BEGIN
  -- If organization_id is not provided, use user's primary organization
  IF NEW.organization_id IS NULL THEN
    SELECT get_user_primary_org(NEW.project_manager_id) INTO user_primary_org;
    
    IF user_primary_org IS NOT NULL THEN
      NEW.organization_id := user_primary_org;
    ELSE
      RAISE EXCEPTION 'Cannot create project: user has no organization association';
    END IF;
  END IF;
  
  -- Verify user has access to the specified organization
  IF NOT check_organization_access(NEW.organization_id, NEW.project_manager_id) THEN
    RAISE EXCEPTION 'User does not have access to specified organization';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS projects_auto_assign_organization ON public.projects;
CREATE TRIGGER projects_auto_assign_organization
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_project_organization();

-- Phase 4: Create audit function for monitoring orphaned projects
CREATE OR REPLACE FUNCTION public.audit_project_organization_associations()
RETURNS TABLE(
  issue_type TEXT,
  project_id UUID,
  project_name TEXT,
  project_manager_email TEXT,
  organization_id UUID,
  organization_name TEXT,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  -- Check for projects without organization (should not exist after constraint)
  SELECT 
    'missing_organization'::TEXT as issue_type,
    p.id as project_id,
    p.name as project_name,
    u.email as project_manager_email,
    p.organization_id,
    NULL::TEXT as organization_name,
    'critical'::TEXT as severity
  FROM public.projects p
  LEFT JOIN auth.users u ON p.project_manager_id = u.id
  WHERE p.organization_id IS NULL
  
  UNION ALL
  
  -- Check for projects where PM doesn't belong to project's organization
  SELECT 
    'pm_not_in_org'::TEXT as issue_type,
    p.id as project_id,
    p.name as project_name,
    u.email as project_manager_email,
    p.organization_id,
    o.name as organization_name,
    'high'::TEXT as severity
  FROM public.projects p
  JOIN auth.users u ON p.project_manager_id = u.id
  JOIN public.organizations o ON p.organization_id = o.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = p.project_manager_id
      AND ou.organization_id = p.organization_id
      AND ou.status = 'active'
  );
END;
$function$;

-- Create function to log project creation events
CREATE OR REPLACE FUNCTION public.log_project_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.system_diagnostics (
    check_type, status, message, details
  ) VALUES (
    'project_creation',
    'info',
    'Project created: ' || NEW.name,
    jsonb_build_object(
      'project_id', NEW.id,
      'project_manager_id', NEW.project_manager_id,
      'organization_id', NEW.organization_id,
      'project_number', NEW.project_number
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Create the logging trigger
DROP TRIGGER IF EXISTS projects_creation_log ON public.projects;
CREATE TRIGGER projects_creation_log
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_creation();