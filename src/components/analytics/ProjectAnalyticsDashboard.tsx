import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Target, Activity } from 'lucide-react';
import { formatCurrency } from '@/utils/variationTransforms';
import { UnifiedIntelligenceDashboard } from '@/components/intelligence/UnifiedIntelligenceDashboard';

interface ProjectData {
  id: string;
  name: string;
  status: string;
  total_budget?: number;
  created_at: string;
  project_type?: string;
}

interface VariationData {
  id: string;
  project_id: string;
  cost_impact?: number;
  time_impact?: number;
  status: string;
  priority: string;
  created_at: string;
  category?: string;
  trade?: string;
}

interface TaskData {
  id: string;
  project_id?: string;
  status: string;
  priority: string;
  created_at: string;
  completed_date?: string;
  due_date?: string;
}

interface QAData {
  id: string;
  project_id: string;
  overall_status: string;
  created_at: string;
  trade: string;
}

interface ProjectAnalyticsProps {
  projects: ProjectData[];
  variations: VariationData[];
  tasks: TaskData[];
  qaInspections?: QAData[];
  selectedProjectId?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#FF8042', '#0088FE', '#00C49F'];

const ProjectAnalyticsDashboard: React.FC<ProjectAnalyticsProps> = ({
  projects,
  variations,
  tasks,
  qaInspections = [],
  selectedProjectId
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  const filteredData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

    const filterByProject = (item: any) => 
      selectedProject === 'all' || item.project_id === selectedProject;
    
    const filterByDate = (item: any) => 
      new Date(item.created_at) >= cutoffDate;

    return {
      projects: selectedProject === 'all' ? projects : projects.filter(p => p.id === selectedProject),
      variations: variations.filter(v => filterByProject(v) && filterByDate(v)),
      tasks: tasks.filter(t => filterByProject(t) && filterByDate(t)),
      qaInspections: qaInspections.filter(qa => filterByProject(qa) && filterByDate(qa))
    };
  }, [projects, variations, tasks, qaInspections, selectedProject, dateRange]);

