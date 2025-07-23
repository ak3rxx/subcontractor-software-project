
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, Calendar, Award } from 'lucide-react';
import SafeChartWrapper from './SafeChartWrapper';
import ChartErrorBoundary from './ChartErrorBoundary';

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
  isDataReady?: boolean;
}

const QACompletionTracker: React.FC<QACompletionTrackerProps> = ({
  completionRates,
  qualityTrends,
  isDataReady = false
}) => {
  // Safe data transformation with strict validation
  const transformTemplateData = () => {
    try {
      if (!completionRates?.byTemplate || !isDataReady) return [];
      
      return Object.entries(completionRates.byTemplate)
        .filter(([template, rate]) => {
          const isValid = template && 
                         typeof rate === 'number' && 
                         Number.isFinite(rate) && 
                         !Number.isNaN(rate);
          if (!isValid) {
            console.warn('QACompletionTracker: Filtered invalid template data:', template, rate);
          }
          return isValid;
        })
        .map(([template, rate]) => ({
          template: String(template).replace(/[-_]/g, ' ').slice(0, 30),
          completion: Math.max(0, Math.min(100, Math.round(rate))),
          target: 85
        }))
        .slice(0, 10);
    } catch (error) {
      console.error('QACompletionTracker: Template transformation error:', error);
      return [];
    }
  };

  const transformTradeData = () => {
    try {
      if (!completionRates?.byTrade || !isDataReady) return [];
      
      return Object.entries(completionRates.byTrade)
        .filter(([trade, rate]) => {
          const isValid = trade && 
                         typeof rate === 'number' && 
                         Number.isFinite(rate) && 
                         !Number.isNaN(rate);
          if (!isValid) {
            console.warn('QACompletionTracker: Filtered invalid trade data:', trade, rate);
          }
          return isValid;
        })
        .map(([trade, rate]) => ({
          trade: String(trade).charAt(0).toUpperCase() + String(trade).slice(1, 30),
          completion: Math.max(0, Math.min(100, Math.round(rate))),
          target: 85
        }))
        .slice(0, 10);
    } catch (error) {
      console.error('QACompletionTracker: Trade transformation error:', error);
      return [];
    }
  };

  const transformMonthlyTrends = () => {
    try {
      if (!qualityTrends?.monthlyTrends || !isDataReady) return [];
      
      return qualityTrends.monthlyTrends
        .filter(trend => {
          const isValid = trend && 
                         trend.month && 
                         Number.isFinite(trend.passed) && 
                         Number.isFinite(trend.failed) && 
                         Number.isFinite(trend.incomplete);
          if (!isValid) {
            console.warn('QACompletionTracker: Filtered invalid monthly trend:', trend);
          }
          return isValid;
        })
        .map(trend => ({
          month: String(trend.month).slice(0, 20),
          passed: Math.max(0, Math.round(trend.passed || 0)),
          failed: Math.max(0, Math.round(trend.failed || 0)),
          incomplete: Math.max(0, Math.round(trend.incomplete || 0))
        }))
        .slice(-12);
    } catch (error) {
      console.error('QACompletionTracker: Monthly trends transformation error:', error);
      return [];
    }
  };

  // Wait for data to be ready before processing
  if (!isDataReady) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const templateData = transformTemplateData();
  const tradeData = transformTradeData();
  const monthlyTrends = transformMonthlyTrends();

  const inspectorPerformance = (qualityTrends?.inspectorPerformance || [])
    .filter(perf => {
      const isValid = perf && 
                     perf.inspector && 
                     typeof perf.passRate === 'number' && 
                     Number.isFinite(perf.passRate) && 
                     !Number.isNaN(perf.passRate);
      if (!isValid) {
        console.warn('QACompletionTracker: Filtered invalid inspector performance:', perf);
      }
      return isValid;
    })
    .map(perf => ({
      inspector: String(perf.inspector).slice(0, 30),
      passRate: Math.max(0, Math.min(100, Math.round(perf.passRate))),
      avgTime: Math.max(0, Math.round(perf.avgTime || 2))
    }))
    .slice(0, 10);

  const getCompletionStatus = (rate: number) => {
    const safeRate = Math.max(0, Math.min(100, Math.round(rate || 0)));
    if (safeRate >= 90) return { status: 'excellent', color: 'bg-emerald-500', text: 'Excellent' };
    if (safeRate >= 75) return { status: 'good', color: 'bg-blue-500', text: 'Good' };
    if (safeRate >= 60) return { status: 'fair', color: 'bg-yellow-500', text: 'Fair' };
    return { status: 'poor', color: 'bg-red-500', text: 'Needs Improvement' };
  };

  const overallRate = Math.max(0, Math.min(100, Math.round(completionRates?.overall || 0)));
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
            <div className="text-2xl font-bold">{overallRate}%</div>
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
              <ChartErrorBoundary title="Monthly Trend">
                <SafeChartWrapper
                  data={monthlyTrends}
                  title="Monthly Trend"
                  fallbackMessage="No trend data available"
                >
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
                </SafeChartWrapper>
              </ChartErrorBoundary>
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
                  {inspectorPerformance[0].passRate}% pass rate
                </div>
                <Progress 
                  value={inspectorPerformance[0].passRate} 
                  className="mt-2" 
                />
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No inspector data</p>
              </div>
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
          <ChartErrorBoundary title="Template Performance">
            <SafeChartWrapper
              data={templateData}
              title="Template Performance"
              fallbackMessage="No template data available"
            >
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
            </SafeChartWrapper>
          </ChartErrorBoundary>
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
          <ChartErrorBoundary title="Trade Performance">
            <SafeChartWrapper
              data={tradeData}
              title="Trade Performance"
              fallbackMessage="No trade data available"
            >
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
            </SafeChartWrapper>
          </ChartErrorBoundary>
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
          <ChartErrorBoundary title="Monthly Trends">
            <SafeChartWrapper
              data={monthlyTrends}
              title="Monthly Trends"
              fallbackMessage="No monthly trend data available"
            >
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
            </SafeChartWrapper>
          </ChartErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
};

export default QACompletionTracker;
