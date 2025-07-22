
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

// Enhanced utility functions for safe math operations
const safeDiv = (numerator: number, denominator: number, fallback: number = 0): number => {
  try {
    if (typeof numerator !== 'number' || typeof denominator !== 'number') return fallback;
    if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator) || isNaN(numerator) || isNaN(denominator)) {
      return fallback;
    }
    const result = numerator / denominator;
    return (isFinite(result) && !isNaN(result)) ? result : fallback;
  } catch (error) {
    console.warn('Safe division error:', { numerator, denominator, error });
    return fallback;
  }
};

const safePercent = (numerator: number, denominator: number): number => {
  const result = safeDiv(numerator, denominator, 0) * 100;
  return Math.round(Math.max(0, Math.min(100, result))); // Clamp between 0-100
};

const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && isFinite(value) && !isNaN(value) && value >= 0;
};

const sanitizeNumber = (value: any, fallback: number = 0): number => {
  if (isValidNumber(value)) return value;
  return fallback;
};

// Safe array operations
const safeArrayLength = (arr: any[]): number => {
  return Array.isArray(arr) ? arr.length : 0;
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
      passFailRatio: 1,
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

      // Build query with error handling
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

      if (inspectionsError) {
        console.error('Supabase query error:', inspectionsError);
        throw inspectionsError;
      }

      // Validate and process analytics data
      const validInspections = Array.isArray(inspections) ? inspections : [];
      console.log('Processing QA analytics with inspections:', validInspections.length);
      
      const processedData = processQAAnalytics(validInspections);
      
      setData(prev => ({
        ...prev,
        ...processedData,
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching QA analytics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch QA analytics';
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      toast({
        title: "Analytics Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const processQAAnalytics = (inspections: any[]): Partial<QAAnalyticsData> => {
    console.log('Processing QA analytics with inspections:', safeArrayLength(inspections));
    
    // Validate input
    const validInspections = Array.isArray(inspections) ? inspections.filter(i => i && typeof i === 'object') : [];
    
    if (validInspections.length === 0) {
      return {
        inspections: [],
        completionRates: { overall: 0, byTemplate: {}, byTrade: {}, byTimeframe: {} },
        errorPatterns: { mostCommonErrors: [], errorTrends: [], templateErrors: {} },
        performanceMetrics: { averageCompletionTime: 0, inspectionsPerDay: 0, passFailRatio: 1, reinspectionRate: 0 },
        qualityTrends: { monthlyTrends: [], inspectorPerformance: [] },
        predictiveInsights: { riskScore: 0, qualityPrediction: 'stable', recommendedActions: [] }
      };
    }

    try {
      // Calculate completion rates with enhanced safety
      const completedInspections = validInspections.filter(i => 
        i.overall_status === 'passed' || i.overall_status === 'failed'
      );
      
      const overall = safePercent(safeArrayLength(completedInspections), safeArrayLength(validInspections));

      const byTemplate: Record<string, number> = {};
      const byTrade: Record<string, number> = {};
      
      // Count totals first with validation
      const templateCounts: Record<string, { completed: number; total: number }> = {};
      const tradeCounts: Record<string, { completed: number; total: number }> = {};
      
      validInspections.forEach(inspection => {
        try {
          const template = String(inspection.template_type || 'unknown');
          const trade = String(inspection.trade || 'unknown');
          const isCompleted = inspection.overall_status === 'passed' || inspection.overall_status === 'failed';
          
          // Template counts with safety
          if (!templateCounts[template]) templateCounts[template] = { completed: 0, total: 0 };
          templateCounts[template].total = sanitizeNumber(templateCounts[template].total + 1);
          if (isCompleted) templateCounts[template].completed = sanitizeNumber(templateCounts[template].completed + 1);
          
          // Trade counts with safety
          if (!tradeCounts[trade]) tradeCounts[trade] = { completed: 0, total: 0 };
          tradeCounts[trade].total = sanitizeNumber(tradeCounts[trade].total + 1);
          if (isCompleted) tradeCounts[trade].completed = sanitizeNumber(tradeCounts[trade].completed + 1);
        } catch (err) {
          console.warn('Error processing inspection:', inspection.id, err);
        }
      });

      // Calculate percentages safely
      Object.entries(templateCounts).forEach(([template, counts]) => {
        byTemplate[template] = safePercent(counts.completed, counts.total);
      });

      Object.entries(tradeCounts).forEach(([trade, counts]) => {
        byTrade[trade] = safePercent(counts.completed, counts.total);
      });

      // Calculate error patterns with safety
      const errorMap = new Map<string, { count: number; category: string }>();
      const templateErrors: Record<string, number> = {};
      
      validInspections.forEach(inspection => {
        try {
          if (Array.isArray(inspection.qa_checklist_items)) {
            inspection.qa_checklist_items.forEach((item: any) => {
              if (item && item.status === 'fail' && item.comments) {
                const error = String(item.comments).toLowerCase().substring(0, 100); // Limit length
                const category = String(inspection.template_type || 'general');
                
                if (errorMap.has(error)) {
                  const existing = errorMap.get(error)!;
                  errorMap.set(error, { ...existing, count: sanitizeNumber(existing.count + 1) });
                } else {
                  errorMap.set(error, { count: 1, category });
                }
                
                templateErrors[category] = sanitizeNumber((templateErrors[category] || 0) + 1);
              }
            });
          }
        } catch (err) {
          console.warn('Error processing checklist items:', inspection.id, err);
        }
      });

      const mostCommonErrors = Array.from(errorMap.entries())
        .map(([error, data]) => ({ 
          error: error.substring(0, 50), // Limit display length
          count: sanitizeNumber(data.count), 
          category: data.category 
        }))
        .filter(item => isValidNumber(item.count))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate performance metrics with enhanced safety
      const passedCount = sanitizeNumber(validInspections.filter(i => i.overall_status === 'passed').length);
      const failedCount = sanitizeNumber(validInspections.filter(i => i.overall_status === 'failed').length);
      const passFailRatio = failedCount > 0 ? safeDiv(passedCount, failedCount, 1) : (passedCount > 0 ? 10 : 1);
      
      const daysDiff = Math.max(1, Math.ceil((new Date().getTime() - new Date(validInspections[validInspections.length - 1]?.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24)));
      const inspectionsPerDay = safeDiv(validInspections.length, daysDiff, 0);

      // Calculate quality trends with safety
      const monthlyMap = new Map<string, { passed: number; failed: number; incomplete: number }>();
      
      validInspections.forEach(inspection => {
        try {
          const date = new Date(inspection.created_at);
          const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          if (!monthlyMap.has(month)) {
            monthlyMap.set(month, { passed: 0, failed: 0, incomplete: 0 });
          }
          
          const stats = monthlyMap.get(month)!;
          if (inspection.overall_status === 'passed') stats.passed = sanitizeNumber(stats.passed + 1);
          else if (inspection.overall_status === 'failed') stats.failed = sanitizeNumber(stats.failed + 1);
          else stats.incomplete = sanitizeNumber(stats.incomplete + 1);
        } catch (err) {
          console.warn('Error processing monthly trend:', inspection.id, err);
        }
      });

      const monthlyTrends = Array.from(monthlyMap.entries())
        .map(([month, stats]) => ({ 
          month, 
          passed: sanitizeNumber(stats.passed),
          failed: sanitizeNumber(stats.failed),
          incomplete: sanitizeNumber(stats.incomplete)
        }))
        .filter(trend => isValidNumber(trend.passed) && isValidNumber(trend.failed) && isValidNumber(trend.incomplete))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-12); // Limit to last 12 months

      // Inspector performance with enhanced safety
      const inspectorMap = new Map<string, { total: number; passed: number; times: number[] }>();
      
      validInspections.forEach(inspection => {
        try {
          const inspector = String(inspection.inspector_name || 'Unknown').substring(0, 50);
          
          if (!inspectorMap.has(inspector)) {
            inspectorMap.set(inspector, { total: 0, passed: 0, times: [] });
          }
          
          const stats = inspectorMap.get(inspector)!;
          stats.total = sanitizeNumber(stats.total + 1);
          if (inspection.overall_status === 'passed') stats.passed = sanitizeNumber(stats.passed + 1);
          
          // Estimate completion time (simplified)
          const estimatedTime = 2; // hours (placeholder)
          if (isValidNumber(estimatedTime)) {
            stats.times.push(estimatedTime);
          }
        } catch (err) {
          console.warn('Error processing inspector performance:', inspection.id, err);
        }
      });

      const inspectorPerformance = Array.from(inspectorMap.entries())
        .map(([inspector, stats]) => {
          const passRate = safePercent(stats.passed, stats.total);
          const avgTime = stats.times.length > 0 ? 
            safeDiv(stats.times.reduce((sum, time) => sum + time, 0), stats.times.length, 2) : 2;
          
          return {
            inspector,
            passRate: sanitizeNumber(passRate),
            avgTime: sanitizeNumber(avgTime)
          };
        })
        .filter(perf => isValidNumber(perf.passRate) && isValidNumber(perf.avgTime) && perf.inspector !== 'Unknown')
        .sort((a, b) => b.passRate - a.passRate)
        .slice(0, 10); // Limit to top 10

      // Predictive insights with safety
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

      console.log('Processed analytics data successfully:', {
        overall,
        inspectorPerformance: inspectorPerformance.length,
        monthlyTrends: monthlyTrends.length,
        passFailRatio: sanitizeNumber(passFailRatio)
      });

      return {
        inspections: validInspections,
        completionRates: { overall, byTemplate, byTrade, byTimeframe: {} },
        errorPatterns: { mostCommonErrors, errorTrends: [], templateErrors },
        performanceMetrics: { 
          averageCompletionTime: 2,
          inspectionsPerDay: sanitizeNumber(Math.round(inspectionsPerDay * 100) / 100), 
          passFailRatio: sanitizeNumber(Math.round(passFailRatio * 100) / 100), 
          reinspectionRate: 0
        },
        qualityTrends: { monthlyTrends, inspectorPerformance },
        predictiveInsights: { riskScore: sanitizeNumber(riskScore), qualityPrediction, recommendedActions }
      };
    } catch (error) {
      console.error('Error in processQAAnalytics:', error);
      return {
        inspections: validInspections,
        completionRates: { overall: 0, byTemplate: {}, byTrade: {}, byTimeframe: {} },
        errorPatterns: { mostCommonErrors: [], errorTrends: [], templateErrors: {} },
        performanceMetrics: { averageCompletionTime: 0, inspectionsPerDay: 0, passFailRatio: 1, reinspectionRate: 0 },
        qualityTrends: { monthlyTrends: [], inspectorPerformance: [] },
        predictiveInsights: { riskScore: 0, qualityPrediction: 'stable', recommendedActions: [] }
      };
    }
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
        console.log('QA inspections changed, refetching analytics...');
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
    totalInspections: safeArrayLength(data.inspections),
    completionRate: sanitizeNumber(Math.round(data.completionRates.overall)),
    qualityScore: sanitizeNumber(Math.round(100 - data.predictiveInsights.riskScore)),
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