  const analytics = useMemo(() => {
    const { projects: filteredProjects, variations: filteredVariations, tasks: filteredTasks, qaInspections: filteredQA } = filteredData;

    // Overall KPIs
    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
    const totalVariationCost = filteredVariations.reduce((sum, v) => sum + (v.cost_impact || 0), 0);
    const budgetVariance = totalBudget > 0 ? ((totalVariationCost / totalBudget) * 100) : 0;

    // Project Health Score (0-100)
    const activeProjects = filteredProjects.filter(p => p.status === 'in-progress').length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const totalTasks = filteredTasks.length;
    const passedQA = filteredQA.filter(qa => qa.overall_status === 'passed').length;
    const totalQA = filteredQA.length;
    
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    const qaPassRate = totalQA > 0 ? (passedQA / totalQA) * 100 : 100;
    const projectHealthScore = Math.round((taskCompletionRate + qaPassRate) / 2);

    // Risk Assessment
    const highPriorityVariations = filteredVariations.filter(v => v.priority === 'high').length;
    const overdueTasks = filteredTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const failedQA = filteredQA.filter(qa => qa.overall_status === 'failed').length;
    
    const riskLevel = highPriorityVariations + overdueTasks + failedQA;
    const riskStatus = riskLevel === 0 ? 'Low' : riskLevel <= 3 ? 'Medium' : 'High';

    // Timeline Analysis
    const monthlyData: Record<string, { month: string; variations: number; tasks: number; qa: number; cost: number }> = {};
    const processMonthly = (items: any[], key: string) => {
      items.forEach(item => {
        const month = new Date(item.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, variations: 0, tasks: 0, qa: 0, cost: 0 };
        }
        monthlyData[month][key]++;
        if (key === 'variations' && item.cost_impact) {
          monthlyData[month].cost += Number(item.cost_impact);
        }
      });
    };

    processMonthly(filteredVariations, 'variations');
    processMonthly(filteredTasks, 'tasks');
    processMonthly(filteredQA, 'qa');

    const timelineData = Object.values(monthlyData).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    // Status Distribution
    const variationStatusData = filteredVariations.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(variationStatusData).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count
    }));

    // Trade Performance
    const tradeData = filteredVariations.reduce((acc, v) => {
      const trade = v.trade || 'Other';
      if (!acc[trade]) {
        acc[trade] = { trade, variations: 0, cost: 0, avgCost: 0 };
      }
      acc[trade].variations++;
      acc[trade].cost += v.cost_impact || 0;
      acc[trade].avgCost = acc[trade].cost / acc[trade].variations;
      return acc;
    }, {} as Record<string, any>);

    const tradePerformance = Object.values(tradeData).sort((a: any, b: any) => b.cost - a.cost);

    // Predictive Insights
    const recentVariations = filteredVariations.filter(v => {
      const daysDiff = (new Date().getTime() - new Date(v.created_at).getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });
    
    const variationTrend = recentVariations.length;
    const avgMonthlyCost: number = timelineData.length > 0 
      ? timelineData.reduce((sum: number, month: any) => sum + (Number(month.cost) || 0), 0) / timelineData.length 
      : 0;
    
    const projectedMonthlyCost = avgMonthlyCost * 1.1; // 10% increase projection
    const completionProbability = Math.max(0, Math.min(100, 100 - (riskLevel * 10)));

    return {
      kpis: {
        totalBudget,
        totalVariationCost,
        budgetVariance,
        projectHealthScore,
        riskStatus,
        activeProjects,
        completionProbability
      },
      charts: {
        timeline: timelineData,
        statusDistribution: statusChartData,
        tradePerformance: tradePerformance.slice(0, 8),
      },
      insights: {
        variationTrend,
        projectedMonthlyCost,
        riskLevel,
        recommendations: [
          riskLevel > 5 ? 'High risk detected - review project scope and timelines' : 'Project risk is manageable',
          budgetVariance > 10 ? 'Budget variance exceeding 10% - cost control review needed' : 'Budget tracking on target',
          qaPassRate < 80 ? 'QA performance below target - review quality processes' : 'Quality standards being maintained'
        ]
      }
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">Project Analytics Dashboard</h2>
        <div className="flex gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.kpis.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Variation Impact: {formatCurrency(analytics.kpis.totalVariationCost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.kpis.projectHealthScore}%</div>
            <p className={`text-xs ${analytics.kpis.projectHealthScore >= 80 ? 'text-green-600' : analytics.kpis.projectHealthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {analytics.kpis.projectHealthScore >= 80 ? 'Excellent' : analytics.kpis.projectHealthScore >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.kpis.riskStatus}</div>
            <p className={`text-xs ${analytics.kpis.riskStatus === 'Low' ? 'text-green-600' : analytics.kpis.riskStatus === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
              Based on current indicators
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
            <div className="text-2xl font-bold">{analytics.kpis.completionProbability}%</div>
            <p className="text-xs text-muted-foreground">
              On-time delivery likelihood
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Intelligence Dashboard for single project view */}
      {selectedProjectId && (
        <UnifiedIntelligenceDashboard 
          projectId={selectedProjectId}
          projectName={projects.find(p => p.id === selectedProjectId)?.name || 'Project'}
        />
      )}

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          {selectedProjectId && <TabsTrigger value="intelligence">Intelligence</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.charts.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="variations" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="tasks" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="qa" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Variation Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.charts.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.charts.statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Trade Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.charts.tradePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trade" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total Cost']} />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predictive Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Projected Monthly Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.insights.projectedMonthlyCost)}</p>
                  <p className="text-xs text-muted-foreground">Based on current trends</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Variation Trend</p>
                  <p className="text-lg">{analytics.insights.variationTrend} new variations this month</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {selectedProjectId && (
          <TabsContent value="intelligence" className="space-y-4">
            <UnifiedIntelligenceDashboard 
              projectId={selectedProjectId}
              projectName={projects.find(p => p.id === selectedProjectId)?.name || 'Project'}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProjectAnalyticsDashboard;