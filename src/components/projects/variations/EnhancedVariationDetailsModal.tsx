
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Calendar, DollarSign, Clock, User, Mail, FileText, Download, Paperclip, Edit, ExternalLink, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import VariationApprovalWorkflow from '../VariationApprovalWorkflow';
import jsPDF from 'jspdf';

interface Variation {
  id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  requested_by?: string;
  request_date: string;
  cost_impact: number;
  time_impact: number;
  status: string;
  category?: string;
  trade?: string;
  priority: string;
  client_email?: string;
  justification?: string;
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
  email_sent?: boolean;
  email_sent_date?: string;
  cost_breakdown?: any[];
  gst_amount?: number;
  total_amount?: number;
  requires_eot?: boolean;
  requires_nod?: boolean;
  eot_days?: number;
  nod_days?: number;
  linked_milestones?: any[];
  linked_tasks?: any[];
  linked_qa_items?: any[];
}

interface EnhancedVariationDetailsModalProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onEdit?: (variation: Variation) => void;
  projectName: string;
}

const EnhancedVariationDetailsModal: React.FC<EnhancedVariationDetailsModalProps> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate,
  onEdit,
  projectName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const { attachments, fetchAttachments, downloadAttachment } = useVariationAttachments(variation?.id || '');

  useEffect(() => {
    if (variation?.id && isOpen) {
      fetchAttachments();
    }
  }, [variation?.id, isOpen, fetchAttachments]);

  if (!variation) return null;

  // Permission checks
  const userRole = user?.role || 'user';
  const userEmail = user?.email || '';
  const isFullAccessUser = userEmail === 'huy.nguyen@dcsquared.com.au';
  const canEdit = [
    'project_manager', 
    'contract_administrator', 
    'project_engineer',
    'admin',
    'manager'
  ].includes(userRole) || isFullAccessUser || !userRole;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'approved': { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: '✅ Approved' },
      'rejected': { icon: XCircle, color: 'bg-red-100 text-red-800', text: '❌ Rejected' },
      'pending_approval': { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800', text: '⏳ Pending Approval' },
      'draft': { icon: FileText, color: 'bg-gray-100 text-gray-800', text: '📝 Draft' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Medium Priority</Badge>;
    }
  };

  const getTradeBadge = (trade: string) => {
    if (!trade) return <Badge variant="outline">Not specified</Badge>;
    
    const tradeColors: { [key: string]: string } = {
      'carpentry': 'bg-orange-100 text-orange-800',
      'tiling': 'bg-blue-100 text-blue-800',
      'painting': 'bg-purple-100 text-purple-800',
      'rendering': 'bg-green-100 text-green-800',
      'builder': 'bg-yellow-100 text-yellow-800',
      'electrical': 'bg-red-100 text-red-800',
      'plumbing': 'bg-cyan-100 text-cyan-800',
      'hvac': 'bg-indigo-100 text-indigo-800',
    };

    const colorClass = tradeColors[trade.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <Badge className={colorClass}>{trade.charAt(0).toUpperCase() + trade.slice(1)}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return amount >= 0 ? `+$${amount.toLocaleString()}` : `-$${Math.abs(amount).toLocaleString()}`;
  };

  const generatePDF = async () => {
    setPdfGenerating(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VARIATION ORDER - QUOTATION', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Company details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('From: DC Squared Construction', margin, yPosition);
      yPosition += 8;
      pdf.text('123 Builder Street, Brisbane QLD 4000', margin, yPosition);
      yPosition += 8;
      pdf.text('Phone: +61 7 1234 5678', margin, yPosition);
      yPosition += 8;
      pdf.text('Email: admin@dcsquared.com.au', margin, yPosition);
      yPosition += 20;

      // Variation details
      pdf.setFont('helvetica', 'bold');
      pdf.text('VARIATION DETAILS', margin, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      const details = [
        ['Variation Number:', variation.variation_number],
        ['Project:', projectName],
        ['Title:', variation.title],
        ['Date:', variation.request_date],
        ['Location:', variation.location || 'Not specified'],
        ['Trade:', variation.trade || 'Not specified'],
        ['Category:', variation.category || 'Not specified'],
        ['Priority:', variation.priority],
        ['Status:', variation.status]
      ];

      details.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(value), margin + 60, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Description
      if (variation.description) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Description:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const splitDescription = pdf.splitTextToSize(variation.description, pageWidth - 2 * margin);
        pdf.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 6 + 10;
      }

      // Cost breakdown
      if (variation.cost_breakdown && variation.cost_breakdown.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('COST BREAKDOWN', margin, yPosition);
        yPosition += 15;

        // Table headers
        const tableHeaders = ['Description', 'Qty', 'Rate', 'Subtotal'];
        const colWidths = [80, 25, 35, 35];
        let xPos = margin;

        pdf.setFont('helvetica', 'bold');
        tableHeaders.forEach((header, index) => {
          pdf.text(header, xPos, yPosition);
          xPos += colWidths[index];
        });
        yPosition += 8;

        // Draw line under headers
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Table rows
        pdf.setFont('helvetica', 'normal');
        variation.cost_breakdown.forEach((item: any) => {
          xPos = margin;
          const rowData = [
            item.description || '',
            item.quantity?.toString() || '0',
            `$${item.rate?.toFixed(2) || '0.00'}`,
            `$${item.subtotal?.toFixed(2) || '0.00'}`
          ];

          rowData.forEach((data, index) => {
            pdf.text(data, xPos, yPosition);
            xPos += colWidths[index];
          });
          yPosition += 8;
        });

        yPosition += 10;

        // Totals
        const subtotal = variation.total_amount! - variation.gst_amount!;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Subtotal: $${subtotal.toFixed(2)}`, pageWidth - margin - 60, yPosition);
        yPosition += 8;
        pdf.text(`GST: $${variation.gst_amount?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, yPosition);
        yPosition += 8;
        pdf.setFontSize(14);
        pdf.text(`TOTAL: $${variation.total_amount?.toFixed(2) || '0.00'}`, pageWidth - margin - 60, yPosition);
        yPosition += 15;
      }

      // Time impact
      if (variation.requires_eot || variation.requires_nod) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TIME IMPACT', margin, yPosition);
        yPosition += 15;

        pdf.setFont('helvetica', 'normal');
        if (variation.requires_nod) {
          pdf.text(`Notice of Delay Required: ${variation.nod_days || 0} days`, margin, yPosition);
          yPosition += 8;
        }
        if (variation.requires_eot) {
          pdf.text(`Extension of Time Required: ${variation.eot_days || 0} days`, margin, yPosition);
          yPosition += 8;
        }
        yPosition += 10;
      }

      // Justification
      if (variation.justification) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Justification:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const splitJustification = pdf.splitTextToSize(variation.justification, pageWidth - 2 * margin);
        pdf.text(splitJustification, margin, yPosition);
        yPosition += splitJustification.length * 6 + 20;
      }

      // Signature section
      pdf.setFont('helvetica', 'bold');
      pdf.text('APPROVALS', margin, yPosition);
      yPosition += 20;

      pdf.setFont('helvetica', 'normal');
      pdf.text('Submitted by: _________________________', margin, yPosition);
      pdf.text('Date: _____________', pageWidth - margin - 80, yPosition);
      yPosition += 20;

      pdf.text('Approved by: _________________________', margin, yPosition);
      pdf.text('Date: _____________', pageWidth - margin - 80, yPosition);

      // Save PDF
      pdf.save(`${variation.variation_number}_Variation_Quotation.pdf`);

      toast({
        title: "Success",
        description: "PDF generated successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {variation.variation_number}
              </DialogTitle>
              <DialogDescription>
                Complete variation details with cost breakdown and approval workflow
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {canEdit && onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(variation)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generatePDF}
                disabled={pdfGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {pdfGenerating ? 'Generating...' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{variation.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(variation.status)}
                      {getPriorityBadge(variation.priority)}
                      {getTradeBadge(variation.trade || '')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(variation.total_amount || variation.cost_impact)}
                    </div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Variation Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Submitted:</span>
                      <span>{variation.request_date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Location:</span>
                      <span>{variation.location}</span>
                    </div>

                    {variation.requested_by && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Submitted by:</span>
                        <span>{variation.requested_by}</span>
                      </div>
                    )}

                    {variation.client_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Client Email:</span>
                        <span className="text-sm">{variation.client_email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Time Impact:</span>
                      <span>
                        {variation.time_impact > 0 ? `+${variation.time_impact}d` : 
                         variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className="capitalize">
                        {variation.category}
                      </Badge>
                    </div>

                    {variation.email_sent && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email Status:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✓ Sent {variation.email_sent_date && `on ${new Date(variation.email_sent_date).toLocaleDateString()}`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EOT/NOD Requirements */}
            {(variation.requires_eot || variation.requires_nod) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Time Impact Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variation.requires_nod && (
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Notice of Delay Required</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          {variation.nod_days || 0} days delay notice required
                        </p>
                      </div>
                    )}
                    
                    {variation.requires_eot && (
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-800">Extension of Time Required</span>
                        </div>
                        <p className="text-sm text-orange-700">
                          {variation.eot_days || 0} days extension requested
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Total Time Impact:</strong> {' '}
                      {(variation.nod_days || 0) + (variation.eot_days || 0)} days
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost Breakdown */}
            {variation.cost_breakdown && variation.cost_breakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Detailed Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Description</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variation.cost_breakdown.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.rate?.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">${item.subtotal?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 space-y-2 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-medium">${((variation.total_amount || 0) - (variation.gst_amount || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>GST:</span>
                      <span>${variation.gst_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span className="text-green-600">${variation.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description & Justification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {variation.description}
                  </p>
                </CardContent>
              </Card>

              {variation.justification && (
                <Card>
                  <CardHeader>
                    <CardTitle>Justification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {variation.justification}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments ({attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium">{attachment.file_name}</span>
                            <div className="text-xs text-gray-500">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(attachment.uploaded_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Module Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Related Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" size="sm" className="justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Programme
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    QA/ITP
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Tasks
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Approval Workflow - Right Side */}
          <div className="lg:col-span-1">
            <VariationApprovalWorkflow 
              variation={variation}
              onUpdate={onUpdate || (() => Promise.resolve())}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVariationDetailsModal;
