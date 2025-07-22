import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QAAnalyticsData {
  inspections: any[];
  completionRates: {
    overall: number;
    byTemplate: Record<string, number>;
    byTrade: Record<string, number>;
    byTimeframe: Record<string, number>;
  };
  errorPatterns: {
    mostCommonErrors: Array<{ error: string; count: number; category: string }>;
    errorTrends: Array<{ date: string; count: number }>;
    templateErrors: Record<string, number>;
  };
  performanceMetrics: {
    averageCompletionTime: number;
    inspectionsPerDay: number;
    passFailRatio: number;
    reinspectionRate: number;
  };
  qualityTrends: {
    monthlyTrends: Array<{ month: string; passed: number; failed: number; incomplete: number }>;
    inspectorPerformance: Array<{ inspector: string; passRate: number; avgTime: number }>;
  };
  predictiveInsights: {
    riskScore: number;
    qualityPrediction: 'improving' | 'declining' | 'stable';
    recommendedActions: string[];
  };
  loading: boolean;
  error: string | null;
}

interface UseQAAnalyticsOptions {
  projectId?: string;
  timeframe?: '7d' | '30d' | '90d' | '1y';
  refreshInterval?: number;
}

// Utility functions for safe math operations
const safeDiv = (numerator: number, denominator: number, fallback: number = 0): number => {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') return fallback;
  if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

const safePercent = (numerator: number, denominator: number): number => {
  return Math.round(safeDiv(numerator, denominator, 0) * 100);
};

const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
};

