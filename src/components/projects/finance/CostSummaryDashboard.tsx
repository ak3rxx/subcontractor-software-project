
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FileText, Download, AlertTriangle } from 'lucide-react';

interface CostSummaryDashboardProps {
  projectName: string;
}

const CostSummaryDashboard: React.FC<CostSummaryDashboardProps> = ({ projectName }) => {
  // Sample financial summary data
  const financialSummary = {
    totalBudget: 125000,
    totalCommitted: 98500,
    totalIncurred: 72400,
    forecastRemaining: 26500,
    overruns: 3000
  };

  // Sample trade distribution data for pie chart
  const tradeDistributionData = [
    { name: 'Prelims', value: 15000, fill: '#8884d8' },
    { name: 'Carpentry', value: 48000, fill: '#82ca9d' },
    { name: 'Plumbing', value: 22000, fill: '#ffc658' },
    { name: 'Electrical', value: 18000, fill: '#ff8042' },
    { name: 'Roofing', value: 12000, fill: '#0088fe' },
    { name: 'Painting', value: 10000, fill: '#00C49F' }
  ];

  // Sample budget vs actual data for bar chart
  const budgetVsActualData = [
    { name: 'Prelims', budget: 14000, actual: 15000 },
    { name: 'Carpentry', budget: 45000, actual: 48000 },
    { name: 'Plumbing', budget: 22000, actual: 22000 },
    { name: 'Electrical', budget: 20000, actual: 18000 },
    { name: 'Roofing', budget: 14000, actual: 12000 },
    { name: 'Painting', budget: 10000, actual: 10000 },
  ];

  // Sample cost overruns data
  const costOverruns = [
    { trade: 'Carpentry', budgeted: 45000, actual: 48000, variance: 3000, percentage: 6.7 },
    { trade: 'Prelims', budgeted: 14000, actual: 15000, variance: 1000, percentage: 7.1 }
  ];

  // Background colors for the cards
  const cardColors = {
    budget: 'bg-blue-50 border-blue-200',
    committed: 'bg-green-50 border-green-200',
    incurred: 'bg-yellow-50 border-yellow-200',
    remaining: 'bg-purple-50 border-purple-200',
    overruns: 'bg-red-50 border-red-200'
  };

  // Colors for the bar chart
  const barColors = {
    budget: '#8884d8',
    actual: '#82ca9d'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Cost Summary & Forecast</CardTitle>
              <CardDescription>
                Overview of project financials and cost forecast
              </CardDescription>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <Card className={`${cardColors.budget} border`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium text-blue-800 mb-1">Total Budget</p>
                <h3 className="text-2xl font-bold text-blue-900">${financialSummary.totalBudget.toLocaleString()}</h3>
                <p className="text-xs text-blue-700 mt-1">Approved budget</p>
              </CardContent>
            </Card>
            
            <Card className={`${cardColors.committed} border`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium text-green-800 mb-1">Total Committed</p>
                <h3 className="text-2xl font-bold text-green-900">${financialSummary.totalCommitted.toLocaleString()}</h3>
                <p className="text-xs text-green-700 mt-1">{Math.round((financialSummary.totalCommitted / financialSummary.totalBudget) * 100)}% of budget</p>
              </CardContent>
            </Card>
            
            <Card className={`${cardColors.incurred} border`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium text-yellow-800 mb-1">Total Incurred</p>
                <h3 className="text-2xl font-bold text-yellow-900">${financialSummary.totalIncurred.toLocaleString()}</h3>
                <p className="text-xs text-yellow-700 mt-1">{Math.round((financialSummary.totalIncurred / financialSummary.totalBudget) * 100)}% of budget</p>
              </CardContent>
            </Card>
            
            <Card className={`${cardColors.remaining} border`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium text-purple-800 mb-1">Forecast Remaining</p>
                <h3 className="text-2xl font-bold text-purple-900">${financialSummary.forecastRemaining.toLocaleString()}</h3>
                <p className="text-xs text-purple-700 mt-1">{Math.round((financialSummary.forecastRemaining / financialSummary.totalBudget) * 100)}% of budget</p>
              </CardContent>
            </Card>
            
            <Card className={`${cardColors.overruns} border`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium text-red-800 mb-1">Cost Overruns</p>
                <h3 className="text-2xl font-bold text-red-900">${financialSummary.overruns.toLocaleString()}</h3>
                <p className="text-xs text-red-700 mt-1">{Math.round((financialSummary.overruns / financialSummary.totalBudget) * 100)}% of budget</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cost Distribution by Trade</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-64">
                  <ChartContainer config={{
                    tradeDistributionData: { theme: { light: '#000', dark: '#fff' } }
                  }}>
                    <PieChart>
                      <Pie
                        data={tradeDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {tradeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {tradeDistributionData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                      <span className="text-xs">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Budget vs Actual by Trade</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-64">
                  <ChartContainer config={{
                    budget: { theme: { light: barColors.budget, dark: barColors.budget } },
                    actual: { theme: { light: barColors.actual, dark: barColors.actual } }
                  }}>
                    <BarChart data={budgetVsActualData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="budget" fill={barColors.budget} name="Budget" />
                      <Bar dataKey="actual" fill={barColors.actual} name="Actual" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Cost Overruns */}
          {costOverruns.length > 0 && (
            <Card className="bg-red-50 border border-red-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg text-red-800">Cost Overruns</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costOverruns.map((item, index) => (
                    <div key={`overrun-${index}`} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.trade}</p>
                        <p className="text-sm text-red-700">
                          Budget: ${item.budgeted.toLocaleString()} | 
                          Actual: ${item.actual.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-700">+${item.variance.toLocaleString()}</p>
                        <p className="text-sm text-red-600">
                          {item.percentage}% over budget
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              This financial data is restricted to the following roles:
            </p>
            <div className="flex gap-2">
              <Badge className="bg-blue-100 text-blue-800">Project Manager</Badge>
              <Badge className="bg-purple-100 text-purple-800">Estimator</Badge>
              <Badge className="bg-green-100 text-green-800">Finance Manager</Badge>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              <p>
                To update role permissions, please contact your system administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostSummaryDashboard;
