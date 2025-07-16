import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, CheckCircle, Clock, Save, AlertTriangle, 
  FileText, User, Calendar, MapPin 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationRule {
  field: string;
  label: string;
  required: boolean;
  validator?: (value: any) => string | null;
  icon?: React.ReactNode;
  category: 'basic' | 'details' | 'checklist' | 'signature';
}

interface QAFormValidationProps {
  formData: Record<string, any>;
  checklist: Array<{ id: string; status?: string; evidenceFiles?: any[] }>;
  onFieldFocus?: (field: string) => void;
  onSaveDraft?: () => void;
  className?: string;
  enableAutoSave?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
}

const QAFormValidation: React.FC<QAFormValidationProps> = ({
  formData,
  checklist,
  onFieldFocus,
  onSaveDraft,
  className,
  enableAutoSave = true,
  lastSaved,
  hasUnsavedChanges = false
}) => {
  
  const validationRules: ValidationRule[] = [
    // Basic Information
    { 
      field: 'projectId', 
      label: 'Project', 
      required: true, 
      icon: <FileText className="h-3 w-3" />,
      category: 'basic'
    },
    { 
      field: 'taskArea', 
      label: 'Task Area', 
      required: true, 
      icon: <MapPin className="h-3 w-3" />,
      category: 'basic'
    },
    { 
      field: 'inspectorName', 
      label: 'Inspector Name', 
      required: true, 
      icon: <User className="h-3 w-3" />,
      category: 'basic'
    },
    { 
      field: 'inspectionDate', 
      label: 'Inspection Date', 
      required: true, 
      icon: <Calendar className="h-3 w-3" />,
      category: 'basic'
    },
    
    // Details
    { 
      field: 'building', 
      label: 'Building', 
      required: true, 
      category: 'details'
    },
    { 
      field: 'level', 
      label: 'Level', 
      required: true, 
      category: 'details'
    },
    { 
      field: 'buildingReference', 
      label: 'Building Reference', 
      required: false, 
      category: 'details'
    },
    
    // Signature
    { 
      field: 'digitalSignature', 
      label: 'Digital Signature', 
      required: true, 
      category: 'signature',
      validator: (value) => {
        if (!value || value.trim().length < 3) {
          return 'Signature must be at least 3 characters';
        }
        return null;
      }
    }
  ];

  // Validate each field
  const fieldValidation = validationRules.map(rule => {
    const value = formData[rule.field];
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    const customError = rule.validator ? rule.validator(value) : null;
    
    return {
      ...rule,
      isValid: !rule.required || (!isEmpty && !customError),
      isEmpty,
      error: customError,
      hasValue: !isEmpty
    };
  });

  // Checklist validation
  const checklistValidation = {
    total: checklist.length,
    completed: checklist.filter(item => item.status === 'pass' || item.status === 'fail').length,
    withEvidence: checklist.filter(item => item.evidenceFiles && item.evidenceFiles.length > 0).length,
    failed: checklist.filter(item => item.status === 'fail').length
  };

  // Overall completion calculation
  const basicFields = fieldValidation.filter(f => f.category === 'basic' && f.required);
  const detailFields = fieldValidation.filter(f => f.category === 'details' && f.required);
  const signatureFields = fieldValidation.filter(f => f.category === 'signature' && f.required);
  
  const basicComplete = basicFields.filter(f => f.isValid).length;
  const detailComplete = detailFields.filter(f => f.isValid).length;
  const signatureComplete = signatureFields.filter(f => f.isValid).length;
  const checklistComplete = checklistValidation.completed;

  const totalRequired = basicFields.length + detailFields.length + signatureFields.length + checklist.length;
  const totalCompleted = basicComplete + detailComplete + signatureComplete + checklistComplete;
  const completionPercentage = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

  // Missing fields
  const missingFields = fieldValidation.filter(f => f.required && !f.isValid);
  const missingChecklist = checklist.length - checklistValidation.completed;

  // Form readiness for submission
  const isReadyForSubmission = missingFields.length === 0 && missingChecklist === 0;
  const canSaveAsDraft = basicComplete >= 2; // At least project and task area

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Progress */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Form Completion</h3>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {completionPercentage.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-2 mb-2" />
          <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
            <div>Required Fields: {totalCompleted}/{totalRequired}</div>
            <div>Checklist Items: {checklistComplete}/{checklist.length}</div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-save Status */}
      {enableAutoSave && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges ? (
                  <>
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-700">Unsaved changes</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Saved {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Auto-save enabled</span>
                  </>
                )}
              </div>
              {onSaveDraft && canSaveAsDraft && (
                <Button size="sm" variant="outline" onClick={onSaveDraft}>
                  <Save className="h-3 w-3 mr-1" />
                  Save Draft
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Issues */}
      {missingFields.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-orange-900">Required Fields Missing</h3>
                <p className="text-xs text-orange-700">Complete these fields to proceed</p>
              </div>
            </div>
            <div className="space-y-2">
              {missingFields.map((field) => (
                <div key={field.field} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {field.icon}
                    <span className="text-sm text-orange-700">{field.label}</span>
                    {field.error && (
                      <Badge variant="destructive" className="text-xs">
                        {field.error}
                      </Badge>
                    )}
                  </div>
                  {onFieldFocus && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFieldFocus(field.field)}
                      className="text-orange-600 hover:text-orange-800 h-6 px-2"
                    >
                      Focus
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist Issues */}
      {missingChecklist > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-900">Checklist Incomplete</h3>
                <p className="text-xs text-amber-700">
                  {missingChecklist} items need inspection
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-amber-600">Completed:</span>
                <span className="ml-1 font-medium">{checklistValidation.completed}</span>
              </div>
              <div>
                <span className="text-amber-600">With Evidence:</span>
                <span className="ml-1 font-medium">{checklistValidation.withEvidence}</span>
              </div>
            </div>
            {checklistValidation.failed > 0 && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                {checklistValidation.failed} items failed inspection
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Status */}
      {isReadyForSubmission ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Ready for Submission</h3>
                <p className="text-xs text-green-700">All required fields and checklist items completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">In Progress</h3>
                <p className="text-xs text-gray-700">
                  Complete {missingFields.length + missingChecklist} more items to submit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QAFormValidation;