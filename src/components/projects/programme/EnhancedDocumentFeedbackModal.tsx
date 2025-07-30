import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Brain, CheckCircle, XCircle, HelpCircle, Lightbulb } from 'lucide-react';
import { useEnhancedDocumentLearning } from '@/hooks/useEnhancedDocumentLearning';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedDocumentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  parsedData: any;
  documentName: string;
  extractedText?: string;
}

const EnhancedDocumentFeedbackModal: React.FC<EnhancedDocumentFeedbackModalProps> = ({
  isOpen,
  onClose,
  documentId,
  parsedData,
  documentName,
  extractedText = ''
}) => {
  const [isCorrect, setIsCorrect] = useState(true);
  const [userConfidence, setUserConfidence] = useState([85]);
  const [userNotes, setUserNotes] = useState('');
  const [corrections, setCorrections] = useState<any>({});
  const [startTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'overview' | 'corrections' | 'suggestions'>('overview');

  const { 
    submitEnhancedFeedback, 
    generateSmartSuggestions, 
    isLearning, 
    smartSuggestions,
    uncertainties 
  } = useEnhancedDocumentLearning();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [uncertainItems, setUncertainItems] = useState<string[]>([]);
  const [suggestionResponses, setSuggestionResponses] = useState<any>({
    accepted: [],
    rejected: [],
    modified: []
  });

  // Generate smart suggestions when modal opens
  useEffect(() => {
    if (isOpen && extractedText) {
      generateSmartSuggestions(extractedText, parsedData).then(result => {
        setSuggestions(result.suggestions || []);
        setUncertainItems(result.uncertainties || []);
      });
    }
  }, [isOpen, extractedText, parsedData, generateSmartSuggestions]);

  const handleSubmitFeedback = async () => {
    const timeToReview = Math.round((Date.now() - startTime) / 1000);
    
    await submitEnhancedFeedback({
      documentId,
      isCorrect,
      userAssessedConfidence: userConfidence[0] / 100,
      timeToReview,
      corrections: isCorrect ? undefined : corrections,
      userNotes,
      uncertainties: uncertainItems,
      suggestions: suggestionResponses
    });
    
    onClose();
  };

  const handleSuggestionAction = (suggestionId: string, action: 'accept' | 'reject' | 'modify', modifiedValue?: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    setSuggestionResponses(prev => {
      const newResponses = { ...prev };
      
      // Remove from other arrays first
      newResponses.accepted = newResponses.accepted.filter((item: any) => item !== suggestion.suggested_value);
      newResponses.rejected = newResponses.rejected.filter((item: any) => item !== suggestion.suggested_value);
      newResponses.modified = newResponses.modified.filter((item: any) => item.original !== suggestion.suggested_value);

      // Add to appropriate array
      switch (action) {
        case 'accept':
          newResponses.accepted.push(suggestion.suggested_value);
          break;
        case 'reject':
          newResponses.rejected.push(suggestion.suggested_value);
          break;
        case 'modify':
          if (modifiedValue) {
            newResponses.modified.push({
              original: suggestion.suggested_value,
              modified: modifiedValue
            });
          }
          break;
      }
      
      return newResponses;
    });
  };

  const getSuggestionAction = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return null;

    if (suggestionResponses.accepted.includes(suggestion.suggested_value)) return 'accepted';
    if (suggestionResponses.rejected.includes(suggestion.suggested_value)) return 'rejected';
    if (suggestionResponses.modified.some((item: any) => item.original === suggestion.suggested_value)) return 'modified';
    return null;
  };

  const renderSafeValue = (value: any) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && value.name) return value.name;
    return 'Unknown';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Document Analysis Feedback
          </DialogTitle>
          <DialogDescription>
            Help improve AI accuracy for "{documentName}" by providing feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Assessment */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Overall Parsing Accuracy</CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label htmlFor="accuracy-switch">Is the AI parsing accurate?</Label>
                  <Switch
                    id="accuracy-switch"
                    checked={isCorrect}
                    onCheckedChange={setIsCorrect}
                  />
                  {isCorrect ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accurate
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Needs Improvement
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-sm">
                  AI Confidence: {Math.round((parsedData.confidence || 0) * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Your Assessment (Confidence: {userConfidence[0]}%)</Label>
                  <Slider
                    value={userConfidence}
                    onValueChange={setUserConfidence}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uncertainties Alert */}
          {uncertainItems.length > 0 && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Areas needing clarification:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {uncertainItems.map((item, index) => (
                    <li key={index} className="text-sm">{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Parsed Data Overview</TabsTrigger>
              <TabsTrigger value="corrections" disabled={isCorrect}>
                Corrections {!isCorrect && corrections && Object.keys(corrections).length > 0 && (
                  <Badge variant="secondary" className="ml-2">{Object.keys(corrections).length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                AI Suggestions {suggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{suggestions.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Detected Milestones:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsedData.milestones?.filter((milestone: any) => milestone && milestone.name)?.map((milestone: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {milestone.name}
                      </Badge>
                    )) || <span className="text-muted-foreground">None detected</span>}
                  </div>
                </div>
                <div>
                  <Label>Detected Trades:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsedData.trades?.map((trade: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {renderSafeValue(trade)}
                      </Badge>
                    )) || <span className="text-muted-foreground">None detected</span>}
                  </div>
                </div>
                <div>
                  <Label>Detected Zones:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsedData.zones?.map((zone: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {renderSafeValue(zone)}
                      </Badge>
                    )) || <span className="text-muted-foreground">None detected</span>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="corrections" className="space-y-4">
              {!isCorrect ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please provide corrections to help the AI learn. Your input will improve future parsing accuracy.
                    </AlertDescription>
                  </Alert>
                  
                  {/* Correction forms would go here */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Correction Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Describe what was incorrect and what it should be..."
                        value={corrections.general || ''}
                        onChange={(e) => setCorrections(prev => ({ ...prev, general: e.target.value }))}
                        className="min-h-[100px]"
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No corrections needed - parsing marked as accurate!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {suggestions.length > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      The AI has generated suggestions based on the document content. Please review and indicate which are correct.
                    </AlertDescription>
                  </Alert>
                  
                  {suggestions.map((suggestion) => {
                    const action = getSuggestionAction(suggestion.id);
                    return (
                      <Card key={suggestion.id} className={`${
                        action === 'accepted' ? 'border-green-200 bg-green-50' :
                        action === 'rejected' ? 'border-red-200 bg-red-50' :
                        action === 'modified' ? 'border-blue-200 bg-blue-50' : ''
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {suggestion.suggestion_type.replace(/_/g, ' ').toUpperCase()}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(suggestion.confidence_score * 100)}% confidence
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="font-medium">{suggestion.suggested_value}</p>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={action === 'accepted' ? 'default' : 'outline'}
                                onClick={() => handleSuggestionAction(suggestion.id, 'accept')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Correct
                              </Button>
                              <Button
                                size="sm"
                                variant={action === 'rejected' ? 'destructive' : 'outline'}
                                onClick={() => handleSuggestionAction(suggestion.id, 'reject')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Incorrect
                              </Button>
                              <div className="flex gap-1">
                                <Input
                                  placeholder="Suggest alternative..."
                                  className="h-8 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      handleSuggestionAction(suggestion.id, 'modify', e.currentTarget.value.trim());
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No AI suggestions generated for this document</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="user-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="user-notes"
              placeholder="Any other feedback or observations about the AI parsing..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFeedback} 
              disabled={isLearning}
            >
              {isLearning ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDocumentFeedbackModal;