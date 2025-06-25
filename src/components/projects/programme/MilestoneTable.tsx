
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';
import { getMilestoneStatusColor, getPriorityColor, calculateDaysUntilDue } from './milestoneUtils';
import MilestoneForm from './MilestoneForm';

interface MilestoneTableProps {
  milestones: ProgrammeMilestone[];
  title: string;
  icon?: React.ReactNode;
  showLinkedModule?: boolean;
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
  onUpdate?: (id: string, updates: Partial<ProgrammeMilestone>) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

const MilestoneTable: React.FC<MilestoneTableProps> = ({
  milestones,
  title,
  icon,
  showLinkedModule = false,
  emptyStateIcon,
  emptyStateMessage = "No milestones found",
  onUpdate,
  onDelete
}) => {
  const [editingMilestone, setEditingMilestone] = useState<ProgrammeMilestone | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEdit = (milestone: ProgrammeMilestone) => {
    setEditingMilestone(milestone);
  };

  const handleUpdate = async (milestoneData: Partial<ProgrammeMilestone>) => {
    if (!editingMilestone || !onUpdate) return;
    
    const success = await onUpdate(editingMilestone.id, milestoneData);
    if (success) {
      setEditingMilestone(null);
    }
  };

  const handleDelete = async (milestone: ProgrammeMilestone) => {
    if (!onDelete || !window.confirm(`Are you sure you want to delete "${milestone.milestone_name}"?`)) return;
    
    setIsDeleting(milestone.id);
    const success = await onDelete(milestone.id);
    setIsDeleting(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilText = (milestone: ProgrammeMilestone) => {
    const dueDate = milestone.end_date_planned || milestone.planned_date;
    if (!dueDate || milestone.status === 'complete') return null;
    
    const days = calculateDaysUntilDue(dueDate);
    
    if (days < 0) {
      return (
        <span className="text-red-600 font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {Math.abs(days)} days overdue
        </span>
      );
    } else if (days === 0) {
      return (
        <span className="text-orange-600 font-medium">
          Due today
        </span>
      );
    } else if (days <= 7) {
      return (
        <span className="text-yellow-600 font-medium">
          {days} days left
        </span>
      );
    }
    
    return (
      <span className="text-gray-600">
        {days} days left
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {editingMilestone && (
        <MilestoneForm
          showForm={true}
          onCancel={() => setEditingMilestone(null)}
          onSubmit={handleUpdate}
          editingMilestone={editingMilestone}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon || <Calendar className="h-5 w-5" />}
            {title}
          </CardTitle>
          <CardDescription>
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {emptyStateIcon || <Calendar className="h-12 w-12 mx-auto" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Milestones</h3>
              <p className="text-gray-600">{emptyStateMessage}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due In</TableHead>
                    {showLinkedModule && <TableHead>Linked Items</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id} className={milestone.critical_path ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {milestone.critical_path && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            {milestone.milestone_name}
                          </div>
                          {milestone.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {milestone.description}
                            </div>
                          )}
                          {milestone.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {milestone.category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMilestoneStatusColor(milestone.status)}>
                          {milestone.status === 'complete' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(milestone.priority)}>
                          {milestone.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(milestone.start_date_planned)}</TableCell>
                      <TableCell>{formatDate(milestone.end_date_planned || milestone.planned_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${milestone.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{milestone.completion_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDaysUntilText(milestone)}
                      </TableCell>
                      {showLinkedModule && (
                        <TableCell>
                          <div className="space-y-1">
                            {milestone.linked_tasks.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {milestone.linked_tasks.length} Task{milestone.linked_tasks.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {milestone.linked_itps.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {milestone.linked_itps.length} ITP{milestone.linked_itps.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {milestone.linked_deliveries.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {milestone.linked_deliveries.length} Deliver{milestone.linked_deliveries.length === 1 ? 'y' : 'ies'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {onUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(milestone)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(milestone)}
                              disabled={isDeleting === milestone.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestoneTable;
