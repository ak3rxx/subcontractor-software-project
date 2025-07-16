import React from 'react';
import { CheckCircle, Circle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProcessStage {
  id: string;
  title: string;
  description: string;
  requiredFields: string[];
  optional?: boolean;
  estimatedTime?: string;
  nextActions?: string[];
}

interface QAProcessGuideProps {
  formData: any;
  checklist: any[];
  onStageAction?: (stageId: string, action: string) => void;
}

const PROCESS_STAGES: ProcessStage[] = [
  {
    id: 'project_info',
    title: 'Project Information',
    description: 'Basic project and inspection details',
    requiredFields: ['project_name', 'task_area', 'location_reference', 'inspection_date'],
    estimatedTime: '2-3 minutes',
    nextActions: ['Fill project details', 'Select inspection date']
  },
  {
    id: 'inspection_setup',
    title: 'Inspection Setup',
    description: 'Configure inspection parameters and template',
    requiredFields: ['inspection_type', 'template_type', 'inspector_name'],
    estimatedTime: '1-2 minutes',
    nextActions: ['Choose inspection type', 'Select template']
  },
  {
    id: 'checklist_completion',
    title: 'Checklist Completion',
    description: 'Complete all required inspection items',
    requiredFields: ['checklist_items'],
    estimatedTime: '10-20 minutes',
    nextActions: ['Review checklist items', 'Add evidence photos', 'Complete assessments']
  },
  {
    id: 'quality_review',
    title: 'Quality Review',
    description: 'Review and validate inspection results',
    requiredFields: ['overall_status'],
    estimatedTime: '3-5 minutes',
    nextActions: ['Review all items', 'Verify evidence', 'Set overall status']
  },
  {
    id: 'final_approval',
    title: 'Final Approval',
    description: 'Digital signature and submission',
    requiredFields: ['digital_signature'],
    estimatedTime: '1-2 minutes',
    nextActions: ['Add digital signature', 'Submit inspection']
  }
];

const QAProcessGuide: React.FC<QAProcessGuideProps> = ({
  formData,
  checklist,
  onStageAction
}) => {
  const getFieldValue = (fieldName: string) => {
    if (fieldName === 'checklist_items') {
      return checklist.length > 0 && checklist.every(item => item.status);
    }
    return formData[fieldName] && formData[fieldName].toString().trim().length > 0;
  };

  const getStageStatus = (stage: ProcessStage) => {
    const completedFields = stage.requiredFields.filter(field => getFieldValue(field));
    const totalFields = stage.requiredFields.length;
    const completionRate = (completedFields.length / totalFields) * 100;

    if (completionRate === 100) return 'completed';
    if (completionRate > 0) return 'in_progress';
    return 'pending';
  };

  const getStageProgress = (stage: ProcessStage) => {
    const completedFields = stage.requiredFields.filter(field => getFieldValue(field));
    return (completedFields.length / stage.requiredFields.length) * 100;
  };

  const getCurrentStage = () => {
    const currentStageIndex = PROCESS_STAGES.findIndex(stage => 
      getStageStatus(stage) === 'in_progress' || getStageStatus(stage) === 'pending'
    );
    return currentStageIndex !== -1 ? currentStageIndex : PROCESS_STAGES.length - 1;
  };

  const getOverallProgress = () => {
    const completedStages = PROCESS_STAGES.filter(stage => getStageStatus(stage) === 'completed').length;
    return (completedStages / PROCESS_STAGES.length) * 100;
  };

  const getStageIcon = (stage: ProcessStage, index: number) => {
    const status = getStageStatus(stage);
    const isActive = index === getCurrentStage();

    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-primary" />;
      default:
        return <Circle className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />;
    }
  };

  const getStageVariant = (stage: ProcessStage, index: number) => {
    const status = getStageStatus(stage);
    const isActive = index === getCurrentStage();

    if (status === 'completed') return 'default';
    if (isActive) return 'default';
    return 'outline';
  };

  const currentStageIndex = getCurrentStage();
  const currentStage = PROCESS_STAGES[currentStageIndex];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Inspection Progress</CardTitle>
          <Badge variant="outline" className="text-sm">
            {Math.round(getOverallProgress())}% Complete
          </Badge>
        </div>
        <Progress value={getOverallProgress()} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stage Highlight */}
        <div className="border-l-4 border-primary pl-4 bg-primary/5 rounded-r-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {getStageIcon(currentStage, currentStageIndex)}
            <h3 className="font-medium text-sm">Current Stage: {currentStage.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{currentStage.description}</p>
          
          {currentStage.nextActions && currentStage.nextActions.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium">Next Actions:</h4>
              <ul className="text-xs space-y-1">
                {currentStage.nextActions.map((action, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Stage List */}
        <div className="space-y-3">
          {PROCESS_STAGES.map((stage, index) => {
            const status = getStageStatus(stage);
            const progress = getStageProgress(stage);
            const isActive = index === currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStageIcon(stage, index)}
                </div>
                
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{stage.title}</h4>
                    <div className="flex items-center gap-2">
                      {stage.estimatedTime && (
                        <span className="text-xs text-muted-foreground">
                          {stage.estimatedTime}
                        </span>
                      )}
                      <Badge variant={getStageVariant(stage, index)} className="text-xs">
                        {status === 'completed' ? 'Complete' : 
                         status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                  
                  {status !== 'completed' && (
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-grow h-2" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            disabled={currentStageIndex === 0}
            onClick={() => onStageAction?.(PROCESS_STAGES[currentStageIndex - 1]?.id, 'previous')}
          >
            Previous Stage
          </Button>
          
          <Button
            variant="default"
            size="sm"
            disabled={currentStageIndex === PROCESS_STAGES.length - 1}
            onClick={() => onStageAction?.(PROCESS_STAGES[currentStageIndex + 1]?.id, 'next')}
          >
            Next Stage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QAProcessGuide;