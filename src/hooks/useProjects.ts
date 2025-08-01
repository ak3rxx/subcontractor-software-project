
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  project_number: number;
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
    project_number: project.project_number || 0,
    created_at: project.created_at || '',
    updated_at: project.updated_at || ''
  };
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_manager_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setError(error.message);
        if (!error.message.includes('policy') && !error.message.includes('permission')) {
          toast({
            title: "Error",
            description: "Failed to fetch projects",
            variant: "destructive"
          });
        }
        setProjects([]);
        return;
      }

      const transformedProjects = (data || []).map(transformProjectData);
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: any) => {
    if (!user) return null;

    try {
      // Get the user's primary organization ID
      const { data: orgId, error: orgError } = await supabase
        .rpc('get_user_primary_org', { user_id: user.id });

      if (orgError || !orgId) {
        console.error('Error getting user organization:', orgError);
        toast({
          title: "Error",
          description: "You must belong to an organization to create projects",
          variant: "destructive"
        });
        return null;
      }
      
      // Generate project number
      const { data: projectNumber, error: numberError } = await supabase
        .rpc('generate_project_number', { org_id: orgId });

      if (numberError) {
        console.error('Error generating project number:', numberError);
        toast({
          title: "Error",
          description: "Failed to generate project number",
          variant: "destructive"
        });
        return null;
      }

      const insertData: ProjectInsert = {
        name: projectData.projectName || projectData.name || '',
        description: projectData.description,
        project_type: projectData.projectType,
        status: projectData.projectStatus || projectData.status || 'planning',
        start_date: projectData.startDate,
        estimated_completion: projectData.estimatedCompletion,
        site_address: projectData.siteAddress,
        project_manager_id: user.id,
        organization_id: orgId,
        total_budget: projectData.totalBudget || null,
        project_number: projectNumber
      };

      console.log('Creating project with data:', insertData);

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast({
          title: "Error",
          description: `Failed to create project: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: `Project #${projectNumber} created successfully`
      });

      const newProject = transformProjectData(data);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
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
        total_budget: updates.total_budget
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
    console.log('useProjects useEffect triggered:', { user: !!user, userId: user?.id, loading });
    
    if (user) {
      console.log('Fetching projects for user:', user.id);
      fetchProjects();
    } else {
      console.log('No user, clearing projects');
      setLoading(false);
      setProjects([]);
    }

    // Listen for QA inspection events to refresh project data when needed
    const handleQAEvents = () => {
      if (user) {
        console.log('QA inspection event detected, refreshing projects');
        fetchProjects();
      }
    };

    window.addEventListener('qa-inspection-created', handleQAEvents);
    window.addEventListener('qa-inspection-updated', handleQAEvents);
    window.addEventListener('qa-inspection-deleted', handleQAEvents);

    return () => {
      window.removeEventListener('qa-inspection-created', handleQAEvents);
      window.removeEventListener('qa-inspection-updated', handleQAEvents);
      window.removeEventListener('qa-inspection-deleted', handleQAEvents);
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-fetches

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    refetch: fetchProjects
  };
};
