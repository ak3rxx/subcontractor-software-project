
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQAAnalytics } from '@/hooks/useQAAnalytics';
import QACompletionTracker from './QACompletionTracker';
import NavigationErrorBoundary from '@/components/NavigationErrorBoundary';
import { AlertTriangle, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';

interface QAMetricsDashboardProps {
  projectId: string;
}

const QAMetricsDashboard: React.FC<QAMetricsDashboardProps> = ({ projectId }) => {
  const { 
    loading, 
    error, 
    completionRates, 
    qualityTrends, 
    summary, 
    isDataReady 
  } = useQAAnalytics({ projectId });

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load analytics data. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe summary metrics
  const safeMetrics = {
    totalInspections: Math.max(0, Math.round(summary?.totalInspections || 0)),
    completionRate: Math.max(0, Math.min(100, Math.round(summary?.completionRate || 0))),
    qualityScore: Math.max(0, Math.min(100, Math.round(summary?.qualityScore || 0))),
    trendDirection: summary?.trendDirection || 'stable'
  };

  return (
    <NavigationErrorBoundary>
      <div className="space-y-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMetrics.totalInspections}</div>
              <p className="text-xs text-muted-foreground">
                Active inspections in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMetrics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Inspections completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMetrics.qualityScore}%</div>
              <p className="text-xs text-muted-foreground">
                Overall quality rating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{safeMetrics.trendDirection}</div>
              <p className="text-xs text-muted-foreground">
                Quality trend direction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <QACompletionTracker
          completionRates={completionRates}
          qualityTrends={qualityTrends}
          isDataReady={isDataReady}
        />
      </div>
    </NavigationErrorBoundary>
  );
};

export default QAMetricsDashboard;
