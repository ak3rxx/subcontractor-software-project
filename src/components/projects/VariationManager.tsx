
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Clock, AlertTriangle, FileText, Download, MapPin, MessageSquare, Calculator } from 'lucide-react';
import { useVariations } from '@/hooks/useVariations';
import VariationDetailsModal from './VariationDetailsModal';
import QuotationVariationForm from './variations/QuotationVariationForm';

interface VariationManagerProps {
  projectName: string;
  projectId: string;
}

const VariationManager: React.FC<VariationManagerProps> = ({ projectName, projectId }) => {
  const { toast } = useToast();
  const { variations, loading, createVariation, updateVariation, sendVariationEmail } = useVariations(projectId);
  const [showNewVariation, setShowNewVariation] = useState(false);
  const [emailingSending, setEmailSending] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (variation: any) => {
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  };

  const handleSendEmail = async (variationId: string) => {
    setEmailSending(variationId);
    const success = await sendVariationEmail(variationId);
    setEmailSending(null);
  };

  const exportToPDF = (variation: any) => {
    const senderCompany = {
      name: "DC Squared Construction",
      address: "123 Builder Street, Brisbane QLD 4000",
      phone: "+61 7 1234 5678",
      email: "admin@dcsquared.com.au",
      abn: "12 345 678 901"
    };

    const recipientCompany = {
      name: "Client Construction Pty Ltd",
      address: "456 Client Avenue, Brisbane QLD 4001",
      phone: "+61 7 9876 5432",
      email: "contact@clientconstruction.com.au",
      abn: "98 765 432 109"
    };

    // Generate detailed cost breakdown
    const costBreakdownHtml = variation.cost_breakdown && variation.cost_breakdown.length > 0 
      ? `
        <h3>Cost Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="border-bottom: 2px solid #333;">
              <th style="text-align: left; padding: 8px;">Description</th>
              <th style="text-align: center; padding: 8px;">Quantity</th>
              <th style="text-align: right; padding: 8px;">Rate</th>
              <th style="text-align: right; padding: 8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${variation.cost_breakdown.map((item: any) => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px;">${item.description}</td>
                <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                <td style="text-align: right; padding: 8px;">$${item.rate.toFixed(2)}</td>
                <td style="text-align: right; padding: 8px;">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px;">
          <p><strong>Subtotal: $${(variation.total_amount - variation.gst_amount).toFixed(2)}</strong></p>
          <p><strong>GST: $${variation.gst_amount.toFixed(2)}</strong></p>
          <p style="font-size: 18px;"><strong>Total: $${variation.total_amount.toFixed(2)}</strong></p>
        </div>
      `
      : `<div class="field"><span class="label">Cost Impact:</span> ${formatCurrency(variation.cost_impact)}</div>`;

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-details { width: 45%; }
          .variation-details { margin-top: 30px; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; }
          .signature-section { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-details">
            <h3>From: ${senderCompany.name}</h3>
            <p>${senderCompany.address}</p>
            <p>Phone: ${senderCompany.phone}</p>
            <p>Email: ${senderCompany.email}</p>
            <p>ABN: ${senderCompany.abn}</p>
          </div>
          <div class="company-details">
            <h3>To: ${recipientCompany.name}</h3>
            <p>${recipientCompany.address}</p>
            <p>Phone: ${recipientCompany.phone}</p>
            <p>Email: ${recipientCompany.email}</p>
            <p>ABN: ${recipientCompany.abn}</p>
          </div>
        </div>
        
        <h2 style="text-align: center; margin: 30px 0;">VARIATION ORDER - QUOTATION</h2>
        
        <div class="variation-details">
          <div class="field"><span class="label">Variation Number:</span> ${variation.variation_number}</div>
          <div class="field"><span class="label">Project:</span> ${projectName}</div>
          <div class="field"><span class="label">Date:</span> ${variation.request_date}</div>
          <div class="field"><span class="label">Location:</span> ${variation.location}</div>
          
          <div class="field"><span class="label">Title:</span> ${variation.title}</div>
          <div class="field"><span class="label">Description:</span><br/>${variation.description}</div>
          
          ${costBreakdownHtml}
          
          <div class="field"><span class="label">Time Impact:</span> ${variation.time_impact > 0 ? `+${variation.time_impact}d` : variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}</div>
          <div class="field"><span class="label">Priority:</span> ${variation.priority}</div>
          <div class="field"><span class="label">Category:</span> ${variation.category}</div>
          <div class="field"><span class="label">Status:</span> ${variation.status}</div>
          
          ${variation.attachments && variation.attachments.length > 0 ? `
            <div class="field">
              <span class="label">Attachments:</span><br/>
              ${variation.attachments.map((file: string) => `• ${file}`).join('<br/>')}
            </div>
          ` : ''}
        </div>
        
        <div class="signature-section">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <p><strong>Submitted by:</strong> ${variation.requested_by}</p>
              <p>Signature: _________________________</p>
              <p>Date: _____________________</p>
            </div>
            <div>
              <p><strong>Approved by:</strong> _________________________</p>
              <p>Signature: _________________________</p>
              <p>Date: _____________________</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${variation.variation_number}_Variation_Quotation.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "PDF Export",
      description: `Variation ${variation.variation_number} has been exported as PDF`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">📝 Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const handleSubmitVariation = async (variationData: any) => {
    const result = await createVariation(variationData);
    
    if (result) {
      setShowNewVariation(false);
      
      toast({
        title: "Success",
        description: "Quotation-style variation created successfully!"
      });
    }
  };

  const handleVariationUpdate = async (id: string, updates: any) => {
    await updateVariation(id, updates);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading variations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Variation Manager - Quotation Style</h3>
          <p className="text-gray-600">Create professional quotation-style variations with detailed cost breakdowns</p>
        </div>
        <Button onClick={() => setShowNewVariation(true)} className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          New Quotation Variation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">{variations.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'pending_approval').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              ${variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + (v.total_amount || v.cost_impact), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Approved Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.time_impact, 0)}
            </div>
            <div className="text-sm text-gray-600">Days Extension</div>
          </CardContent>
        </Card>
      </div>

      {/* New Variation Form */}
      {showNewVariation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              New Quotation-Style Variation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuotationVariationForm
              onSubmit={handleSubmitVariation}
              onCancel={() => setShowNewVariation(false)}
              projectName={projectName}
            />
          </CardContent>
        </Card>
      )}

      {/* Variations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variation Register</CardTitle>
        </CardHeader>
        <CardContent>
          {variations.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variations Yet</h3>
              <p className="text-gray-600 mb-4">Create your first quotation-style variation to get started</p>
              <Button onClick={() => setShowNewVariation(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                Create Quotation Variation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Time Impact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((variation) => (
                  <TableRow key={variation.id}>
                    <TableCell className="font-mono text-sm">{variation.variation_number}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {variation.title}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span title={variation.location}>{variation.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{variation.request_date}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ${(variation.total_amount || variation.cost_impact).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      ${variation.gst_amount?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      {variation.time_impact > 0 ? `+${variation.time_impact}d` : variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                    </TableCell>
                    <TableCell>{getStatusBadge(variation.status)}</TableCell>
                    <TableCell>{getPriorityBadge(variation.priority)}</TableCell>
                    <TableCell>
                      {variation.email_sent ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✓ Sent
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not sent</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View Details"
                          onClick={() => handleViewDetails(variation)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Export PDF"
                          onClick={() => exportToPDF(variation)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {variation.client_email && !variation.email_sent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send Email to Client"
                            onClick={() => handleSendEmail(variation.id)}
                            disabled={emailingSending === variation.id}
                          >
                            {emailingSending === variation.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <span>📧</span>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Variation Details Modal */}
      <VariationDetailsModal
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={handleVariationUpdate}
      />
    </div>
  );
};

export default VariationManager;
