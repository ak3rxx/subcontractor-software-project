
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Settings, Plus, Edit, Trash2, CreditCard } from 'lucide-react';

const OrganizationManagement: React.FC = () => {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Mock data - replace with real data from Supabase
  const organizations = [
    {
      id: '1',
      name: 'ABC Construction Ltd',
      status: 'active',
      subscription: 'professional',
      userCount: 12,
      projectCount: 8,
      createdAt: '2024-01-15',
      lastActivity: '2024-12-20'
    },
    {
      id: '2',
      name: 'XYZ Builders',
      status: 'trial',
      subscription: 'trial',
      userCount: 3,
      projectCount: 2,
      createdAt: '2024-12-01',
      lastActivity: '2024-12-19'
    },
    {
      id: '3',
      name: 'Smith & Co',
      status: 'suspended',
      subscription: 'basic',
      userCount: 5,
      projectCount: 3,
      createdAt: '2024-03-20',
      lastActivity: '2024-11-15'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trial': return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'professional': return <Badge className="bg-purple-100 text-purple-800">Professional</Badge>;
      case 'basic': return <Badge className="bg-yellow-100 text-yellow-800">Basic</Badge>;
      case 'trial': return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Organization Management</h3>
          <p className="text-gray-600">Manage all client organizations and their subscriptions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>Add a new client organization to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" placeholder="Enter organization name" />
              </div>
              <div>
                <Label htmlFor="subscription">Subscription Plan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial (30 days)</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input id="adminEmail" type="email" placeholder="admin@organization.com" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button>Create Organization</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-gray-600">Total Organizations</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-gray-600">Trial</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">20</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>Manage client organizations and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-500">Created {org.createdAt}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(org.status)}</TableCell>
                  <TableCell>{getSubscriptionBadge(org.subscription)}</TableCell>
                  <TableCell>{org.userCount}</TableCell>
                  <TableCell>{org.projectCount}</TableCell>
                  <TableCell>{org.lastActivity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
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

export default OrganizationManagement;
