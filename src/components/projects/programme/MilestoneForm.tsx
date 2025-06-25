
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, X } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';

interface MilestoneFormProps {
  showForm: boolean;
  onCancel: () => void;
  onSubmit?: (milestoneData: Partial<ProgrammeMilestone>) => Promise<void>;
  projectId?: string;
  editingMilestone?: ProgrammeMilestone;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({
  showForm,
  onCancel,
  onSubmit,
  projectId,
  editingMilestone
}) => {
  const [formData, setFormData] = useState<Partial<ProgrammeMilestone>>({
    milestone_name: editingMilestone?.milestone_name || '',
    description: editingMilestone?.description || '',
    start_date_planned: editingMilestone?.start_date_planned || '',
    end_date_planned: editingMilestone?.end_date_planned || '',
    status: editingMilestone?.status || 'upcoming',
    priority: editingMilestone?.priority || 'medium',
    category: editingMilestone?.category || '',
    completion_percentage: editingMilestone?.completion_percentage || 0,
    critical_path: editingMilestone?.critical_path || false,
    notes: editingMilestone?.notes || '',
    project_id: projectId || editingMilestone?.project_id
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.milestone_name || !formData.start_date_planned) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Error submitting milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ProgrammeMilestone, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!showForm) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
            </CardTitle>
            <CardDescription>
              {editingMilestone ? 'Update milestone details' : 'Create a new programme milestone with timeline and dependencies'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="milestone_name">Milestone Name *</Label>
              <Input
                id="milestone_name"
                value={formData.milestone_name}
                onChange={(e) => handleInputChange('milestone_name', e.target.value)}
                placeholder="e.g., Foundation Pour Complete"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="finishes">Finishes</SelectItem>
                  <SelectItem value="external">External Works</SelectItem>
                  <SelectItem value="handover">Handover</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date_planned">Planned Start Date *</Label>
              <Input
                id="start_date_planned"
                type="date"
                value={formData.start_date_planned}
                onChange={(e) => handleInputChange('start_date_planned', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date_planned">Planned End Date</Label>
              <Input
                id="end_date_planned"
                type="date"
                value={formData.end_date_planned}
                onChange={(e) => handleInputChange('end_date_planned', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as ProgrammeMilestone['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value as ProgrammeMilestone['priority'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
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
              placeholder="Detailed description of the milestone and requirements..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completion_percentage">Completion %</Label>
              <Input
                id="completion_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.completion_percentage}
                onChange={(e) => handleInputChange('completion_percentage', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="critical_path"
                checked={formData.critical_path}
                onCheckedChange={(checked) => handleInputChange('critical_path', checked)}
              />
              <Label htmlFor="critical_path">Critical Path Item</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or requirements..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingMilestone ? 'Update Milestone' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MilestoneForm;
