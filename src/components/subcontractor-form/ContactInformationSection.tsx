
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Phone, Mail } from 'lucide-react';

interface ContactInformationSectionProps {
  formData: {
    mainTelephone: string;
    mobile: string;
    mainContactEmail: string;
    accountsContactEmail: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const ContactInformationSection: React.FC<ContactInformationSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mainTelephone">Main Office Telephone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="mainTelephone"
              placeholder="Enter main telephone"
              value={formData.mainTelephone}
              onChange={(e) => onInputChange('mainTelephone', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="mobile"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={(e) => onInputChange('mobile', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainContactEmail">Main Contact Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="mainContactEmail"
              type="email"
              placeholder="Enter main contact email"
              value={formData.mainContactEmail}
              onChange={(e) => onInputChange('mainContactEmail', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountsContactEmail">Accounts Contact Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="accountsContactEmail"
              type="email"
              placeholder="Enter accounts contact email"
              value={formData.accountsContactEmail}
              onChange={(e) => onInputChange('accountsContactEmail', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInformationSection;
