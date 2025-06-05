
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, FileText, Shield } from 'lucide-react';

const PendingApprovals = () => {
  const { toast } = useToast();
  
  const pendingSubcontractors = [
    {
      id: 1,
      companyName: "FastTrack Flooring",
      contactPerson: "David Martinez",
      tradeType: "Flooring",
      submittedDate: "2024-06-03",
      documentsStatus: "Complete",
      priority: "High"
    },
    {
      id: 2,
      companyName: "Reliable Roofing Co.",
      contactPerson: "Emma Davis",
      tradeType: "Roofing",
      submittedDate: "2024-06-02",
      documentsStatus: "Missing Insurance",
      priority: "Medium"
    },
    {
      id: 3,
      companyName: "Quality Concrete Works",
      contactPerson: "Robert Johnson",
      tradeType: "Concrete",
      submittedDate: "2024-06-01",
      documentsStatus: "Under Review",
      priority: "Low"
    }
  ];

  const handleApprove = (companyName: string) => {
    console.log(`Approving ${companyName}`);
    toast({
      title: "Subcontractor Approved",
      description: `${companyName} has been approved and added to the active directory.`,
    });
  };

  const handleReject = (companyName: string) => {
    console.log(`Rejecting ${companyName}`);
    toast({
      title: "Subcontractor Rejected",
      description: `${companyName} application has been rejected. They will be notified via email.`,
      variant: "destructive"
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Under Review': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>Review and approve subcontractor applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {pendingSubcontractors.map((subcontractor) => (
            <div key={subcontractor.id} className="border rounded-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{subcontractor.companyName}</h3>
                    <Badge className={getPriorityColor(subcontractor.priority)}>
                      {subcontractor.priority} Priority
                    </Badge>
                    <Badge variant="outline">{subcontractor.tradeType}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Contact Person</p>
                      <p className="text-gray-600">{subcontractor.contactPerson}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Submitted Date</p>
                      <p className="text-gray-600">{subcontractor.submittedDate}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Document Status</p>
                      <div className="flex items-center gap-2">
                        {getDocumentStatusIcon(subcontractor.documentsStatus)}
                        <span className="text-gray-600">{subcontractor.documentsStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    Review Docs
                  </Button>
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-1" />
                    Background Check
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReject(subcontractor.companyName)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleApprove(subcontractor.companyName)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {pendingSubcontractors.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
            <p className="text-gray-500">All subcontractor applications have been processed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovals;
