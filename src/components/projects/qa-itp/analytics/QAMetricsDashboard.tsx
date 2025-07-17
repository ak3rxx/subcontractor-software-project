import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useQAAnalytics } from '@/hooks/useQAAnalytics';
import QACompletionTracker from './QACompletionTracker';
import QAErrorPatternAnalysis from './QAErrorPatternAnalysis';
import QAPerformanceInsights from './QAPerformanceInsights';

interface QAMetricsDashboardProps {
  projectId?: string;
  className?: string;
}

const QAMetricsDashboard: React.FC<QAMetricsDashboardProps> = ({ 
  projectId, 
  className = "" 
}) => {
  const { 
    summary, 
    completionRates, 
    performanceMetrics, 
    qualityTrends, 
    predictiveInsights,
    loading, 
    error,
    setTimeframe
  } = useQAAnalytics({ projectId });

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'improving': return 'text-emerald-600';
      case 'declining': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading QA analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-2" />
              <span className="text-red-600">Failed to load analytics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QA Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive quality assurance metrics and insights
          </p>
        </div>
        
        {/* Timeframe Selection */}
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className="px-3 py-1 text-sm rounded-md border hover:bg-muted transition-colors"
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Inspections</div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{summary.totalInspections}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(summary.trendDirection)}
              <span className={`ml-1 ${getTrendColor(summary.trendDirection)}`}>
                {summary.trendDirection}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Completion Rate</div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{summary.completionRate}%</div>
            <Progress value={summary.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Quality Score</div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{summary.qualityScore}%</div>
            <div className="text-xs text-muted-foreground">
              {summary.qualityScore >= 80 ? 'Excellent' : 
               summary.qualityScore >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Risk Level</div>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${getRiskColor(predictiveInsights.riskScore)}`}>
              {Math.round(predictiveInsights.riskScore)}%
            </div>
            <Badge variant={predictiveInsights.riskScore >= 70 ? 'destructive' : 
                           predictiveInsights.riskScore >= 40 ? 'secondary' : 'default'}
                   className="mt-1">
              {predictiveInsights.riskScore >= 70 ? 'High Risk' : 
               predictiveInsights.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="completion" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Completion</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Errors</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="space-y-4">
          <QACompletionTracker 
            completionRates={completionRates}
            qualityTrends={qualityTrends}
          />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <QAErrorPatternAnalysis 
            errorPatterns={{
              mostCommonErrors: [],
              errorTrends: [],
              templateErrors: {}
            }}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <QAPerformanceInsights 
            performanceMetrics={performanceMetrics}
            inspectorPerformance={qualityTrends.inspectorPerformance}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Quality Prediction</h4>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(predictiveInsights.qualityPrediction)}
                    <span className={getTrendColor(predictiveInsights.qualityPrediction)}>
                      {predictiveInsights.qualityPrediction.charAt(0).toUpperCase() + 
                       predictiveInsights.qualityPrediction.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <Progress 
                    value={predictiveInsights.riskScore} 
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {predictiveInsights.riskScore}% risk level
                  </p>
                </div>
              </div>

              {predictiveInsights.recommendedActions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommended Actions</h4>
                  <ul className="space-y-1">
                    {predictiveInsights.recommendedActions.map((action, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QAMetricsDashboard;