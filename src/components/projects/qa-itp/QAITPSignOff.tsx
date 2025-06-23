
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QAITPSignOffProps {
  formData: {
    inspectorName: string;
    inspectionDate: string;
    digitalSignature: string;
    overallStatus: string;
  };
  onFormDataChange: (field: string, value: string) => void;
}

const QAITPSignOff: React.FC<QAITPSignOffProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign-Off Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspectorName">Inspector Name</Label>
            <Input
              id="inspectorName"
              value={formData.inspectorName}
              onChange={(e) => onFormDataChange('inspectorName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspectionDate">Inspection Date</Label>
            <Input
              id="inspectionDate"
              type="date"
              value={formData.inspectionDate}
              onChange={(e) => onFormDataChange('inspectionDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="digitalSignature">Digital Signature *</Label>
          <Textarea
            id="digitalSignature"
            placeholder="Type your full legal name here as your digital signature"
            value={formData.digitalSignature}
            onChange={(e) => onFormDataChange('digitalSignature', e.target.value)}
            className="min-h-[80px] font-cursive italic border-2 border-blue-200 bg-blue-50"
            required
          />
          <p className="text-xs text-gray-600">
            By typing your name above, you are providing a legally binding digital signature
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="overallStatus">Overall Status</Label>
          <Select value={formData.overallStatus} onValueChange={(value) => onFormDataChange('overallStatus', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select overall status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
              <SelectItem value="incomplete-in-progress">Incomplete/In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Any changes to Pass/Fail/N/A selections will be automatically recorded with timestamps for audit purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QAITPSignOff;
