import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QAContextualHelpProps {
  fieldName: string;
  templateType: string;
  currentValue?: any;
  validationErrors?: string[];
  isRequired?: boolean;
  onHelpAction?: (action: string) => void;
}

interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  warnings?: string[];
  tips?: string[];
  relatedFields?: string[];
}

const HELP_CONTENT: Record<string, Record<string, HelpContent>> = {
  // Template-specific help content
  general: {
    project_name: {
      title: "Project Name",
      description: "Enter the exact project name as it appears in your project management system.",
      examples: ["Residential Complex Block A", "Office Tower Level 5 Fitout"],
      tips: ["Use consistent naming across all inspections", "Include building/phase if applicable"],
      warnings: ["Mismatched names can cause tracking issues"]
    },
    task_area: {
      title: "Task/Area Description",
      description: "Specify the exact location or work area being inspected.",
      examples: ["Level 2 Bathrooms", "Kitchen Cabinetry", "External Cladding North Wall"],
      tips: ["Be specific to avoid confusion", "Include level/room numbers where relevant"],
      warnings: ["Vague descriptions can lead to re-inspections"]
    },
    location_reference: {
      title: "Location Reference",
      description: "Provide grid references, room numbers, or other identifying markers.",
      examples: ["Grid A1-A3", "Apartment 205", "Drawing Ref: A-101"],
      tips: ["Reference architectural drawings where possible", "Use standard notation"],
      warnings: ["Missing references make defect tracking difficult"]
    },
    inspector_name: {
      title: "Inspector Name",
      description: "Full name of the qualified inspector conducting this inspection.",
      tips: ["Use full professional name", "Ensure name matches certification"],
      warnings: ["Name must match your professional credentials"]
    }
  },
  concrete: {
    strength_test: {
      title: "Concrete Strength Test",
      description: "Document concrete strength testing results and compliance.",
      examples: ["28-day strength: 32MPa", "Test certificate #TC-2024-001"],
      tips: ["Include test dates and certificate numbers", "Reference design specifications"],
      warnings: ["Non-compliant strength requires immediate action"]
    },
    surface_finish: {
      title: "Surface Finish Quality",
      description: "Assess concrete surface finish according to specified tolerances.",
      examples: ["Class 2 finish achieved", "Minor honeycombing at grid B3"],
      tips: ["Use standard finish classifications", "Document any remedial work"],
      warnings: ["Poor finishes may require costly rectification"]
    }
  },
  steel: {
    welding_quality: {
      title: "Welding Quality",
      description: "Inspect welding according to AS/NZS standards and specifications.",
      examples: ["Full penetration welds compliant", "Minor undercut at connection 4"],
      tips: ["Reference welding procedures", "Check welder qualifications"],
      warnings: ["Defective welds compromise structural integrity"]
    },
    protection_coating: {
      title: "Protection Coating",
      description: "Verify protective coatings are applied correctly and completely.",
      examples: ["Galvanizing complete", "Paint system: 3 coats applied"],
      tips: ["Check coating thickness", "Document any damage"],
      warnings: ["Missing protection leads to corrosion"]
    }
  }
};

const getFieldHelp = (fieldName: string, templateType: string): HelpContent | null => {
  const templateHelp = HELP_CONTENT[templateType]?.[fieldName];
  const generalHelp = HELP_CONTENT.general[fieldName];
  return templateHelp || generalHelp || null;
};

const QAContextualHelp: React.FC<QAContextualHelpProps> = ({
  fieldName,
  templateType,
  currentValue,
  validationErrors = [],
  isRequired = false,
  onHelpAction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const helpContent = getFieldHelp(fieldName, templateType);

  if (!helpContent) return null;

  const hasValue = currentValue && currentValue.toString().trim().length > 0;
  const hasErrors = validationErrors.length > 0;

  const getStatusIcon = () => {
    if (hasErrors) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (hasValue) return <CheckCircle className="h-4 w-4 text-success" />;
    return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = () => {
    if (hasErrors) return "destructive";
    if (hasValue) return "default";
    return "secondary";
  };

  return (
    <TooltipProvider>
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {getStatusIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click for detailed help about {helpContent.title}</p>
          </TooltipContent>
        </Tooltip>

        {isExpanded && (
          <Card className="absolute top-8 right-0 z-50 w-80 shadow-lg border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{helpContent.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {isRequired && <Badge variant="outline" className="text-xs">Required</Badge>}
                  <Badge variant={getStatusColor()} className="text-xs">
                    {hasErrors ? 'Error' : hasValue ? 'Complete' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{helpContent.description}</p>

              {helpContent.examples && helpContent.examples.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Examples
                  </h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {helpContent.examples.map((example, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {helpContent.tips && helpContent.tips.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 text-success">Tips</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {helpContent.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-success">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {helpContent.warnings && helpContent.warnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 text-destructive">Warnings</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {helpContent.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-destructive">⚠</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 text-destructive">Current Issues</h4>
                  <ul className="text-xs space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-destructive">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default QAContextualHelp;