
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';

const ReviewLog = () => {
  const reviewEntries = [
    {
      id: 1,
      subcontractor: "Elite Electrical Services",
      reviewer: "Sarah Johnson",
      action: "Approved",
      date: "2024-06-05 14:30",
      notes: "All documents verified, insurance valid",
      status: "completed"
    },
    {
      id: 2,
      subcontractor: "ProPlumb Solutions",
      reviewer: "Mike Wilson",
      action: "Requested Documents",
      date: "2024-06-05 10:15",
      notes: "Missing updated insurance certificate",
      status: "pending"
    },
    {
      id: 3,
      subcontractor: "HVAC Masters",
      reviewer: "Lisa Brown",
      action: "Under Review",
      date: "2024-06-04 16:45",
      notes: "Background check in progress",
      status: "in-progress"
    },
    {
      id: 4,
      subcontractor: "Drywall Experts",
      reviewer: "David Martinez",
      action: "Rejected",
      date: "2024-06-04 09:20",
      notes: "License expired, needs renewal",
      status: "rejected"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Log</CardTitle>
        <CardDescription>Complete history of all review activities and decisions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subcontractor</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.subcontractor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {entry.reviewer}
                  </div>
                </TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell className="text-sm text-gray-600">{entry.date}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(entry.status)}
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{entry.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ReviewLog;
