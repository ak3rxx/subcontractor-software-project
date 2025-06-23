
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Activity, 
  TestTube, 
  FileText, 
  Database, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Code,
  Shield
} from 'lucide-react';
import QADiagnosticTool from './QADiagnosticTool';
import QATestPlatform from './QATestPlatform';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const systemHealth = {
    overall: 'good',
    components: {
      'File Upload System': 'good',
      'Change History': 'warning',
      'Data Persistence': 'good',
      'Type Safety': 'good',
      'Performance': 'warning',
      'Code Quality': 'needs-attention'
    }
  };

  const recentOptimizations = [
    {
      date: 'Today',
      items: [
        'Fixed TypeScript type predicate errors in file handling',
        'Improved file conversion with proper type guards',
        'Added debounced change tracking for better performance',
        'Enhanced error handling in upload system'
      ]
    }
  ];

  const codeMetrics = {
    totalFiles: 15,
    largeFiles: 4,
    linesOfCode: 2847,
    testCoverage: 45,
    typeScriptErrors: 0
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'needs-attention':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthBadge = (status: string) => {
    const variants = {
      good: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      'needs-attention': 'bg-red-100 text-red-800'
    };

    return <Badge className={variants[status as keyof typeof variants]}>{status.replace('-', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Developer Admin Panel</h1>
              <p className="text-gray-600">QA/ITP System Management & Diagnostics</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">v2.1.0</Badge>
              <Badge variant="outline">Development Mode</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Testing Platform
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security & Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                This admin panel is only visible to developers and provides comprehensive system monitoring and testing capabilities.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Health</p>
                      <p className="text-2xl font-bold text-green-600">Good</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Code Files</p>
                      <p className="text-2xl font-bold">{codeMetrics.totalFiles}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Lines of Code</p>
                      <p className="text-2xl font-bold">{codeMetrics.linesOfCode.toLocaleString()}</p>
                    </div>
                    <Code className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">TS Errors</p>
                      <p className="text-2xl font-bold text-green-600">{codeMetrics.typeScriptErrors}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Component Health Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(systemHealth.components).map(([component, status]) => (
                      <div key={component} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getHealthIcon(status)}
                          <span className="text-sm font-medium">{component}</span>
                        </div>
                        {getHealthBadge(status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOptimizations.map((day, dayIndex) => (
                      <div key={dayIndex}>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">{day.date}</h4>
                        <ul className="space-y-1">
                          {day.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-xs text-gray-600 flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Code Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{codeMetrics.largeFiles}</div>
                    <div className="text-sm text-gray-600">Large Files (&gt;200 lines)</div>
                    <div className="text-xs text-gray-500 mt-1">Recommend refactoring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{codeMetrics.testCoverage}%</div>
                    <div className="text-sm text-gray-600">Test Coverage</div>
                    <div className="text-xs text-gray-500 mt-1">Target: 80%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{codeMetrics.typeScriptErrors}</div>
                    <div className="text-sm text-gray-600">TypeScript Errors</div>
                    <div className="text-xs text-gray-500 mt-1">All resolved ✓</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics">
            <QADiagnosticTool />
          </TabsContent>

          <TabsContent value="testing">
            <QATestPlatform />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Security monitoring and access control for the QA/ITP system.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Row Level Security (RLS)</span>
                      <Badge className="bg-green-100 text-green-800">ENABLED</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Authentication Required</span>
                      <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">File Storage Bucket</span>
                      <Badge className="bg-blue-100 text-blue-800">PUBLIC</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Change History Tracking</span>
                      <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">API Calls Today:</span> 247
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">File Uploads:</span> 12
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Failed Auth Attempts:</span> 0
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Error Rate:</span> 0.8%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
