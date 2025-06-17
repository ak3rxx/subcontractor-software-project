
-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for subdomain or URL identification
  license_count INTEGER NOT NULL DEFAULT 5, -- number of user licenses
  active_users_count INTEGER NOT NULL DEFAULT 0, -- current active users
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')) DEFAULT 'trial',
  subscription_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_users junction table (users can belong to multiple orgs)
CREATE TABLE public.organization_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('org_admin', 'project_manager', 'estimator', 'finance_manager', 'site_supervisor', 'client', 'subcontractor', 'user')) NOT NULL DEFAULT 'user',
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id) -- prevent duplicate memberships
);

-- Create organization_invitations table for managing user invites
CREATE TABLE public.organization_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('org_admin', 'project_manager', 'estimator', 'finance_manager', 'site_supervisor', 'client', 'subcontractor', 'user')) NOT NULL DEFAULT 'user',
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  invitation_token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update projects table to belong to organizations
ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Create indexes for better performance
CREATE INDEX idx_organization_users_org_id ON public.organization_users(organization_id);
CREATE INDEX idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX idx_organization_invitations_org_id ON public.organization_invitations(organization_id);
CREATE INDEX idx_organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Org admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND role = 'org_admin' 
      AND status = 'active'
    )
  );

-- RLS Policies for organization_users
CREATE POLICY "Users can view org memberships they have access to" ON public.organization_users
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.organization_users as ou 
      WHERE ou.organization_id = organization_users.organization_id 
      AND ou.user_id = auth.uid() 
      AND ou.role IN ('org_admin', 'project_manager')
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Org admins can manage organization users" ON public.organization_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users as ou 
      WHERE ou.organization_id = organization_users.organization_id 
      AND ou.user_id = auth.uid() 
      AND ou.role = 'org_admin' 
      AND ou.status = 'active'
    )
  );

-- RLS Policies for organization_invitations
CREATE POLICY "Org admins can manage invitations" ON public.organization_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = organization_invitations.organization_id 
      AND user_id = auth.uid() 
      AND role = 'org_admin' 
      AND status = 'active'
    )
  );

-- Update projects RLS to include organization context
DROP POLICY IF EXISTS "Users can view projects they're involved in" ON public.projects;
CREATE POLICY "Users can view projects in their organization" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Function to automatically create organization for new signups (optional)
CREATE OR REPLACE FUNCTION public.create_default_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a default organization for the user
  INSERT INTO public.organizations (name, slug, license_count)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company', NEW.email || '''s Organization'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company', NEW.email), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8),
    5 -- default license count
  )
  RETURNING id INTO new_org_id;
  
  -- Add the user as org admin to their default organization
  INSERT INTO public.organization_users (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'org_admin', 'active');
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to also create organizations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_organization();
