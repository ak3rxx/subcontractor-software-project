import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedParsedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  parsing_status: string;
  parsed_data: any;
  ai_confidence: number;
  created_at: string;
  extracted_text?: string;
}

interface ProcessingAnalytics {
  id: string;
  document_id: string;
  processing_method: string;
  extraction_quality_score: number;
  ai_model_used: string;
  confidence_before_learning: number;
  confidence_after_learning: number;
  learned_patterns_applied: number;
  success_indicators: any;
  failure_indicators: any;
}

interface SmartSuggestion {
  id: string;
  suggestion_type: string;
  suggested_value: string;
  context_data: any;
  confidence_score: number;
  user_action: string;
}

export const useEnhancedProgrammeAI = (projectId: string) => {
  const [parsedDocuments, setParsedDocuments] = useState<EnhancedParsedDocument[]>([]);
  const [processingAnalytics, setProcessingAnalytics] = useState<ProcessingAnalytics[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [learningInsights, setLearningInsights] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch enhanced parsed documents with analytics
  const fetchEnhancedDocuments = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      // Fetch documents
      const { data: documents, error: docsError } = await supabase
        .from('programme_document_parsing')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Fetch processing analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('document_processing_analytics')
        .select('*')
        .in('document_id', documents?.map(d => d.id) || [])
        .order('created_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Fetch smart suggestions
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('document_smart_suggestions')
        .select('*')
        .in('document_id', documents?.map(d => d.id) || [])
        .eq('user_action', 'pending')
        .order('confidence_score', { ascending: false });

      if (suggestionsError) throw suggestionsError;

      setParsedDocuments(documents || []);
      setProcessingAnalytics(analytics || []);
      setSmartSuggestions(suggestions || []);

    } catch (error) {
      console.error('Error fetching enhanced documents:', error);
      toast({
        title: "Error",
        description: "Failed to load document analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Get aggregated data with enhanced analytics
  const getEnhancedAggregatedData = useCallback(() => {
    const completedDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'completed' && doc.parsed_data
    );

    const failedDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'failed'
    );

    const processingDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'processing'
    );

    // Enhanced data extraction with new structure
    const allTrades = new Set<any>();
    const allZones = new Set<any>();
    const allMilestones: any[] = [];
    let totalConfidence = 0;
    let qualityScore = 0;

    completedDocs.forEach(doc => {
      totalConfidence += doc.ai_confidence || 0;
      
      if (doc.parsed_data) {
        // Handle new enhanced structure
        const docTrades = doc.parsed_data.trades || [];
        const docZones = doc.parsed_data.zones || [];
        const docMilestones = doc.parsed_data.milestones || [];

        docTrades.forEach((trade: any) => {
          if (trade) {
            if (typeof trade === 'string') {
              allTrades.add({ name: trade, description: '' });
            } else if (trade.name) {
              allTrades.add(trade);
            }
          }
        });

        docZones.forEach((zone: any) => {
          if (zone) {
            if (typeof zone === 'string') {
              allZones.add({ name: zone, description: '' });
            } else if (zone.name) {
              allZones.add(zone);
            }
          }
        });

        docMilestones.forEach((milestone: any) => {
          if (milestone && milestone.name) {
            allMilestones.push({
              ...milestone,
              source_document: doc.file_name,
              extraction_confidence: doc.ai_confidence || 0
            });
          }
        });
      }
    });

    // Calculate processing quality based on analytics
    const analytics = processingAnalytics.filter(a => 
      completedDocs.some(d => d.id === a.document_id)
    );

    const avgQualityScore = analytics.length > 0 
      ? analytics.reduce((sum, a) => sum + (a.extraction_quality_score || 0), 0) / analytics.length
      : 0;

    const avgConfidence = completedDocs.length > 0 
      ? totalConfidence / completedDocs.length 
      : 0;

    // Enhanced quality assessment
    let processingQuality = 'unknown';
    if (avgConfidence >= 0.8 && avgQualityScore >= 70) {
      processingQuality = 'excellent';
    } else if (avgConfidence >= 0.6 && avgQualityScore >= 50) {
      processingQuality = 'good';
    } else if (avgConfidence >= 0.4 && avgQualityScore >= 30) {
      processingQuality = 'fair';
    } else if (avgConfidence > 0) {
      processingQuality = 'poor';
    }

    return {
      // Enhanced core data
      trades: Array.from(allTrades),
      zones: Array.from(allZones),
      milestones: allMilestones,
      
      // Enhanced quality metrics
      averageConfidence: avgConfidence,
      averageQualityScore: avgQualityScore,
      processingQuality,
      
      // Enhanced analytics
      documentCount: completedDocs.length,
      totalDocuments: parsedDocuments.length,
      failedDocuments: failedDocs.length,
      processingDocuments: processingDocs.length,
      
      // Smart suggestions summary
      pendingSuggestions: smartSuggestions.length,
      highConfidenceSuggestions: smartSuggestions.filter(s => s.confidence_score > 0.7).length,
      
      // Processing method breakdown
      processingMethods: analytics.reduce((acc, a) => {
        acc[a.processing_method] = (acc[a.processing_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Learning indicators
      learningPatternsApplied: analytics.reduce((sum, a) => sum + (a.learned_patterns_applied || 0), 0),
      
      // Success indicators
      successIndicators: analytics.map(a => a.success_indicators).filter(Boolean),
      failureIndicators: analytics.map(a => a.failure_indicators).filter(Boolean)
    };
  }, [parsedDocuments, processingAnalytics, smartSuggestions]);

  // Get learning insights
  const fetchLearningInsights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .eq('status', 'active')
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      setLearningInsights(data || []);
      return data || [];

    } catch (error) {
      console.error('Error fetching learning insights:', error);
      return [];
    }
  }, []);

  // Apply smart suggestion
  const applySmartSuggestion = useCallback(async (suggestionId: string, action: 'accept' | 'reject', feedback?: string) => {
    try {
      const { error } = await supabase
        .from('document_smart_suggestions')
        .update({
          user_action: action,
          user_feedback: feedback,
          resolved_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Update local state
      setSmartSuggestions(prev => 
        prev.map(s => s.id === suggestionId 
          ? { ...s, user_action: action, user_feedback: feedback }
          : s
        )
      );

      toast({
        title: action === 'accept' ? "Suggestion Applied" : "Suggestion Rejected",
        description: "Your feedback helps improve AI accuracy."
      });

    } catch (error) {
      console.error('Error applying smart suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to apply suggestion",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Get document processing recommendations
  const getProcessingRecommendations = useCallback(() => {
    const recommendations = [];
    const analytics = processingAnalytics;

    // Analyze processing method success rates
    const methodStats = analytics.reduce((acc, a) => {
      if (!acc[a.processing_method]) {
        acc[a.processing_method] = { total: 0, goodQuality: 0 };
      }
      acc[a.processing_method].total++;
      if (a.extraction_quality_score > 60) {
        acc[a.processing_method].goodQuality++;
      }
      return acc;
    }, {} as Record<string, { total: number; goodQuality: number }>);

    Object.entries(methodStats).forEach(([method, stats]) => {
      const successRate = stats.goodQuality / stats.total;
      if (successRate < 0.5 && stats.total >= 3) {
        recommendations.push({
          type: 'processing_method',
          priority: 'medium',
          message: `${method} method has low success rate (${Math.round(successRate * 100)}%). Consider document quality improvements.`,
          suggestion: method === 'pdf_vision' 
            ? 'Try scanning documents at higher resolution or improving lighting'
            : 'Ensure documents are properly formatted and structured'
        });
      }
    });

    // Check for confidence improvement opportunities
    const lowConfidenceDocs = parsedDocuments.filter(d => 
      d.ai_confidence < 0.5 && d.parsing_status === 'completed'
    );

    if (lowConfidenceDocs.length > 0) {
      recommendations.push({
        type: 'confidence_improvement',
        priority: 'high',
        message: `${lowConfidenceDocs.length} documents have low confidence scores`,
        suggestion: 'Review these documents and provide feedback to improve AI learning'
      });
    }

    return recommendations;
  }, [parsedDocuments, processingAnalytics]);

  // Initialize
  useEffect(() => {
    if (projectId) {
      fetchEnhancedDocuments();
      fetchLearningInsights();
    }
  }, [projectId, fetchEnhancedDocuments, fetchLearningInsights]);

  return {
    // Enhanced data
    parsedDocuments,
    processingAnalytics,
    smartSuggestions,
    learningInsights,
    loading,
    
    // Enhanced functions
    getEnhancedAggregatedData,
    applySmartSuggestion,
    getProcessingRecommendations,
    refreshData: fetchEnhancedDocuments,
    refreshInsights: fetchLearningInsights
  };
};