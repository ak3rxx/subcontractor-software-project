import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Brain, FileText, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDocumentLearning } from '@/hooks/useDocumentLearning';

interface DocumentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  parsedData: any;
  documentName: string;
}

interface MilestoneCorrection {
  original: string;
  corrected: string;
  reason: string;
}

interface TradeCorrection {
  original: string;
  corrected: string;
}

interface ZoneCorrection {
  original: string;
  corrected: string;
}

const DocumentFeedbackModal: React.FC<DocumentFeedbackModalProps> = ({
  isOpen,
  onClose,
  documentId,
  parsedData,
  documentName
}) => {
  const [isCorrect, setIsCorrect] = useState(true);
  const [userNotes, setUserNotes] = useState('');
  const [milestoneCorrections, setMilestoneCorrections] = useState<MilestoneCorrection[]>([]);
  const [tradeCorrections, setTradeCorrections] = useState<TradeCorrection[]>([]);
  const [zoneCorrections, setZoneCorrections] = useState<ZoneCorrection[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'trades' | 'zones'>('overview');

  const { submitDocumentFeedback, isLearning } = useDocumentLearning();

  const handleSubmitFeedback = async () => {
    const feedback = {
      documentId,
      isCorrect,
      corrections: isCorrect ? undefined : {
        milestones: milestoneCorrections.length > 0 ? milestoneCorrections : undefined,
        trades: tradeCorrections.length > 0 ? tradeCorrections : undefined,
        zones: zoneCorrections.length > 0 ? zoneCorrections : undefined
      },
      userNotes
    };

    await submitDocumentFeedback(feedback);
    onClose();
  };

  const addMilestoneCorrection = () => {
    setMilestoneCorrections([...milestoneCorrections, { original: '', corrected: '', reason: '' }]);
  };

  const updateMilestoneCorrection = (index: number, field: keyof MilestoneCorrection, value: string) => {
    const updated = [...milestoneCorrections];
    updated[index] = { ...updated[index], [field]: value };
    setMilestoneCorrections(updated);
  };

  const removeMilestoneCorrection = (index: number) => {
    setMilestoneCorrections(milestoneCorrections.filter((_, i) => i !== index));
  };

  const addTradeCorrection = () => {
    setTradeCorrections([...tradeCorrections, { original: '', corrected: '' }]);
  };

  const updateTradeCorrection = (index: number, field: keyof TradeCorrection, value: string) => {
    const updated = [...tradeCorrections];
    updated[index] = { ...updated[index], [field]: value };
    setTradeCorrections(updated);
  };

  const removeTradeCorrection = (index: number) => {
    setTradeCorrections(tradeCorrections.filter((_, i) => i !== index));
  };

  const addZoneCorrection = () => {
    setZoneCorrections([...zoneCorrections, { original: '', corrected: '' }]);
  };

  const updateZoneCorrection = (index: number, field: keyof ZoneCorrection, value: string) => {
    const updated = [...zoneCorrections];
    updated[index] = { ...updated[index], [field]: value };
    setZoneCorrections(updated);
  };

  const removeZoneCorrection = (index: number) => {
    setZoneCorrections(zoneCorrections.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Document Parsing Feedback
          </DialogTitle>
          <DialogDescription>
            Help improve AI parsing accuracy by providing feedback on "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Accuracy Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Parsing Accuracy</CardTitle>
              <CardDescription>
                Was the AI parsing generally accurate for this document?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isCorrect}
                    onCheckedChange={setIsCorrect}
                    id="accuracy-switch"
                  />
                  <Label htmlFor="accuracy-switch" className="flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        Accurate
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        Needs Improvement
                      </>
                    )}
                  </Label>
                </div>
                <Badge variant={isCorrect ? "default" : "destructive"}>
                  {Math.round((parsedData.confidence || 0) * 100)}% AI Confidence
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Parsed Data Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parsed Data Summary</CardTitle>
              <CardDescription>
                Review what the AI extracted from the document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Milestones</Label>
                  <div className="text-2xl font-bold text-primary">
                    {parsedData.milestones?.length || 0}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trades</Label>
                  <div className="text-2xl font-bold text-primary">
                    {parsedData.trades?.length || 0}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Zones</Label>
                  <div className="text-2xl font-bold text-primary">
                    {parsedData.zones?.length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Corrections (only shown if not correct) */}
          {!isCorrect && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Provide Corrections</CardTitle>
                <CardDescription>
                  Help the AI learn by correcting specific parsing errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tab Navigation */}
                  <div className="flex space-x-2 border-b">
                    {[
                      { id: 'overview', label: 'Overview', icon: FileText },
                      { id: 'milestones', label: 'Milestones', icon: Settings },
                      { id: 'trades', label: 'Trades', icon: Settings },
                      { id: 'zones', label: 'Zones', icon: Settings }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
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
                          {parsedData.trades?.map((trade: any, index: number) => {
                            const tradeName = typeof trade === 'string' ? trade : (trade?.name || 'Unknown Trade');
                            return (
                              <Badge key={index} variant="outline">
                                {tradeName}
                              </Badge>
                            );
                          }) || <span className="text-muted-foreground">None detected</span>}
                        </div>
                      </div>
                      <div>
                        <Label>Detected Zones:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {parsedData.zones?.map((zone: any, index: number) => {
                            const zoneName = typeof zone === 'string' ? zone : (zone?.name || 'Unknown Zone');
                            return (
                              <Badge key={index} variant="outline">
                                {zoneName}
                              </Badge>
                            );
                          }) || <span className="text-muted-foreground">None detected</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'milestones' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Milestone Corrections</Label>
                        <Button onClick={addMilestoneCorrection} size="sm" variant="outline">
                          Add Correction
                        </Button>
                      </div>
                      {milestoneCorrections.map((correction, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Correction #{index + 1}</Label>
                            <Button
                              onClick={() => removeMilestoneCorrection(index)}
                              size="sm"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Original (incorrect)</Label>
                              <Input
                                value={correction.original}
                                onChange={(e) => updateMilestoneCorrection(index, 'original', e.target.value)}
                                placeholder="What the AI extracted"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Corrected</Label>
                              <Input
                                value={correction.corrected}
                                onChange={(e) => updateMilestoneCorrection(index, 'corrected', e.target.value)}
                                placeholder="What it should be"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Reason for correction</Label>
                            <Input
                              value={correction.reason}
                              onChange={(e) => updateMilestoneCorrection(index, 'reason', e.target.value)}
                              placeholder="Why was this incorrect?"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'trades' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Trade Corrections</Label>
                        <Button onClick={addTradeCorrection} size="sm" variant="outline">
                          Add Correction
                        </Button>
                      </div>
                      {tradeCorrections.map((correction, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Trade Correction #{index + 1}</Label>
                            <Button
                              onClick={() => removeTradeCorrection(index)}
                              size="sm"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Original (incorrect)</Label>
                              <Input
                                value={correction.original}
                                onChange={(e) => updateTradeCorrection(index, 'original', e.target.value)}
                                placeholder="What the AI extracted"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Corrected</Label>
                              <Input
                                value={correction.corrected}
                                onChange={(e) => updateTradeCorrection(index, 'corrected', e.target.value)}
                                placeholder="What it should be"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'zones' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Zone Corrections</Label>
                        <Button onClick={addZoneCorrection} size="sm" variant="outline">
                          Add Correction
                        </Button>
                      </div>
                      {zoneCorrections.map((correction, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Zone Correction #{index + 1}</Label>
                            <Button
                              onClick={() => removeZoneCorrection(index)}
                              size="sm"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Original (incorrect)</Label>
                              <Input
                                value={correction.original}
                                onChange={(e) => updateZoneCorrection(index, 'original', e.target.value)}
                                placeholder="What the AI extracted"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Corrected</Label>
                              <Input
                                value={correction.corrected}
                                onChange={(e) => updateZoneCorrection(index, 'corrected', e.target.value)}
                                placeholder="What it should be"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
              <CardDescription>
                Any additional feedback or suggestions for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Optional: Provide any additional feedback about the parsing accuracy or suggestions for improvement..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose} disabled={isLearning}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={isLearning}>
              {isLearning ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentFeedbackModal;