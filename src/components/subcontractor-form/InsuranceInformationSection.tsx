
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield } from 'lucide-react';

interface InsuranceInformationSectionProps {
  formData: {
    workersCompensationAmount: string;
    publicLiabilityAmount: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const InsuranceInformationSection: React.FC<InsuranceInformationSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Insurance Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workersCompensationAmount">Workers Compensation Coverage Amount</Label>
          <Input
            id="workersCompensationAmount"
            placeholder="e.g., $1,000,000"
            value={formData.workersCompensationAmount}
            onChange={(e) => onInputChange('workersCompensationAmount', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicLiabilityAmount">Public Liability Coverage Amount</Label>
          <Input
            id="publicLiabilityAmount"
            placeholder="e.g., $10,000,000"
            value={formData.publicLiabilityAmount}
            onChange={(e) => onInputChange('publicLiabilityAmount', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default InsuranceInformationSection;
