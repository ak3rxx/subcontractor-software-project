
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye } from 'lucide-react';

const TrackTableView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');

  const subcontractors = [
    {
      id: 1,
      companyName: "Elite Electrical Services",
      contactPerson: "John Smith",
      tradeType: "Electrical",
      status: "Active",
      submittedDate: "2024-05-15",
      approvedDate: "2024-05-20",
      documentsCount: "4/4",
      insuranceExpiry: "2025-05-15",
      licenseExpiry: "2025-12-31"
    },
    {
      id: 2,
      companyName: "ProPlumb Solutions",
      contactPerson: "Sarah Johnson",
      tradeType: "Plumbing",
      status: "Pending Documents",
      submittedDate: "2024-06-01",
      approvedDate: "-",
      documentsCount: "3/4",
      insuranceExpiry: "2024-12-15",
      licenseExpiry: "2025-08-30"
    },
    {
      id: 3,
      companyName: "HVAC Masters",
      contactPerson: "Mike Wilson",
      tradeType: "HVAC",
      status: "Under Review",
      submittedDate: "2024-06-03",
      approvedDate: "-",
      documentsCount: "4/4",
      insuranceExpiry: "2025-03-20",
      licenseExpiry: "2024-11-15"
    },
    {
      id: 4,
      companyName: "Drywall Experts",
      contactPerson: "Lisa Brown",
      tradeType: "Drywall",
      status: "Rejected",
      submittedDate: "2024-05-28",
      approvedDate: "-",
      documentsCount: "2/4",
      insuranceExpiry: "2024-08-10",
      licenseExpiry: "2024-06-30"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending Documents': return 'bg-yellow-100 text-yellow-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesTrade = tradeFilter === 'all' || sub.tradeType === tradeFilter;
    return matchesSearch && matchesStatus && matchesTrade;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Dashboard</CardTitle>
        <CardDescription>Comprehensive view of all subcontractor applications and statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending Documents">Pending Documents</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Drywall">Drywall</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Results Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Insurance Expiry</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubcontractors.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.companyName}</TableCell>
                  <TableCell>{sub.contactPerson}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.tradeType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sub.status)}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{sub.submittedDate}</TableCell>
                  <TableCell className="text-sm">{sub.approvedDate}</TableCell>
                  <TableCell>
                    <span className={sub.documentsCount === '4/4' ? 'text-green-600' : 'text-red-600'}>
                      {sub.documentsCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{sub.insuranceExpiry}</TableCell>
                  <TableCell className="text-sm">{sub.licenseExpiry}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Showing {filteredSubcontractors.length} of {subcontractors.length} entries
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackTableView;
