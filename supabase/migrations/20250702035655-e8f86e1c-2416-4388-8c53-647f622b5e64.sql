-- Fix critical infinite recursion issue in QA/ITP module

-- 1. Drop all conflicting policies that are causing infinite recursion
DROP POLICY IF EXISTS "Users can view QA inspections in their organization" ON qa_inspections;
DROP POLICY IF EXISTS "Users can create QA inspections for their organization" ON qa_inspections;
DROP POLICY IF EXISTS "Users can update QA inspections in their organization" ON qa_inspections;

DROP POLICY IF EXISTS "Users can view checklist items in their organization" ON qa_checklist_items;
DROP POLICY IF EXISTS "Users can manage checklist items in their organization" ON qa_checklist_items;
DROP POLICY IF EXISTS "Users can update checklist items in their organization" ON qa_checklist_items;

DROP POLICY IF EXISTS "Users can view change history in their organization" ON qa_change_history;
DROP POLICY IF EXISTS "Users can create change history in their organization" ON qa_change_history;

-- 2. Create security definer function to safely get user organization IDs
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

-- 3. Create clean, non-conflicting QA policies using the security definer function

-- QA Inspections policies
CREATE POLICY "Organization members can view QA inspections" 
ON qa_inspections 
FOR SELECT 
USING (
  organization_id = ANY(public.get_user_organization_ids())
);

CREATE POLICY "Organization members can create QA inspections" 
ON qa_inspections 
FOR INSERT 
WITH CHECK (
  organization_id = ANY(public.get_user_organization_ids())
);

CREATE POLICY "Organization members can update QA inspections" 
ON qa_inspections 
FOR UPDATE 
USING (
  organization_id = ANY(public.get_user_organization_ids())
);

-- Checklist items policies
CREATE POLICY "Organization members can view checklist items" 
ON qa_checklist_items 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids())
  )
);

CREATE POLICY "Organization members can manage checklist items" 
ON qa_checklist_items 
FOR ALL 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids())
  )
);

-- Change history policies
CREATE POLICY "Organization members can view change history" 
ON qa_change_history 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids())
  )
);

CREATE POLICY "Organization members can create change history" 
ON qa_change_history 
FOR INSERT 
WITH CHECK (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id = ANY(public.get_user_organization_ids())
  )
);