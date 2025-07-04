
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Mail, Trash2, Edit, AlertTriangle } from 'lucide-react';
type UserRole = 'project_manager' | 'estimator' | 'admin' | 'site_supervisor' | 'subcontractor' | 'client';
import RoleAssignmentAlerts from './RoleAssignmentAlerts';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: 'active' | 'pending' | 'inactive';
  last_login: string;
}

const TeamManagement: React.FC = () => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('project_manager');
  const pendingCount = 0; // Simplified for now

  // Mock data - in real implementation, this would come from the database
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: 'john.manager@company.com',
      full_name: 'John Manager',
      role: 'project_manager',
      status: 'active',
      last_login: '2024-01-15 09:30'
    },
    {
      id: '2',
      email: 'sarah.supervisor@company.com',
      full_name: 'Sarah Supervisor',
      role: 'site_supervisor',
      status: 'active',
      last_login: '2024-01-15 08:45'
    },
    {
      id: '3',
      email: 'mike.estimator@company.com',
      full_name: 'Mike Estimator',
      role: 'estimator',
      status: 'pending',
      last_login: 'Never'
    }
  ]);

  const roles: { value: UserRole; label: string }[] = [
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'estimator', label: 'Estimator' },
    { value: 'admin', label: 'Admin/Project Engineer' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'subcontractor', label: 'Subcontractor' },
    { value: 'client', label: 'Client/Builder' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    return <Badge variant="outline" className="capitalize">{role.replace('_', ' ')}</Badge>;
  };

  const handleInvite = () => {
    // In real implementation, send invitation email
    console.log('Inviting user:', inviteEmail, 'as', inviteRole);
    setShowInviteDialog(false);
    setInviteEmail('');
    setInviteRole('project_manager');
  };

  const handleResendInvite = (email: string) => {
    // Resend invitation email
    console.log('Resending invite to:', email);
  };

  const handleDeleteUser = (id: string) => {
    // Delete user from organization
    console.log('Deleting user:', id);
  };

  return (
    <div className="space-y-6">
      {/* Role Assignment Alerts - Priority Section */}
      {pendingCount > 0 && (
        <RoleAssignmentAlerts />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Team Management
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {pendingCount} pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage team members, assign roles, and control access
              </CardDescription>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite}>Send Invitation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            Current team size: {teamMembers.length} / 25 license limit
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {member.last_login}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {member.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResendInvite(member.email)}
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          Resend
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
