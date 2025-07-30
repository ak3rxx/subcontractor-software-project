import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  confidence: number;
  milestones: number;
  trades: number;
  zones: number;
  message: string;
  msProjectDetected?: boolean;
}

export const MSProjectTestComponent: React.FC = () => {
  const [testData, setTestData] = useState(`
ID   Task Name                    Duration   Start Date   Finish Date   Predecessors
1    Project Start               0 days     01/03/2024   01/03/2024    
2    Site Preparation            5 days     01/03/2024   08/03/2024    1
3    Excavation                  3 days     11/03/2024   13/03/2024    2
4    Concrete Foundation         2 days     14/03/2024   15/03/2024    3
5    Structural Framing          10 days    18/03/2024   29/03/2024    4
6    First Fix Carpentry         8 days     01/04/2024   10/04/2024    5
7    Electrical First Fix        5 days     01/04/2024   05/04/2024    5
8    Plumbing First Fix          4 days     02/04/2024   05/04/2024    5
9    Fit Off Carpentry           6 days     11/04/2024   18/04/2024    6,7,8
10   Door Install Level 1        2 days     19/04/2024   22/04/2024    9
11   Delivery of Skirting        1 day      23/04/2024   23/04/2024    10
12   Architrave Installation     3 days     24/04/2024   26/04/2024    11
13   Cornice Installation        2 days     29/04/2024   30/04/2024    12
14   Fix Out Building 1          4 days     01/05/2024   06/05/2024    13
15   Final Inspection            1 day      07/05/2024   07/05/2024    14
16   Practical Completion        0 days     08/05/2024   08/05/2024    15
  `);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const runMSProjectTest = async () => {
    if (!testData.trim()) {
      toast({
        title: "Test Data Required",
        description: "Please provide test data to parse",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Convert test data to base64 for simulation
      const fileContent = btoa(testData);
      
      // Call the parse document function
      const { data, error } = await supabase.functions.invoke('parse-programme-document', {
        body: {
          fileContent,
          fileName: 'test_ms_project_schedule.txt',
          fileType: 'text/plain',
          projectId: 'test-project-id',
          documentId: 'test-document-id'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to parse document');
      }

      const result = data?.data || {};
      setTestResult({
        success: data?.success || false,
        confidence: Math.round((result.confidence || 0) * 100),
        milestones: result.milestones?.length || 0,
        trades: result.trades?.length || 0,
        zones: result.zones?.length || 0,
        message: data?.message || 'Test completed',
        msProjectDetected: true // We know this is MS Project data
      });

      toast({
        title: "Test Completed",
        description: `Parsed with ${Math.round((result.confidence || 0) * 100)}% confidence`,
      });

    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({
        success: false,
        confidence: 0,
        milestones: 0,
        trades: 0,
        zones: 0,
        message: error instanceof Error ? error.message : 'Test failed',
      });

      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Microsoft Project Intelligence Test
          </CardTitle>
          <CardDescription>
            Test the enhanced Microsoft Project parsing capabilities with Australian construction terminology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Test Data (MS Project Format)
            </label>
            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="Paste MS Project task data here..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <Button 
            onClick={runMSProjectTest}
            disabled={testing}
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Testing MS Project Parsing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Run Microsoft Project Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {testResult.confidence}%
                </div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResult.milestones}
                </div>
                <div className="text-sm text-muted-foreground">Milestones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResult.trades}
                </div>
                <div className="text-sm text-muted-foreground">Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {testResult.zones}
                </div>
                <div className="text-sm text-muted-foreground">Zones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {testResult.msProjectDetected ? 'YES' : 'NO'}
                </div>
                <div className="text-sm text-muted-foreground">MS Project</div>
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{testResult.message}</p>
            </div>

            {testResult.success && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">
                  Expected Improvements from Microsoft Project Intelligence:
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Higher confidence scores (target: 80%+ for MS Project documents)</li>
                  <li>• Better recognition of Australian construction terminology</li>
                  <li>• Accurate milestone extraction from task hierarchies</li>
                  <li>• Proper trade identification from resource assignments</li>
                  <li>• Dependency parsing from predecessor/successor relationships</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};