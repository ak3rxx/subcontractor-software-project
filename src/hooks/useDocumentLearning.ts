import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentFeedback {
  documentId: string;
  isCorrect: boolean;
  corrections?: {
    milestones?: Array<{
      original: string;
      corrected: string;
      reason: string;
    }>;
    trades?: Array<{
      original: string;
      corrected: string;
    }>;
    zones?: Array<{
      original: string;
      corrected: string;
    }>;
  };
  userNotes?: string;
}

interface LearningPattern {
  id: string;
  original_text: string;
  corrected_text: string;
  correction_type: string;
  pattern_hint?: string;
  document_type?: string;
  success_count: number;
  usage_count: number;
  success_rate: number;
  last_used: string;
  created_at: string;
}

export const useDocumentLearning = () => {
  const [isLearning, setIsLearning] = useState(false);
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const { toast } = useToast();

  // Submit user feedback on document parsing
  const submitDocumentFeedback = useCallback(async (feedback: DocumentFeedback) => {
    setIsLearning(true);
    
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Store feedback in database
      const { error: feedbackError } = await supabase
        .from('document_parsing_feedback')
        .insert({
          document_id: feedback.documentId,
          user_id: user.id,
          is_correct: feedback.isCorrect,
          corrections: feedback.corrections,
          user_notes: feedback.userNotes,
          created_at: new Date().toISOString()
        });

      if (feedbackError) {
        throw feedbackError;
      }

      // If corrections are provided, learn from them
      if (feedback.corrections) {
        await learnFromCorrections(feedback.corrections, feedback.documentId);
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you! Your feedback helps improve document parsing accuracy."
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Feedback Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLearning(false);
    }
  }, [toast]);

  // Learn from user corrections
  const learnFromCorrections = useCallback(async (corrections: any, documentId: string) => {
    try {
      const learningData = [];

      // Process milestone corrections
      if (corrections.milestones) {
        for (const correction of corrections.milestones) {
          learningData.push({
            original_text: correction.original,
            corrected_text: correction.corrected,
            correction_type: 'milestone',
            pattern_hint: correction.reason,
            document_id: documentId
          });
        }
      }

      // Process trade corrections
      if (corrections.trades) {
        for (const correction of corrections.trades) {
          learningData.push({
            original_text: correction.original,
            corrected_text: correction.corrected,
            correction_type: 'trade',
            document_id: documentId
          });
        }
      }

      // Process zone corrections
      if (corrections.zones) {
        for (const correction of corrections.zones) {
          learningData.push({
            original_text: correction.original,
            corrected_text: correction.corrected,
            correction_type: 'zone',
            document_id: documentId
          });
        }
      }

      // Store learning patterns
      if (learningData.length > 0) {
        const { error } = await supabase
          .from('document_learning_patterns')
          .insert(learningData);

        if (error) {
          throw error;
        }
      }

    } catch (error) {
      console.error('Error learning from corrections:', error);
    }
  }, []);

  // Get learning patterns for a specific category
  const getLearningPatterns = useCallback(async (category?: string) => {
    try {
      let query = supabase
        .from('document_learning_patterns')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('correction_type', category);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        throw error;
      }

      setLearningPatterns(data || []);
      return data || [];

    } catch (error) {
      console.error('Error fetching learning patterns:', error);
      return [];
    }
  }, []);

  // Get suggested improvements based on learning patterns
  const getSuggestedImprovements = useCallback(async (documentType: string) => {
    try {
      const { data, error } = await supabase
        .from('document_learning_patterns')
        .select('corrected_text, correction_type, pattern_hint')
        .eq('document_type', documentType)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      const improvements = {
        milestones: data?.filter(d => d.correction_type === 'milestone') || [],
        trades: data?.filter(d => d.correction_type === 'trade') || [],
        zones: data?.filter(d => d.correction_type === 'zone') || []
      };

      return improvements;

    } catch (error) {
      console.error('Error getting suggested improvements:', error);
      return { milestones: [], trades: [], zones: [] };
    }
  }, []);

  // Update pattern success rate
  const updatePatternSuccess = useCallback(async (patternId: string, wasSuccessful: boolean) => {
    try {
      const { data: pattern, error: fetchError } = await supabase
        .from('document_learning_patterns')
        .select('success_count, usage_count')
        .eq('id', patternId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newSuccessCount = wasSuccessful 
        ? (pattern.success_count || 0) + 1 
        : (pattern.success_count || 0);
      const newUsageCount = (pattern.usage_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('document_learning_patterns')
        .update({
          success_count: newSuccessCount,
          usage_count: newUsageCount,
          success_rate: newSuccessCount / newUsageCount,
          last_used: new Date().toISOString()
        })
        .eq('id', patternId);

      if (updateError) {
        throw updateError;
      }

    } catch (error) {
      console.error('Error updating pattern success:', error);
    }
  }, []);

  // Get organization-specific learning insights
  const getOrganizationInsights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('document_parsing_feedback')
        .select(`
          *,
          programme_document_parsing (
            file_type,
            ai_confidence,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Calculate insights
      const totalFeedback = data?.length || 0;
      const correctParsing = data?.filter(f => f.is_correct).length || 0;
      const averageConfidence = data?.reduce((sum, f) => {
        return sum + (f.programme_document_parsing?.ai_confidence || 0);
      }, 0) / totalFeedback || 0;

      const insights = {
        totalDocuments: totalFeedback,
        accuracyRate: totalFeedback > 0 ? correctParsing / totalFeedback : 0,
        averageConfidence,
        commonIssues: data?.filter(f => !f.is_correct)
          .map(f => f.corrections)
          .filter(Boolean) || [],
        improvementTrend: calculateImprovementTrend(data || [])
      };

      return insights;

    } catch (error) {
      console.error('Error getting organization insights:', error);
      return null;
    }
  }, []);

  // Calculate improvement trend over time
  const calculateImprovementTrend = (feedbackData: any[]) => {
    if (feedbackData.length < 5) return 'insufficient_data';

    const recent = feedbackData.slice(0, Math.floor(feedbackData.length / 2));
    const older = feedbackData.slice(Math.floor(feedbackData.length / 2));

    const recentAccuracy = recent.filter(f => f.is_correct).length / recent.length;
    const olderAccuracy = older.filter(f => f.is_correct).length / older.length;

    if (recentAccuracy > olderAccuracy + 0.1) return 'improving';
    if (recentAccuracy < olderAccuracy - 0.1) return 'declining';
    return 'stable';
  };

  return {
    submitDocumentFeedback,
    getLearningPatterns,
    getSuggestedImprovements,
    updatePatternSuccess,
    getOrganizationInsights,
    isLearning,
    learningPatterns
  };
};