import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Target, 
  Activity,
  Network,
  Zap,
  BarChart3,
  LineChart
} from 'lucide-react';
import { useUnifiedIntelligence } from '@/hooks/useUnifiedIntelligence';
import { formatCurrency } from '@/utils/variationTransforms';

interface UnifiedIntelligenceDashboardProps {
  projectId: string;
  projectName: string;
}

export const UnifiedIntelligenceDashboard: React.FC<UnifiedIntelligenceDashboardProps> = ({
  projectId,
  projectName
}) => {
  const { 
    data, 
    loading, 
    error, 
    healthMetrics, 
    predictiveInsights, 
    crossModuleConnections 
  } = useUnifiedIntelligence(projectId);
  const [selectedConnection, setSelectedConnection] = useState<string>('all');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Unified Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Intelligence Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Unified Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No project data available</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Unified Intelligence Dashboard
          </h2>
          <p className="text-muted-foreground">{projectName}</p>
        </div>
        <Badge variant={getRiskBadgeVariant(healthMetrics.riskLevel)} className="text-sm">
          {healthMetrics.riskLevel.toUpperCase()} RISK
        </Badge>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.healthScore}%</div>
            <Progress value={healthMetrics.healthScore} className="mt-2" />
            <p className={`text-xs mt-1 ${
              healthMetrics.healthScore >= 80 ? 'text-green-600' : 
              healthMetrics.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthMetrics.healthScore >= 80 ? 'Excellent' : 
               healthMetrics.healthScore >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completion Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.completionProbability}%</div>
            <Progress value={healthMetrics.completionProbability} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              On-time delivery likelihood
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.budgetVariance.toFixed(1)}%</div>
            <Progress 
              value={Math.min(100, healthMetrics.budgetVariance)} 
              className="mt-2" 
            />
            <p className={`text-xs mt-1 ${
              healthMetrics.budgetVariance > 10 ? 'text-red-600' : 
              healthMetrics.budgetVariance > 5 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {healthMetrics.budgetVariance > 10 ? 'Over Budget' : 
               healthMetrics.budgetVariance > 5 ? 'Watch' : 'On Track'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.scheduleVariance.toFixed(1)}%</div>
            <Progress 
              value={Math.min(100, healthMetrics.scheduleVariance)} 
              className="mt-2" 
            />
            <p className={`text-xs mt-1 ${
              healthMetrics.scheduleVariance > 20 ? 'text-red-600' : 
              healthMetrics.scheduleVariance > 10 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {healthMetrics.scheduleVariance > 20 ? 'Behind Schedule' : 
               healthMetrics.scheduleVariance > 10 ? 'Watch' : 'On Track'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="connections">Cross-Module Connections</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Delay Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delay Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{predictiveInsights.delayRisk.probability.toFixed(0)}%</div>
                  <Progress value={predictiveInsights.delayRisk.probability} className="mt-2" />
                  <Badge variant={getRiskBadgeVariant(predictiveInsights.delayRisk.impact)} className="mt-2">
                    {predictiveInsights.delayRisk.impact.toUpperCase()} IMPACT
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Risk Factors:</p>
                  {predictiveInsights.delayRisk.factors.map((factor, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      {factor}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Overrun */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Overrun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{predictiveInsights.costOverrun.probability.toFixed(0)}%</div>
                  <Progress value={predictiveInsights.costOverrun.probability} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Est. Amount: {formatCurrency(predictiveInsights.costOverrun.estimatedAmount)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cost Drivers:</p>
                  {predictiveInsights.costOverrun.drivers.map((driver, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      {driver}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quality Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{predictiveInsights.qualityRisk.probability.toFixed(0)}%</div>
                  <Progress value={predictiveInsights.qualityRisk.probability} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {predictiveInsights.qualityRisk.impact}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Risk Areas:</p>
                  {predictiveInsights.qualityRisk.areas.map((area, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variation-Milestone Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Variation-Milestone Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crossModuleConnections.variationToMilestone.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No connections found</p>
                  ) : (
                    crossModuleConnections.variationToMilestone.map((connection, index) => {
                      const variation = data.variations.find(v => v.id === connection.variationId);
                      const milestone = data.milestones.find(m => m.id === connection.milestoneId);
                      return (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm font-medium">
                            {variation?.variation_number} → {milestone?.milestone_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{connection.impact}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task-Milestone Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Task-Milestone Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crossModuleConnections.taskToMilestone.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No connections found</p>
                  ) : (
                    crossModuleConnections.taskToMilestone.map((connection, index) => {
                      const task = data.tasks.find(t => t.id === connection.taskId);
                      const milestone = data.milestones.find(m => m.id === connection.milestoneId);
                      return (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm font-medium">
                            {task?.title} → {milestone?.milestone_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{connection.dependency}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* QA-Milestone Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  QA-Milestone Gates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crossModuleConnections.qaToMilestone.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No quality gates found</p>
                  ) : (
                    crossModuleConnections.qaToMilestone.map((connection, index) => {
                      const qa = data.qaInspections.find(q => q.id === connection.qaId);
                      const milestone = data.milestones.find(m => m.id === connection.milestoneId);
                      return (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm font-medium">
                            {qa?.inspection_number} → {milestone?.milestone_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{connection.gateType}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RFI-Variation Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  RFI-Variation Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crossModuleConnections.rfiToVariation.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No connections found</p>
                  ) : (
                    crossModuleConnections.rfiToVariation.map((connection, index) => {
                      const rfi = data.rfis.find(r => r.id === connection.rfiId);
                      const variation = data.variations.find(v => v.id === connection.variationId);
                      return (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm font-medium">
                            RFI-{rfi?.rfi_number} → {variation?.variation_number}
                          </div>
                          <div className="text-xs text-muted-foreground">{connection.relationship}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.recommendations.length === 0 ? (
                  <p className="text-muted-foreground">No recommendations at this time</p>
                ) : (
                  predictiveInsights.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}
                              className="mb-2"
                            >
                              {rec.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{rec.module}</Badge>
                          </div>
                          <h4 className="font-medium">{rec.action}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Module Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Milestones</span>
                    <span className="font-medium">{data.milestones.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Variations</span>
                    <span className="font-medium">{data.variations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tasks</span>
                    <span className="font-medium">{data.tasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">QA Inspections</span>
                    <span className="font-medium">{data.qaInspections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">RFIs</span>
                    <span className="font-medium">{data.rfis.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Task Completion</span>
                      <span className="text-sm font-medium">
                        {data.tasks.filter(t => t.status === 'completed').length}/{data.tasks.length}
                      </span>
                    </div>
                    <Progress 
                      value={data.tasks.length > 0 ? (data.tasks.filter(t => t.status === 'completed').length / data.tasks.length) * 100 : 0} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">QA Pass Rate</span>
                      <span className="text-sm font-medium">
                        {data.qaInspections.filter(qa => qa.overall_status === 'passed').length}/{data.qaInspections.length}
                      </span>
                    </div>
                    <Progress 
                      value={data.qaInspections.length > 0 ? (data.qaInspections.filter(qa => qa.overall_status === 'passed').length / data.qaInspections.length) * 100 : 0} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Milestone Progress</span>
                      <span className="text-sm font-medium">
                        {data.milestones.filter(m => m.status === 'complete').length}/{data.milestones.length}
                      </span>
                    </div>
                    <Progress 
                      value={data.milestones.length > 0 ? (data.milestones.filter(m => m.status === 'complete').length / data.milestones.length) * 100 : 0} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};