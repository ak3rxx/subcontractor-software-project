
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye, AlertTriangle, Clock } from 'lucide-react';

const TrackTableView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');

  const subcontractors = [
    {
      id: 1,
      companyName: "Elite Electrical Services",
      contactPerson: "John Smith",
      tradeType: "Electrical",
      status: "Active",
      submittedDate: "2024-05-15",
      approvedDate: "2024-05-20",
      documentsCount: "5/5",
      workersCompExpiry: "2025-05-15",
      publicLiabilityExpiry: "2025-05-15",
      licenseExpiry: "2025-12-31",
      reviewNotes: "All documents verified"
    },
    {
      id: 2,
      companyName: "ProPlumb Solutions",
      contactPerson: "Sarah Johnson",
      tradeType: "Plumbing",
      status: "Pending Documents",
      submittedDate: "2024-06-01",
      approvedDate: "-",
      documentsCount: "4/5",
      workersCompExpiry: "2024-12-15",
      publicLiabilityExpiry: "2024-12-15",
      licenseExpiry: "2025-08-30",
      reviewNotes: "Missing SWMS document"
    },
    {
      id: 3,
      companyName: "HVAC Masters",
      contactPerson: "Mike Wilson",
      tradeType: "HVAC",
      status: "Under Review",
      submittedDate: "2024-06-03",
      approvedDate: "-",
      documentsCount: "5/5",
      workersCompExpiry: "2025-03-20",
      publicLiabilityExpiry: "2025-03-20",
      licenseExpiry: "2024-07-15",
      reviewNotes: "Awaiting approval from safety coordinator"
    },
    {
      id: 4,
      companyName: "Drywall Experts",
      contactPerson: "Lisa Brown",
      tradeType: "Drywall",
      status: "Rejected",
      submittedDate: "2024-05-28",
      approvedDate: "-",
      documentsCount: "3/5",
      workersCompExpiry: "2024-08-10",
      publicLiabilityExpiry: "2024-08-10",
      licenseExpiry: "2024-06-30",
      reviewNotes: "Insufficient insurance coverage, expired license"
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

  const isExpiringWithin30Days = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const daysDifference = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDifference <= 30 && daysDifference >= 0;
  };

  const isExpired = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  const getExpiryStatus = (workersCompExpiry: string, publicLiabilityExpiry: string, licenseExpiry: string) => {
    if (isExpired(workersCompExpiry) || isExpired(publicLiabilityExpiry) || isExpired(licenseExpiry)) {
      return { color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" />, text: 'Expired' };
    }
    if (isExpiringWithin30Days(workersCompExpiry) || isExpiringWithin30Days(publicLiabilityExpiry) || isExpiringWithin30Days(licenseExpiry)) {
      return { color: 'text-amber-600', icon: <Clock className="h-4 w-4" />, text: 'Expiring Soon' };
    }
    return { color: 'text-green-600', icon: null, text: 'Current' };
  };

  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesTrade = tradeFilter === 'all' || sub.tradeType === tradeFilter;
    
    let matchesExpiry = true;
    if (expiryFilter === 'expired') {
      matchesExpiry = isExpired(sub.workersCompExpiry) || isExpired(sub.publicLiabilityExpiry) || isExpired(sub.licenseExpiry);
    } else if (expiryFilter === 'expiring') {
      matchesExpiry = isExpiringWithin30Days(sub.workersCompExpiry) || isExpiringWithin30Days(sub.publicLiabilityExpiry) || isExpiringWithin30Days(sub.licenseExpiry);
    }
    
    return matchesSearch && matchesStatus && matchesTrade && matchesExpiry;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcontractor Tracking Dashboard</CardTitle>
        <CardDescription>Comprehensive view of all subcontractor applications and compliance status</CardDescription>
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

          <Select value={expiryFilter} onValueChange={setExpiryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expiry Status</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="expiring">Expiring Within 30 Days</SelectItem>
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
                <TableHead>Documents</TableHead>
                <TableHead>Workers Comp Expiry</TableHead>
                <TableHead>Public Liability Expiry</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead>Review Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubcontractors.map((sub) => {
                const expiryStatus = getExpiryStatus(sub.workersCompExpiry, sub.publicLiabilityExpiry, sub.licenseExpiry);
                return (
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
                    <TableCell>
                      <span className={sub.documentsCount === '5/5' ? 'text-green-600' : 'text-red-600'}>
                        {sub.documentsCount}
                      </span>
                    </TableCell>
                    <TableCell className={`text-sm ${isExpired(sub.workersCompExpiry) ? 'text-red-600 font-semibold' : isExpiringWithin30Days(sub.workersCompExpiry) ? 'text-amber-600' : ''}`}>
                      {sub.workersCompExpiry}
                    </TableCell>
                    <TableCell className={`text-sm ${isExpired(sub.publicLiabilityExpiry) ? 'text-red-600 font-semibold' : isExpiringWithin30Days(sub.publicLiabilityExpiry) ? 'text-amber-600' : ''}`}>
                      {sub.publicLiabilityExpiry}
                    </TableCell>
                    <TableCell className={`text-sm ${isExpired(sub.licenseExpiry) ? 'text-red-600 font-semibold' : isExpiringWithin30Days(sub.licenseExpiry) ? 'text-amber-600' : ''}`}>
                      {sub.licenseExpiry}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{sub.reviewNotes}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {expiryStatus.icon && (
                          <span className={expiryStatus.color} title={expiryStatus.text}>
                            {expiryStatus.icon}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Showing {filteredSubcontractors.length} of {subcontractors.length} entries
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Expired</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Expiring Soon</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackTableView;
