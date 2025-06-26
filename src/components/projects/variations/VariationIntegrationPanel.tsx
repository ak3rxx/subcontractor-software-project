
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVariationIntegration } from '@/hooks/useVariationIntegration';
import { useProgrammeMilestones } from '@/hooks/useProgrammeMilestones';
import { Link2, Calculator, Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface VariationIntegrationPanelProps {
  variation: any;
  projectId: string;
}

const VariationIntegrationPanel: React.FC<VariationIntegrationPanelProps> = ({
  variation,
  projectId
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [timeImpactDays, setTimeImpactDays] = useState(0);
  const [showLinkMilestone, setShowLinkMilestone] = useState(false);
  
  const { 
    milestoneLinks, 
    budgetImpacts, 
    projectImpact,
    linkVariationToMilestone,
    createBudgetImpact 
  } = useVariationIntegration(projectId);
  
  const { milestones } = useProgrammeMilestones(projectId);

  const handleLinkMilestone = async () => {
    if (!selectedMilestone) return;
    
    const success = await linkVariationToMilestone(
      variation.id, 
      selectedMilestone, 
      timeImpactDays
    );
    
    if (success) {
      setShowLinkMilestone(false);
      setSelectedMilestone('');
      setTimeImpactDays(0);
    }
  };

  const linkedMilestones = milestoneLinks.filter(link => link.variation_id === variation.id);
  const variationBudgetImpacts = budgetImpacts.filter(impact => impact.variation_id === variation.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Integration Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {linkedMilestones.length}
              </div>
              <div className="text-sm text-gray-600">Linked Milestones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {variationBudgetImpacts.length}
              </div>
              <div className="text-sm text-gray-600">Budget Impacts</div>
            </div>
            <div className="text-center">
              <Badge variant={
                linkedMilestones.length > 0 || variationBudgetImpacts.length > 0 
                  ? "default" 
                  : "secondary"
              }>
                {linkedMilestones.length > 0 || variationBudgetImpacts.length > 0 
                  ? "Integrated" 
                  : "Pending Integration"}
              </Badge>
            </div>
          </div>

          {/* Linked Milestones */}
          {linkedMilestones.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Linked Milestones</h4>
              <div className="space-y-2">
                {linkedMilestones.map((link) => {
                  const milestone = milestones.find(m => m.id === link.milestone_id);
                  return (
                    <div key={link.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{milestone?.milestone_name || 'Unknown Milestone'}</div>
                        <div className="text-sm text-gray-600">
                          Impact: {link.time_impact_days} days
                        </div>
                      </div>
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Impacts */}
          {variationBudgetImpacts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Budget Impacts</h4>
              <div className="space-y-2">
                {variationBudgetImpacts.map((impact) => (
                  <div key={impact.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">Budget Item Impact</div>
                      <div className="text-sm text-gray-600">
                        {impact.impact_type === 'increase' ? '+' : '-'}${impact.impact_amount.toLocaleString()}
                      </div>
                    </div>
                    <DollarSign className={`h-4 w-4 ${impact.impact_type === 'increase' ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link Milestone Section */}
          <div className="border-t pt-4">
            {!showLinkMilestone ? (
              <Button 
                onClick={() => setShowLinkMilestone(true)}
                variant="outline"
                className="w-full"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Link to Milestone
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="milestone">Select Milestone</Label>
                  <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      {milestones
                        .filter(m => !linkedMilestones.some(link => link.milestone_id === m.id))
                        .map((milestone) => (
                          <SelectItem key={milestone.id} value={milestone.id}>
                            {milestone.milestone_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeImpact">Time Impact (Days)</Label>
                  <Input
                    id="timeImpact"
                    type="number"
                    value={timeImpactDays}
                    onChange={(e) => setTimeImpactDays(Number(e.target.value))}
                    placeholder="Enter time impact in days"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleLinkMilestone} disabled={!selectedMilestone}>
                    Link Milestone
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLinkMilestone(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Impact Summary */}
      {projectImpact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Project Impact Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  ${projectImpact.total_approved_cost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Approved Cost</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  ${projectImpact.total_pending_cost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Pending Cost</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {projectImpact.total_time_impact} days
                </div>
                <div className="text-sm text-gray-600">Time Extension</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VariationIntegrationPanel;
