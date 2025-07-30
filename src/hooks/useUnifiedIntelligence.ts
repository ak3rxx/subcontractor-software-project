import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedProjectData {
  id: string;
  name: string;
  status: string;
  total_budget?: number;
  project_manager_id: string;
  organization_id: string;
  created_at: string;
  milestones: any[];
  variations: any[];
  tasks: any[];
  qaInspections: any[];
  rfis: any[];
}

interface ProjectHealthMetrics {
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  completionProbability: number;
  budgetVariance: number;
  scheduleVariance: number;
  qualityScore: number;
}

interface PredictiveInsights {
  delayRisk: {
    probability: number;
    factors: string[];
    impact: 'low' | 'medium' | 'high';
  };
  costOverrun: {
    probability: number;
    estimatedAmount: number;
    drivers: string[];
  };
  qualityRisk: {
    probability: number;
    areas: string[];
    impact: string;
  };
  recommendations: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    module: string;
    reasoning: string;
  }[];
}

interface CrossModuleConnections {
  variationToMilestone: { variationId: string; milestoneId: string; impact: string; }[];
  taskToMilestone: { taskId: string; milestoneId: string; dependency: string; }[];
  qaToMilestone: { qaId: string; milestoneId: string; gateType: string; }[];
  rfiToVariation: { rfiId: string; variationId: string; relationship: string; }[];
}

