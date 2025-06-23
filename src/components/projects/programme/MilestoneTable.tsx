
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Milestone, getDaysUntil } from './milestoneUtils';
import { getStatusBadge, getPriorityBadge, getDaysUntilBadge } from './MilestoneBadges';

interface MilestoneTableProps {
  milestones: Milestone[];
  title: string;
  icon?: React.ReactNode;
  showLinkedModule?: boolean;
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
}

const MilestoneTable: React.FC<MilestoneTableProps> = ({ 
  milestones, 
  title, 
  icon, 
  showLinkedModule = false,
  emptyStateIcon,
  emptyStateMessage = "No milestones found"
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({milestones.length} milestones)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            {emptyStateIcon && <div className="h-12 w-12 text-gray-400 mx-auto mb-4">{emptyStateIcon}</div>}
            <p className="text-gray-500">{emptyStateMessage}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                {showLinkedModule && <TableHead>Linked Module</TableHead>}
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell className="font-medium">{milestone.name}</TableCell>
                  <TableCell>{milestone.dueDate}</TableCell>
                  <TableCell>{getDaysUntilBadge(getDaysUntil(milestone.dueDate))}</TableCell>
                  <TableCell>{getStatusBadge(milestone.status, milestone.daysOverdue)}</TableCell>
                  <TableCell>{getPriorityBadge(milestone.priority)}</TableCell>
                  {showLinkedModule && <TableCell>{milestone.linkedModule}</TableCell>}
                  <TableCell>{milestone.assignedTo}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MilestoneTable;
