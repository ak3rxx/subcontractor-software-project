import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ParsedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  parsing_status: string;
  parsed_data: any;
  ai_confidence: number;
  error_message?: string;
  created_at: string;
}

interface AISuggestion {
  id: string;
  suggestion_type: string;
  suggestion_data: any;
  confidence: number;
  applied: boolean;
  created_at: string;
}

export const useProgrammeAI = (projectId: string) => {
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch parsed documents
  const fetchParsedDocuments = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('programme_document_parsing')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParsedDocuments(data || []);
    } catch (error) {
      console.error('Error fetching parsed documents:', error);
      toast({
        title: "Error",
        description: "Failed to load parsed documents",
        variant: "destructive"
      });
    }
  };

  // Fetch AI suggestions
  const fetchSuggestions = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('programme_ai_suggestions')
        .select('*')
        .eq('project_id', projectId)
        .eq('applied', false)
        .order('confidence', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
  };

  // Apply an AI suggestion
  const applySuggestion = async (suggestion: AISuggestion) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('programme_ai_suggestions')
        .update({ 
          applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', suggestion.id);

      if (error) throw error;

      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
      toast({
        title: "Suggestion Applied",
        description: "AI suggestion has been successfully applied."
      });

      return true;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to apply AI suggestion",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle document parsing completion
  const handleDocumentParsed = (documentId: string, parsedData: any) => {
    console.log('Document parsed:', documentId, parsedData);
    
    // Update the document in our state
    setParsedDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, parsed_data: parsedData, parsing_status: 'completed' }
          : doc
      )
    );

    // Refresh suggestions as new ones might have been generated
    fetchSuggestions();
  };

  // Get aggregated data from all parsed documents with enhanced analysis
  const getAggregatedData = () => {
    const completedDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'completed' && doc.parsed_data
    );

    const failedDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'failed'
    );

    const processingDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'processing'
    );

    const allTrades = new Set<string>();
    const allZones = new Set<string>();
    const allMilestones: any[] = [];
    let totalConfidence = 0;
    let processingQuality = 'unknown';

    completedDocs.forEach(doc => {
      totalConfidence += doc.ai_confidence || 0;
      
      if (doc.parsed_data) {
        // Enhanced data extraction with validation
        const docTrades = doc.parsed_data.trades || [];
        const docZones = doc.parsed_data.zones || [];
        const docMilestones = doc.parsed_data.milestones || [];

        docTrades.forEach((trade: string) => {
          if (trade && trade.trim()) {
            allTrades.add(trade.toLowerCase().trim());
          }
        });

        docZones.forEach((zone: string) => {
          if (zone && zone.trim()) {
            allZones.add(zone.trim());
          }
        });

        docMilestones.forEach((milestone: any) => {
          if (milestone && milestone.name) {
            allMilestones.push({
              ...milestone,
              source_document: doc.file_name,
              extraction_confidence: doc.ai_confidence || 0,
              has_dates: !!(milestone.startDate || milestone.endDate),
              has_trade: !!milestone.trade,
              has_zone: !!milestone.zone
            });
          }
        });
      }
    });

    // Calculate processing quality
    const avgConfidence = completedDocs.length > 0 ? totalConfidence / completedDocs.length : 0;
    if (avgConfidence >= 0.7) {
      processingQuality = 'excellent';
    } else if (avgConfidence >= 0.5) {
      processingQuality = 'good';
    } else if (avgConfidence >= 0.3) {
      processingQuality = 'fair';
    } else if (avgConfidence > 0) {
      processingQuality = 'poor';
    }

    // Enhanced analytics
    const milestonesWithDates = allMilestones.filter(m => m.has_dates).length;
    const milestonesWithTrades = allMilestones.filter(m => m.has_trade).length;
    const milestonesWithZones = allMilestones.filter(m => m.has_zone).length;

    return {
      // Core data
      trades: Array.from(allTrades),
      zones: Array.from(allZones),
      milestones: allMilestones,
      
      // Quality metrics
      averageConfidence: avgConfidence,
      processingQuality,
      
      // Document statistics
      documentCount: completedDocs.length,
      totalDocuments: parsedDocuments.length,
      failedDocuments: failedDocs.length,
      processingDocuments: processingDocs.length,
      
      // Data quality analytics
      dataQuality: {
        milestonesTotal: allMilestones.length,
        milestonesWithDates,
        milestonesWithTrades,
        milestonesWithZones,
        completenessScore: allMilestones.length > 0 ? 
          (milestonesWithDates + milestonesWithTrades + milestonesWithZones) / (allMilestones.length * 3) : 0
      },
      
      // Processing diagnostics
      processingDiagnostics: {
        successRate: parsedDocuments.length > 0 ? completedDocs.length / parsedDocuments.length : 0,
        failureReasons: failedDocs.map(doc => ({
          document: doc.file_name,
          error: doc.error_message,
          fileSize: doc.file_size
        })),
        lowConfidenceDocs: completedDocs.filter(doc => (doc.ai_confidence || 0) < 0.3).map(doc => ({
          document: doc.file_name,
          confidence: doc.ai_confidence,
          extractedData: {
            milestones: doc.parsed_data?.milestones?.length || 0,
            trades: doc.parsed_data?.trades?.length || 0,
            zones: doc.parsed_data?.zones?.length || 0
          }
        }))
      }
    };
  };

  // Get suggestions by type
  const getSuggestionsByType = (type: string) => {
    return suggestions.filter(s => s.suggestion_type === type);
  };

  // Initialize data fetching
  useEffect(() => {
    if (projectId) {
      fetchParsedDocuments();
      fetchSuggestions();
    }
  }, [projectId]);

  return {
    parsedDocuments,
    suggestions,
    loading,
    applySuggestion,
    handleDocumentParsed,
    getAggregatedData,
    getSuggestionsByType,
    refreshDocuments: fetchParsedDocuments,
    refreshSuggestions: fetchSuggestions
  };
};