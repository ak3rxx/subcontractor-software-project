
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Save, Edit, FileText, User, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQAInspections, QAInspection, QAChecklistItem } from '@/hooks/useQAInspections';

interface QAInspectionViewerProps {
  inspectionId: string;
  onClose: () => void;
  canEdit?: boolean;
}

const QAInspectionViewer: React.FC<QAInspectionViewerProps> = ({ 
  inspectionId, 
  onClose, 
  canEdit = true 
}) => {
  const { toast } = useToast();
  const { getChecklistItems, getInspectionById, updateInspection, refetch } = useQAInspections();
  const [inspection, setInspection] = useState<QAInspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<QAChecklistItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInspectionData();
  }, [inspectionId]);

  const fetchInspectionData = async () => {
    setLoading(true);
    try {
      const [inspectionData, items] = await Promise.all([
        getInspectionById(inspectionId),
        getChecklistItems(inspectionId)
      ]);
      
      setInspection(inspectionData);
      setChecklistItems(items);
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      toast({
        title: "Error",
        description: "Failed to load inspection data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistItemChange = (itemId: string, field: string, value: any) => {
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleInspectionFieldChange = (field: string, value: string) => {
    if (inspection) {
      setInspection(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleSave = async () => {
    if (!inspection) return;

    setSaving(true);
    try {
      await updateInspection(inspectionId, inspection, checklistItems);
      setEditMode(false);
      refetch();
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Reinspection</Badge>;
      case 'incomplete-in-progress':
        return <Badge className="bg-blue-100 text-blue-800">Incomplete/In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">✓ Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">✗ Fail</Badge>;
      case 'na':
        return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
      default:
        return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Loading Inspection...</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Inspection Not Found</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">The requested inspection could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            QA Inspection Details
          </h3>
          {canEdit && (
            <Button
              variant={editMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editMode ? 'Cancel Edit' : 'Edit Inspection'}
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Inspection Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Inspection Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600">Inspection Number</Label>
              <div className="font-mono text-sm">{inspection.inspection_number}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600">Project</Label>
              <div className="text-sm">{inspection.project_name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600">Overall Status</Label>
              {editMode ? (
                <Select 
                  value={inspection.overall_status} 
                  onValueChange={(value) => handleInspectionFieldChange('overall_status', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
                    <SelectItem value="incomplete-in-progress">Incomplete/In Progress</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                getStatusBadge(inspection.overall_status)
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Task Area
              </Label>
              {editMode ? (
                <Input
                  value={inspection.task_area}
                  onChange={(e) => handleInspectionFieldChange('task_area', e.target.value)}
                />
              ) : (
                <div className="text-sm">{inspection.task_area}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600">Location Reference</Label>
              {editMode ? (
                <Input
                  value={inspection.location_reference}
                  onChange={(e) => handleInspectionFieldChange('location_reference', e.target.value)}
                />
              ) : (
                <div className="text-sm">{inspection.location_reference}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <User className="h-3 w-3" />
                Inspector
              </Label>
              {editMode ? (
                <Input
                  value={inspection.inspector_name}
                  onChange={(e) => handleInspectionFieldChange('inspector_name', e.target.value)}
                />
              ) : (
                <div className="text-sm">{inspection.inspector_name}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Inspection Date
              </Label>
              {editMode ? (
                <Input
                  type="date"
                  value={inspection.inspection_date}
                  onChange={(e) => handleInspectionFieldChange('inspection_date', e.target.value)}
                />
              ) : (
                <div className="text-sm">{new Date(inspection.inspection_date).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No checklist items found for this inspection.</p>
            </div>
          ) : (
            checklistItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.description}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.requirements}</p>
                  </div>
                  <div className="ml-4">
                    {getItemStatusBadge(item.status)}
                  </div>
                </div>
                
                {editMode ? (
                  <div className="space-y-3">
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${item.id}-pass`}
                          checked={item.status === 'pass'}
                          onCheckedChange={(checked) => 
                            handleChecklistItemChange(item.id, 'status', checked ? 'pass' : '')
                          }
                        />
                        <Label htmlFor={`${item.id}-pass`} className="text-green-600">Pass</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${item.id}-fail`}
                          checked={item.status === 'fail'}
                          onCheckedChange={(checked) => 
                            handleChecklistItemChange(item.id, 'status', checked ? 'fail' : '')
                          }
                        />
                        <Label htmlFor={`${item.id}-fail`} className="text-red-600">Fail</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${item.id}-na`}
                          checked={item.status === 'na'}
                          onCheckedChange={(checked) => 
                            handleChecklistItemChange(item.id, 'status', checked ? 'na' : '')
                          }
                        />
                        <Label htmlFor={`${item.id}-na`} className="text-gray-600">N/A</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${item.id}-comments`}>Comments</Label>
                      <Textarea
                        id={`${item.id}-comments`}
                        value={item.comments || ''}
                        onChange={(e) => handleChecklistItemChange(item.id, 'comments', e.target.value)}
                        placeholder="Add comments..."
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  item.comments && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <Label className="text-sm font-medium text-gray-700">Comments:</Label>
                      <p className="text-sm text-gray-600 mt-1">{item.comments}</p>
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editMode && (
        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={() => setEditMode(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QAInspectionViewer;
