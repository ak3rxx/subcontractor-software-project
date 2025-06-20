
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export interface Project {
  id: string;
  name: string;
  description?: string;
  project_type?: string;
  status: 'planning' | 'in-progress' | 'paused' | 'complete';
  start_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  site_address?: string;
  project_manager_id?: string;
  client_id?: string;
  total_budget?: number;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

const transformProjectData = (project: ProjectRow): Project => {
  return {
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    project_type: project.project_type || undefined,
    status: (project.status as Project['status']) || 'planning',
    start_date: project.start_date || undefined,
    estimated_completion: project.estimated_completion || undefined,
    actual_completion: project.actual_completion || undefined,
    site_address: project.site_address || undefined,
    project_manager_id: project.project_manager_id || undefined,
    client_id: project.client_id || undefined,
    total_budget: project.total_budget || undefined,
    organization_id: project.organization_id || undefined,
    created_at: project.created_at || '',
    updated_at: project.updated_at || ''
  };
};

export const useProjects = (organizationId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      // If no organization, get all projects for this user
      // If organization is provided, filter by organization
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        // Get projects where user is project manager or where organization_id is null
        query = query.or(`project_manager_id.eq.${user.id},organization_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        // Don't show error toast if it's just RLS blocking access
        if (!error.message.includes('policy')) {
          toast({
            title: "Error",
            description: "Failed to fetch projects",
            variant: "destructive"
          });
        }
        setProjects([]); // Set empty array on error
        return;
      }

      const transformedProjects = (data || []).map(transformProjectData);
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>) => {
    if (!user) return null;

    try {
      const insertData: ProjectInsert = {
        name: projectData.name || '',
        description: projectData.description,
        project_type: projectData.project_type,
        status: projectData.status,
        start_date: projectData.start_date,
        estimated_completion: projectData.estimated_completion,
        actual_completion: projectData.actual_completion,
        site_address: projectData.site_address,
        project_manager_id: user.id,
        client_id: projectData.client_id,
        total_budget: projectData.total_budget,
        organization_id: organizationId || projectData.organization_id
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Project created successfully"
      });

      const newProject = transformProjectData(data);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: ProjectUpdate = {
        name: updates.name,
        description: updates.description,
        project_type: updates.project_type,
        status: updates.status,
        start_date: updates.start_date,
        estimated_completion: updates.estimated_completion,
        actual_completion: updates.actual_completion,
        site_address: updates.site_address,
        client_id: updates.client_id,
        total_budget: updates.total_budget,
        organization_id: updates.organization_id
      };

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        toast({
          title: "Error",
          description: "Failed to update project",
          variant: "destructive"
        });
        return null;
      }

      const updatedProject = transformProjectData(data);
      setProjects(prev => 
        prev.map(project => 
          project.id === id ? updatedProject : project
        )
      );

      return updatedProject;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user, organizationId]);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    refetch: fetchProjects
  };
};
