import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, AlertTriangle, CheckCircle, Upload, Clock } from 'lucide-react';
import { format, differenceInBusinessDays } from 'date-fns';
import { usePaymentClaims, type PaymentClaim } from '@/hooks/usePaymentClaims';
import { usePaymentSchedules, type PaymentSchedule, type WithholdingSuggestion } from '@/hooks/usePaymentSchedules';

interface PaymentScheduleFormProps {
  projectId: string;
  paymentClaim: PaymentClaim;
  onClose: () => void;
  onSuccess?: (schedule: PaymentSchedule) => void;
}

const PaymentScheduleForm: React.FC<PaymentScheduleFormProps> = ({
  projectId,
  paymentClaim,
  onClose,
  onSuccess
}) => {
  const { createSchedule, getWithholdingSuggestions } = usePaymentSchedules();
  const [loading, setLoading] = useState(false);
  const [witholdingSuggestions, setWitholdingSuggestions] = useState<WithholdingSuggestion[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    respondent_company_name: '',
    respondent_abn: '',
    respondent_acn: '',
    respondent_address: '',
    respondent_suburb: '',
    respondent_postcode: '',
    respondent_email: '',
    scheduled_amount: paymentClaim.claim_amount,
    withheld_amount: 0,
    contract_clauses: '',
    service_method: 'email' as const,
    service_proof: '',
    supporting_evidence: []
  });

  const legalDeadline = new Date(paymentClaim.claim_received_date);
  legalDeadline.setDate(legalDeadline.getDate() + 14); // Approximate 10 business days
  
  const daysRemaining = differenceInBusinessDays(legalDeadline, new Date());
  const isUrgent = daysRemaining <= 3;
  const isOverdue = daysRemaining < 0;

  useEffect(() => {
    const loadSuggestions = async () => {
      const suggestions = await getWithholdingSuggestions(projectId);
      setWitholdingSuggestions(suggestions.filter(s => s.confidence_score > 0.3));
    };
    loadSuggestions();
  }, [projectId]);

  useEffect(() => {
    const scheduledAmount = paymentClaim.claim_amount - formData.withheld_amount;
    setFormData(prev => ({ ...prev, scheduled_amount: Math.max(0, scheduledAmount) }));
  }, [formData.withheld_amount, paymentClaim.claim_amount]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReasonToggle = (reason: string, checked: boolean) => {
    if (checked) {
      setSelectedReasons(prev => [...prev, reason]);
    } else {
      setSelectedReasons(prev => prev.filter(r => r !== reason));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const scheduleData = {
        ...formData,
        project_id: projectId,
        payment_claim_id: paymentClaim.id,
        withholding_reasons: selectedReasons.map(reason => ({ reason, manual: true })),
        status: 'draft' as const
      };

      const newSchedule = await createSchedule(scheduleData);
      if (onSuccess && newSchedule) {
        // Transform the response to match our interface
        const transformedSchedule: PaymentSchedule = {
          ...newSchedule,
          withholding_reasons: Array.isArray(newSchedule.withholding_reasons) 
            ? newSchedule.withholding_reasons 
            : newSchedule.withholding_reasons ? JSON.parse(newSchedule.withholding_reasons as string) : [],
          supporting_evidence: Array.isArray(newSchedule.supporting_evidence) 
            ? newSchedule.supporting_evidence 
            : newSchedule.supporting_evidence ? JSON.parse(newSchedule.supporting_evidence as string) : [],
          service_method: (newSchedule.service_method as 'email' | 'post' | 'in-person') || 'email',
          status: (newSchedule.status as 'draft' | 'sent' | 'delivered') || 'draft'
        };
        onSuccess(transformedSchedule);
      }
      onClose();
    } catch (error) {
      console.error('Error creating payment schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Legal Deadline Alert */}
      <Card className={`${isOverdue ? 'bg-red-50 border-red-200' : isUrgent ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : isUrgent ? (
                <Clock className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-medium">
                Legal Deadline: {format(legalDeadline, 'PPP')}
              </span>
            </div>
            <Badge variant={isOverdue ? 'destructive' : isUrgent ? 'default' : 'secondary'}>
              {isOverdue ? 'OVERDUE' : `${daysRemaining} days remaining`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claimant Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Claimant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">Company:</Label>
              <div>{paymentClaim.claimant_company_name}</div>
            </div>
            <div>
              <Label className="font-medium">ABN:</Label>
              <div>{paymentClaim.claimant_abn}</div>
            </div>
            <div>
              <Label className="font-medium">Address:</Label>
              <div>{paymentClaim.claimant_address}, {paymentClaim.claimant_suburb} {paymentClaim.claimant_postcode}</div>
            </div>
            <div>
              <Label className="font-medium">Email:</Label>
              <div>{paymentClaim.claimant_email}</div>
            </div>
            <div>
              <Label className="font-medium">Claim Amount:</Label>
              <div className="text-lg font-semibold">${paymentClaim.claim_amount.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Respondent Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Respondent (Your Company) Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="respondent-company">Company Name *</Label>
                <Input
                  id="respondent-company"
                  value={formData.respondent_company_name}
                  onChange={(e) => handleInputChange('respondent_company_name', e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="respondent-abn">ABN *</Label>
                  <Input
                    id="respondent-abn"
                    value={formData.respondent_abn}
                    onChange={(e) => handleInputChange('respondent_abn', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="respondent-acn">ACN</Label>
                  <Input
                    id="respondent-acn"
                    value={formData.respondent_acn}
                    onChange={(e) => handleInputChange('respondent_acn', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="respondent-address">Business Address *</Label>
                <Input
                  id="respondent-address"
                  value={formData.respondent_address}
                  onChange={(e) => handleInputChange('respondent_address', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="respondent-suburb">Suburb *</Label>
                  <Input
                    id="respondent-suburb"
                    value={formData.respondent_suburb}
                    onChange={(e) => handleInputChange('respondent_suburb', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="respondent-postcode">Postcode *</Label>
                  <Input
                    id="respondent-postcode"
                    value={formData.respondent_postcode}
                    onChange={(e) => handleInputChange('respondent_postcode', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="respondent-email">Contact Email *</Label>
                <Input
                  id="respondent-email"
                  type="email"
                  value={formData.respondent_email}
                  onChange={(e) => handleInputChange('respondent_email', e.target.value)}
                  required
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Claim Amount</Label>
                <div className="text-lg font-semibold p-2 bg-gray-100 rounded">
                  ${paymentClaim.claim_amount.toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="withheld-amount">Withheld Amount</Label>
                <Input
                  id="withheld-amount"
                  type="number"
                  step="0.01"
                  value={formData.withheld_amount}
                  onChange={(e) => handleInputChange('withheld_amount', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Scheduled Amount to Pay</Label>
                <div className="text-lg font-semibold p-2 bg-green-100 rounded">
                  ${formData.scheduled_amount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* AI-Powered Withholding Suggestions */}
            {witholdingSuggestions.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <Label className="text-base font-medium">🧠 Smart Withholding Suggestions</Label>
                  <div className="text-sm text-gray-600 mb-3">
                    Based on project data analysis
                  </div>
                  <div className="space-y-2">
                    {witholdingSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox
                          id={`suggestion-${index}`}
                          checked={selectedReasons.includes(suggestion.reason)}
                          onCheckedChange={(checked) => 
                            handleReasonToggle(suggestion.reason, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <label htmlFor={`suggestion-${index}`} className="font-medium cursor-pointer">
                            {suggestion.reason}
                          </label>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(suggestion.confidence_score * 100)}% confidence
                            </Badge>
                            {suggestion.evidence_count > 0 && (
                              <span>{suggestion.evidence_count} evidence items found</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Withholding Reasons */}
            <div className="space-y-4">
              <Separator />
              <div>
                <Label className="text-base font-medium">Additional Withholding Reasons</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {[
                    'Defective Works',
                    'Not Yet Due',
                    'Overclaimed Quantity',
                    'Supporting Documents not provided',
                    'Dispute over work quality',
                    'Incomplete work'
                  ].map(reason => (
                    <div key={reason} className="flex items-center space-x-2">
                      <Checkbox
                        id={reason}
                        checked={selectedReasons.includes(reason)}
                        onCheckedChange={(checked) => 
                          handleReasonToggle(reason, checked as boolean)
                        }
                      />
                      <Label htmlFor={reason} className="cursor-pointer">{reason}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-clauses">Contract Clauses Reference</Label>
              <Textarea
                id="contract-clauses"
                placeholder="e.g., Clause 12 - Progress Payments, Clause 15 - Defects Liability"
                value={formData.contract_clauses}
                onChange={(e) => handleInputChange('contract_clauses', e.target.value)}
                rows={2}
              />
            </div>

            {/* Service Method */}
            <div className="space-y-4">
              <Separator />
              <div>
                <Label className="text-base font-medium">Schedule Delivery Method</Label>
                <Select
                  value={formData.service_method}
                  onValueChange={(value) => handleInputChange('service_method', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="in-person">In-person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Supporting Evidence Upload */}
            <div className="space-y-2">
              <Label>Supporting Evidence</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <div className="text-sm text-gray-600">
                  Upload defect reports, QA non-conformance, delay notices, correspondence
                </div>
                <Button variant="outline" size="sm" className="mt-2" type="button">
                  Choose Files
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Generate Payment Schedule'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentScheduleForm;
