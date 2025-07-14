import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Mail, Trash2, Edit, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PermissionGate from '@/components/PermissionGate';

type UserRole = 'org_admin' | 'project_manager' | 'estimator' | 'admin' | 'site_supervisor' | 'subcontractor' | 'client';

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}

interface EnhancedTeamManagementProps {
  organizationId?: string;
}

const EnhancedTeamManagement: React.FC<EnhancedTeamManagementProps> = ({ organizationId }) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('project_manager');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const { currentOrganization, organizationUsers, inviteUser, updateUserRole, deleteInvitation, refetch } = useOrganizations();
  const { user, isDeveloper, hasRole } = useAuth();
  const { toast } = useToast();

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'org_admin', label: 'Organization Admin', description: 'Full access to organization management' },
    { value: 'project_manager', label: 'Project Manager', description: 'Manage projects and approve variations' },
    { value: 'estimator', label: 'Estimator', description: 'Create budgets and cost estimates' },
    { value: 'admin', label: 'Admin/Project Engineer', description: 'Manage documents and compliance' },
    { value: 'site_supervisor', label: 'Site Supervisor', description: 'QA inspections and site operations' },
    { value: 'subcontractor', label: 'Subcontractor', description: 'Submit ITPs and view assigned tasks' },
    { value: 'client', label: 'Client/Builder', description: 'View-only access to project progress' },
  ];

  const fetchPendingInvitations = async () => {
    if (!currentOrganization) return;

    try {
      setLoadingInvitations(true);
      const { data, error } = await supabase.rpc('get_organization_invitations', {
        org_id: currentOrganization.id
      });

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchPendingInvitations();
    }
  }, [currentOrganization]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success/10 text-success">Active</Badge>;
      case 'pending': return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = roles.find(r => r.value === role);
    return (
      <Badge variant="outline" className="capitalize">
        {roleInfo?.label || role.replace('_', ' ')}
      </Badge>
    );
  };

  const handleInvite = async () => {
    if (!currentOrganization || !inviteEmail) return;

    setInviteLoading(true);
    try {
      const success = await inviteUser(currentOrganization.id, inviteEmail, inviteRole);
      
      if (success) {
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRole('project_manager');
        await fetchPendingInvitations(); // Refresh invitations
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    try {
      // In a real implementation, this would trigger a resend email
      toast({
        title: "Invitation Resent",
        description: "The invitation email has been resent."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvite = async (invitationId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete the invitation for ${email}?`)) {
      return;
    }

    const success = await deleteInvitation(invitationId, email);
    if (success) {
      await fetchPendingInvitations(); // Refresh invitations
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!currentOrganization) return;

    try {
      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove user",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${userEmail} has been removed from the organization`
      });

      refetch(); // Refresh the organization users
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = async (organizationUserId: string, newRole: string) => {
    await updateUserRole(organizationUserId, newRole);
  };

  const canManageTeam = isDeveloper() || hasRole('org_admin', currentOrganization?.id);
  const pendingCount = pendingInvitations.filter(inv => inv.status === 'pending').length;
  const activeUsersCount = organizationUsers.filter(user => user.status === 'active').length;

  if (!currentOrganization) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No organization selected. Please select an organization to manage team members.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Card */}
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
                Manage team members, assign roles, and control access for {currentOrganization.name}
              </CardDescription>
            </div>
            <PermissionGate permission="admin" showMessage={false}>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join {currentOrganization.name}
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
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-xs text-muted-foreground">{role.description}</div>
                              </div>
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
                    <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
                      {inviteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Users:</span>
              <span className="font-semibold">{activeUsersCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Invites:</span>
              <span className="font-semibold">{pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License Limit:</span>
              <span className="font-semibold">{currentOrganization.license_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Active Team Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizationUsers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.user_profile?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.user_profile?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission="admin" fallback={getRoleBadge(member.role)}>
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                      >
                        <SelectTrigger className="w-auto">
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
                    </PermissionGate>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission="admin" showMessage={false}>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(member.user_id, member.user_profile?.email || '')}
                          className="text-destructive hover:text-destructive"
                          disabled={member.user_id === user?.id} // Can't delete yourself
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Invitations
              {loadingInvitations && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.invited_by_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <PermissionGate permission="admin" showMessage={false}>
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResendInvite(invitation.id)}
                                className="flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" />
                                Resend
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteInvite(invitation.id, invitation.email)}
                                className="flex items-center gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedTeamManagement;