
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import BasicInformation from './BasicInformation';
import CostBreakdown from './CostBreakdown';
import TimeImpact from './TimeImpact';
import FileAttachments from './FileAttachments';
import AdditionalInformation from './AdditionalInformation';

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
  
  // Initialize form state
  const initialFormData = useMemo(() => ({
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
  }), []);

  const initialCostBreakdown = useMemo(() => ([
    { id: '1', description: '', quantity: 1, rate: 0, subtotal: 0 }
  ]), []);

  const [formData, setFormData] = useState(initialFormData);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>(initialCostBreakdown);
  const [gstRate, setGstRate] = useState(10);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    attachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment
  } = useVariationAttachments(editingVariation?.id || null);

  // Memoized functions to prevent re-renders
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const calculateTotals = useCallback(() => {
    const subtotal = costBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  }, [costBreakdown, gstRate]);

  // Initialize form data when editing variation changes
  useEffect(() => {
    if (editingVariation && !isInitialized) {
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

      setUploadedFiles([]);
      setIsInitialized(true);
    } else if (!editingVariation && isInitialized) {
      // Reset form for new variation
      setFormData(initialFormData);
      setCostBreakdown(initialCostBreakdown);
      setGstRate(10);
      setUploadedFiles([]);
      setIsInitialized(false);
    }
  }, [editingVariation, isInitialized, initialFormData, initialCostBreakdown]);

  // Reset initialization flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      setFormData(initialFormData);
      setCostBreakdown(initialCostBreakdown);
      setUploadedFiles([]);
      setIsInitialized(false);
      
      onClose();
    } catch (error) {
      console.error('Error submitting variation:', error);
    }
  }, [formData, costBreakdown, calculateTotals, onSubmit, uploadedFiles, editingVariation, uploadAttachment, toast, initialFormData, initialCostBreakdown, onClose]);

  const handleClose = useCallback(() => {
    setIsInitialized(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVariation ? 'Edit Variation' : 'Create New Variation'} - {projectName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInformation
            formData={formData}
            onInputChange={handleInputChange}
          />

          <CostBreakdown
            costBreakdown={costBreakdown}
            setCostBreakdown={setCostBreakdown}
            gstRate={gstRate}
            setGstRate={setGstRate}
          />

          <TimeImpact
            formData={formData}
            onInputChange={handleInputChange}
          />

          <FileAttachments
            editingVariation={editingVariation}
            attachments={attachments}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onDeleteAttachment={deleteAttachment}
            onDownloadAttachment={downloadAttachment}
          />

          <AdditionalInformation
            formData={formData}
            onInputChange={handleInputChange}
          />

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
