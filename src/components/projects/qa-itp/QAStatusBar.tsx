import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { ChecklistItem } from './QAITPTemplates';

interface QAStatusBarProps {
  checklist: ChecklistItem[];
  isFormComplete: boolean;
  missingFormFields?: string[];
}

export const QAStatusBar: React.FC<QAStatusBarProps> = ({ checklist, isFormComplete, missingFormFields = [] }) => {
  // Calculate status counts
  const statusCounts = checklist.reduce(
    (acc, item) => {
      if (item.status === 'pass') acc.pass++;
      else if (item.status === 'fail') acc.fail++;
      else if (item.status === 'na') acc.na++;
      else acc.incomplete++;
      return acc;
    },
    { pass: 0, fail: 0, na: 0, incomplete: 0 }
  );

  const totalItems = checklist.length;
  const completedItems = statusCounts.pass + statusCounts.fail + statusCounts.na;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate overall status
  const calculateOverallStatus = (): { status: string; color: string; icon: React.ReactNode; details?: string } => {
    // Check for missing form fields first
    if (missingFormFields.length > 0) {
      return {
        status: 'Form Incomplete',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Clock className="h-3 w-3" />,
        details: `Missing: ${missingFormFields.join(', ')}`
      };
    }

    // Check for incomplete checklist items
    if (statusCounts.incomplete > 0) {
      return {
        status: 'Checklist Incomplete',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Clock className="h-3 w-3" />,
        details: `${statusCounts.incomplete} items pending`
      };
    }

    // Filter out N/A items for pass/fail calculation
    const passFailItems = statusCounts.pass + statusCounts.fail;
    
    if (passFailItems === 0) {
      // All items are N/A
      return {
        status: 'Pass (All N/A)',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />
      };
    }

    const failPercentage = passFailItems > 0 ? statusCounts.fail / passFailItems : 0;

    if (statusCounts.fail === 0) {
      return {
        status: 'Pass',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />
      };
    } else if (failPercentage >= 0.5) {
      return {
        status: 'Fail',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3" />
      };
    } else {
      return {
        status: 'Pending Re-inspection',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertCircle className="h-3 w-3" />
      };
    }
  };

  const overallStatus = calculateOverallStatus();

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">
            Inspection Progress: {completionPercentage}% Complete
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Counts */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Pass: {statusCounts.pass}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3 w-3 mr-1" />
              Fail: {statusCounts.fail}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              N/A: {statusCounts.na}
            </Badge>
            {statusCounts.incomplete > 0 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Clock className="h-3 w-3 mr-1" />
                Pending: {statusCounts.incomplete}
              </Badge>
            )}
          </div>

          {/* Overall Status */}
          <div className="border-l border-gray-300 pl-3">
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${overallStatus.color} font-medium`}>
                {overallStatus.icon}
                <span className="ml-1">Overall: {overallStatus.status}</span>
              </Badge>
              {overallStatus.details && (
                <div className="text-xs text-gray-500 text-right">
                  {overallStatus.details}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};