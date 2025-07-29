import React, { useState, useEffect } from 'react';
import { useTaskAssignments } from '@/hooks/useTaskAssignments';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  X, 
  Search,
  UserCheck,
  Clock
} from 'lucide-react';

interface OrgUser {
  user_id: string;
  full_name?: string;
  email: string;
  role: string;
}

interface TaskAssignmentSelectorProps {
  taskId: string;
  projectId: string;
  isEditing: boolean;
  onAssignmentsChange?: (assignments: any[]) => void;
}

const TaskAssignmentSelector: React.FC<TaskAssignmentSelectorProps> = ({
  taskId,
  projectId,
  isEditing,
  onAssignmentsChange
}) => {
  const { assignments, loading, addAssignment, removeAssignment } = useTaskAssignments(taskId);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { toast } = useToast();

  // Fetch organization users
  useEffect(() => {
    const fetchOrgUsers = async () => {
      try {
        // First get the organization ID from the project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('organization_id')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        // Then get all users in the organization
        const { data, error } = await supabase
          .from('organization_users')
          .select(`
            user_id,
            role,
            profiles!organization_users_user_id_fkey (
              full_name,
              email
            )
          `)
          .eq('organization_id', project.organization_id)
          .eq('status', 'active');

        if (error) throw error;

        const formattedUsers = data?.map(user => ({
          user_id: user.user_id,
          full_name: user.profiles?.full_name,
          email: user.profiles?.email || '',
          role: user.role
        })) || [];

        setOrgUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching organization users:', error);
        toast({
          title: "Error",
          description: "Failed to load organization users",
          variant: "destructive"
        });
      }
    };

    if (projectId) {
      fetchOrgUsers();
    }
  }, [projectId, toast]);

  // Notify parent of assignment changes
  useEffect(() => {
    if (onAssignmentsChange) {
      onAssignmentsChange(assignments);
    }
  }, [assignments, onAssignmentsChange]);

  const handleAddAssignment = async () => {
    if (!selectedUserId) return;

    const success = await addAssignment(selectedUserId);
    if (success) {
      setSelectedUserId('');
    }
  };

  const handleRemoveAssignment = async (userId: string) => {
    await removeAssignment(userId);
  };

  const filteredUsers = orgUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const displayName = user.full_name || user.email;
    return displayName.toLowerCase().includes(searchLower);
  });

  const availableUsers = filteredUsers.filter(user => 
    !assignments.some(assignment => assignment.user_id === user.user_id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4" />
        <span className="font-medium">Assigned To</span>
        <Badge variant="secondary">
          {assignments.length} {assignments.length === 1 ? 'person' : 'people'}
        </Badge>
      </div>

      {/* Current Assignments */}
      {assignments.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {assignment.user_name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveAssignment(assignment.user_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add New Assignment - Only in edit mode */}
      {isEditing && (
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Add Assignment</h4>
            
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{user.full_name || user.email}</span>
                        <Badge variant="outline" className="ml-2">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleAddAssignment}
                disabled={!selectedUserId || loading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {assignments.length === 0 && !isEditing && (
        <Card className="p-4">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No users assigned to this task</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TaskAssignmentSelector;