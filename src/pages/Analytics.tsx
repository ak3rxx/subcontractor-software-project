import React from 'react';
import TopNav from '@/components/TopNav';
import ProjectAnalyticsDashboard from '@/components/analytics/ProjectAnalyticsDashboard';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Analytics = () => {
  const { projects, variations, tasks, qaInspections, loading, error, summary } = useProjectAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 py-8">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading analytics data...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 py-8">
          <div className="container px-4 mx-auto max-w-7xl">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-red-600">Analytics Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Analytics & Insights</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive project analytics and performance insights
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.totalProjects}</div>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.totalVariations}</div>
                <p className="text-xs text-muted-foreground">Total Variations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.totalTasks}</div>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.totalQAInspections}</div>
                <p className="text-xs text-muted-foreground">QA Inspections</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Dashboard */}
          <ProjectAnalyticsDashboard
            projects={projects}
            variations={variations}
            tasks={tasks}
            qaInspections={qaInspections}
          />
        </div>
      </main>
    </div>
  );
};

export default Analytics;