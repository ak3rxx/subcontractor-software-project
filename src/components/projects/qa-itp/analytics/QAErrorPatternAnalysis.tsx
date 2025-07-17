import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Target, FileText, Lightbulb } from 'lucide-react';

interface ErrorPattern {
  mostCommonErrors: Array<{ error: string; count: number; category: string }>;
  errorTrends: Array<{ date: string; count: number }>;
  templateErrors: Record<string, number>;
}

interface QAErrorPatternAnalysisProps {
  errorPatterns: ErrorPattern;
}

const QAErrorPatternAnalysis: React.FC<QAErrorPatternAnalysisProps> = ({
  errorPatterns
}) => {
  // Sample data for demonstration (in real app, this would come from props)
  const sampleErrors = [
    { error: 'Improper door alignment', count: 15, category: 'doors-jambs-hardware' },
    { error: 'Missing weatherstripping', count: 12, category: 'doors-jambs-hardware' },
    { error: 'Uneven skirting gaps', count: 8, category: 'skirting' },
    { error: 'Hardware not secured', count: 7, category: 'doors-jambs-hardware' },
    { error: 'Paint finish quality', count: 6, category: 'skirting' },
    { error: 'Measurement tolerance exceeded', count: 5, category: 'general' }
  ];

  const sampleTemplateErrors = {
    'doors-jambs-hardware': 34,
    'skirting': 14,
    'general': 8
  };

  const errorTrendData = [
    { date: 'Week 1', count: 12 },
    { date: 'Week 2', count: 8 },
    { date: 'Week 3', count: 15 },
    { date: 'Week 4', count: 6 }
  ];

  const errors = errorPatterns.mostCommonErrors.length > 0 ? errorPatterns.mostCommonErrors : sampleErrors;
  const templateErrors = Object.keys(errorPatterns.templateErrors).length > 0 ? errorPatterns.templateErrors : sampleTemplateErrors;

  // Transform template errors for pie chart
  const templateErrorData = Object.entries(templateErrors).map(([template, count]) => ({
    name: template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    count
  }));

  // Colors for pie chart
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Calculate error severity
  const totalErrors = errors.reduce((sum, error) => sum + error.count, 0);
  const criticalThreshold = Math.max(1, totalErrors * 0.2); // Top 20% are critical
  
  const getErrorSeverity = (count: number) => {
    if (count >= criticalThreshold) return { level: 'critical', color: 'destructive' };
    if (count >= criticalThreshold * 0.5) return { level: 'high', color: 'secondary' };
    return { level: 'medium', color: 'outline' };
  };

  // Generate recommendations based on error patterns
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (errors.length > 0) {
      const topError = errors[0];
      recommendations.push(`Address "${topError.error}" (${topError.count} occurrences) through targeted training`);
    }

    const templateWithMostErrors = Object.entries(templateErrors).reduce((a, b) => a[1] > b[1] ? a : b);
    if (templateWithMostErrors) {
      recommendations.push(`Review ${templateWithMostErrors[0]} template checklist items - ${templateWithMostErrors[1]} total errors`);
    }

    if (totalErrors > 20) {
      recommendations.push('Consider implementing additional quality control checkpoints');
    }

    if (errors.filter(e => e.category === 'doors-jambs-hardware').length > 3) {
      recommendations.push('Focus on doors and hardware installation training');
    }

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  };

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              Across all inspections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {errors.length > 0 ? (
              <>
                <div className="text-lg font-bold truncate" title={errors[0].error}>
                  {errors[0].error}
                </div>
                <div className="text-sm text-muted-foreground">
                  {errors[0].count} occurrences
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No errors recorded</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalErrors > 0 ? Math.round((totalErrors / 50) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              Of total inspections
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Common Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Most Common Error Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length > 0 ? (
            <div className="space-y-4">
              {errors.slice(0, 6).map((error, index) => {
                const severity = getErrorSeverity(error.count);
                const percentage = (error.count / totalErrors) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate max-w-[300px]" title={error.error}>
                          {error.error}
                        </span>
                        <Badge variant={severity.color as any}>
                          {severity.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{error.count} occurrences</span>
                        <span>({Math.round(percentage)}%)</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No error data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Distribution by Template */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Errors by Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templateErrorData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={templateErrorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {templateErrorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Errors']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No template error data available
              </div>
            )}
            
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-4">
              {templateErrorData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{entry.name} ({entry.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Error Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Errors']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QAErrorPatternAnalysis;