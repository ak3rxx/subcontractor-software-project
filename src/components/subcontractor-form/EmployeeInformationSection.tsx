
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

interface EmployeeInformationSectionProps {
  formData: {
    numberOfEmployees: string;
    numberOfApprentices: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const EmployeeInformationSection: React.FC<EmployeeInformationSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" />
        Employee Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numberOfEmployees">Number of Employees</Label>
          <Input
            id="numberOfEmployees"
            type="number"
            placeholder="Enter number of employees"
            value={formData.numberOfEmployees}
            onChange={(e) => onInputChange('numberOfEmployees', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfApprentices">Number of Apprentices/Trainees</Label>
          <Input
            id="numberOfApprentices"
            type="number"
            placeholder="Enter number of apprentices/trainees"
            value={formData.numberOfApprentices}
            onChange={(e) => onInputChange('numberOfApprentices', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeInformationSection;
