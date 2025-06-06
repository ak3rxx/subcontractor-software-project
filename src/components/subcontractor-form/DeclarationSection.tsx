
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText } from 'lucide-react';

interface DeclarationSectionProps {
  formData: {
    companyName: string;
    abn: string;
    documentsCurrentAndTrue: boolean;
    complySafety: boolean;
    authorizedRepresentative: boolean;
    signatureDate: string;
    signatureFullName: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const DeclarationSection: React.FC<DeclarationSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Declaration
      </h3>
      
      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="documentsCurrentAndTrue"
            checked={formData.documentsCurrentAndTrue}
            onCheckedChange={(checked) => onInputChange('documentsCurrentAndTrue', checked as boolean)}
          />
          <Label htmlFor="documentsCurrentAndTrue" className="text-sm leading-5">
            I declare all documents are current and true
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="complySafety"
            checked={formData.complySafety}
            onCheckedChange={(checked) => onInputChange('complySafety', checked as boolean)}
          />
          <Label htmlFor="complySafety" className="text-sm leading-5">
            I agree to comply with site policies and safety requirements and the DC2 Subcontractor policies agreement
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="authorizedRepresentative"
            checked={formData.authorizedRepresentative}
            onCheckedChange={(checked) => onInputChange('authorizedRepresentative', checked as boolean)}
          />
          <Label htmlFor="authorizedRepresentative" className="text-sm leading-5">
            I am an authorized representative of the company and have authority to sign on behalf of{' '}
            <span className="font-semibold">
              {formData.companyName || '[Company Name]'} - ABN: {formData.abn || '[ABN]'}
            </span>
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signatureFullName">Full Name (Digital Signature)</Label>
          <Input
            id="signatureFullName"
            placeholder="Enter full name"
            value={formData.signatureFullName}
            onChange={(e) => onInputChange('signatureFullName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signatureDate">Date</Label>
          <Input
            id="signatureDate"
            type="date"
            value={formData.signatureDate}
            onChange={(e) => onInputChange('signatureDate', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default DeclarationSection;
