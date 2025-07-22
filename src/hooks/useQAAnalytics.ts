
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

// Ultra-safe validation functions - Circuit breaker pattern
const validateNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    console.log('QA Analytics: Invalid number input (null/undefined/empty):', value);
    return 0;
  }
  
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    console.log('QA Analytics: Invalid number conversion:', value, '-> NaN/Infinity');
    return 0;
  }
  
  return Math.max(0, num);
};

const safeCalculation = (operation: () => number): number => {
  try {
    const result = operation();
    if (!Number.isFinite(result) || Number.isNaN(result)) {
      console.error('QA Analytics: Calculation produced invalid result:', result);
      return 0;
    }
    return result;
  } catch (error) {
    console.error('QA Analytics: Calculation error:', error);
    return 0;
  }
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
      console.log('QA Analytics: Starting safe fetch for project:', projectId);
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Return empty data immediately if no project ID
      if (!projectId) {
        console.log('QA Analytics: No project ID provided, returning empty data');
        setData(prev => ({
          ...prev,
          ...createEmptyAnalytics(),
          loading: false
        } as QAAnalyticsData));
        return;
      }

      // Calculate date range with validation
      const endDate = new Date();
      const startDate = new Date();
      
      try {
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
      } catch (dateError) {
        console.error('QA Analytics: Date calculation error:', dateError);
        startDate.setDate(endDate.getDate() - 30); // Default to 30 days
      }

      // Supabase query with comprehensive error handling
      const { data: inspections, error: inspectionsError } = await supabase
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
        .eq('project_id', projectId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (inspectionsError) {
        console.error('QA Analytics: Supabase query error:', inspectionsError);
        throw new Error(`Database query failed: ${inspectionsError.message}`);
      }

      // Validate and process data with circuit breaker
      const processedData = processQAAnalyticsSafely(inspections || []);
      
      setData(prev => ({
        ...prev,
        ...processedData,
        loading: false
      }));

      console.log('QA Analytics: Successfully processed data safely');

    } catch (error) {
      console.error('QA Analytics: Critical error in fetch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Circuit breaker: Return safe empty state on any error
      setData(prev => ({
        ...prev,
        ...createEmptyAnalytics(),
        loading: false,
        error: errorMessage
      } as QAAnalyticsData));
      
      toast({
        title: "Analytics Loading Issue",
        description: "Using default values. Please try refreshing.",
        variant: "destructive"
      });
    }
  };

  const processQAAnalyticsSafely = (inspections: any[]): Partial<QAAnalyticsData> => {
    console.log('QA Analytics: Processing', inspections?.length || 0, 'inspections with circuit breaker');
    
    // Circuit breaker: Return empty data if invalid input
    if (!Array.isArray(inspections) || inspections.length === 0) {
      console.log('QA Analytics: No valid inspections, returning empty data');
      return createEmptyAnalytics();
    }

    try {
      // Validate all inspections have required fields
      const validInspections = inspections.filter(inspection => {
        if (!inspection || typeof inspection !== 'object') {
          console.log('QA Analytics: Invalid inspection object:', inspection);
          return false;
        }
        
        if (!inspection.id || !inspection.overall_status) {
          console.log('QA Analytics: Missing required fields:', inspection);
          return false;
        }
        
        return true;
      });

      if (validInspections.length === 0) {
        console.log('QA Analytics: No valid inspections after filtering');
        return createEmptyAnalytics();
      }

      // Safe completion rate calculation
      const completedCount = validInspections.filter(i => 
        i.overall_status === 'passed' || i.overall_status === 'failed'
      ).length;
      
      const overall = safeCalculation(() => {
        if (validInspections.length === 0) return 0;
        return Math.round((completedCount / validInspections.length) * 100);
      });

      // Safe template processing
      const templateStats: Record<string, { completed: number; total: number }> = {};
      const tradeStats: Record<string, { completed: number; total: number }> = {};
      
      validInspections.forEach(inspection => {
        const template = String(inspection.template_type || 'unknown').slice(0, 50);
        const trade = String(inspection.trade || 'unknown').slice(0, 50);
        const isCompleted = inspection.overall_status === 'passed' || inspection.overall_status === 'failed';
        
        // Template stats
        if (!templateStats[template]) templateStats[template] = { completed: 0, total: 0 };
        templateStats[template].total++;
        if (isCompleted) templateStats[template].completed++;
        
        // Trade stats
        if (!tradeStats[trade]) tradeStats[trade] = { completed: 0, total: 0 };
        tradeStats[trade].total++;
        if (isCompleted) tradeStats[trade].completed++;
      });

      // Convert to safe percentages
      const byTemplate: Record<string, number> = {};
      const byTrade: Record<string, number> = {};
      
      Object.entries(templateStats).forEach(([template, stats]) => {
        byTemplate[template] = safeCalculation(() => {
          if (stats.total === 0) return 0;
          return Math.round((stats.completed / stats.total) * 100);
        });
      });

      Object.entries(tradeStats).forEach(([trade, stats]) => {
        byTrade[trade] = safeCalculation(() => {
          if (stats.total === 0) return 0;
          return Math.round((stats.completed / stats.total) * 100);
        });
      });

      // Safe error pattern processing
      const errorMap = new Map<string, { count: number; category: string }>();
      const templateErrors: Record<string, number> = {};
      
      validInspections.forEach(inspection => {
        const checklistItems = inspection.qa_checklist_items || [];
        if (Array.isArray(checklistItems)) {
          checklistItems.forEach((item: any) => {
            if (item && item.status === 'fail' && item.comments) {
              const error = String(item.comments).slice(0, 100);
              const category = String(inspection.template_type || 'general').slice(0, 50);
              
              const current = errorMap.get(error) || { count: 0, category };
              errorMap.set(error, { ...current, count: current.count + 1 });
              
              templateErrors[category] = validateNumber(templateErrors[category]) + 1;
            }
          });
        }
      });

      const mostCommonErrors = Array.from(errorMap.entries())
        .map(([error, data]) => ({ 
          error: error.slice(0, 50), 
          count: validateNumber(data.count), 
          category: data.category 
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Safe performance metrics
      const passedCount = validInspections.filter(i => i.overall_status === 'passed').length;
      const failedCount = validInspections.filter(i => i.overall_status === 'failed').length;
      
      const passFailRatio = safeCalculation(() => {
        if (failedCount === 0) return passedCount > 0 ? 10 : 1;
        return passedCount / failedCount;
      });

      const inspectionsPerDay = safeCalculation(() => {
        if (validInspections.length === 0) return 0;
        const daysDiff = Math.max(1, Math.ceil(
          (Date.now() - new Date(validInspections[validInspections.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
        ));
        return validInspections.length / daysDiff;
      });

      // Safe monthly trends
      const monthlyMap = new Map<string, { passed: number; failed: number; incomplete: number }>();
      
      validInspections.forEach(inspection => {
        try {
          const date = new Date(inspection.created_at);
          const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const stats = monthlyMap.get(month) || { passed: 0, failed: 0, incomplete: 0 };
          
          if (inspection.overall_status === 'passed') stats.passed++;
          else if (inspection.overall_status === 'failed') stats.failed++;
          else stats.incomplete++;
          
          monthlyMap.set(month, stats);
        } catch (dateError) {
          console.log('QA Analytics: Date processing error for inspection:', inspection.id, dateError);
        }
      });

      const monthlyTrends = Array.from(monthlyMap.entries())
        .map(([month, stats]) => ({ 
          month, 
          passed: validateNumber(stats.passed),
          failed: validateNumber(stats.failed),
          incomplete: validateNumber(stats.incomplete)
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-12);

      // Safe inspector performance
      const inspectorMap = new Map<string, { total: number; passed: number }>();
      
      validInspections.forEach(inspection => {
        const inspector = String(inspection.inspector_name || 'Unknown').slice(0, 50);
        const stats = inspectorMap.get(inspector) || { total: 0, passed: 0 };
        
        stats.total++;
        if (inspection.overall_status === 'passed') stats.passed++;
        
        inspectorMap.set(inspector, stats);
      });

      const inspectorPerformance = Array.from(inspectorMap.entries())
        .map(([inspector, stats]) => ({
          inspector,
          passRate: safeCalculation(() => {
            if (stats.total === 0) return 0;
            return Math.round((stats.passed / stats.total) * 100);
          }),
          avgTime: 2 // Safe default
        }))
        .filter(perf => perf.inspector !== 'Unknown')
        .sort((a, b) => b.passRate - a.passRate)
        .slice(0, 10);

      // Safe predictive insights
      const riskScore = safeCalculation(() => {
        let score = 0;
        if (completedCount > 0) {
          score += Math.round((failedCount / completedCount) * 100);
        }
        if (mostCommonErrors.length > 5) score += 20;
        if (passFailRatio < 2) score += 30;
        return Math.min(100, Math.max(0, score));
      });

      const qualityPrediction: 'improving' | 'declining' | 'stable' = 'stable'; // Safe default

      const recommendedActions: string[] = [];
      if (riskScore > 70) recommendedActions.push('Immediate quality review required');
      if (passFailRatio < 2) recommendedActions.push('Focus on inspector training');
      if (mostCommonErrors.length > 5) recommendedActions.push('Address recurring error patterns');
      if (overall < 80) recommendedActions.push('Improve completion processes');

      console.log('QA Analytics: Successfully processed all data with circuit breaker');

      return {
        inspections: validInspections,
        completionRates: { overall, byTemplate, byTrade, byTimeframe: {} },
        errorPatterns: { mostCommonErrors, errorTrends: [], templateErrors },
        performanceMetrics: { 
          averageCompletionTime: 2,
          inspectionsPerDay: validateNumber(inspectionsPerDay), 
          passFailRatio: validateNumber(passFailRatio), 
          reinspectionRate: 0
        },
        qualityTrends: { monthlyTrends, inspectorPerformance },
        predictiveInsights: { riskScore: validateNumber(riskScore), qualityPrediction, recommendedActions }
      };

    } catch (error) {
      console.error('QA Analytics: Processing error with circuit breaker:', error);
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
        console.log('QA Analytics: Database change detected, safe refetch...');
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
    totalInspections: validateNumber(data.inspections?.length || 0),
    completionRate: validateNumber(data.completionRates?.overall || 0),
    qualityScore: validateNumber(100 - (data.predictiveInsights?.riskScore || 0)),
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
