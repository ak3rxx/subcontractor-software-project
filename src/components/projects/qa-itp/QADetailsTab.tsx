
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, User, FileText, Flame } from 'lucide-react';

interface QADetailsTabProps {
  inspection: any;
  editData: any;
  isEditing: boolean;
  onDataChange: (changes: any) => void;
  recordChange?: (field: string, oldValue: string, newValue: string, changeType?: string, itemId?: string, itemDescription?: string) => void;
}

const QADetailsTab: React.FC<QADetailsTabProps> = ({
  inspection,
  editData,
  isEditing,
  onDataChange,
  recordChange
}) => {
  console.log('QA Details Tab: Rendering', {
    inspectionId: inspection?.id,
    isEditing,
    editDataKeys: Object.keys(editData || {}),
    hasOnDataChange: !!onDataChange
  });

  const handleFieldChange = (field: string, value: any) => {
    console.log(`QA Details Tab: Field change ${field} = ${value}`);
    
    // Record audit trail if in editing mode
    if (isEditing && recordChange) {
      const oldValue = editData[field] || inspection[field] || '';
      recordChange(field, String(oldValue), String(value), 'update', inspection?.id, `Details: ${field}`);
    }
    
    onDataChange({ [field]: value });
  };

  const displayData = isEditing ? { ...inspection, ...editData } : inspection;

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inspection Details
            </div>
            {!isEditing && (
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                View Mode
              </span>
            )}
            {isEditing && (
              <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Edit Mode - Changes Tracked
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name (Auto-selected)</Label>
              <div className="p-2 bg-gray-50 border rounded-md text-gray-700">
                {displayData.project_name}
              </div>
              <p className="text-xs text-muted-foreground">Project cannot be changed from inspection details</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_area">Task Area</Label>
              {isEditing ? (
                <Input
                  id="task_area"
                  value={editData.task_area || ''}
                  onChange={(e) => handleFieldChange('task_area', e.target.value)}
                  placeholder="Enter task area"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{displayData.task_area}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_reference" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Reference
              </Label>
              {isEditing ? (
                <Input
                  id="location_reference"
                  value={editData.location_reference || ''}
                  onChange={(e) => handleFieldChange('location_reference', e.target.value)}
                  placeholder="Enter location reference"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{displayData.location_reference}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection_type">Inspection Type</Label>
              {isEditing ? (
                <Select
                  value={editData.inspection_type || ''}
                  onValueChange={(value) => handleFieldChange('inspection_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inspection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-installation">Pre-installation</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-gray-50 rounded">{displayData.inspection_type}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_type">Template Type</Label>
              {isEditing ? (
                <Select
                  value={editData.template_type || ''}
                  onValueChange={(value) => handleFieldChange('template_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doors-jambs-hardware">Doors, Jambs & Hardware</SelectItem>
                    <SelectItem value="skirting">Skirting</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-gray-50 rounded">{displayData.template_type}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade">Trade</Label>
              {isEditing ? (
                <Select
                  value={editData.trade || ''}
                  onValueChange={(value) => handleFieldChange('trade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carpentry">Carpentry</SelectItem>
                    <SelectItem value="tiling">Tiling</SelectItem>
                    <SelectItem value="painting">Painting</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="rendering">Rendering</SelectItem>
                    <SelectItem value="builder">Builder</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-gray-50 rounded capitalize">{displayData.trade || 'Not specified'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Inspector Name
              </Label>
              {isEditing ? (
                <Input
                  id="inspector_name"
                  value={editData.inspector_name || ''}
                  onChange={(e) => handleFieldChange('inspector_name', e.target.value)}
                  placeholder="Enter inspector name"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{displayData.inspector_name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection_date" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Inspection Date
              </Label>
              {isEditing ? (
                <Input
                  id="inspection_date"
                  type="date"
                  value={editData.inspection_date || ''}
                  onChange={(e) => handleFieldChange('inspection_date', e.target.value)}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{displayData.inspection_date}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall_status">Overall Status</Label>
              {isEditing ? (
                <Select
                  value={editData.overall_status || ''}
                  onValueChange={(value) => handleFieldChange('overall_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
                    <SelectItem value="incomplete-in-progress">In Progress</SelectItem>
                    <SelectItem value="incomplete-draft">Incomplete Draft</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-gray-50 rounded">
                  <Badge 
                    className={
                      displayData.overall_status === 'pass' ? 'bg-green-100 text-green-800' :
                      displayData.overall_status === 'fail' ? 'bg-red-100 text-red-800' :
                      displayData.overall_status === 'pending-reinspection' ? 'bg-orange-100 text-orange-800' :
                      displayData.overall_status === 'incomplete-draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {displayData.overall_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Checkbox
                  id="is_fire_door"
                  checked={editData.is_fire_door || false}
                  onCheckedChange={(checked) => handleFieldChange('is_fire_door', checked)}
                />
              ) : (
                <Checkbox
                  id="is_fire_door"
                  checked={displayData.is_fire_door || false}
                  disabled
                />
              )}
              <Label htmlFor="is_fire_door" className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                Fire Door Inspection
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="digital_signature">Digital Signature</Label>
            {isEditing ? (
              <Input
                id="digital_signature"
                value={editData.digital_signature || ''}
                onChange={(e) => handleFieldChange('digital_signature', e.target.value)}
                placeholder="Enter digital signature"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded">{displayData.digital_signature}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(QADetailsTab);
