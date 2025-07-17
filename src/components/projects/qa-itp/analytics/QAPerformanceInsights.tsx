import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Clock, Users, TrendingUp, Award, Timer, Target } from 'lucide-react';

interface PerformanceMetrics {
  averageCompletionTime: number;
  inspectionsPerDay: number;
  passFailRatio: number;
  reinspectionRate: number;
}

interface InspectorPerformance {
  inspector: string;
  passRate: number;
  avgTime: number;
}

interface QAPerformanceInsightsProps {
  performanceMetrics: PerformanceMetrics;
  inspectorPerformance: InspectorPerformance[];
}

const QAPerformanceInsights: React.FC<QAPerformanceInsightsProps> = ({
  performanceMetrics,
  inspectorPerformance
}) => {
  // Sample data for demonstration
  const sampleInspectorData = inspectorPerformance.length > 0 ? inspectorPerformance : [
    { inspector: 'John Smith', passRate: 92, avgTime: 1.5 },
    { inspector: 'Sarah Johnson', passRate: 88, avgTime: 2.1 },
    { inspector: 'Mike Wilson', passRate: 85, avgTime: 1.8 },
    { inspector: 'Lisa Chen', passRate: 90, avgTime: 1.7 },
    { inspector: 'David Brown', passRate: 87, avgTime: 2.0 }
  ];

  // Performance efficiency data (pass rate vs time)
  const efficiencyData = sampleInspectorData.map(inspector => ({
    inspector: inspector.inspector,
    passRate: inspector.passRate,
    avgTime: inspector.avgTime,
    efficiency: (inspector.passRate / inspector.avgTime) * 10 // Efficiency score
  }));

  // Get performance ratings
  const getPerformanceRating = (passRate: number) => {
    if (passRate >= 90) return { rating: 'excellent', color: 'default', text: 'Excellent' };
    if (passRate >= 80) return { rating: 'good', color: 'secondary', text: 'Good' };
    if (passRate >= 70) return { rating: 'fair', color: 'outline', text: 'Fair' };
    return { rating: 'poor', color: 'destructive', text: 'Needs Improvement' };
  };

  const getTimeRating = (avgTime: number) => {
    if (avgTime <= 1.5) return { rating: 'fast', color: 'default', text: 'Fast' };
    if (avgTime <= 2.0) return { rating: 'average', color: 'secondary', text: 'Average' };
    return { rating: 'slow', color: 'outline', text: 'Slow' };
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getPassFailColor = (ratio: number) => {
    if (ratio >= 4) return 'text-emerald-600';
    if (ratio >= 2) return 'text-blue-600';
    if (ratio >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(performanceMetrics.averageCompletionTime)}
            </div>
            <div className="text-xs text-muted-foreground">
              Per inspection
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Throughput</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(performanceMetrics.inspectionsPerDay * 10) / 10}
            </div>
            <div className="text-xs text-muted-foreground">
              Inspections per day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass/Fail Ratio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPassFailColor(performanceMetrics.passFailRatio)}`}>
              {Math.round(performanceMetrics.passFailRatio * 10) / 10}:1
            </div>
            <div className="text-xs text-muted-foreground">
              Pass to fail ratio
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reinspection Rate</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(performanceMetrics.reinspectionRate)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Requiring rework
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspector Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Inspector Performance Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleInspectorData
              .sort((a, b) => b.passRate - a.passRate)
              .map((inspector, index) => {
                const passRating = getPerformanceRating(inspector.passRate);
                const timeRating = getTimeRating(inspector.avgTime);
                
                return (
                  <div key={inspector.inspector} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{inspector.inspector}</div>
                        <div className="text-sm text-muted-foreground">
                          {inspector.passRate}% pass rate • {formatTime(inspector.avgTime)} avg time
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={passRating.color as any}>
                        {passRating.text}
                      </Badge>
                      <Badge variant={timeRating.color as any}>
                        {timeRating.text}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Performance vs Time Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pass Rate Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleInspectorData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="inspector" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Pass Rate %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Pass Rate']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="passRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Efficiency Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="avgTime" 
                    type="number"
                    domain={[0, 3]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Avg Time (hours)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="passRate"
                    type="number"
                    domain={[70, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Pass Rate %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'passRate' ? `${value}%` : `${value}h`,
                      name === 'passRate' ? 'Pass Rate' : 'Avg Time'
                    ]}
                    labelFormatter={(label: string) => `Inspector: ${label}`}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Scatter dataKey="passRate" fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Ideal: High pass rate with low time investment (top-left quadrant)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-600">Top Performers</h4>
              <div className="space-y-1">
                {sampleInspectorData
                  .filter(i => i.passRate >= 90)
                  .slice(0, 3)
                  .map(inspector => (
                    <div key={inspector.inspector} className="text-sm">
                      {inspector.inspector} ({inspector.passRate}%)
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Most Efficient</h4>
              <div className="space-y-1">
                {sampleInspectorData
                  .sort((a, b) => a.avgTime - b.avgTime)
                  .slice(0, 3)
                  .map(inspector => (
                    <div key={inspector.inspector} className="text-sm">
                      {inspector.inspector} ({formatTime(inspector.avgTime)})
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-amber-600">Needs Support</h4>
              <div className="space-y-1">
                {sampleInspectorData
                  .filter(i => i.passRate < 85 || i.avgTime > 2.2)
                  .slice(0, 3)
                  .map(inspector => (
                    <div key={inspector.inspector} className="text-sm">
                      {inspector.inspector} 
                      {inspector.passRate < 85 && ' (Quality)'}
                      {inspector.avgTime > 2.2 && ' (Speed)'}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAPerformanceInsights;