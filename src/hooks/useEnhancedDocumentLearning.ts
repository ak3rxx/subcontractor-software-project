import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmartSuggestion {
  id: string;
  suggestion_type: string;
  suggested_value: string;
  context_data: any;
  confidence_score: number;
  user_action: string;
}

interface EnhancedDocumentFeedback {
  documentId: string;
  isCorrect: boolean;
  userAssessedConfidence: number;
  timeToReview: number;
  corrections?: {
    milestones?: Array<{
      original: string;
      corrected: string;
      reason: string;
      context_keywords?: string[];
    }>;
    trades?: Array<{
      original: string;
      corrected: string;
      context_keywords?: string[];
    }>;
    zones?: Array<{
      original: string;
      corrected: string;
      context_keywords?: string[];
    }>;
  };
  userNotes?: string;
  uncertainties?: string[];
  suggestions?: {
    accepted: string[];
    rejected: string[];
    modified: Array<{ original: string; modified: string }>;
  };
}

export const useEnhancedDocumentLearning = () => {
  const [isLearning, setIsLearning] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [uncertainties, setUncertainties] = useState<string[]>([]);
  const { toast } = useToast();

  // Enhanced feedback submission with smart learning
  const submitEnhancedFeedback = useCallback(async (feedback: EnhancedDocumentFeedback) => {
    setIsLearning(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Store enhanced feedback
      const { error: feedbackError } = await supabase
        .from('document_parsing_feedback_enhanced')
        .insert({
          document_id: feedback.documentId,
          user_id: user.id,
          is_correct: feedback.isCorrect,
          original_confidence: 0.95, // Will be updated with actual value
          user_assessed_confidence: feedback.userAssessedConfidence,
          corrections: feedback.corrections,
          user_notes: feedback.userNotes,
          feedback_type: 'manual',
          time_to_review: feedback.timeToReview
        });

      if (feedbackError) throw feedbackError;

      // Process corrections with enhanced learning
      if (feedback.corrections) {
        await processEnhancedCorrections(feedback.corrections, feedback.documentId);
      }

      // Process suggestion responses
      if (feedback.suggestions) {
        await processSuggestionResponses(feedback.suggestions, feedback.documentId);
      }

      toast({
        title: "Enhanced Feedback Submitted",
        description: "Your feedback will help improve AI accuracy. Thank you!"
      });

    } catch (error) {
      console.error('Error submitting enhanced feedback:', error);
      toast({
        title: "Feedback Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLearning(false);
    }
  }, [toast]);

  // Process corrections with context extraction
  const processEnhancedCorrections = useCallback(async (corrections: any, documentId: string) => {
    try {
      const learningData = [];

      // Process each correction type with enhanced context
      for (const [type, items] of Object.entries(corrections)) {
        if (Array.isArray(items)) {
          for (const correction of items) {
            learningData.push({
              original_text: correction.original,
              corrected_text: correction.corrected,
              correction_type: type,
              pattern_hint: correction.reason || `User correction for ${type}`,
              document_type: 'general',
              context_keywords: correction.context_keywords || [],
              document_id: documentId,
              user_id: (await supabase.auth.getUser()).data.user?.id
            });
          }
        }
      }

      // Store learning patterns
      if (learningData.length > 0) {
        const { error } = await supabase
          .from('document_learning_patterns_enhanced')
          .insert(learningData);

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error processing enhanced corrections:', error);
    }
  }, []);

  // Process suggestion responses
  const processSuggestionResponses = useCallback(async (suggestions: any, documentId: string) => {
    try {
      const responses = [];

      // Process accepted suggestions
      for (const accepted of suggestions.accepted || []) {
        responses.push({
          suggestion_type: 'accepted',
          suggested_value: accepted,
          user_action: 'accepted',
          document_id: documentId,
          confidence_score: 0.9
        });
      }

      // Process rejected suggestions
      for (const rejected of suggestions.rejected || []) {
        responses.push({
          suggestion_type: 'rejected',
          suggested_value: rejected,
          user_action: 'rejected',
          document_id: documentId,
          confidence_score: 0.1
        });
      }

      // Process modified suggestions
      for (const modified of suggestions.modified || []) {
        responses.push({
          suggestion_type: 'modified',
          suggested_value: modified.modified,
          user_action: 'modified',
          document_id: documentId,
          context_data: { original: modified.original },
          confidence_score: 0.7
        });
      }

      if (responses.length > 0) {
        const { error } = await supabase
          .from('document_smart_suggestions')
          .insert(responses);

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error processing suggestion responses:', error);
    }
  }, []);

  // Generate smart suggestions for uncertain content
  const generateSmartSuggestions = useCallback(async (extractedText: string, parsedData: any) => {
    try {
      // Identify uncertainties in the parsed data
      const uncertainItems: string[] = [];
      
      // Check for vague or unclear milestones
      if (parsedData.milestones) {
        parsedData.milestones.forEach((milestone: any) => {
          if (!milestone.trade || !milestone.zone || milestone.name.length < 5) {
            uncertainItems.push(`Unclear milestone: "${milestone.name}"`);
          }
        });
      }

      // Check for missing information
      if (!parsedData.trades || parsedData.trades.length === 0) {
        uncertainItems.push("No trades detected - what type of work is this?");
      }

      if (!parsedData.zones || parsedData.zones.length === 0) {
        uncertainItems.push("No zones/locations detected - which areas are involved?");
      }

      // Generate contextual suggestions
      const suggestions = await generateContextualSuggestions(extractedText, parsedData);

      setUncertainties(uncertainItems);
      setSmartSuggestions(suggestions);

      return { uncertainties: uncertainItems, suggestions };

    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return { uncertainties: [], suggestions: [] };
    }
  }, []);

  // Generate contextual suggestions based on text analysis
  const generateContextualSuggestions = useCallback(async (text: string, parsedData: any): Promise<SmartSuggestion[]> => {
    const suggestions: SmartSuggestion[] = [];

    // Suggest common Australian construction trades if missing
    const commonTrades = ['carpentry', 'electrical', 'plumbing', 'concrete', 'steel', 'tiling', 'painting'];
    const detectedTrades = parsedData.trades?.map((t: any) => typeof t === 'string' ? t : t.name) || [];
    
    for (const trade of commonTrades) {
      if (text.toLowerCase().includes(trade) && !detectedTrades.some((dt: string) => dt.toLowerCase().includes(trade))) {
        suggestions.push({
          id: `trade-${trade}`,
          suggestion_type: 'trade_clarification',
          suggested_value: trade.charAt(0).toUpperCase() + trade.slice(1),
          context_data: { found_in_text: true, keyword: trade },
          confidence_score: 0.8,
          user_action: 'pending'
        });
      }
    }

    // Suggest common zones if missing
    const commonZones = ['ground floor', 'level 1', 'level 2', 'basement', 'external works', 'wet areas'];
    const detectedZones = parsedData.zones?.map((z: any) => typeof z === 'string' ? z : z.name) || [];
    
    for (const zone of commonZones) {
      const zoneRegex = new RegExp(zone.replace(' ', '\\s*'), 'i');
      if (zoneRegex.test(text) && !detectedZones.some((dz: string) => zoneRegex.test(dz))) {
        suggestions.push({
          id: `zone-${zone.replace(' ', '-')}`,
          suggestion_type: 'zone_suggestion',
          suggested_value: zone.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          context_data: { found_in_text: true, keyword: zone },
          confidence_score: 0.7,
          user_action: 'pending'
        });
      }
    }

    // Suggest missing milestones based on common patterns
    const milestonePatterns = [
      { pattern: /start|commencement/i, suggestion: 'Project Start' },
      { pattern: /completion|finish|handover/i, suggestion: 'Practical Completion' },
      { pattern: /inspection|qa|quality/i, suggestion: 'Quality Inspection' },
      { pattern: /delivery|supply/i, suggestion: 'Material Delivery' }
    ];

    const detectedMilestones = parsedData.milestones?.map((m: any) => m.name || '') || [];
    
    for (const { pattern, suggestion } of milestonePatterns) {
      if (pattern.test(text) && !detectedMilestones.some((dm: string) => dm.toLowerCase().includes(suggestion.toLowerCase()))) {
        suggestions.push({
          id: `milestone-${suggestion.replace(' ', '-').toLowerCase()}`,
          suggestion_type: 'missing_milestone',
          suggested_value: suggestion,
          context_data: { pattern_matched: pattern.toString() },
          confidence_score: 0.6,
          user_action: 'pending'
        });
      }
    }

    return suggestions;
  }, []);

  // Get learning insights for the organization
  const getOrganizationLearningInsights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .eq('status', 'active')
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting learning insights:', error);
      return [];
    }
  }, []);

  return {
    submitEnhancedFeedback,
    generateSmartSuggestions,
    getOrganizationLearningInsights,
    isLearning,
    smartSuggestions,
    uncertainties
  };
};