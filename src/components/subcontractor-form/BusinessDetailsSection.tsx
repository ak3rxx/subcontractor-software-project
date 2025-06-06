
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface BusinessDetailsSectionProps {
  formData: {
    gstRegistered: boolean;
    authorizedRepresentatives: string;
    tradeType: string;
    licenseNumber: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const BusinessDetailsSection: React.FC<BusinessDetailsSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <>
      {/* GST Registration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">GST Registration</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="gstRegistered"
            checked={formData.gstRegistered}
            onCheckedChange={(checked) => onInputChange('gstRegistered', checked as boolean)}
          />
          <Label htmlFor="gstRegistered">GST Registered</Label>
        </div>
      </div>

      {/* Business Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="authorizedRepresentatives">Authorized Representatives</Label>
            <Input
              id="authorizedRepresentatives"
              placeholder="Enter authorized representatives"
              value={formData.authorizedRepresentatives}
              onChange={(e) => onInputChange('authorizedRepresentatives', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeType">Trade Type</Label>
            <Select value={formData.tradeType} onValueChange={(value) => onInputChange('tradeType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select trade type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="drywall">Drywall</SelectItem>
                <SelectItem value="flooring">Flooring</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="concrete">Concrete</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="Enter license number"
              value={formData.licenseNumber}
              onChange={(e) => onInputChange('licenseNumber', e.target.value)}
              required
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessDetailsSection;
