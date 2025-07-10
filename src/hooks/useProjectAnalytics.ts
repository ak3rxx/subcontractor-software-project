import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectAnalyticsData {
  projects: any[];
  variations: any[];
  tasks: any[];
  qaInspections: any[];
  loading: boolean;
  error: string | null;
}

export const useProjectAnalytics = (projectId?: string) => {
  const [data, setData] = useState<ProjectAnalyticsData>({
    projects: [],
    variations: [],
    tasks: [],
    qaInspections: [],
    loading: true,
    error: null
  });
  const { toast } = useToast();

  const fetchAnalyticsData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch projects
      let projectsQuery = supabase.from('projects').select('*');
      if (projectId) {
        projectsQuery = projectsQuery.eq('id', projectId);
      }
      const { data: projects, error: projectsError } = await projectsQuery;

      if (projectsError) throw projectsError;

      // Fetch variations
      let variationsQuery = supabase.from('variations').select('*');
      if (projectId) {
        variationsQuery = variationsQuery.eq('project_id', projectId);
      }
      const { data: variations, error: variationsError } = await variationsQuery;

      if (variationsError) throw variationsError;

      // Fetch tasks
      let tasksQuery = supabase.from('tasks').select('*');
      if (projectId) {
        tasksQuery = tasksQuery.eq('project_id', projectId);
      }
      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      // Fetch QA inspections
      let qaQuery = supabase.from('qa_inspections').select('*');
      if (projectId) {
        qaQuery = qaQuery.eq('project_id', projectId);
      }
      const { data: qaInspections, error: qaError } = await qaQuery;

      if (qaError) throw qaError;

      setData({
        projects: projects || [],
        variations: variations || [],
        tasks: tasks || [],
        qaInspections: qaInspections || [],
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data';
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast({
        title: 'Analytics Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [projectId]);

  // Set up real-time subscriptions for data updates
  useEffect(() => {
    const channels = [
      supabase
        .channel('analytics-variations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'variations' }, () => {
          fetchAnalyticsData();
        })
        .subscribe(),
      
      supabase
        .channel('analytics-tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          fetchAnalyticsData();
        })
        .subscribe(),

      supabase
        .channel('analytics-qa')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'qa_inspections' }, () => {
          fetchAnalyticsData();
        })
        .subscribe(),

      supabase
        .channel('analytics-projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          fetchAnalyticsData();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [projectId]);

  const summary = useMemo(() => {
    const { projects, variations, tasks, qaInspections } = data;
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in-progress').length,
      totalVariations: variations.length,
      pendingVariations: variations.filter(v => v.status === 'pending_approval').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalQAInspections: qaInspections.length,
      passedQAInspections: qaInspections.filter(qa => qa.overall_status === 'passed').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.total_budget || 0), 0),
      totalVariationCost: variations.reduce((sum, v) => sum + (v.cost_impact || 0), 0)
    };
  }, [data]);

  return {
    ...data,
    summary,
    refetch: fetchAnalyticsData
  };
};