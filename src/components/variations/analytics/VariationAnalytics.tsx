
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Variation } from '@/types/variations';
import { formatCurrency } from '@/utils/variationTransforms';

interface VariationAnalyticsProps {
  variations: Variation[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const VariationAnalytics: React.FC<VariationAnalyticsProps> = ({ variations }) => {
  const analyticsData = useMemo(() => {
    // Status distribution
    const statusData = variations.reduce((acc, variation) => {
      acc[variation.status] = (acc[variation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusData).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count
    }));

    // Cost impact by month
    const monthlyData = variations.reduce((acc, variation) => {
      const month = new Date(variation.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = { month, cost: 0, count: 0 };
      }
      
      acc[month].cost += variation.cost_impact || 0;
      acc[month].count += 1;
      
      return acc;
    }, {} as Record<string, { month: string; cost: number; count: number }>);

    const costTrendData = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    // Priority distribution
    const priorityData = variations.reduce((acc, variation) => {
      acc[variation.priority] = (acc[variation.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityChartData = Object.entries(priorityData).map(([priority, count]) => ({
      name: priority.toUpperCase(),
      value: count
    }));

    // Summary stats
    const totalCost = variations.reduce((sum, v) => sum + (v.cost_impact || 0), 0);
    const avgCost = variations.length > 0 ? totalCost / variations.length : 0;
    const avgTimeImpact = variations.length > 0 
      ? variations.reduce((sum, v) => sum + (v.time_impact || 0), 0) / variations.length 
      : 0;

    return {
      statusChartData,
      costTrendData,
      priorityChartData,
      summary: {
        total: variations.length,
        totalCost,
        avgCost,
        avgTimeImpact,
        approved: statusData.approved || 0,
        rejected: statusData.rejected || 0,
        pending: statusData.pending_approval || 0
      }
    };
  }, [variations]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.totalCost)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.avgCost)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Time Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analyticsData.summary.avgTimeImpact)}d</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Impact Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.costTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Cost Impact']} />
              <Bar dataKey="cost" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default VariationAnalytics;
