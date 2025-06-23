import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Clock, AlertTriangle, FileText, Download, Upload, Paperclip, MapPin } from 'lucide-react';
import { useVariations } from '@/hooks/useVariations';

interface VariationManagerProps {
  projectName: string;
  projectId: string;
}

const VariationManager: React.FC<VariationManagerProps> = ({ projectName, projectId }) => {
  const { toast } = useToast();
  const { variations, loading, createVariation, sendVariationEmail } = useVariations(projectId);
  const [showNewVariation, setShowNewVariation] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [emailingSending, setEmailSending] = useState<string | null>(null);
  const [newVariation, setNewVariation] = useState({
    title: '',
    description: '',
    submittedBy: '',
    costImpact: '',
    timeImpact: '',
    category: '',
    priority: 'medium', // Changed from 'normal' to 'medium'
    clientEmail: '',
    justification: '',
    location: ''
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Files Attached",
        description: `${newFiles.length} file(s) attached successfully`,
      });
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async (variationId: string) => {
    setEmailSending(variationId);
    const success = await sendVariationEmail(variationId);
    setEmailSending(null);
  };

  const exportToPDF = (variation: any) => {
    // Company details
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

    // Create PDF content (simplified HTML for demo)
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
        
        <h2 style="text-align: center; margin: 30px 0;">VARIATION ORDER</h2>
        
        <div class="variation-details">
          <div class="field"><span class="label">Variation Number:</span> ${variation.variation_number}</div>
          <div class="field"><span class="label">Project:</span> ${projectName}</div>
          <div class="field"><span class="label">Date:</span> ${variation.submitted_date}</div>
          <div class="field"><span class="label">Location:</span> ${variation.location}</div>
          
          <div class="field"><span class="label">Title:</span> ${variation.title}</div>
          <div class="field"><span class="label">Description:</span><br/>${variation.description}</div>
          
          <div class="field"><span class="label">Cost Impact:</span> ${formatCurrency(variation.cost_impact)}</div>
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
              <p><strong>Submitted by:</strong> ${variation.submitted_by}</p>
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

    // Create and download PDF (simplified approach)
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${variation.variation_number}_Variation_Order.html`;
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
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
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
      case 'medium': // Changed from 'normal' to 'medium'
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>; // Changed default
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const handleSubmitVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const attachmentData = attachedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));

    const variationData = {
      ...newVariation,
      attachments: attachmentData
    };

    const result = await createVariation(variationData);
    
    if (result) {
      setNewVariation({
        title: '',
        description: '',
        submittedBy: '',
        costImpact: '',
        timeImpact: '',
        category: '',
        priority: 'medium', // Changed from 'normal' to 'medium'
        clientEmail: '',
        justification: '',
        location: ''
      });
      setAttachedFiles([]);
      setShowNewVariation(false);
    }
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
          <h3 className="text-lg font-semibold">Variation Manager</h3>
          <p className="text-gray-600">Track project variations and cost impacts</p>
        </div>
        <Button onClick={() => setShowNewVariation(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Variation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              ${variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.cost_impact, 0).toLocaleString()}
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

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">{variations.length}</div>
            <div className="text-sm text-gray-600">Total Variations</div>
          </CardContent>
        </Card>
      </div>

      {/* New Variation Form */}
      {showNewVariation && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Variation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVariation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variationTitle">Variation Title</Label>
                  <Input
                    id="variationTitle"
                    value={newVariation.title}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of variation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submittedBy">Submitted By</Label>
                  <Input
                    id="submittedBy"
                    value={newVariation.submittedBy}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, submittedBy: e.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newVariation.location}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Specific location within the project (e.g., Unit 3A, Level 2, Kitchen)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={newVariation.description}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the variation including scope and requirements"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costImpact">Cost Impact ($)</Label>
                  <Input
                    id="costImpact"
                    type="number"
                    value={newVariation.costImpact}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, costImpact: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeImpact">Time Impact (days)</Label>
                  <Input
                    id="timeImpact"
                    type="number"
                    value={newVariation.timeImpact}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, timeImpact: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newVariation.priority} onValueChange={(value) => setNewVariation(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newVariation.category} onValueChange={(value) => setNewVariation(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="fixtures">Fixtures & Fittings</SelectItem>
                      <SelectItem value="finishes">Finishes</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={newVariation.clientEmail}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification / Reason for Variation</Label>
                <Textarea
                  id="justification"
                  value={newVariation.justification}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, justification: e.target.value }))}
                  placeholder="Explain why this variation is necessary or requested"
                  rows={2}
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('attachments')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </Button>
                  <span className="text-sm text-gray-600">
                    PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
                  </span>
                </div>

                {/* Display attached files */}
                {attachedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Label>Attached Files:</Label>
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Submit Variation</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewVariation(false)}>
                  Cancel
                </Button>
              </div>
            </form>
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
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variations Yet</h3>
              <p className="text-gray-600 mb-4">Create your first variation to get started</p>
              <Button onClick={() => setShowNewVariation(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Variation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cost Impact</TableHead>
                  <TableHead>Time Impact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Client Email</TableHead>
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
                    <TableCell>{variation.submitted_by}</TableCell>
                    <TableCell>{variation.submitted_date}</TableCell>
                    <TableCell className={variation.cost_impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(variation.cost_impact)}
                    </TableCell>
                    <TableCell>
                      {variation.time_impact > 0 ? `+${variation.time_impact}d` : variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                    </TableCell>
                    <TableCell>{getStatusBadge(variation.status)}</TableCell>
                    <TableCell>{getPriorityBadge(variation.priority)}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {variation.client_email || 'No email'}
                    </TableCell>
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
                        <Button variant="ghost" size="sm" title="View Details">
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
    </div>
  );
};

export default VariationManager;
