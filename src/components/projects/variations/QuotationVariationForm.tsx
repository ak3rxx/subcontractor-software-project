
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import BasicInformation from './BasicInformation';
import CostBreakdown from './CostBreakdown';
import TimeImpact from './TimeImpact';
import VariationFileUpload from './VariationFileUpload';
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
  const [isInitialized, setIsInitialized] = useState(false);

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

      setIsInitialized(true);
    } else if (!editingVariation && isInitialized) {
      // Reset form for new variation
      setFormData(initialFormData);
      setCostBreakdown(initialCostBreakdown);
      setGstRate(10);
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
      
      // Reset form
      setFormData(initialFormData);
      setCostBreakdown(initialCostBreakdown);
      setIsInitialized(false);
      
      onClose();
    } catch (error) {
      console.error('Error submitting variation:', error);
    }
  }, [formData, costBreakdown, calculateTotals, onSubmit, initialFormData, initialCostBreakdown, onClose]);

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

          <VariationFileUpload
            variationId={editingVariation?.id}
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
