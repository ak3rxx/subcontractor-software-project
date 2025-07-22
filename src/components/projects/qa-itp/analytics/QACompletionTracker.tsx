
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, Calendar, Award, AlertTriangle } from 'lucide-react';

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

// Ultra-safe data validation to prevent ALL chart errors
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  if (!isFinite(num) || isNaN(num)) return 0;
  return Math.max(0, Math.min(1000, num)); // Reasonable bounds
};

const validateChartData = (data: any[]): any[] => {
  if (!Array.isArray(data)) return [];
  
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const validated: any = {};
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'number') {
          validated[key] = safeNumber(value);
        } else if (typeof value === 'string') {
          validated[key] = String(value).slice(0, 50);
        } else {
          validated[key] = value;
        }
      });
      return validated;
    })
    .filter(item => {
      // Ensure at least one valid numeric value exists
      return Object.values(item).some(value => 
        typeof value === 'number' && safeNumber(value) >= 0
      );
    });
};

const QACompletionTracker: React.FC<QACompletionTrackerProps> = ({
  completionRates,
  qualityTrends
}) => {
  // Error boundary wrapper with logging
  const renderSafely = (content: () => React.ReactNode, fallback: React.ReactNode, context: string) => {
    try {
      return content();
    } catch (error) {
      console.error(`QACompletionTracker ${context} error:`, error);
      return fallback;
    }
  };

  // Ultra-safe data transformation
  const templateData = validateChartData(
    Object.entries(completionRates?.byTemplate || {})
      .filter(([template, rate]) => template && safeNumber(rate) >= 0)
      .map(([template, rate]) => ({
        template: String(template).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).slice(0, 30),
        completion: safeNumber(rate),
        target: 85
      }))
  );

  const tradeData = validateChartData(
    Object.entries(completionRates?.byTrade || {})
      .filter(([trade, rate]) => trade && safeNumber(rate) >= 0)
      .map(([trade, rate]) => ({
        trade: String(trade).charAt(0).toUpperCase() + String(trade).slice(1, 30),
        completion: safeNumber(rate),
        target: 85
      }))
  );

  const monthlyTrends = validateChartData(
    (qualityTrends?.monthlyTrends || [])
      .filter(trend => trend && trend.month)
      .map(trend => ({
        month: String(trend.month).slice(0, 20),
        passed: safeNumber(trend.passed),
        failed: safeNumber(trend.failed),
        incomplete: safeNumber(trend.incomplete)
      }))
  );

  const inspectorPerformance = (qualityTrends?.inspectorPerformance || [])
    .filter(perf => perf && perf.inspector && safeNumber(perf.passRate) >= 0 && safeNumber(perf.avgTime) >= 0)
    .map(perf => ({
      inspector: String(perf.inspector).slice(0, 30),
      passRate: Math.min(100, Math.max(0, safeNumber(perf.passRate))),
      avgTime: safeNumber(perf.avgTime)
    }))
    .slice(0, 10);

  // Safe completion status calculation
  const getCompletionStatus = (rate: number) => {
    const safeRate = safeNumber(rate);
    if (safeRate >= 90) return { status: 'excellent', color: 'bg-emerald-500', text: 'Excellent' };
    if (safeRate >= 75) return { status: 'good', color: 'bg-blue-500', text: 'Good' };
    if (safeRate >= 60) return { status: 'fair', color: 'bg-yellow-500', text: 'Fair' };
    return { status: 'poor', color: 'bg-red-500', text: 'Needs Improvement' };
  };

  const overallRate = safeNumber(completionRates?.overall || 0);
  const overallStatus = getCompletionStatus(overallRate);

  // Safe error fallback component
  const ErrorFallback = ({ message }: { message: string }) => (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground border rounded-lg bg-gray-50">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );

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
              {renderSafely(
                () => monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends}>
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
                  <EmptyState message="No trend data available" />
                ),
                <EmptyState message="Chart unavailable" />,
                'monthly trend chart'
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
            {inspectorPerformance.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {inspectorPerformance[0].inspector}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(inspectorPerformance[0].passRate)}% pass rate
                </div>
                <Progress 
                  value={inspectorPerformance[0].passRate} 
                  className="mt-2" 
                />
              </>
            ) : (
              <EmptyState message="No inspector data" />
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
          {renderSafely(
            () => templateData.length > 0 ? (
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
                      formatter={(value: number) => [`${safeNumber(value)}%`, 'Completion Rate']}
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
              <EmptyState message="No template data available" />
            ),
            <ErrorFallback message="Template chart unavailable" />,
            'template chart'
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
          {renderSafely(
            () => tradeData.length > 0 ? (
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
                      formatter={(value: number) => [`${safeNumber(value)}%`, 'Completion Rate']}
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
              <EmptyState message="No trade data available" />
            ),
            <ErrorFallback message="Trade chart unavailable" />,
            'trade chart'
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
          {renderSafely(
            () => monthlyTrends.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
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
              <EmptyState message="No monthly trend data available" />
            ),
            <ErrorFallback message="Monthly trends chart unavailable" />,
            'monthly trends chart'
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QACompletionTracker;
