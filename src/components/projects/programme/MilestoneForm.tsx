
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface MilestoneFormProps {
  showForm: boolean;
  onCancel: () => void;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ showForm, onCancel }) => {
  const { toast } = useToast();
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    dueDate: '',
    linkedModule: '',
    priority: 'normal',
    assignedTo: '',
    description: ''
  });

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Milestone:', newMilestone);
    
    toast({
      title: "Milestone Added",
      description: `${newMilestone.name} has been added to the programme.`,
    });

    setNewMilestone({
      name: '',
      dueDate: '',
      linkedModule: '',
      priority: 'normal',
      assignedTo: '',
      description: ''
    });
    onCancel();
  };

  if (!showForm) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Milestone</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="milestoneName">Milestone Name</Label>
              <Input
                id="milestoneName"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Electrical Second Fix"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedModule">Linked Module</Label>
              <Select value={newMilestone.linkedModule} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, linkedModule: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select linked module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qa-itp">QA/ITP</SelectItem>
                  <SelectItem value="material-handover">Material Handover</SelectItem>
                  <SelectItem value="delivery-schedule">Delivery Schedule</SelectItem>
                  <SelectItem value="variation">Variation</SelectItem>
                  <SelectItem value="rfi">RFI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={newMilestone.priority} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button type="submit">Add Milestone</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MilestoneForm;
