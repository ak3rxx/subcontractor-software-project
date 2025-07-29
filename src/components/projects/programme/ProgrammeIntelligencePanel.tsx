import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Route,
  Zap,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';
import { useProgrammeIntelligence, ConflictIssue, CriticalPathResult } from '@/hooks/useProgrammeIntelligence';
import { getMilestoneHealthScore, identifyResourceConflicts } from './milestoneUtils';

interface ProgrammeIntelligencePanelProps {
  milestones: ProgrammeMilestone[];
  projectId: string;
  onCreateMilestones?: (milestones: Partial<ProgrammeMilestone>[]) => void;
}

const ProgrammeIntelligencePanel: React.FC<ProgrammeIntelligencePanelProps> = ({
  milestones,
  projectId,
  onCreateMilestones
}) => {
  const {
    analyzing,
    calculateCriticalPath,
    detectConflicts,
    createTemplateBasedProgramme,
    MILESTONE_TEMPLATES
  } = useProgrammeIntelligence();

  const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'critical-path' | 'templates'>('overview');

  // Calculate intelligence data
  const criticalPath = useMemo(() => calculateCriticalPath(milestones), [milestones, calculateCriticalPath]);
  const conflicts = useMemo(() => detectConflicts(milestones), [milestones, detectConflicts]);
  const resourceConflicts = useMemo(() => identifyResourceConflicts(milestones), [milestones]);
  
  const programmeHealth = useMemo(() => {
    if (milestones.length === 0) return 0;
    const totalHealth = milestones.reduce((sum, milestone) => sum + getMilestoneHealthScore(milestone), 0);
    return Math.round(totalHealth / milestones.length);
  }, [milestones]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreateTemplateBasedProgramme = async () => {
    try {
      const templateMilestones = await createTemplateBasedProgramme(projectId);
      if (onCreateMilestones) {
        onCreateMilestones(templateMilestones);
      }
    } catch (error) {
      console.error('Failed to create template-based programme:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Programme Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{milestones.length}</div>
              <div className="text-sm text-gray-600">Total Milestones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{programmeHealth}%</div>
              <div className="text-sm text-gray-600">Programme Health</div>
              <Progress value={programmeHealth} className="mt-1" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{conflicts.length}</div>
              <div className="text-sm text-gray-600">Detected Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{criticalPath.duration}</div>
              <div className="text-sm text-gray-600">Critical Path (days)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
          { id: 'critical-path', label: 'Critical Path', icon: Route },
          { id: 'templates', label: 'Templates', icon: Zap }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleCreateTemplateBasedProgramme}
                disabled={analyzing || milestones.length > 0}
                className="w-full"
              >
                Create Template-Based Programme
              </Button>
              <p className="text-sm text-gray-600">
                {milestones.length > 0 
                  ? 'Template creation is available for new projects only'
                  : 'Generate a complete construction programme using industry-standard templates'
                }
              </p>
            </CardContent>
          </Card>

          {/* Recent Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recent Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">No conflicts detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conflicts.slice(0, 3).map((conflict, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(conflict.severity)}>
                            {conflict.severity}
                          </Badge>
                          {conflict.description}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  {conflicts.length > 3 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('conflicts')}
                    >
                      View All ({conflicts.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Conflicts</CardTitle>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conflicts Detected</h3>
                  <p className="text-gray-600">Your programme schedule looks good!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(conflict.severity)}>
                              {conflict.severity}
                            </Badge>
                            <Badge variant="outline">{conflict.type}</Badge>
                          </div>
                          <p className="font-medium">{conflict.description}</p>
                          {conflict.suggestion && (
                            <p className="text-sm text-gray-600">
                              💡 {conflict.suggestion}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resource Conflicts */}
          {resourceConflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Resource Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resourceConflicts.map((conflict, index) => (
                    <Alert key={index}>
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{conflict.trade}</Badge>
                            <span className="text-sm text-gray-600">
                              {conflict.overlapDays} day overlap
                            </span>
                          </div>
                          <div className="text-sm">
                            Conflicting milestones:
                            <ul className="list-disc list-inside ml-4">
                              {conflict.conflictingMilestones.map(milestone => (
                                <li key={milestone.id}>{milestone.milestone_name}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'critical-path' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Critical Path Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalPath.path.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Critical Path Found</h3>
                <p className="text-gray-600">Add milestones with dependencies to analyze critical path</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{criticalPath.path.length}</div>
                    <div className="text-sm text-gray-600">Critical Milestones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{criticalPath.duration}</div>
                    <div className="text-sm text-gray-600">Total Duration (days)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{criticalPath.riskFactors.length}</div>
                    <div className="text-sm text-gray-600">Risk Factors</div>
                  </div>
                </div>

                {criticalPath.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Risk Factors:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {criticalPath.riskFactors.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {criticalPath.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                      {criticalPath.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Critical Path Sequence:</h4>
                  <div className="space-y-2">
                    {criticalPath.path.map((milestoneId, index) => {
                      const milestone = milestones.find(m => m.id === milestoneId);
                      if (!milestone) return null;
                      
                      return (
                        <div key={milestoneId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{milestone.milestone_name}</div>
                            <div className="text-sm text-gray-600">
                              {milestone.trade} • {milestone.start_date_planned} to {milestone.end_date_planned}
                            </div>
                          </div>
                          <Badge className={milestone.status === 'delayed' ? 'bg-red-500' : milestone.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'}>
                            {milestone.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Milestone Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={handleCreateTemplateBasedProgramme}
                  disabled={analyzing || milestones.length > 0}
                >
                  Create Full Programme
                </Button>
                <p className="text-sm text-gray-600 flex-1">
                  Create a complete construction programme using industry-standard templates and intelligent dependency mapping.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MILESTONE_TEMPLATES.map(template => (
                  <Card key={template.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.trade}</Badge>
                          <Badge variant="outline">{template.estimatedDuration}d</Badge>
                          {template.isCriticalPath && (
                            <Badge className="bg-red-100 text-red-800">Critical</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgrammeIntelligencePanel;