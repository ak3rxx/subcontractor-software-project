
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageSquare, Clock, AlertTriangle, CheckCircle2, Upload, Link } from 'lucide-react';
import { useCrossModuleNavigation } from '@/hooks/useCrossModuleNavigation';

interface RFIManagerProps {
  projectName: string;
  crossModuleData?: any;
}

const RFIManager: React.FC<RFIManagerProps> = ({ projectName, crossModuleData }) => {
  const { toast } = useToast();
  const { getCrossModuleAction } = useCrossModuleNavigation();
  const [showNewRFI, setShowNewRFI] = useState(false);
  const [newRFI, setNewRFI] = useState({
    title: '',
    question: '',
    submittedTo: '',
    submittedBy: '',
    dueDate: '',
    priority: 'normal',
    category: '',
    relatedArea: '',
    referenceNumber: ''
  });

  // Auto-open form and populate when arriving from cross-module navigation
  useEffect(() => {
    const action = getCrossModuleAction();
    if (action === 'create-rfi' && crossModuleData) {
      console.log('Auto-opening RFI form with cross-module data:', crossModuleData);
      
      setNewRFI({
        title: crossModuleData.rfi_title || crossModuleData.title || '',
        question: crossModuleData.rfi_description || crossModuleData.description || '',
        submittedTo: '',
        submittedBy: '',
        dueDate: '',
        priority: 'normal',
        category: 'design',
        relatedArea: crossModuleData.trade || crossModuleData.category || '',
        referenceNumber: crossModuleData.reference_number || crossModuleData.variationNumber || ''
      });
      
      setShowNewRFI(true);
      
      toast({
        title: "Cross-Module Integration",
        description: `RFI form auto-populated from variation ${crossModuleData.variationNumber}`,
      });
    }
  }, [crossModuleData, getCrossModuleAction]);

  // Sample RFI data
  const rfis = [
    {
      id: 'RFI-001',
      title: 'Bathroom Fixture Specifications',
      question: 'Please confirm tap and shower specifications for Unit 3A bathroom renovation',
      submittedTo: 'architect@design.com',
      submittedBy: 'Sarah Johnson',
      dateSent: '2024-01-08',
      dueDate: '2024-01-15',
      status: 'overdue',
      priority: 'high',
      response: '',
      daysOverdue: 2,
      referenceNumber: '001-VAR-0001'
    },
    {
      id: 'RFI-002',
      title: 'Electrical Panel Location',
      question: 'Confirm location of main electrical panel - conflicts with plumbing layout',
      submittedTo: 'engineer@structural.com',
      submittedBy: 'Mike Davis',
      dateSent: '2024-01-10',
      dueDate: '2024-01-20',
      status: 'open',
      priority: 'high',
      response: '',
      daysOverdue: 0,
      referenceNumber: ''
    },
    {
      id: 'RFI-003',
      title: 'Floor Finish Material',
      question: 'Please specify floor finish material for common areas',
      submittedTo: 'client@project.com',
      submittedBy: 'John Smith',
      dateSent: '2024-01-05',
      dueDate: '2024-01-12',
      status: 'answered',
      priority: 'normal',
      response: 'Approved for polished concrete finish as per specification sheet attached.',
      daysOverdue: 0,
      referenceNumber: ''
    }
  ];

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case 'answered':
        return <Badge className="bg-green-100 text-green-800">✅ Answered</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">🔴 Overdue ({daysOverdue}d)</Badge>;
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Open</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const handleSubmitRFI = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New RFI:', newRFI);
    
    toast({
      title: "RFI Submitted",
      description: `${newRFI.title} has been sent to ${newRFI.submittedTo}. You will be notified when a response is received.`,
    });

    setNewRFI({
      title: '',
      question: '',
      submittedTo: '',
      submittedBy: '',
      dueDate: '',
      priority: 'normal',
      category: '',
      relatedArea: '',
      referenceNumber: ''
    });
    setShowNewRFI(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">RFI Manager</h3>
          <p className="text-gray-600">Request for Information tracking and management</p>
          {crossModuleData?.fromVariation && (
            <Badge className="mt-2 bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
              <Link className="h-3 w-3" />
              Linked from Variation {crossModuleData.variationNumber}
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowNewRFI(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New RFI
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {rfis.filter(r => r.status === 'open').length}
            </div>
            <div className="text-sm text-gray-600">Open RFIs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">
              {rfis.filter(r => r.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              {rfis.filter(r => r.status === 'answered').length}
            </div>
            <div className="text-sm text-gray-600">Answered</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">
              {Math.round(rfis.filter(r => r.status === 'answered').length / rfis.length * 100)}%
            </div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* New RFI Form */}
      {showNewRFI && (
        <Card className={crossModuleData?.fromVariation ? "border-blue-200 bg-blue-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Submit New RFI
              {crossModuleData?.fromVariation && (
                <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  From Variation {crossModuleData.variationNumber}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRFI} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfiTitle">RFI Title</Label>
                  <Input
                    id="rfiTitle"
                    value={newRFI.title}
                    onChange={(e) => setNewRFI(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of information request"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submittedBy">Submitted By</Label>
                  <Input
                    id="submittedBy"
                    value={newRFI.submittedBy}
                    onChange={(e) => setNewRFI(prev => ({ ...prev, submittedBy: e.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Question / Request</Label>
                <Textarea
                  id="question"
                  value={newRFI.question}
                  onChange={(e) => setNewRFI(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Detailed question or information request including any relevant context"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submittedTo">Submitted To (Email)</Label>
                  <Input
                    id="submittedTo"
                    type="email"
                    value={newRFI.submittedTo}
                    onChange={(e) => setNewRFI(prev => ({ ...prev, submittedTo: e.target.value }))}
                    placeholder="recipient@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Response Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newRFI.dueDate}
                    onChange={(e) => setNewRFI(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newRFI.priority} onValueChange={(value) => setNewRFI(prev => ({ ...prev, priority: value }))}>
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
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newRFI.category} onValueChange={(value) => setNewRFI(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design Clarification</SelectItem>
                      <SelectItem value="specification">Specification</SelectItem>
                      <SelectItem value="coordination">Coordination</SelectItem>
                      <SelectItem value="approval">Approval Required</SelectItem>
                      <SelectItem value="technical">Technical Query</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relatedArea">Related Area/Trade</Label>
                  <Input
                    id="relatedArea"
                    value={newRFI.relatedArea}
                    onChange={(e) => setNewRFI(prev => ({ ...prev, relatedArea: e.target.value }))}
                    placeholder="e.g. Electrical, Level 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference #</Label>
                  <Input
                    id="referenceNumber"
                    value={newRFI.referenceNumber}
                    onChange={(e) => setNewRFI(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="VAR-001"
                    readOnly={crossModuleData?.fromVariation}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Attach relevant drawings, photos, or documents
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to browse or drag files here
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Submit RFI</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewRFI(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* RFI Table */}
      <Card>
        <CardHeader>
          <CardTitle>RFI Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submitted To</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfis.map((rfi) => (
                <TableRow key={rfi.id}>
                  <TableCell className="font-mono text-sm">{rfi.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {rfi.title}
                  </TableCell>
                  <TableCell>{rfi.submittedTo}</TableCell>
                  <TableCell>{rfi.submittedBy}</TableCell>
                  <TableCell>{rfi.dateSent}</TableCell>
                  <TableCell>{rfi.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(rfi.status, rfi.daysOverdue)}</TableCell>
                  <TableCell>{getPriorityBadge(rfi.priority)}</TableCell>
                  <TableCell>
                    {rfi.referenceNumber && (
                      <Badge variant="outline" className="text-xs">
                        {rfi.referenceNumber}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" title="View Details">
                        View
                      </Button>
                      {rfi.status === 'answered' && (
                        <Button variant="ghost" size="sm" title="View Response">
                          Response
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {rfis.some(rfi => rfi.status === 'overdue') && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-800">
                {rfis.filter(rfi => rfi.status === 'overdue').length} RFI(s) are overdue
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Please follow up with recipients for timely responses to avoid project delays.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RFIManager;
