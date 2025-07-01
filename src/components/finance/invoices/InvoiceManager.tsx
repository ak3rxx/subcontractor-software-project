
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';

const InvoiceManager = () => {
  const [showForm, setShowForm] = useState(false);

  // Mock invoice data
  const invoices = [
    {
      id: '1',
      number: 'INV-2024-001',
      client: 'ABC Construction Ltd',
      project: 'Office Complex Alpha',
      amount: 45000,
      dueDate: '2024-02-15',
      status: 'sent',
      createdDate: '2024-01-15'
    },
    {
      id: '2',
      number: 'INV-2024-002',
      client: 'XYZ Developments',
      project: 'Residential Tower Beta',
      amount: 78000,
      dueDate: '2024-02-20',
      status: 'paid',
      createdDate: '2024-01-20'
    },
    {
      id: '3',
      number: 'INV-2024-003',
      client: 'City Council',
      project: 'Community Center Gamma',
      amount: 32000,
      dueDate: '2024-01-30',
      status: 'overdue',
      createdDate: '2024-01-01'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'sent': return <Badge variant="default">Sent</Badge>;
      case 'paid': return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTotalAmount = (status?: string) => {
    return invoices
      .filter(invoice => !status || invoice.status === status)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">Create, track, and manage client invoices</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{invoices.length}</div>
            <div className="text-sm text-gray-600">Total Invoices</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">${getTotalAmount('paid').toLocaleString()}</div>
            <div className="text-sm text-gray-600">Paid Amount</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">${getTotalAmount('sent').toLocaleString()}</div>
            <div className="text-sm text-gray-600">Pending Payment</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="h-8 w-8 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-red-600 font-bold">!</span>
            </div>
            <div className="text-2xl font-bold text-red-600">${getTotalAmount('overdue').toLocaleString()}</div>
            <div className="text-sm text-gray-600">Overdue Amount</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices</h3>
              <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
              <Button onClick={() => setShowForm(true)}>Create Invoice</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{invoice.number}</h3>
                        <p className="text-gray-600">{invoice.client}</p>
                        <p className="text-sm text-gray-500">{invoice.project}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(invoice.status)}
                        <div className="text-lg font-semibold mt-1">${invoice.amount.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Created:</span>
                        <div>{new Date(invoice.createdDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Due Date:</span>
                        <div>{new Date(invoice.dueDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <div className="capitalize">{invoice.status}</div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                      {invoice.status === 'draft' && (
                        <Button size="sm">Send</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Invoice Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Invoice form will be implemented here</p>
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

export default InvoiceManager;