export const useUnifiedIntelligence = (projectId?: string) => {
  const [data, setData] = useState<UnifiedProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnifiedData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all project data in parallel
      const [
        projectResult,
        milestonesResult,
        variationsResult,
        tasksResult,
        qaResult,
        rfisResult
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('programme_milestones').select('*').eq('project_id', projectId),
        supabase.from('variations').select('*').eq('project_id', projectId),
        supabase.from('tasks').select('*').eq('project_id', projectId),
        supabase.from('qa_inspections').select('*').eq('project_id', projectId),
        supabase.from('rfis').select('*').eq('project_id', projectId)
      ]);

      // Check for errors
      const errors = [projectResult, milestonesResult, variationsResult, tasksResult, qaResult, rfisResult]
        .map(result => result.error)
        .filter(Boolean);

      if (errors.length > 0) {
        console.error('Errors fetching unified data:', errors);
        throw new Error('Failed to fetch project data');
      }

      const unifiedData: UnifiedProjectData = {
        ...projectResult.data,
        milestones: milestonesResult.data || [],
        variations: variationsResult.data || [],
        tasks: tasksResult.data || [],
        qaInspections: qaResult.data || [],
        rfis: rfisResult.data || []
      };

      setData(unifiedData);
    } catch (err) {
      console.error('Error fetching unified data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project data';
      setError(errorMessage);
      toast({
        title: 'Data Loading Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Calculate project health metrics
  const healthMetrics = useMemo((): ProjectHealthMetrics => {
    if (!data) {
      return {
        healthScore: 0,
        riskLevel: 'low',
        completionProbability: 0,
        budgetVariance: 0,
        scheduleVariance: 0,
        qualityScore: 0
      };
    }

    const { milestones, variations, tasks, qaInspections } = data;

    // Task completion rate
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100;

    // QA pass rate
    const passedQA = qaInspections.filter(qa => qa.overall_status === 'passed').length;
    const qaPassRate = qaInspections.length > 0 ? (passedQA / qaInspections.length) * 100 : 100;

    // Milestone progress
    const completedMilestones = milestones.filter(m => m.status === 'complete').length;
    const milestoneProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 100;

    // Budget variance
    const totalBudget = data.total_budget || 0;
    const variationCost = variations.reduce((sum, v) => sum + (v.cost_impact || 0), 0);
    const budgetVariance = totalBudget > 0 ? (variationCost / totalBudget) * 100 : 0;

    // Schedule variance (based on overdue tasks and delayed milestones)
    const overdueTasks = tasks.filter(t => 
      t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()
    ).length;
    const delayedMilestones = milestones.filter(m => 
      m.planned_date && m.status !== 'complete' && new Date(m.planned_date) < new Date()
    ).length;
    const scheduleVariance = ((overdueTasks + delayedMilestones) / Math.max(tasks.length + milestones.length, 1)) * 100;

    // Overall health score
    const healthScore = Math.round(
      (taskCompletionRate * 0.3) + 
      (qaPassRate * 0.25) + 
      (milestoneProgress * 0.25) + 
      (Math.max(0, 100 - budgetVariance) * 0.1) + 
      (Math.max(0, 100 - scheduleVariance) * 0.1)
    );

    // Risk level calculation
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const riskFactors = [
      budgetVariance > 15,
      scheduleVariance > 20,
      qaPassRate < 80,
      taskCompletionRate < 70
    ].filter(Boolean).length;

    if (riskFactors >= 3) riskLevel = 'critical';
    else if (riskFactors >= 2) riskLevel = 'high';
    else if (riskFactors >= 1) riskLevel = 'medium';

    return {
      healthScore,
      riskLevel,
      completionProbability: Math.max(0, Math.min(100, healthScore - (riskFactors * 10))),
      budgetVariance,
      scheduleVariance,
      qualityScore: qaPassRate
    };
  }, [data]);

  // Generate predictive insights
  const predictiveInsights = useMemo((): PredictiveInsights => {
    if (!data) {
      return {
        delayRisk: { probability: 0, factors: [], impact: 'low' },
        costOverrun: { probability: 0, estimatedAmount: 0, drivers: [] },
        qualityRisk: { probability: 0, areas: [], impact: 'low' },
        recommendations: []
      };
    }

    const { milestones, variations, tasks, qaInspections } = data;

    // Delay risk analysis
    const delayFactors = [];
    const overdueTasks = tasks.filter(t => 
      t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()
    ).length;
    const delayedMilestones = milestones.filter(m => 
      m.planned_date && m.status !== 'complete' && new Date(m.planned_date) < new Date()
    ).length;
    const pendingVariations = variations.filter(v => v.status === 'pending_approval').length;

    if (overdueTasks > 0) delayFactors.push(`${overdueTasks} overdue tasks`);
    if (delayedMilestones > 0) delayFactors.push(`${delayedMilestones} delayed milestones`);
    if (pendingVariations > 0) delayFactors.push(`${pendingVariations} pending variations`);

    const delayProbability = Math.min(100, (overdueTasks + delayedMilestones + pendingVariations) * 15);

    // Cost overrun analysis
    const unapprovedVariations = variations.filter(v => v.status !== 'approved');
    const estimatedCostOverrun = unapprovedVariations.reduce((sum, v) => sum + (v.cost_impact || 0), 0);
    const costDrivers = [];
    
    if (unapprovedVariations.length > 0) costDrivers.push(`${unapprovedVariations.length} pending variations`);
    if (delayedMilestones > 0) costDrivers.push('Schedule delays increasing costs');
    if (qaInspections.filter(qa => qa.overall_status === 'failed').length > 0) {
      costDrivers.push('Quality failures requiring rework');
    }

    const costOverrunProbability = Math.min(100, (unapprovedVariations.length * 20) + (delayedMilestones * 10));

    // Quality risk analysis
    const failedQA = qaInspections.filter(qa => qa.overall_status === 'failed').length;
    const qaAreas = qaInspections.reduce((acc, qa) => {
      if (qa.overall_status === 'failed' && qa.trade) {
        acc.add(qa.trade);
      }
      return acc;
    }, new Set<string>());

    const qualityRiskProbability = qaInspections.length > 0 ? (failedQA / qaInspections.length) * 100 : 0;

    // Generate recommendations
    const recommendations = [];

    if (delayProbability > 50) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Review project schedule and allocate additional resources',
        module: 'programme',
        reasoning: 'High delay risk detected with multiple overdue items'
      });
    }

    if (costOverrunProbability > 40) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Fast-track variation approvals to avoid schedule impact',
        module: 'variations',
        reasoning: 'Pending variations may cause schedule and cost overruns'
      });
    }

    if (qualityRiskProbability > 30) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'Implement additional quality checks for identified trades',
        module: 'qa',
        reasoning: 'Quality failures detected in specific trade areas'
      });
    }

    if (healthMetrics.healthScore < 70) {
      recommendations.push({
        priority: 'critical' as const,
        action: 'Conduct comprehensive project review and intervention',
        module: 'dashboard',
        reasoning: 'Project health score indicates immediate attention required'
      });
    }

    return {
      delayRisk: {
        probability: delayProbability,
        factors: delayFactors,
        impact: delayProbability > 50 ? 'high' : delayProbability > 25 ? 'medium' : 'low'
      },
      costOverrun: {
        probability: costOverrunProbability,
        estimatedAmount: estimatedCostOverrun,
        drivers: costDrivers
      },
      qualityRisk: {
        probability: qualityRiskProbability,
        areas: Array.from(qaAreas),
        impact: qualityRiskProbability > 30 ? 'High rework risk' : 'Manageable quality issues'
      },
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }, [data, healthMetrics]);

  // Identify cross-module connections
  const crossModuleConnections = useMemo((): CrossModuleConnections => {
    if (!data) {
      return {
        variationToMilestone: [],
        taskToMilestone: [],
        qaToMilestone: [],
        rfiToVariation: []
      };
    }

    const { milestones, variations, tasks, qaInspections, rfis } = data;

    // Variation to milestone connections
    const variationToMilestone = variations.flatMap(variation => 
      (variation.linked_programme_milestones || []).map((milestoneId: string) => ({
        variationId: variation.id,
        milestoneId,
        impact: variation.time_impact ? `${variation.time_impact} days delay` : 'Schedule impact TBD'
      }))
    );

    // Task to milestone connections
    const taskToMilestone = tasks.filter(task => task.linked_module === 'programme' && task.linked_id)
      .map(task => ({
        taskId: task.id,
        milestoneId: task.linked_id,
        dependency: task.status === 'completed' ? 'Completed' : 'In Progress'
      }));

    // QA to milestone connections (based on trade and category matching)
    const qaToMilestone = qaInspections.flatMap(qa => 
      milestones
        .filter(milestone => milestone.trade === qa.trade)
        .map(milestone => ({
          qaId: qa.id,
          milestoneId: milestone.id,
          gateType: qa.overall_status === 'passed' ? 'Quality Gate Passed' : 'Quality Gate Pending'
        }))
    );

    // RFI to variation connections
    const rfiToVariation = rfis.filter(rfi => rfi.linked_variation_id)
      .map(rfi => ({
        rfiId: rfi.id,
        variationId: rfi.linked_variation_id,
        relationship: 'Clarification Request'
      }));

    return {
      variationToMilestone,
      taskToMilestone,
      qaToMilestone,
      rfiToVariation
    };
  }, [data]);

  // Auto-sync cross-module updates
  const syncCrossModuleUpdates = useCallback(async (moduleType: string, itemId: string, updateData: any) => {
    if (!data) return;

    try {
      // When a task is completed, update linked milestone progress
      if (moduleType === 'task' && updateData.status === 'completed') {
        const linkedMilestone = crossModuleConnections.taskToMilestone.find(conn => conn.taskId === itemId);
        if (linkedMilestone) {
          const milestone = data.milestones.find(m => m.id === linkedMilestone.milestoneId);
          if (milestone) {
            const linkedTasks = crossModuleConnections.taskToMilestone.filter(conn => conn.milestoneId === milestone.id);
            const completedLinkedTasks = linkedTasks.filter(conn => {
              const task = data.tasks.find(t => t.id === conn.taskId);
              return task?.status === 'completed';
            });
            
            const newProgress = Math.round((completedLinkedTasks.length / linkedTasks.length) * 100);
            
            await supabase
              .from('programme_milestones')
              .update({ completion_percentage: newProgress })
              .eq('id', milestone.id);
          }
        }
      }

      // When a QA inspection passes, update milestone status
      if (moduleType === 'qa' && updateData.overall_status === 'passed') {
        const linkedMilestone = crossModuleConnections.qaToMilestone.find(conn => conn.qaId === itemId);
        if (linkedMilestone) {
          const milestone = data.milestones.find(m => m.id === linkedMilestone.milestoneId);
          if (milestone && milestone.status !== 'complete') {
            await supabase
              .from('programme_milestones')
              .update({ 
                status: 'in-progress',
                completion_percentage: Math.max(milestone.completion_percentage || 0, 75)
              })
              .eq('id', milestone.id);
          }
        }
      }

      // When a variation is approved, update linked milestones
      if (moduleType === 'variation' && updateData.status === 'approved') {
        const linkedMilestones = crossModuleConnections.variationToMilestone.filter(conn => conn.variationId === itemId);
        for (const connection of linkedMilestones) {
          const variation = data.variations.find(v => v.id === itemId);
          if (variation?.time_impact) {
            const milestone = data.milestones.find(m => m.id === connection.milestoneId);
            if (milestone?.planned_date) {
              const newDate = new Date(milestone.planned_date);
              newDate.setDate(newDate.getDate() + variation.time_impact);
              
              await supabase
                .from('programme_milestones')
                .update({ 
                  planned_date: newDate.toISOString().split('T')[0],
                  delay_risk_flag: variation.time_impact > 0
                })
                .eq('id', milestone.id);
            }
          }
        }
      }

      // Refresh data after cross-module updates
      await fetchUnifiedData();
    } catch (error) {
      console.error('Error syncing cross-module updates:', error);
    }
  }, [data, crossModuleConnections, fetchUnifiedData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!projectId) return;

    const channels = [
      supabase
        .channel('unified-milestones')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'programme_milestones',
          filter: `project_id=eq.${projectId}`
        }, () => {
          fetchUnifiedData();
        })
        .subscribe(),
      
      supabase
        .channel('unified-variations')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'variations',
          filter: `project_id=eq.${projectId}`
        }, () => {
          fetchUnifiedData();
        })
        .subscribe(),

      supabase
        .channel('unified-tasks')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        }, () => {
          fetchUnifiedData();
        })
        .subscribe(),

      supabase
        .channel('unified-qa')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'qa_inspections',
          filter: `project_id=eq.${projectId}`
        }, () => {
          fetchUnifiedData();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [projectId, fetchUnifiedData]);

  useEffect(() => {
    fetchUnifiedData();
  }, [fetchUnifiedData]);

  return {
    data,
    loading,
    error,
    healthMetrics,
    predictiveInsights,
    crossModuleConnections,
    syncCrossModuleUpdates,
    refetch: fetchUnifiedData
  };
};