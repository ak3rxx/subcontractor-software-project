
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, DollarSign, CheckCircle } from 'lucide-react';

const ProgressClaimManager = () => {
  const [showForm, setShowForm] = useState(false);

  // Mock progress claim data
  const progressClaims = [
    {
      id: '1',
      number: 'PC-2024-001',
      project: 'Office Complex Alpha',
      period: 'January 2024',
      amount: 120000,
      status: 'approved',
      submittedDate: '2024-01-31',
      approvedDate: '2024-02-05'
    },
    {
      id: '2',
      number: 'PC-2024-002',
      project: 'Residential Tower Beta',
      period: 'January 2024',
      amount: 85000,
      status: 'pending',
      submittedDate: '2024-01-31',
      approvedDate: null
    },
    {
      id: '3',
      number: 'PC-2024-003',
      project: 'Community Center Gamma',
      period: 'December 2023',
      amount: 65000,
      status: 'rejected',
      submittedDate: '2023-12-31',
      approvedDate: null
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'pending': return <Badge variant="default">Pending Review</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTotalAmount = (status?: string) => {
    return progressClaims
      .filter(claim => !status || claim.status === status)
      .reduce((sum, claim) => sum + claim.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Progress Claims</h2>
          <p className="text-muted-foreground">Submit and track monthly progress claims</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Progress Claim
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{progressClaims.length}</div>
            <div className="text-sm text-gray-600">Total Claims</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">${getTotalAmount('approved').toLocaleString()}</div>
            <div className="text-sm text-gray-600">Approved Amount</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">${getTotalAmount('pending').toLocaleString()}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="h-8 w-8 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-red-600 font-bold">×</span>
            </div>
            <div className="text-2xl font-bold text-red-600">${getTotalAmount('rejected').toLocaleString()}</div>
            <div className="text-sm text-gray-600">Rejected Amount</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Claims List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Progress Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {progressClaims.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Claims</h3>
              <p className="text-gray-600 mb-4">Submit your first progress claim to get started</p>
              <Button onClick={() => setShowForm(true)}>Create Progress Claim</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {progressClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{claim.number}</h3>
                        <p className="text-gray-600">{claim.project}</p>
                        <p className="text-sm text-gray-500">Period: {claim.period}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(claim.status)}
                        <div className="text-lg font-semibold mt-1">${claim.amount.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Submitted:</span>
                        <div>{new Date(claim.submittedDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <div className="capitalize">{claim.status}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Approved:</span>
                        <div>{claim.approvedDate ? new Date(claim.approvedDate).toLocaleDateString() : 'Pending'}</div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      {claim.status === 'draft' && (
                        <>
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button size="sm">Submit</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Progress Claim Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Progress Claim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Progress claim form will be implemented here</p>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressClaimManager;
