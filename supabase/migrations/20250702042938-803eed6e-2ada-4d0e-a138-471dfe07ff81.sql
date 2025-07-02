
-- Comprehensive fix for infinite recursion in QA/ITP module and organization policies

-- 1. First, drop ALL existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view org memberships they have access to" ON organization_users;
DROP POLICY IF EXISTS "Org admins can manage organization users" ON organization_users;
DROP POLICY IF EXISTS "Users can view their org memberships" ON organization_users;
DROP POLICY IF EXISTS "Org members can view memberships" ON organization_users;

-- 2. Ensure our security definer function exists and is working
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS UUID[] 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT ARRAY(
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  );
$$;

-- 3. Create safe, non-recursive policies for organization_users
CREATE POLICY "Users can view their own membership records" 
ON organization_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own membership records" 
ON organization_users 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 4. Create admin policy using a different approach to avoid recursion
CREATE POLICY "Org admins can manage users in their organization" 
ON organization_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (
      p.email = 'huy.nguyen@dcsquared.com.au' OR
      p.is_developer = true OR
      p.role = 'org_admin'
    )
  )
);

-- 5. Ensure QA inspection policies are working correctly with the fixed function
-- Drop any conflicting QA policies first
DROP POLICY IF EXISTS "Users can view QA inspections in their organization" ON qa_inspections;
DROP POLICY IF EXISTS "Users can create QA inspections for their organization" ON qa_inspections;
DROP POLICY IF EXISTS "Users can update QA inspections in their organization" ON qa_inspections;

-- Recreate clean QA policies
CREATE POLICY "Organization members can view QA inspections" 
ON qa_inspections 
FOR SELECT 
USING (
  organization_id = ANY(public.get_user_organization_ids()) OR
  created_by = auth.uid()
);

CREATE POLICY "Organization members can create QA inspections" 
ON qa_inspections 
FOR INSERT 
WITH CHECK (
  organization_id = ANY(public.get_user_organization_ids()) OR
  created_by = auth.uid()
);

CREATE POLICY "Organization members can update QA inspections" 
ON qa_inspections 
FOR UPDATE 
USING (
  organization_id = ANY(public.get_user_organization_ids()) OR
  created_by = auth.uid()
);

-- 6. Clean up checklist items policies to avoid any recursion
DROP POLICY IF EXISTS "Users can view checklist items in their organization" ON qa_checklist_items;
DROP POLICY IF EXISTS "Users can manage checklist items in their organization" ON qa_checklist_items;
DROP POLICY IF EXISTS "Users can update checklist items in their organization" ON qa_checklist_items;

-- Recreate clean checklist policies
CREATE POLICY "Organization members can view checklist items" 
ON qa_checklist_items 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids()) OR created_by = auth.uid()
  )
);

CREATE POLICY "Organization members can manage checklist items" 
ON qa_checklist_items 
FOR ALL 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids()) OR created_by = auth.uid()
  )
);

-- 7. Clean up change history policies
DROP POLICY IF EXISTS "Users can view change history in their organization" ON qa_change_history;
DROP POLICY IF EXISTS "Users can create change history in their organization" ON qa_change_history;

-- Recreate clean change history policies
CREATE POLICY "Organization members can view change history" 
ON qa_change_history 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids()) OR created_by = auth.uid()
  )
);

CREATE POLICY "Organization members can create change history" 
ON qa_change_history 
FOR INSERT 
WITH CHECK (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids()) OR created_by = auth.uid()
  )
);

-- 8. Ensure variations table has proper policies without recursion issues
-- Check if there are any problematic variation policies
CREATE POLICY IF NOT EXISTS "Users can view variations for their projects" 
ON variations 
FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE project_manager_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can create variations for their projects" 
ON variations 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT id FROM projects 
    WHERE project_manager_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can update variations for their projects" 
ON variations 
FOR UPDATE 
USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE project_manager_id = auth.uid()
  )
);
