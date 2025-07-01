
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, FileText, Calendar, CreditCard } from 'lucide-react';

const FinanceDashboard = () => {
  // Mock data - will be replaced with real data from hooks
  const financialMetrics = {
    totalRevenue: 2450000,
    totalCosts: 1850000,
    profit: 600000,
    profitMargin: 24.5,
    pendingInvoices: 125000,
    overduePayments: 35000,
    activeProjects: 8,
    completedProjects: 12
  };

  const recentActivity = [
    { type: 'invoice', description: 'Invoice #INV-2024-001 sent to ABC Construction', amount: 45000, date: '2024-01-15' },
    { type: 'payment', description: 'Payment received for Project Alpha', amount: 120000, date: '2024-01-14' },
    { type: 'claim', description: 'Progress claim submitted for Project Delta', amount: 85000, date: '2024-01-13' },
    { type: 'schedule', description: 'Payment schedule issued for XYZ Developments', amount: 32000, date: '2024-01-12' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'claim': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'schedule': return <CreditCard className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${financialMetrics.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold">${financialMetrics.totalCosts.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-green-600">${financialMetrics.profit.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{financialMetrics.profitMargin}% margin</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                <p className="text-2xl font-bold">${financialMetrics.pendingInvoices.toLocaleString()}</p>
                {financialMetrics.overduePayments > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    ${financialMetrics.overduePayments.toLocaleString()} overdue
                  </Badge>
                )}
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Financial Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Projects</span>
                <Badge variant="default">{financialMetrics.activeProjects}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completed Projects</span>
                <Badge variant="secondary">{financialMetrics.completedProjects}</Badge>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Overall Performance</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(financialMetrics.completedProjects / (financialMetrics.activeProjects + financialMetrics.completedProjects)) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((financialMetrics.completedProjects / (financialMetrics.activeProjects + financialMetrics.completedProjects)) * 100)}% completion rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Financial Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${activity.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <FileText className="h-6 w-6 text-blue-500 mb-2" />
              <div className="text-sm font-medium">Create Invoice</div>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <Calendar className="h-6 w-6 text-orange-500 mb-2" />
              <div className="text-sm font-medium">Submit Progress Claim</div>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <CreditCard className="h-6 w-6 text-purple-500 mb-2" />
              <div className="text-sm font-medium">Record Payment Claim</div>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <DollarSign className="h-6 w-6 text-green-500 mb-2" />
              <div className="text-sm font-medium">View Budget Reports</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;
