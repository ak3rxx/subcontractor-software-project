
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Upload, X, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CategorySelector from './CategorySelector';
import SmartTradeSelector from './SmartTradeSelector';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';

interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

interface QuotationVariationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  projectName: string;
  editingVariation?: any;
}

const QuotationVariationForm: React.FC<QuotationVariationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  editingVariation
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    trade: '',
    priority: 'medium',
    clientEmail: '',
    justification: '',
    requires_eot: false,
    requires_nod: false,
    eot_days: 0,
    nod_days: 0
  });

  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, subtotal: 0 }
  ]);
  const [gstRate, setGstRate] = useState(10);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize variation attachments hook with proper fallback
  const variationAttachments = editingVariation ? 
    useVariationAttachments(editingVariation.id) : 
    { 
      attachments: [], 
      uploadAttachment: null, 
      deleteAttachment: null, 
      loading: false, 
      fetchAttachments: async () => {},
      downloadAttachment: async () => {}
    };

  const { attachments, uploadAttachment, deleteAttachment, loading: attachmentsLoading, fetchAttachments } = variationAttachments;

  useEffect(() => {
    if (editingVariation) {
      setFormData({
        title: editingVariation.title || '',
        description: editingVariation.description || '',
        location: editingVariation.location || '',
        category: editingVariation.category || '',
        trade: editingVariation.trade || '',
        priority: editingVariation.priority || 'medium',
        clientEmail: editingVariation.client_email || '',
        justification: editingVariation.justification || '',
        requires_eot: editingVariation.requires_eot || false,
        requires_nod: editingVariation.requires_nod || false,
        eot_days: editingVariation.eot_days || 0,
        nod_days: editingVariation.nod_days || 0
      });

      if (editingVariation.cost_breakdown && editingVariation.cost_breakdown.length > 0) {
        setCostBreakdown(editingVariation.cost_breakdown);
      }

      // Fetch attachments for editing variation
      if (editingVariation.id && fetchAttachments) {
        fetchAttachments();
      }
    } else {
      // Reset form for new variation
      setFormData({
        title: '',
        description: '',
        location: '',
        category: '',
        trade: '',
        priority: 'medium',
        clientEmail: '',
        justification: '',
        requires_eot: false,
        requires_nod: false,
        eot_days: 0,
        nod_days: 0
      });
      setCostBreakdown([{ id: '1', description: '', quantity: 1, rate: 0, subtotal: 0 }]);
      setGstRate(10);
      setUploadedFiles([]);
    }
  }, [editingVariation, fetchAttachments]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData, costBreakdown, uploadedFiles]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCostBreakdown = (index: number, field: keyof CostBreakdownItem, value: any) => {
    const updated = [...costBreakdown];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updated[index].subtotal = updated[index].quantity * updated[index].rate;
    }
    
    setCostBreakdown(updated);
  };

  const addCostItem = () => {
    setCostBreakdown(prev => [...prev, {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      subtotal: 0
    }]);
  };

  const removeCostItem = (index: number) => {
    if (costBreakdown.length > 1) {
      setCostBreakdown(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = costBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (deleteAttachment) {
      try {
        await deleteAttachment(attachmentId);
        toast({
          title: "Success",
          description: "Attachment deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete attachment",
          variant: "destructive"
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, gstAmount, total } = calculateTotals();
    
    const submissionData = {
      ...formData,
      cost_breakdown: costBreakdown,
      gst_amount: gstAmount,
      total_amount: total,
      costImpact: total,
      timeImpact: formData.requires_eot ? formData.eot_days : 0,
      time_impact_details: {
        requiresNoticeOfDelay: formData.requires_nod,
        requiresExtensionOfTime: formData.requires_eot,
        noticeOfDelayDays: formData.requires_nod ? formData.nod_days : undefined,
        extensionOfTimeDays: formData.requires_eot ? formData.eot_days : undefined,
      }
    };

    try {
      await onSubmit(submissionData);
      
      // Upload files if we have any and we're editing a variation
      if (uploadedFiles.length > 0 && editingVariation && uploadAttachment) {
        for (const file of uploadedFiles) {
          try {
            await uploadAttachment(file);
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            toast({
              title: "Warning",
              description: `Failed to upload ${file.name}`,
              variant: "destructive"
            });
          }
        }
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        category: '',
        trade: '',
        priority: 'medium',
        clientEmail: '',
        justification: '',
        requires_eot: false,
        requires_nod: false,
        eot_days: 0,
        nod_days: 0
      });
      setCostBreakdown([{ id: '1', description: '', quantity: 1, rate: 0, subtotal: 0 }]);
      setUploadedFiles([]);
      setHasUnsavedChanges(false);
      
      onClose();
    } catch (error) {
      console.error('Error submitting variation:', error);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    
    setHasUnsavedChanges(false);
    onClose();
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVariation ? 'Edit Variation' : 'Create New Variation'} - {projectName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Variation Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <CategorySelector
                    value={formData.category}
                    onChange={(value) => handleInputChange('category', value)}
                    selectedTrade={formData.trade}
                  />
                </div>
                <div>
                  <Label>Trade</Label>
                  <SmartTradeSelector
                    value={formData.trade}
                    onChange={(value) => handleInputChange('trade', value)}
                    description={formData.description}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {costBreakdown.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateCostBreakdown(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateCostBreakdown(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Rate ($)</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateCostBreakdown(index, 'rate', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Subtotal</Label>
                    <Input
                      value={`$${item.subtotal.toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCostItem(index)}
                      disabled={costBreakdown.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addCostItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <Label>GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label>Subtotal</Label>
                  <div className="text-lg font-semibold">${subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <Label>GST</Label>
                  <div className="text-lg font-semibold">${gstAmount.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="text-right">
                <Label>Total Amount</Label>
                <div className="text-2xl font-bold text-green-600">${total.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Time Impact */}
          <Card>
            <CardHeader>
              <CardTitle>Time Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_eot"
                    checked={formData.requires_eot}
                    onChange={(e) => handleInputChange('requires_eot', e.target.checked)}
                  />
                  <Label htmlFor="requires_eot">Requires Extension of Time (EOT)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_nod"
                    checked={formData.requires_nod}
                    onChange={(e) => handleInputChange('requires_nod', e.target.checked)}
                  />
                  <Label htmlFor="requires_nod">Requires Notice of Delay (NOD)</Label>
                </div>
              </div>

              {(formData.requires_eot || formData.requires_nod) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.requires_eot && (
                    <div>
                      <Label htmlFor="eot_days">EOT Days</Label>
                      <Input
                        id="eot_days"
                        type="number"
                        value={formData.eot_days}
                        onChange={(e) => handleInputChange('eot_days', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  )}
                  {formData.requires_nod && (
                    <div>
                      <Label htmlFor="nod_days">NOD Days</Label>
                      <Input
                        id="nod_days"
                        type="number"
                        value={formData.nod_days}
                        onChange={(e) => handleInputChange('nod_days', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>File Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing attachments (when editing) */}
              {editingVariation && attachments.length > 0 && (
                <div>
                  <Label>Existing Attachments</Label>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment.file_name}</span>
                          <Badge variant="outline">{(attachment.file_size / 1024 / 1024).toFixed(2)} MB</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New file uploads */}
              <div>
                <Label htmlFor="file-upload">Upload New Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <Label>Files to Upload</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingVariation ? 'Update Variation' : 'Create Variation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationVariationForm;
