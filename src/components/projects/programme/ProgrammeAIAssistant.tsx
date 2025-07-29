import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, CheckCircle, Clock, AlertTriangle, ChevronRight, Sparkles, Target, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AISuggestion {
  id: string;
  suggestion_type: string;
  suggestion_data: any;
  confidence: number;
  applied: boolean;
  created_at: string;
}

interface ParsedDocument {
  id: string;
  file_name: string;
  parsing_status: string;
  parsed_data: any;
  ai_confidence: number;
}

interface ProgrammeAIAssistantProps {
  projectId: string;
  parsedDocuments: ParsedDocument[];
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onCreateMilestones: (milestones: any[]) => void;
}

const ProgrammeAIAssistant: React.FC<ProgrammeAIAssistantProps> = ({
  projectId,
  parsedDocuments,
  onApplySuggestion,
  onCreateMilestones
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const { toast } = useToast();

  // Fetch AI suggestions from database
  useEffect(() => {
    fetchSuggestions();
  }, [projectId, parsedDocuments]);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('programme_ai_suggestions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const getAggregatedData = () => {
    const allTrades = new Set<string>();
    const allZones = new Set<string>();
    const allMilestones: any[] = [];
    let totalConfidence = 0;
    let documentCount = 0;

    parsedDocuments.forEach(doc => {
      if (doc.parsed_data) {
        documentCount++;
        totalConfidence += doc.ai_confidence || 0;
        
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
      averageConfidence: documentCount > 0 ? totalConfidence / documentCount : 0,
      documentCount
    };
  };

  const getSuggestionsByType = (type: string) => {
    return suggestions.filter(s => s.suggestion_type === type && !s.applied);
  };

  const applySuggestion = async (suggestion: AISuggestion) => {
    setLoading(true);
    
    try {
      // Mark suggestion as applied
      const { error } = await supabase
        .from('programme_ai_suggestions')
        .update({ 
          applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', suggestion.id);

      if (error) throw error;

      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
      );

      // Call parent handler
      onApplySuggestion(suggestion);

      toast({
        title: "Suggestion Applied",
        description: "AI suggestion has been applied to your programme."
      });
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to apply suggestion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMilestonesForTrades = () => {
    if (selectedTrades.length === 0) {
      toast({
        title: "No Trades Selected",
        description: "Please select trades to programme first.",
        variant: "destructive"
      });
      return;
    }

    const aggregatedData = getAggregatedData();
    const filteredMilestones = aggregatedData.milestones.filter(milestone => 
      selectedTrades.includes(milestone.trade) || selectedTrades.includes('all')
    );

    // Add suggested planning stages
    const planningStageMilestones = [
      {
        name: 'Site Establishment',
        description: 'Set up site facilities, safety measures, and access',
        trade: 'site_management',
        priority: 'high',
        suggested: true
      },
      {
        name: 'Procurement Setup',
        description: 'Finalize supplier agreements and order long-lead items',
        trade: 'procurement',
        priority: 'high',
        suggested: true
      },
      {
        name: 'QA/ITP Preparation',
        description: 'Prepare quality assurance and inspection test plans',
        trade: 'qa',
        priority: 'medium',
        suggested: true
      }
    ];

    onCreateMilestones([...planningStageMilestones, ...filteredMilestones]);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const aggregatedData = getAggregatedData();
  const tradeMappingSuggestions = getSuggestionsByType('trade_mapping');
  const sequenceSuggestions = getSuggestionsByType('sequence_suggestion');
  const milestoneSuggestions = getSuggestionsByType('milestone_creation');

  if (parsedDocuments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Programme Assistant
          </CardTitle>
          <CardDescription>
            Upload programme documents to get AI-powered insights and suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Upload your programme documents to get started with AI-powered programme building.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card>
        <Collapsible 
          open={expandedSections.includes('overview')}
          onOpenChange={() => toggleSection('overview')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Programme Insights
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${expandedSections.includes('overview') ? 'rotate-90' : ''}`} />
              </CardTitle>
              <CardDescription>
                AI analysis from {aggregatedData.documentCount} uploaded document{aggregatedData.documentCount !== 1 ? 's' : ''}
                {aggregatedData.averageConfidence > 0 && (
                  <span className="ml-2">
                    • {Math.round(aggregatedData.averageConfidence * 100)}% confidence
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Detected Trades */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4" />
                    Detected Trades ({aggregatedData.trades.length})
                  </h4>
                  <div className="space-y-2">
                    {aggregatedData.trades.map(trade => (
                      <Badge 
                        key={trade} 
                        variant={selectedTrades.includes(trade) ? "default" : "outline"}
                        className="mr-2 cursor-pointer"
                        onClick={() => setSelectedTrades(prev => 
                          prev.includes(trade) 
                            ? prev.filter(t => t !== trade)
                            : [...prev, trade]
                        )}
                      >
                        {trade}
                      </Badge>
                    ))}
                    {aggregatedData.trades.length > 0 && (
                      <Badge 
                        variant={selectedTrades.includes('all') ? "default" : "outline"}
                        className="mt-2 cursor-pointer"
                        onClick={() => setSelectedTrades(prev => 
                          prev.includes('all') ? [] : ['all']
                        )}
                      >
                        Select All
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detected Zones */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4" />
                    Zones/Areas ({aggregatedData.zones.length})
                  </h4>
                  <div className="space-y-1">
                    {aggregatedData.zones.map(zone => (
                      <Badge key={zone} variant="secondary" className="mr-2">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" />
                    Extracted Milestones ({aggregatedData.milestones.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {aggregatedData.milestones.slice(0, 5).map((milestone, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{milestone.name}</span>
                        {milestone.trade && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {milestone.trade}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {aggregatedData.milestones.length > 5 && (
                      <p className="text-xs text-gray-500">
                        +{aggregatedData.milestones.length - 5} more milestones
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={generateMilestonesForTrades}
                  disabled={selectedTrades.length === 0 || loading}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Create Programme for Selected Trades
                </Button>
                
                {sequenceSuggestions.length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => applySuggestion(sequenceSuggestions[0])}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    Apply Trade Sequence
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <Collapsible 
            open={expandedSections.includes('suggestions')}
            onOpenChange={() => toggleSection('suggestions')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    AI Suggestions ({suggestions.filter(s => !s.applied).length})
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${expandedSections.includes('suggestions') ? 'rotate-90' : ''}`} />
                </CardTitle>
                <CardDescription>
                  Smart recommendations based on document analysis
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {suggestions.filter(s => !s.applied).map(suggestion => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium capitalize">
                            {suggestion.suggestion_type.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {suggestion.suggestion_type === 'trade_mapping' && 'AI has mapped detected trades to standard categories'}
                            {suggestion.suggestion_type === 'sequence_suggestion' && 'Recommended construction sequence based on industry best practices'}
                            {suggestion.suggestion_type === 'milestone_creation' && 'Suggested milestones extracted from your documents'}
                            {suggestion.suggestion_type === 'dependency_suggestion' && 'Recommended dependencies between activities'}
                          </p>
                          <Badge 
                            variant="outline" 
                            className="mt-2"
                          >
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          disabled={loading}
                          className="ml-4"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};

export default ProgrammeAIAssistant;