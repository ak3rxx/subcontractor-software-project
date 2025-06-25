
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle, Flag } from 'lucide-react';

const IssueManagement: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  // Mock data - replace with real data from Supabase
  const issues = [
    {
      id: '1',
      title: 'Unable to upload documents',
      description: 'Client cannot upload PDF files in the document manager',
      organization: 'ABC Construction Ltd',
      reportedBy: 'john@abcconstruction.com',
      priority: 'high',
      status: 'open',
      category: 'technical',
      createdAt: '2024-12-20 10:30',
      lastUpdate: '2024-12-20 14:15'
    },
    {
      id: '2',
      title: 'Permission denied for QA module',
      description: 'Site supervisor cannot access QA/ITP section despite having correct role',
      organization: 'XYZ Builders',
      reportedBy: 'sarah@xyzbuild.com',
      priority: 'medium',
      status: 'in-progress',
      category: 'permissions',
      createdAt: '2024-12-19 16:45',
      lastUpdate: '2024-12-20 09:30'
    },
    {
      id: '3',
      title: 'Project budget calculations incorrect',
      description: 'Budget totals not adding up correctly in finance module',
      organization: 'Smith & Co',
      reportedBy: 'mike@smithco.com',
      priority: 'high',
      status: 'resolved',
      category: 'calculation',
      createdAt: '2024-12-18 11:20',
      lastUpdate: '2024-12-19 15:00'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800"><Flag className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-100 text-blue-800"><AlertTriangle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in-progress': return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed': return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'technical': return <Badge variant="outline">Technical</Badge>;
      case 'permissions': return <Badge variant="outline">Permissions</Badge>;
      case 'calculation': return <Badge variant="outline">Calculation</Badge>;
      case 'ui': return <Badge variant="outline">UI/UX</Badge>;
      case 'performance': return <Badge variant="outline">Performance</Badge>;
      default: return <Badge variant="outline">General</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Issue Management</h3>
          <p className="text-gray-600">Track and resolve client-reported issues across all organizations</p>
        </div>
      </div>

      {/* Issue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-gray-600">Total Issues</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-gray-600">Open</p>
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
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Flag className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-gray-600">Resolved Today</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Issues</CardTitle>
          <CardDescription>Manage and respond to client issues</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{issue.description}</div>
                      <div className="text-xs text-gray-400 mt-1">By: {issue.reportedBy}</div>
                    </div>
                  </TableCell>
                  <TableCell>{issue.organization}</TableCell>
                  <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                  <TableCell>{getStatusBadge(issue.status)}</TableCell>
                  <TableCell>{getCategoryBadge(issue.category)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{issue.createdAt}</div>
                      <div className="text-gray-500">Updated: {issue.lastUpdate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowResponseDialog(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Issue</DialogTitle>
            <DialogDescription>
              {selectedIssue && `Responding to: ${selectedIssue.title}`}
            </DialogDescription>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Issue Details</h4>
                <p className="text-sm text-gray-700 mb-2">{selectedIssue.description}</p>
                <div className="flex gap-2 text-xs">
                  {getPriorityBadge(selectedIssue.priority)}
                  {getStatusBadge(selectedIssue.status)}
                  {getCategoryBadge(selectedIssue.category)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Response</label>
                <Textarea 
                  placeholder="Type your response to help resolve this issue..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                  Cancel
                </Button>
                <Button>Send Response</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueManagement;
