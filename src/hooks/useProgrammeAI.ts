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

  // Get aggregated data from all parsed documents
  const getAggregatedData = () => {
    const completedDocs = parsedDocuments.filter(doc => 
      doc.parsing_status === 'completed' && doc.parsed_data
    );

    const allTrades = new Set<string>();
    const allZones = new Set<string>();
    const allMilestones: any[] = [];
    let totalConfidence = 0;

    completedDocs.forEach(doc => {
      totalConfidence += doc.ai_confidence || 0;
      
      if (doc.parsed_data) {
        (doc.parsed_data.trades || []).forEach((trade: string) => allTrades.add(trade));
        (doc.parsed_data.zones || []).forEach((zone: string) => allZones.add(zone));
        (doc.parsed_data.milestones || []).forEach((milestone: any) => {
          allMilestones.push({
            ...milestone,
            source_document: doc.file_name
          });
        });
      }
    });

    return {
      trades: Array.from(allTrades),
      zones: Array.from(allZones),
      milestones: allMilestones,
      averageConfidence: completedDocs.length > 0 ? totalConfidence / completedDocs.length : 0,
      documentCount: completedDocs.length,
      totalDocuments: parsedDocuments.length
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