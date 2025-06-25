
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  user_email: string;
  user_role: string;
  action: string;
  module: string;
  details: string;
  ip_address: string;
}

const UserActivityLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  // Mock data - in real implementation, this would come from the database
  const [logs] = useState<ActivityLog[]>([
    {
      id: '1',
      timestamp: '2024-01-15 10:30:25',
      user_email: 'john@example.com',
      user_role: 'project_manager',
      action: 'create',
      module: 'projects',
      details: 'Created project "Office Building A"',
      ip_address: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: '2024-01-15 10:25:12',
      user_email: 'sarah@example.com',
      user_role: 'site_supervisor',
      action: 'update',
      module: 'tasks',
      details: 'Updated task "Foundation Inspection"',
      ip_address: '192.168.1.101'
    },
    {
      id: '3',
      timestamp: '2024-01-15 10:20:45',
      user_email: 'mike@subcontractor.com',
      user_role: 'subcontractor',
      action: 'view',
      module: 'qa_itp',
      details: 'Viewed ITP checklist for Area 2',
      ip_address: '10.0.1.50'
    }
  ]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <Badge className="bg-green-100 text-green-800">Create</Badge>;
      case 'update': return <Badge className="bg-blue-100 text-blue-800">Update</Badge>;
      case 'delete': return <Badge variant="destructive">Delete</Badge>;
      case 'view': return <Badge variant="outline">View</Badge>;
      default: return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return <Badge variant="outline" className="capitalize">{role.replace('_', ' ')}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || log.module === filterModule;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesModule && matchesAction;
  });

  const exportLogs = () => {
    // In real implementation, this would generate and download a CSV/Excel file
    console.log('Exporting logs:', filteredLogs);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Activity Logs</CardTitle>
          <CardDescription>
            Complete audit trail of user actions across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user email or action details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="rfis">RFIs</SelectItem>
                <SelectItem value="qa_itp">QA/ITP</SelectItem>
                <SelectItem value="variations">Variations</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportLogs} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>{log.user_email}</TableCell>
                  <TableCell>{getRoleBadge(log.user_role)}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.module}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.details}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {log.ip_address}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No activity logs found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityLogs;
