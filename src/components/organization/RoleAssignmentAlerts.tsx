
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, User, Clock, CheckCircle, XCircle } from 'lucide-react';
type UserRole = 'project_manager' | 'estimator' | 'admin' | 'site_supervisor' | 'subcontractor' | 'client';

const RoleAssignmentAlerts: React.FC = () => {
  const requests: any[] = [];
  const loading = false;
  const pendingCount = 0;
  const approveRequest = async () => {};
  const rejectRequest = async () => {};
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('project_manager');
  const [rejectionReason, setRejectionReason] = useState('');

  const roles: { value: UserRole; label: string }[] = [
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'estimator', label: 'Estimator' },
    { value: 'admin', label: 'Admin/Project Engineer' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'subcontractor', label: 'Subcontractor' },
    { value: 'client', label: 'Client/Builder' },
  ];

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    await approveRequest();
    // Mock success
    setShowApprovalDialog(false);
    setSelectedRequest(null);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    await rejectRequest();
    // Mock success
    setShowRejectionDialog(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {pendingCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Action Required:</strong> No pending role assignments.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Role Assignment Requests
          </CardTitle>
          <CardDescription>
            Manage user role assignments and access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No role assignment requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">
                          {request.user_profile?.full_name || 'Unknown User'}
                        </h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Email: {request.user_profile?.email}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Requested Role: <span className="font-medium">{request.requested_role}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setSelectedRole(request.requested_role as UserRole || 'project_manager');
                            setShowApprovalDialog(true);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectionDialog(true);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Role Assignment</DialogTitle>
            <DialogDescription>
              Assign role to {selectedRequest?.user_profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign Role</label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
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
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              Approve & Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Role Assignment</DialogTitle>
            <DialogDescription>
              Reject role assignment request for {selectedRequest?.user_profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection (Optional)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejecting this request..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleAssignmentAlerts;
