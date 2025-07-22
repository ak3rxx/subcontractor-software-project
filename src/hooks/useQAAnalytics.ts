
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

// Critical: Ultra-safe math operations to prevent ALL NaN/Infinity issues
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  if (!isFinite(num) || isNaN(num)) return 0;
  return Math.max(0, num); // Ensure positive numbers
};

const safeDiv = (numerator: any, denominator: any): number => {
  const num = safeNumber(numerator);
  const den = safeNumber(denominator);
  if (den === 0) return 0;
  const result = num / den;
  return safeNumber(result);
};

const safePercent = (numerator: any, denominator: any): number => {
  const result = safeDiv(numerator, denominator) * 100;
  return Math.min(100, Math.max(0, Math.round(result)));
};

// Safe array operations with validation
const safeArray = (arr: any): any[] => {
  return Array.isArray(arr) ? arr.filter(item => item && typeof item === 'object') : [];
};

const createEmptyAnalytics = (): Partial<QAAnalyticsData> => ({
  inspections: [],
  completionRates: { overall: 0, byTemplate: {}, byTrade: {}, byTimeframe: {} },
  errorPatterns: { mostCommonErrors: [], errorTrends: [], templateErrors: {} },
  performanceMetrics: { averageCompletionTime: 0, inspectionsPerDay: 0, passFailRatio: 1, reinspectionRate: 0 },
  qualityTrends: { monthlyTrends: [], inspectorPerformance: [] },
  predictiveInsights: { riskScore: 0, qualityPrediction: 'stable', recommendedActions: [] }
});

export const useQAAnalytics = (options: UseQAAnalyticsOptions = {}) => {
  const { projectId, timeframe = '30d', refreshInterval = 300000 } = options;
  const { toast } = useToast();
  
  const [data, setData] = useState<QAAnalyticsData>({
    ...createEmptyAnalytics(),
    loading: true,
    error: null
  } as QAAnalyticsData);

  const fetchQAAnalytics = async () => {
    try {
      console.log('QA Analytics: Starting fetch for project:', projectId);
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

      // Build query with comprehensive error handling
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
        console.error('QA Analytics: Supabase query error:', inspectionsError);
        throw new Error(`Failed to fetch inspections: ${inspectionsError.message}`);
      }

      // Critical: Validate and sanitize data immediately
      const validInspections = safeArray(inspections);
      console.log('QA Analytics: Processing', validInspections.length, 'inspections');
      
      // Process with ultra-safe analytics
      const processedData = processQAAnalyticsSafe(validInspections);
      
      setData(prev => ({
        ...prev,
        ...processedData,
        loading: false
      }));

      console.log('QA Analytics: Successfully processed data');

    } catch (error) {
      console.error('QA Analytics: Critical error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Set safe empty state on error
      setData(prev => ({
        ...prev,
        ...createEmptyAnalytics(),
        loading: false,
        error: errorMessage
      } as QAAnalyticsData));
      
      toast({
        title: "Analytics Error",
        description: "Using default values due to data loading issue",
        variant: "destructive"
      });
    }
  };

  const processQAAnalyticsSafe = (inspections: any[]): Partial<QAAnalyticsData> => {
    console.log('QA Analytics: Processing', inspections.length, 'inspections');
    
    // Return empty data if no inspections
    if (inspections.length === 0) {
      console.log('QA Analytics: No inspections found, returning empty data');
      return createEmptyAnalytics();
    }

    try {
      // Filter valid inspections with null checks
      const validInspections = inspections.filter(i => 
        i && 
        typeof i === 'object' && 
        i.id && 
        i.overall_status
      );

      if (validInspections.length === 0) {
        return createEmptyAnalytics();
      }

      // Calculate completion rates with ultra-safe operations
      const completedInspections = validInspections.filter(i => 
        i.overall_status === 'passed' || i.overall_status === 'failed'
      );
      
      const overall = safePercent(completedInspections.length, validInspections.length);

      // Process by template with safe operations
      const templateCounts: Record<string, { completed: number; total: number }> = {};
      const tradeCounts: Record<string, { completed: number; total: number }> = {};
      
      validInspections.forEach(inspection => {
        const template = String(inspection.template_type || 'unknown').slice(0, 50);
        const trade = String(inspection.trade || 'unknown').slice(0, 50);
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

      const byTemplate: Record<string, number> = {};
      const byTrade: Record<string, number> = {};
      
      Object.entries(templateCounts).forEach(([template, counts]) => {
        byTemplate[template] = safePercent(counts.completed, counts.total);
      });

      Object.entries(tradeCounts).forEach(([trade, counts]) => {
        byTrade[trade] = safePercent(counts.completed, counts.total);
      });

      // Process error patterns safely
      const errorMap = new Map();
      const templateErrors: Record<string, number> = {};
      
      validInspections.forEach(inspection => {
        if (safeArray(inspection.qa_checklist_items).length > 0) {
          inspection.qa_checklist_items.forEach((item: any) => {
            if (item && item.status === 'fail' && item.comments) {
              const error = String(item.comments).slice(0, 100);
              const category = String(inspection.template_type || 'general').slice(0, 50);
              
              const current = errorMap.get(error) || { count: 0, category };
              errorMap.set(error, { ...current, count: current.count + 1 });
              
              templateErrors[category] = safeNumber(templateErrors[category]) + 1;
            }
          });
        }
      });

      const mostCommonErrors = Array.from(errorMap.entries())
        .map(([error, data]: [string, any]) => ({ 
          error: error.slice(0, 50), 
          count: safeNumber(data.count), 
          category: data.category 
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate performance metrics safely
      const passedCount = safeNumber(validInspections.filter(i => i.overall_status === 'passed').length);
      const failedCount = safeNumber(validInspections.filter(i => i.overall_status === 'failed').length);
      const passFailRatio = failedCount > 0 ? safeDiv(passedCount, failedCount) : (passedCount > 0 ? 10 : 1);
      
      const daysDiff = Math.max(1, Math.ceil((Date.now() - new Date(validInspections[validInspections.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
      const inspectionsPerDay = safeDiv(validInspections.length, daysDiff);

      // Calculate monthly trends safely
      const monthlyMap = new Map();
      
      validInspections.forEach(inspection => {
        const date = new Date(inspection.created_at);
        const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const stats = monthlyMap.get(month) || { passed: 0, failed: 0, incomplete: 0 };
        
        if (inspection.overall_status === 'passed') stats.passed++;
        else if (inspection.overall_status === 'failed') stats.failed++;
        else stats.incomplete++;
        
        monthlyMap.set(month, stats);
      });

      const monthlyTrends = Array.from(monthlyMap.entries())
        .map(([month, stats]: [string, any]) => ({ 
          month, 
          passed: safeNumber(stats.passed),
          failed: safeNumber(stats.failed),
          incomplete: safeNumber(stats.incomplete)
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-12);

      // Inspector performance safely
      const inspectorMap = new Map();
      
      validInspections.forEach(inspection => {
        const inspector = String(inspection.inspector_name || 'Unknown').slice(0, 50);
        const stats = inspectorMap.get(inspector) || { total: 0, passed: 0 };
        
        stats.total++;
        if (inspection.overall_status === 'passed') stats.passed++;
        
        inspectorMap.set(inspector, stats);
      });

      const inspectorPerformance = Array.from(inspectorMap.entries())
        .map(([inspector, stats]: [string, any]) => ({
          inspector,
          passRate: safePercent(stats.passed, stats.total),
          avgTime: 2 // Default placeholder
        }))
        .filter(perf => perf.inspector !== 'Unknown' && perf.passRate >= 0)
        .sort((a, b) => b.passRate - a.passRate)
        .slice(0, 10);

      // Predictive insights
      const recentTrend = monthlyTrends.slice(-3);
      let trendDirection = 0;
      
      if (recentTrend.length >= 2) {
        const recent = recentTrend[recentTrend.length - 1];
        const earlier = recentTrend[0];
        const recentRate = safeDiv(recent.passed, recent.passed + recent.failed);
        const earlierRate = safeDiv(earlier.passed, earlier.passed + earlier.failed);
        trendDirection = recentRate - earlierRate;
      }

      const qualityPrediction: 'improving' | 'declining' | 'stable' = 
        trendDirection > 0.05 ? 'improving' : trendDirection < -0.05 ? 'declining' : 'stable';

      const riskScore = Math.min(100, Math.max(0,
        safePercent(failedCount, completedInspections.length) +
        (mostCommonErrors.length > 5 ? 20 : 0) +
        (passFailRatio < 2 ? 30 : 0)
      ));

      const recommendedActions: string[] = [];
      if (riskScore > 70) recommendedActions.push('Immediate quality review required');
      if (passFailRatio < 2) recommendedActions.push('Focus on inspector training');
      if (mostCommonErrors.length > 5) recommendedActions.push('Address recurring error patterns');
      if (overall < 80) recommendedActions.push('Improve completion processes');

      console.log('QA Analytics: Successfully processed all data safely');

      return {
        inspections: validInspections,
        completionRates: { overall, byTemplate, byTrade, byTimeframe: {} },
        errorPatterns: { mostCommonErrors, errorTrends: [], templateErrors },
        performanceMetrics: { 
          averageCompletionTime: 2,
          inspectionsPerDay: safeNumber(inspectionsPerDay), 
          passFailRatio: safeNumber(passFailRatio), 
          reinspectionRate: 0
        },
        qualityTrends: { monthlyTrends, inspectorPerformance },
        predictiveInsights: { riskScore: safeNumber(riskScore), qualityPrediction, recommendedActions }
      };
    } catch (error) {
      console.error('QA Analytics: Error in processing:', error);
      return createEmptyAnalytics();
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
        console.log('QA Analytics: Database change detected, refetching...');
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
    totalInspections: safeNumber(data.inspections?.length || 0),
    completionRate: safeNumber(data.completionRates?.overall || 0),
    qualityScore: safeNumber(100 - (data.predictiveInsights?.riskScore || 0)),
    trendDirection: data.predictiveInsights?.qualityPrediction || 'stable'
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
