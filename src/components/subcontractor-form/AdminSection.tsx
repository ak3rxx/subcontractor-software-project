
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock } from 'lucide-react';

interface AdminSectionProps {
  formData: {
    approvedBy: string;
    approvedDate: string;
    adminNotes: string;
  };
  onInputChange: (field: string, value: string) => void;
  isAdminView?: boolean;
}

const AdminSection: React.FC<AdminSectionProps> = ({
  formData,
  onInputChange,
  isAdminView = false
}) => {
  const teamMembers = [
    'John Smith - Project Manager',
    'Sarah Johnson - Office Manager',
    'Mike Wilson - Safety Coordinator',
    'Lisa Brown - Operations Manager'
  ];

  if (!isAdminView) {
    return null;
  }

  return (
    <div className="space-y-4 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
        <Lock className="h-5 w-5" />
        Internal Use (Admin Only)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="approvedBy">Approved By</Label>
          <Select value={formData.approvedBy} onValueChange={(value) => onInputChange('approvedBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member} value={member}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="approvedDate">Approved Date</Label>
          <Input
            id="approvedDate"
            type="date"
            value={formData.approvedDate}
            onChange={(e) => onInputChange('approvedDate', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminNotes">Notes (Optional)</Label>
        <Textarea
          id="adminNotes"
          placeholder="Add any internal notes about this submission..."
          value={formData.adminNotes}
          onChange={(e) => onInputChange('adminNotes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default AdminSection;
