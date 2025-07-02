-- Fix critical issues in QA/ITP module

-- 1. Add missing RLS policies for qa_change_history table
CREATE POLICY "Users can view change history for their inspections" 
ON qa_change_history 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert change history for their inspections" 
ON qa_change_history 
FOR INSERT 
WITH CHECK (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE created_by = auth.uid()
  )
);

-- 2. Update QA inspections to use proper organization context
-- Add RLS policy for organization-based access
CREATE POLICY "Users can view QA inspections in their organization" 
ON qa_inspections 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create QA inspections for their organization" 
ON qa_inspections 
FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update QA inspections in their organization" 
ON qa_inspections 
FOR UPDATE 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- 3. Add organization-based policies for checklist items
CREATE POLICY "Users can view checklist items in their organization" 
ON qa_checklist_items 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

CREATE POLICY "Users can manage checklist items in their organization" 
ON qa_checklist_items 
FOR INSERT 
WITH CHECK (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

CREATE POLICY "Users can update checklist items in their organization" 
ON qa_checklist_items 
FOR UPDATE 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- 4. Update change history table to use organization context too
CREATE POLICY "Users can view change history in their organization" 
ON qa_change_history 
FOR SELECT 
USING (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

CREATE POLICY "Users can create change history in their organization" 
ON qa_change_history 
FOR INSERT 
WITH CHECK (
  inspection_id IN (
    SELECT id FROM qa_inspections 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);