
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Calendar, Flag, AlertTriangle } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';

interface MilestoneFormProps {
  showForm: boolean;
  onCancel: () => void;
  onSubmit: (data: Partial<ProgrammeMilestone>) => Promise<void>;
  editingMilestone?: ProgrammeMilestone | null;
  projectId?: string;
  crossModuleData?: any;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({
  showForm,
  onCancel,
  onSubmit,
  editingMilestone,
  projectId,
  crossModuleData
}) => {
  const [formData, setFormData] = useState({
    milestone_name: '',
    description: '',
    start_date_planned: '',
    end_date_planned: '',
    status: 'upcoming' as const,
    priority: 'medium' as const,
    category: '',
    trade: '',
    reference_number: '',
    completion_percentage: 0,
    critical_path: false,
    delay_risk_flag: false,
    notes: ''
  });

  useEffect(() => {
    if (editingMilestone) {
      setFormData({
        milestone_name: editingMilestone.milestone_name,
        description: editingMilestone.description || '',
        start_date_planned: editingMilestone.start_date_planned || '',
        end_date_planned: editingMilestone.end_date_planned || '',
        status: editingMilestone.status,
        priority: editingMilestone.priority,
        category: editingMilestone.category || '',
        trade: editingMilestone.trade || '',
        reference_number: editingMilestone.reference_number || '',
        completion_percentage: editingMilestone.completion_percentage,
        critical_path: editingMilestone.critical_path,
        delay_risk_flag: editingMilestone.delay_risk_flag,
        notes: editingMilestone.notes || ''
      });
    } else if (crossModuleData) {
      // Auto-populate from cross-module data (e.g., from variations)
      setFormData(prev => ({
        ...prev,
        milestone_name: crossModuleData.title || crossModuleData.milestone_name || '',
        category: crossModuleData.category || '',
        trade: crossModuleData.trade || '',
        reference_number: crossModuleData.variationNumber || crossModuleData.reference_number || '',
        description: crossModuleData.description || ''
      }));
    }
  }, [editingMilestone, crossModuleData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const milestoneData = {
      ...formData,
      project_id: projectId,
      planned_date: formData.start_date_planned || new Date().toISOString().split('T')[0]
    };

    console.log('Submitting milestone data:', milestoneData);
    await onSubmit(milestoneData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="milestone_name">Milestone Name *</Label>
                <Input
                  id="milestone_name"
                  value={formData.milestone_name}
                  onChange={(e) => handleInputChange('milestone_name', e.target.value)}
                  placeholder="Enter milestone name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="e.g., Construction, Design, Approval"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade">Trade</Label>
                <Input
                  id="trade"
                  value={formData.trade}
                  onChange={(e) => handleInputChange('trade', e.target.value)}
                  placeholder="e.g., Carpentry, Electrical, Plumbing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => handleInputChange('reference_number', e.target.value)}
                  placeholder="Link to Variation, Task, RFI, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date_planned">Start Date</Label>
                <Input
                  id="start_date_planned"
                  type="date"
                  value={formData.start_date_planned}
                  onChange={(e) => handleInputChange('start_date_planned', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date_planned">End Date</Label>
                <Input
                  id="end_date_planned"
                  type="date"
                  value={formData.end_date_planned}
                  onChange={(e) => handleInputChange('end_date_planned', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-gray-500" />
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-yellow-500" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-red-500" />
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the milestone requirements and deliverables"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_percentage">Completion Percentage</Label>
              <Input
                id="completion_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.completion_percentage}
                onChange={(e) => handleInputChange('completion_percentage', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="critical_path"
                  checked={formData.critical_path}
                  onCheckedChange={(checked) => handleInputChange('critical_path', checked)}
                />
                <Label htmlFor="critical_path" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Critical Path
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delay_risk_flag"
                  checked={formData.delay_risk_flag}
                  onCheckedChange={(checked) => handleInputChange('delay_risk_flag', checked)}
                />
                <Label htmlFor="delay_risk_flag" className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  Delay Risk
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or comments"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestoneForm;
