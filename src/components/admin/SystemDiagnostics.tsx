
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Play, RefreshCw } from 'lucide-react';

interface DiagnosticCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
}

const SystemDiagnostics: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<DiagnosticCheck[]>([
    {
      id: 'permissions',
      name: 'Permission System',
      status: 'pass',
      message: 'All role permissions are properly configured'
    },
    {
      id: 'database',
      name: 'Database Connectivity',
      status: 'pass',
      message: 'Database connection is healthy'
    },
    {
      id: 'auth',
      name: 'Authentication',
      status: 'pass',
      message: 'Auth system is functioning correctly'
    },
    {
      id: 'rls',
      name: 'Row Level Security',
      status: 'warning',
      message: 'Some tables may have overly permissive policies',
      details: 'Review RLS policies for optimal security'
    },
    {
      id: 'features',
      name: 'Feature Flags',
      status: 'pass',
      message: 'All feature flags are operational'
    }
  ]);

  const runDiagnostics = async () => {
    setRunning(true);
    
    // Simulate running diagnostics
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update check results (in real implementation, this would run actual checks)
    setChecks(prev => prev.map(check => ({
      ...check,
      status: Math.random() > 0.8 ? 'warning' : 'pass'
    })));
    
    setRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const healthScore = Math.round((checks.filter(c => c.status === 'pass').length / checks.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Health Dashboard</CardTitle>
          <CardDescription>
            Monitor system integrity and run diagnostic checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{healthScore}%</div>
              <div className="text-sm text-gray-600">System Health Score</div>
            </div>
            <Progress value={healthScore} className="w-32" />
          </div>
          
          <Button 
            onClick={runDiagnostics} 
            disabled={running}
            className="flex items-center gap-2"
          >
            {running ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Full Diagnostic
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-gray-600">{check.message}</div>
                    {check.details && (
                      <div className="text-xs text-gray-500 mt-1">{check.details}</div>
                    )}
                  </div>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {checks.some(c => c.status === 'warning' || c.status === 'error') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some issues were detected. Review the diagnostic results above and consider running repairs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SystemDiagnostics;