export const useQAAnalytics = (options: UseQAAnalyticsOptions = {}) => {
  const { projectId, timeframe = '30d', refreshInterval = 300000 } = options;
  const { toast } = useToast();
  
  const [data, setData] = useState<QAAnalyticsData>({
    inspections: [],
    completionRates: {
      overall: 0,
      byTemplate: {},
      byTrade: {},
      byTimeframe: {}
    },
    errorPatterns: {
      mostCommonErrors: [],
      errorTrends: [],
      templateErrors: {}
    },
    performanceMetrics: {
      averageCompletionTime: 0,
      inspectionsPerDay: 0,
      passFailRatio: 0,
      reinspectionRate: 0
    },
    qualityTrends: {
      monthlyTrends: [],
      inspectorPerformance: []
    },
    predictiveInsights: {
      riskScore: 0,
      qualityPrediction: 'stable',
      recommendedActions: []
    },
    loading: true,
    error: null
  });

  const fetchQAAnalytics = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Build query
      let query = supabase
        .from('qa_inspections')
        .select(`
          *,
          qa_checklist_items (
            id,
            status,
            comments,
            description,
            evidence_files
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: inspections, error: inspectionsError } = await query;

      if (inspectionsError) throw inspectionsError;

      // Process analytics data
      const processedData = processQAAnalytics(inspections || []);
      
      setData(prev => ({
        ...prev,
        ...processedData,
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching QA analytics:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch QA analytics'
      }));
      
      toast({
        title: "Analytics Error",
        description: "Failed to load QA analytics data",
        variant: "destructive"
      });
    }
  };

  const processQAAnalytics = (inspections: any[]): Partial<QAAnalyticsData> => {
    console.log('Processing QA analytics with inspections:', inspections.length);
    
    if (!inspections.length) {
      return {
        inspections: [],
        completionRates: { overall: 0, byTemplate: {}, byTrade: {}, byTimeframe: {} },
        errorPatterns: { mostCommonErrors: [], errorTrends: [], templateErrors: {} },
        performanceMetrics: { averageCompletionTime: 0, inspectionsPerDay: 0, passFailRatio: 1, reinspectionRate: 0 },
        qualityTrends: { monthlyTrends: [], inspectorPerformance: [] },
        predictiveInsights: { riskScore: 0, qualityPrediction: 'stable', recommendedActions: [] }
      };
    }

    // Calculate completion rates with safe math
    const completedInspections = inspections.filter(i => i.overall_status === 'passed' || i.overall_status === 'failed');
    const overall = safePercent(completedInspections.length, inspections.length);

    const byTemplate: Record<string, number> = {};
    const byTrade: Record<string, number> = {};
    
    // Count totals first
    const templateCounts: Record<string, { completed: number; total: number }> = {};
    const tradeCounts: Record<string, { completed: number; total: number }> = {};
    
    inspections.forEach(inspection => {
      const template = inspection.template_type || 'unknown';
      const trade = inspection.trade || 'unknown';
      const isCompleted = inspection.overall_status === 'passed' || inspection.overall_status === 'failed';
      
      // Template counts
      if (!templateCounts[template]) templateCounts[template] = { completed: 0, total: 0 };
      templateCounts[template].total++;
      if (isCompleted) templateCounts[template].completed++;
      
      // Trade counts
      if (!tradeCounts[trade]) tradeCounts[trade] = { completed: 0, total: 0 };
      tradeCounts[trade].total++;
      if (isCompleted) tradeCounts[trade].completed++;
    });

    // Calculate percentages safely
    Object.entries(templateCounts).forEach(([template, counts]) => {
      byTemplate[template] = safePercent(counts.completed, counts.total);
    });

    Object.entries(tradeCounts).forEach(([trade, counts]) => {
      byTrade[trade] = safePercent(counts.completed, counts.total);
    });

    // Calculate error patterns
    const errorMap = new Map<string, { count: number; category: string }>();
    const templateErrors: Record<string, number> = {};
    
    inspections.forEach(inspection => {
      if (inspection.qa_checklist_items) {
        inspection.qa_checklist_items.forEach((item: any) => {
          if (item.status === 'fail' && item.comments) {
            const error = item.comments.toLowerCase();
            const category = inspection.template_type || 'general';
            
            if (errorMap.has(error)) {
              errorMap.get(error)!.count++;
            } else {
              errorMap.set(error, { count: 1, category });
            }
            
            templateErrors[category] = (templateErrors[category] || 0) + 1;
          }
        });
      }
    });

    const mostCommonErrors = Array.from(errorMap.entries())
      .map(([error, data]) => ({ error, count: data.count, category: data.category }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate performance metrics with safe math
    const passedCount = inspections.filter(i => i.overall_status === 'passed').length;
    const failedCount = inspections.filter(i => i.overall_status === 'failed').length;
    const passFailRatio = safeDiv(passedCount, Math.max(1, failedCount), passedCount || 1);
    
    const daysDiff = Math.max(1, Math.ceil((new Date().getTime() - new Date(inspections[inspections.length - 1]?.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24)));
    const inspectionsPerDay = safeDiv(inspections.length, daysDiff, 0);

    // Calculate quality trends
    const monthlyMap = new Map<string, { passed: number; failed: number; incomplete: number }>();
    
    inspections.forEach(inspection => {
      const month = new Date(inspection.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { passed: 0, failed: 0, incomplete: 0 });
      }
      
      const stats = monthlyMap.get(month)!;
      if (inspection.overall_status === 'passed') stats.passed++;
      else if (inspection.overall_status === 'failed') stats.failed++;
      else stats.incomplete++;
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Inspector performance with safe calculations
    const inspectorMap = new Map<string, { total: number; passed: number; times: number[] }>();
    
    inspections.forEach(inspection => {
      const inspector = inspection.inspector_name || 'Unknown';
      
      if (!inspectorMap.has(inspector)) {
        inspectorMap.set(inspector, { total: 0, passed: 0, times: [] });
      }
      
      const stats = inspectorMap.get(inspector)!;
      stats.total++;
      if (inspection.overall_status === 'passed') stats.passed++;
      
      // Estimate completion time (simplified)
      const estimatedTime = 2; // hours (placeholder)
      stats.times.push(estimatedTime);
    });

    const inspectorPerformance = Array.from(inspectorMap.entries())
      .map(([inspector, stats]) => ({
        inspector,
        passRate: safePercent(stats.passed, stats.total),
        avgTime: safeDiv(stats.times.reduce((sum, time) => sum + time, 0), stats.times.length, 2)
      }))
      .filter(perf => isValidNumber(perf.passRate) && isValidNumber(perf.avgTime))
      .sort((a, b) => b.passRate - a.passRate);

    // Predictive insights with safe calculations
    const recentTrend = monthlyTrends.slice(-3);
    let trendDirection = 0;
    
    if (recentTrend.length >= 2) {
      const recent = recentTrend[recentTrend.length - 1];
      const earlier = recentTrend[0];
      const recentRate = safeDiv(recent.passed, recent.passed + recent.failed, 0);
      const earlierRate = safeDiv(earlier.passed, earlier.passed + earlier.failed, 0);
      trendDirection = recentRate - earlierRate;
    }

    const qualityPrediction: 'improving' | 'declining' | 'stable' = 
      trendDirection > 0.05 ? 'improving' : trendDirection < -0.05 ? 'declining' : 'stable';

    const riskScore = Math.max(0, Math.min(100, 
      safePercent(failedCount, Math.max(1, completedInspections.length)) +
      (mostCommonErrors.length > 5 ? 20 : 0) +
      (passFailRatio < 2 ? 30 : 0)
    ));

    const recommendedActions: string[] = [];
    if (riskScore > 70) recommendedActions.push('Immediate quality review required');
    if (passFailRatio < 2) recommendedActions.push('Focus on inspector training');
    if (mostCommonErrors.length > 5) recommendedActions.push('Address recurring error patterns');
    if (overall < 80) recommendedActions.push('Improve completion processes');

    console.log('Processed analytics data:', {
      overall,
      inspectorPerformance: inspectorPerformance.length,
      monthlyTrends: monthlyTrends.length,
      passFailRatio
    });

    return {
      inspections,
      completionRates: { overall, byTemplate, byTrade, byTimeframe: {} },
      errorPatterns: { mostCommonErrors, errorTrends: [], templateErrors },
      performanceMetrics: { 
        averageCompletionTime: 2,
        inspectionsPerDay: Math.round(inspectionsPerDay * 100) / 100, 
        passFailRatio: Math.round(passFailRatio * 100) / 100, 
        reinspectionRate: 0
      },
      qualityTrends: { monthlyTrends, inspectorPerformance },
      predictiveInsights: { riskScore, qualityPrediction, recommendedActions }
    };
  };

  useEffect(() => {
    fetchQAAnalytics();

    const channel = supabase
      .channel('qa-analytics-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'qa_inspections'
      }, () => {
        fetchQAAnalytics();
      })
      .subscribe();

    const interval = setInterval(fetchQAAnalytics, refreshInterval);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [projectId, timeframe, refreshInterval]);

  const summary = useMemo(() => ({
    totalInspections: data.inspections.length,
    completionRate: Math.round(data.completionRates.overall),
    qualityScore: Math.round(100 - data.predictiveInsights.riskScore),
    trendDirection: data.predictiveInsights.qualityPrediction
  }), [data]);

  return {
    ...data,
    summary,
    refetch: fetchQAAnalytics,
    setTimeframe: (newTimeframe: '7d' | '30d' | '90d' | '1y') => {
      fetchQAAnalytics();
    }
  };
};
