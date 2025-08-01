
import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, User, FileText, Flame } from 'lucide-react';
import { calculateOverallStatus, getStatusDisplayName, getStatusBadgeStyle } from '@/utils/qaStatusCalculation';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { useAutoTaskCreation } from '@/hooks/useAutoTaskCreation';
import { supabase } from '@/integrations/supabase/client';
import FieldAuditNote from './FieldAuditNote';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

  const { getChecklistItems } = useQAInspectionsSimple(inspection?.project_id);
  const { changeHistory, recordChange: recordAuditChange } = useQAChangeHistory(inspection?.id);
  const { createFailedQATask } = useAutoTaskCreation({ 
    enabled: true, 
    projectId: inspection?.project_id 
  });
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [autoCalculatedStatus, setAutoCalculatedStatus] = useState<string>('');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean>(false);

  // Fetch checklist items for auto status calculation
  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (inspection?.id) {
        try {
          const items = await getChecklistItems(inspection.id);
          setChecklistItems(items || []);
          
          // Auto-calculate status
          const calculatedStatus = calculateOverallStatus(items || []);
          setAutoCalculatedStatus(calculatedStatus);
          
          // Update database if calculated status differs from stored status
          if (calculatedStatus !== inspection.overall_status) {
            await updateDatabaseStatus(calculatedStatus);
          }
        } catch (error) {
          console.error('Error fetching checklist items:', error);
          setChecklistItems([]);
        }
      }
    };

    fetchChecklistItems();
  }, [inspection?.id, getChecklistItems, inspection?.overall_status]);

  // Function to update database status
  const updateDatabaseStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('qa_inspections')
        .update({ overall_status: newStatus })
        .eq('id', inspection.id);

      if (error) {
        console.error('Error updating inspection status:', error);
        return;
      }

      console.log('Updated inspection status in database:', newStatus);
      
      // Update parent component to sync modal header
      onDataChange({ overall_status: newStatus });
      
      // Record the status change in audit trail
      if (recordChange) {
        recordChange(
          'overall_status',
          inspection.overall_status,
          newStatus,
          'update',
          inspection.id,
          'Auto-calculated: Status updated based on checklist items completion'
        );
      }

      // Trigger auto-task creation for failed QA inspections
      if (newStatus === 'failed' && inspection.overall_status !== 'failed') {
        console.log('QA inspection failed, triggering auto-task creation');
        
        // Check if task already exists to avoid duplicates
        const { data: existingTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('linked_module', 'qa')
          .eq('linked_id', inspection.id)
          .eq('category', 'qa')
          .single();
          
        if (!existingTask && createFailedQATask) {
          createFailedQATask({
            ...inspection,
            overall_status: newStatus
          });
        }
      }
    } catch (error) {
      console.error('Failed to update inspection status:', error);
    }
  };

  // Set up real-time subscription for checklist items to update status badge
  useEffect(() => {
    if (!inspection?.id) return;

    // Prevent duplicate subscriptions
    if (subscriptionActive) {
      console.log('Checklist subscription already active for inspection:', inspection.id);
      return;
    }

    console.log('Setting up real-time subscription for checklist items:', inspection.id);

    // Clean up existing subscription
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }

    // Create new subscription with unique channel name
    const channelName = `qa_checklist_items:${inspection.id}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',  
          table: 'qa_checklist_items',
          filter: `inspection_id=eq.${inspection.id}`
        },
        async (payload) => {
          console.log('Real-time checklist item change:', payload);
          
          // Refetch checklist items and recalculate status
          try {
            const items = await getChecklistItems(inspection.id);
            setChecklistItems(items || []);
            
            // Auto-calculate status
            const calculatedStatus = calculateOverallStatus(items || []);
            setAutoCalculatedStatus(calculatedStatus);
            
            // Update database if calculated status differs from stored status
            if (calculatedStatus !== inspection.overall_status) {
              await updateDatabaseStatus(calculatedStatus);
            }
            
            console.log('Status recalculated:', calculatedStatus);
          } catch (error) {
            console.error('Error refetching checklist items:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Checklist items subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to checklist items updates');
          setSubscriptionActive(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Checklist items subscription error');
          setSubscriptionActive(false);
        } else if (status === 'CLOSED') {
          console.log('Checklist items subscription closed');
          setSubscriptionActive(false);
        }
      });

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        console.log('Cleaning up checklist items subscription');
        supabase.removeChannel(channel);
        setSubscriptionActive(false);
      }
    };
  }, [inspection?.id, getChecklistItems, subscriptionActive, realtimeChannel]);

  const handleFieldChange = (field: string, value: any) => {
    console.log(`QA Details Tab: Field change ${field} = ${value}`);
    
    // Record audit trail if in editing mode
    if (isEditing && recordAuditChange) {
      const oldValue = editData[field] || inspection[field] || '';
      recordAuditChange(field, String(oldValue), String(value), 'update', inspection?.id, `Details: ${field}`);
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
              <FieldAuditNote 
                fieldName="task_area" 
                changeHistory={changeHistory}
              />
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
              <FieldAuditNote 
                fieldName="location_reference" 
                changeHistory={changeHistory}
              />
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
              <FieldAuditNote 
                fieldName="inspection_type" 
                changeHistory={changeHistory}
              />
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
              <FieldAuditNote 
                fieldName="template_type" 
                changeHistory={changeHistory}
              />
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
              <FieldAuditNote 
                fieldName="trade" 
                changeHistory={changeHistory}
              />
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
              <FieldAuditNote 
                fieldName="inspector_name" 
                changeHistory={changeHistory}
              />
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
              <FieldAuditNote 
                fieldName="inspection_date" 
                changeHistory={changeHistory}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall_status">Overall Status (Auto-calculated)</Label>
              <div className="p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusBadgeStyle(autoCalculatedStatus || displayData.overall_status)}>
                    {getStatusDisplayName(autoCalculatedStatus || displayData.overall_status)}
                  </Badge>
                  {autoCalculatedStatus && autoCalculatedStatus !== displayData.overall_status && (
                    <span className="text-xs text-orange-600">
                      Auto-calculated: {getStatusDisplayName(autoCalculatedStatus)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Status automatically calculated based on checklist completion • Updates live
                </p>
              </div>
              <FieldAuditNote 
                fieldName="overall_status" 
                changeHistory={changeHistory}
                className="mt-2"
              />
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
            <FieldAuditNote 
              fieldName="is_fire_door" 
              changeHistory={changeHistory}
            />
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
            <FieldAuditNote 
              fieldName="digital_signature" 
              changeHistory={changeHistory}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(QADetailsTab);
