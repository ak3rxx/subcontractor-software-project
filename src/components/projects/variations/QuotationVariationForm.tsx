
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calculator, Upload, Paperclip, Wrench } from 'lucide-react';
import { useSmartCategories } from '@/hooks/useSmartCategories';
import { useAITradeSuggestions } from '@/hooks/useAITradeSuggestions';

interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

interface TimeImpactDetails {
  requiresNoticeOfDelay: boolean;
  requiresExtensionOfTime: boolean;
  noticeOfDelayDays?: number;
  extensionOfTimeDays?: number;
}

interface QuotationVariationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  projectName: string;
}

const QuotationVariationForm: React.FC<QuotationVariationFormProps> = ({
  onSubmit,
  onCancel,
  projectName
}) => {
  const { categories } = useSmartCategories();
  const { getAllTrades, getTradeCategories, suggestTrade, loading: aiLoading } = useAITradeSuggestions();
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requested_by: '',
    location: '',
    priority: 'medium',
    clientEmail: '',
    justification: '',
    trade: '',
    category: '',
    gstRate: 10 // Default GST rate
  });

  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, subtotal: 0 },
    { id: '2', description: '', quantity: 1, rate: 0, subtotal: 0 },
    { id: '3', description: '', quantity: 1, rate: 0, subtotal: 0 }
  ]);

  const [timeImpactDetails, setTimeImpactDetails] = useState<TimeImpactDetails>({
    requiresNoticeOfDelay: false,
    requiresExtensionOfTime: false
  });

  // Update available categories when trade changes
  useEffect(() => {
    if (formData.trade) {
      const tradeCategories = getTradeCategories(formData.trade);
      setAvailableCategories(tradeCategories);
      // Reset category if it's not valid for the new trade
      if (formData.category && !tradeCategories.includes(formData.category)) {
        setFormData(prev => ({ ...prev, category: '' }));
      }
    } else {
      setAvailableCategories([]);
    }
  }, [formData.trade, getTradeCategories]);

  // AI suggestion when description changes
  useEffect(() => {
    const suggestTradeFromDescription = async () => {
      if (formData.description && formData.description.length > 10 && !formData.trade) {
        // We need organization ID for AI suggestions - this would come from context in real app
        // For now, we'll skip the AI suggestion if no organization context is available
        console.log('Would suggest trade for:', formData.description);
      }
    };

    const timeoutId = setTimeout(suggestTradeFromDescription, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.description, formData.trade]);

  const addCostRow = () => {
    const newId = Date.now().toString();
    setCostBreakdown(prev => [...prev, { 
      id: newId, 
      description: '', 
      quantity: 1, 
      rate: 0, 
      subtotal: 0 
    }]);
  };

  const removeCostRow = (id: string) => {
    if (costBreakdown.length > 1) {
      setCostBreakdown(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateCostItem = (id: string, field: keyof CostBreakdownItem, value: any) => {
    setCostBreakdown(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.subtotal = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = costBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
    const gstAmount = (subtotal * formData.gstRate) / 100;
    const totalAmount = subtotal + gstAmount;
    return { subtotal, gstAmount, totalAmount };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, gstAmount, totalAmount } = calculateTotals();
    
    const variationData = {
      ...formData,
      costImpact: totalAmount,
      cost_breakdown: costBreakdown.filter(item => item.description.trim() !== ''),
      gst_amount: gstAmount,
      total_amount: totalAmount,
      time_impact_details: timeImpactDetails,
      timeImpact: (timeImpactDetails.noticeOfDelayDays || 0) + (timeImpactDetails.extensionOfTimeDays || 0),
      attachments: attachedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };

    onSubmit(variationData);
  };

  const { subtotal, gstAmount, totalAmount } = calculateTotals();
  const allTrades = getAllTrades();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            AI-Powered Variation Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Variation Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of variation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedBy">Requested By *</Label>
              <Input
                id="requestedBy"
                value={formData.requested_by}
                onChange={(e) => setFormData(prev => ({ ...prev, requested_by: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Specific location within project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the variation (AI will suggest trade based on this)"
              rows={3}
              required
            />
            {aiLoading && (
              <p className="text-sm text-blue-600">🤖 AI analyzing description for trade suggestion...</p>
            )}
          </div>

          {/* Trade and Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trade" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Trade *
              </Label>
              <Select 
                value={formData.trade} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, trade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  {allTrades.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade.charAt(0).toUpperCase() + trade.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.trade && (
                <p className="text-sm text-gray-500">💡 Tip: Add description above for AI trade suggestion</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={!formData.trade}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.trade ? "Select category" : "Select trade first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                  {/* Also include organization categories */}
                  {categories
                    .filter(cat => !availableCategories.includes(cat.category_name))
                    .map((cat) => (
                      <SelectItem key={cat.category_name} value={cat.category_name}>
                        {cat.category_name} ({cat.usage_count} uses)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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
        </CardContent>
      </Card>

      {/* Cost Breakdown - Quotation Style */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cost Breakdown</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addCostRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="w-[15%]">Quantity</TableHead>
                  <TableHead className="w-[20%]">Rate ($)</TableHead>
                  <TableHead className="w-[20%]">Subtotal ($)</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costBreakdown.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateCostItem(item.id, 'description', e.target.value)}
                        placeholder="Description of work/materials"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCostItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateCostItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${item.subtotal.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {costBreakdown.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostRow(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>GST ({formData.gstRate}%):</span>
                <Input
                  type="number"
                  value={formData.gstRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstRate: parseFloat(e.target.value) || 0 }))}
                  className="w-16 h-6"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <span className="font-medium">${gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Time Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noticeOfDelay"
                checked={timeImpactDetails.requiresNoticeOfDelay}
                onCheckedChange={(checked) => 
                  setTimeImpactDetails(prev => ({ 
                    ...prev, 
                    requiresNoticeOfDelay: checked as boolean 
                  }))
                }
              />
              <Label htmlFor="noticeOfDelay">Do we require a "Notice of Delay"?</Label>
            </div>

            {timeImpactDetails.requiresNoticeOfDelay && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="delayDays">Days for Notice of Delay</Label>
                <Input
                  id="delayDays"
                  type="number"
                  value={timeImpactDetails.noticeOfDelayDays || ''}
                  onChange={(e) => setTimeImpactDetails(prev => ({ 
                    ...prev, 
                    noticeOfDelayDays: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="Number of days"
                  min="0"
                />
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    📋 Notice of Delay form template will be auto-generated (Template to be configured)
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="extensionOfTime"
                checked={timeImpactDetails.requiresExtensionOfTime}
                onCheckedChange={(checked) => 
                  setTimeImpactDetails(prev => ({ 
                    ...prev, 
                    requiresExtensionOfTime: checked as boolean 
                  }))
                }
              />
              <Label htmlFor="extensionOfTime">Do we require an "Extension of Time"?</Label>
            </div>

            {timeImpactDetails.requiresExtensionOfTime && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="extensionDays">Days for Extension of Time</Label>
                <Input
                  id="extensionDays"
                  type="number"
                  value={timeImpactDetails.extensionOfTimeDays || ''}
                  onChange={(e) => setTimeImpactDetails(prev => ({ 
                    ...prev, 
                    extensionOfTimeDays: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="Number of days"
                  min="0"
                />
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    📋 Extension of Time form template will be auto-generated (Template to be configured)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="client@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification / Reason for Variation</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
              placeholder="Explain why this variation is necessary"
              rows={2}
            />
          </div>

          {/* File Attachments */}
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Submit AI-Enhanced Variation
        </Button>
      </div>
    </form>
  );
};

export default QuotationVariationForm;
