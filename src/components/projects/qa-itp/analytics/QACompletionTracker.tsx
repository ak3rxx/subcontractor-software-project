
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, Calendar, Award } from 'lucide-react';

interface QACompletionTrackerProps {
  completionRates: {
    overall: number;
    byTemplate: Record<string, number>;
    byTrade: Record<string, number>;
    byTimeframe: Record<string, number>;
  };
  qualityTrends: {
    monthlyTrends: Array<{ month: string; passed: number; failed: number; incomplete: number }>;
    inspectorPerformance: Array<{ inspector: string; passRate: number; avgTime: number }>;
  };
}

// Utility functions to sanitize chart data
const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
};

const sanitizeChartData = (data: any[]): any[] => {
  return data.filter(item => {
    // Check all numeric values in the item
    return Object.values(item).every(value => {
      if (typeof value === 'number') {
        return isValidNumber(value);
      }
      return true; // Non-numeric values are okay
    });
  });
};

const sanitizeNumber = (value: number, fallback: number = 0): number => {
  return isValidNumber(value) ? value : fallback;
};

const QACompletionTracker: React.FC<QACompletionTrackerProps> = ({
  completionRates,
  qualityTrends
}) => {
  // Transform template data for charts with sanitization
  const templateData = sanitizeChartData(
    Object.entries(completionRates.byTemplate).map(([template, rate]) => ({
      template: template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      completion: sanitizeNumber(rate),
      target: 85
    }))
  );

  // Transform trade data for charts with sanitization
  const tradeData = sanitizeChartData(
    Object.entries(completionRates.byTrade).map(([trade, rate]) => ({
      trade: trade.charAt(0).toUpperCase() + trade.slice(1),
      completion: sanitizeNumber(rate),
      target: 85
    }))
  );

  // Sanitize monthly trends data
  const sanitizedMonthlyTrends = sanitizeChartData(
    qualityTrends.monthlyTrends.map(trend => ({
      ...trend,
      passed: sanitizeNumber(trend.passed),
      failed: sanitizeNumber(trend.failed),
      incomplete: sanitizeNumber(trend.incomplete)
    }))
  );

  // Sanitize inspector performance data
  const sanitizedInspectorPerformance = qualityTrends.inspectorPerformance
    .filter(perf => isValidNumber(perf.passRate) && isValidNumber(perf.avgTime))
    .map(perf => ({
      ...perf,
      passRate: sanitizeNumber(perf.passRate),
      avgTime: sanitizeNumber(perf.avgTime)
    }));

  // Calculate completion status
  const getCompletionStatus = (rate: number) => {
    const safeRate = sanitizeNumber(rate);
    if (safeRate >= 90) return { status: 'excellent', color: 'bg-emerald-500', text: 'Excellent' };
    if (safeRate >= 75) return { status: 'good', color: 'bg-blue-500', text: 'Good' };
    if (safeRate >= 60) return { status: 'fair', color: 'bg-yellow-500', text: 'Fair' };
    return { status: 'poor', color: 'bg-red-500', text: 'Needs Improvement' };
  };

  const overallRate = sanitizeNumber(completionRates.overall);
  const overallStatus = getCompletionStatus(overallRate);

  return (
    <div className="space-y-6">
      {/* Overall Completion Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallRate)}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={overallRate} className="flex-1" />
              <Badge variant={overallStatus.status === 'excellent' ? 'default' : 
                            overallStatus.status === 'good' ? 'secondary' : 'destructive'}>
                {overallStatus.text}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: 85% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[80px]">
              {sanitizedMonthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sanitizedMonthlyTrends}>
                    <Area
                      type="monotone"
                      dataKey="passed"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pass/fail ratio over time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sanitizedInspectorPerformance.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {sanitizedInspectorPerformance[0].inspector}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(sanitizedInspectorPerformance[0].passRate)}% pass rate
                </div>
                <Progress 
                  value={sanitizedInspectorPerformance[0].passRate} 
                  className="mt-2" 
                />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Template Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Completion Rate by Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templateData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={templateData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="template" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="hsl(var(--muted))" opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No template data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Completion Rate by Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tradeData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="trade" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="completion" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="target" fill="hsl(var(--muted))" opacity={0.3} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No trade data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Quality Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sanitizedMonthlyTrends.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sanitizedMonthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="passed" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Passed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Failed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="incomplete" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="Incomplete"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No monthly trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QACompletionTracker;
