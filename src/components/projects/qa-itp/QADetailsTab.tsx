import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import QACrossModuleIntegration from './QACrossModuleIntegration';

interface QADetailsTabProps {
  inspection: any;
  editData: any;
  isEditing: boolean;
  onDataChange: (changes: any) => void;
}

const QADetailsTab: React.FC<QADetailsTabProps> = ({
  inspection,
  editData,
  isEditing,
  onDataChange
}) => {
  const currentData = isEditing ? editData : inspection;

  return (
    <div className="space-y-6 overflow-y-auto h-full">
      <QACrossModuleIntegration inspection={inspection} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inspection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Project</Label>
              <div className="mt-1">
                <div className="px-3 py-2 bg-muted rounded-md text-sm">
                  {currentData.project_name}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="task_area">Task Area</Label>
              {isEditing ? (
                <Input
                  id="task_area"
                  value={currentData.task_area || ''}
                  onChange={(e) => onDataChange({ task_area: e.target.value })}
                />
              ) : (
                <div className="mt-1">
                  <div className="px-3 py-2 bg-muted rounded-md text-sm">
                    {currentData.task_area}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="location_reference">Location</Label>
              {isEditing ? (
                <Input
                  id="location_reference"
                  value={currentData.location_reference || ''}
                  onChange={(e) => onDataChange({ location_reference: e.target.value })}
                />
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{currentData.location_reference}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="inspection_type">Inspection Type</Label>
              {isEditing ? (
                <Select value={currentData.inspection_type} onValueChange={(value) => onDataChange({ inspection_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post-installation">Post Installation</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
                    {currentData.inspection_type?.replace('-', ' ')}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="template_type">Template</Label>
              {isEditing ? (
                <Select value={currentData.template_type} onValueChange={(value) => onDataChange({ template_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doors-jambs-hardware">Doors, Jambs & Hardware</SelectItem>
                    <SelectItem value="skirting">Skirting</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
                    {currentData.template_type?.replace('-', ' ')}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="inspector_name">Inspector</Label>
              {isEditing ? (
                <Input
                  id="inspector_name"
                  value={currentData.inspector_name || ''}
                  onChange={(e) => onDataChange({ inspector_name: e.target.value })}
                />
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{currentData.inspector_name}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="inspection_date">Inspection Date</Label>
              {isEditing ? (
                <Input
                  id="inspection_date"
                  type="date"
                  value={currentData.inspection_date || ''}
                  onChange={(e) => onDataChange({ inspection_date: e.target.value })}
                />
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {currentData.inspection_date ? format(new Date(currentData.inspection_date), 'dd/MM/yyyy') : 'Not set'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-1">
                <Badge 
                  className={
                    currentData.overall_status === 'pass' ? 'bg-green-100 text-green-800' :
                    currentData.overall_status === 'fail' ? 'bg-red-100 text-red-800' :
                    currentData.overall_status === 'pending-reinspection' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }
                >
                  {currentData.overall_status?.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            {currentData.is_fire_door && (
              <div className="col-span-full">
                <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                  🔥 Fire Door Inspection
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Digital Signature</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div>
              <Label htmlFor="digital_signature">Signature</Label>
              <Input
                id="digital_signature"
                value={currentData.digital_signature || ''}
                onChange={(e) => onDataChange({ digital_signature: e.target.value })}
                placeholder="Enter inspector signature"
              />
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-mono text-lg">{currentData.digital_signature}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Signed by {currentData.inspector_name} on {currentData.inspection_date ? format(new Date(currentData.inspection_date), 'dd/MM/yyyy') : 'Not set'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QADetailsTab;