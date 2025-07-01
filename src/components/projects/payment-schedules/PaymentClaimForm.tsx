
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { usePaymentClaims, type PaymentClaim } from '@/hooks/usePaymentClaims';

interface PaymentClaimFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: (claim: PaymentClaim) => void;
}

const PaymentClaimForm: React.FC<PaymentClaimFormProps> = ({
  projectId,
  onClose,
  onSuccess
}) => {
  const { createClaim } = usePaymentClaims();
  const [loading, setLoading] = useState(false);
  const [claimDate, setClaimDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    claimant_company_name: '',
    claimant_abn: '',
    claimant_acn: '',
    claimant_address: '',
    claimant_suburb: '',
    claimant_postcode: '',
    claimant_email: '',
    claim_number: '',
    claim_amount: 0,
    contract_number: '',
    claim_description: '',
    supporting_documents: []
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimDate) return;

    setLoading(true);
    try {
      const claimData = {
        ...formData,
        project_id: projectId,
        claim_received_date: format(claimDate, 'yyyy-MM-dd'),
        status: 'received' as const
      };

      const newClaim = await createClaim(claimData);
      if (onSuccess && newClaim) {
        onSuccess(newClaim);
      }
      onClose();
    } catch (error) {
      console.error('Error creating payment claim:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Record Payment Claim</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Claimant Company Name *</Label>
              <Input
                id="company-name"
                value={formData.claimant_company_name}
                onChange={(e) => handleInputChange('claimant_company_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="abn">ABN *</Label>
              <Input
                id="abn"
                value={formData.claimant_abn}
                onChange={(e) => handleInputChange('claimant_abn', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acn">ACN (if applicable)</Label>
              <Input
                id="acn"
                value={formData.claimant_acn}
                onChange={(e) => handleInputChange('claimant_acn', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.claimant_email}
                onChange={(e) => handleInputChange('claimant_email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Business Address *</Label>
            <Input
              id="address"
              value={formData.claimant_address}
              onChange={(e) => handleInputChange('claimant_address', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb *</Label>
              <Input
                id="suburb"
                value={formData.claimant_suburb}
                onChange={(e) => handleInputChange('claimant_suburb', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                value={formData.claimant_postcode}
                onChange={(e) => handleInputChange('claimant_postcode', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="claim-number">Claim Number *</Label>
              <Input
                id="claim-number"
                value={formData.claim_number}
                onChange={(e) => handleInputChange('claim_number', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim-amount">Claim Amount (incl. GST) *</Label>
              <Input
                id="claim-amount"
                type="number"
                step="0.01"
                value={formData.claim_amount}
                onChange={(e) => handleInputChange('claim_amount', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date Claim Received *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {claimDate ? format(claimDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={claimDate}
                    onSelect={setClaimDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-number">Contract Number</Label>
            <Input
              id="contract-number"
              value={formData.contract_number}
              onChange={(e) => handleInputChange('contract_number', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Claim Description</Label>
            <Textarea
              id="description"
              value={formData.claim_description}
              onChange={(e) => handleInputChange('claim_description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-600">
                Upload claim documents, invoices, and supporting evidence
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Choose Files
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Payment Claim'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentClaimForm;
