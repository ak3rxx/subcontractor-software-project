
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdditionalInformationProps {
  formData: {
    justification: string;
    clientEmail: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const AdditionalInformation: React.FC<AdditionalInformationProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="justification">Justification</Label>
          <Textarea
            id="justification"
            value={formData.justification}
            onChange={(e) => onInputChange('justification', e.target.value)}
            rows={3}
            placeholder="Provide justification for this variation"
          />
        </div>
        <div>
          <Label htmlFor="clientEmail">Client Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => onInputChange('clientEmail', e.target.value)}
            placeholder="client@example.com"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalInformation;
