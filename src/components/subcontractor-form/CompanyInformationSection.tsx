
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building, MapPin } from 'lucide-react';

interface CompanyInformationSectionProps {
  formData: {
    companyName: string;
    abn: string;
    director: string;
    address: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const CompanyInformationSection: React.FC<CompanyInformationSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Company Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="companyName">Company Name in Full</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="companyName"
              placeholder="Enter full company name"
              value={formData.companyName}
              onChange={(e) => onInputChange('companyName', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abn">ABN</Label>
          <Input
            id="abn"
            placeholder="Enter ABN"
            value={formData.abn}
            onChange={(e) => onInputChange('abn', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="director">Director</Label>
          <Input
            id="director"
            placeholder="Enter director name"
            value={formData.director}
            onChange={(e) => onInputChange('director', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="address"
              placeholder="Enter complete business address"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInformationSection;
