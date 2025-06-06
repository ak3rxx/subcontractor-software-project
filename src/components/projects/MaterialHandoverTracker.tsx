
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye, Plus } from 'lucide-react';

interface MaterialHandoverTrackerProps {
  onNewHandover: () => void;
}

const MaterialHandoverTracker: React.FC<MaterialHandoverTrackerProps> = ({ onNewHandover }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');

  // Sample data
  const handovers = [
    {
      id: 1,
      project: 'Riverside Apartments',
      date: '2024-01-15',
      trade: 'Timber Supply Co',
      location: 'Level 3, North Wing',
      itemSummary: 'Framing Timber (120 pcs)',
      status: 'accepted',
      submittedBy: 'John Smith',
      attachmentCount: 5
    },
    {
      id: 2,
      project: 'Commercial Plaza',
      date: '2024-01-14',
      trade: 'Door & Hardware Plus',
      location: 'Ground Floor Lobby',
      itemSummary: 'Door Hardware Set (15 sets)',
      status: 'conditional',
      submittedBy: 'Sarah Johnson',
      attachmentCount: 8
    },
    {
      id: 3,
      project: 'Warehouse Extension',
      date: '2024-01-13',
      trade: 'Steel Fabricators Ltd',
      location: 'Section A-B',
      itemSummary: 'Steel Beams (25 units)',
      status: 'rejected',
      submittedBy: 'Mike Davis',
      attachmentCount: 3
    },
    {
      id: 4,
      project: 'Riverside Apartments',
      date: '2024-01-12',
      trade: 'Electrical Supplies',
      location: 'Level 2, All Units',
      itemSummary: 'Cable & Conduits',
      status: 'accepted',
      submittedBy: 'Lisa Wang',
      attachmentCount: 12
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">✅ Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'conditional':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Conditional</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const filteredHandovers = handovers.filter(handover => {
    const matchesSearch = handover.itemSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         handover.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         handover.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || handover.status === statusFilter;
    const matchesProject = projectFilter === 'all' || handover.project === projectFilter;
    const matchesTrade = tradeFilter === 'all' || handover.trade === tradeFilter;
    
    return matchesSearch && matchesStatus && matchesProject && matchesTrade;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search materials, trades, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="accepted">✅ Accepted</SelectItem>
              <SelectItem value="rejected">❌ Rejected</SelectItem>
              <SelectItem value="conditional">⚠️ Conditional</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="Riverside Apartments">Riverside Apartments</SelectItem>
              <SelectItem value="Commercial Plaza">Commercial Plaza</SelectItem>
              <SelectItem value="Warehouse Extension">Warehouse Extension</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="Timber Supply Co">Timber Supply Co</SelectItem>
              <SelectItem value="Door & Hardware Plus">Door & Hardware Plus</SelectItem>
              <SelectItem value="Steel Fabricators Ltd">Steel Fabricators Ltd</SelectItem>
              <SelectItem value="Electrical Supplies">Electrical Supplies</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onNewHandover} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Handover
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredHandovers.length} of {handovers.length} material handovers
      </div>

      {/* Handovers Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Trade/Location</TableHead>
              <TableHead>Item Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Attachments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHandovers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No material handovers found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredHandovers.map((handover) => (
                <TableRow key={handover.id}>
                  <TableCell className="font-medium">{handover.project}</TableCell>
                  <TableCell>{handover.date}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{handover.trade}</div>
                      <div className="text-sm text-gray-500">{handover.location}</div>
                    </div>
                  </TableCell>
                  <TableCell>{handover.itemSummary}</TableCell>
                  <TableCell>{getStatusBadge(handover.status)}</TableCell>
                  <TableCell>{handover.submittedBy}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{handover.attachmentCount} files</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-800 font-semibold">Accepted</div>
          <div className="text-2xl font-bold text-green-900">
            {handovers.filter(h => h.status === 'accepted').length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-yellow-800 font-semibold">Conditional</div>
          <div className="text-2xl font-bold text-yellow-900">
            {handovers.filter(h => h.status === 'conditional').length}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-red-800 font-semibold">Rejected</div>
          <div className="text-2xl font-bold text-red-900">
            {handovers.filter(h => h.status === 'rejected').length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-800 font-semibold">Total Handovers</div>
          <div className="text-2xl font-bold text-blue-900">{handovers.length}</div>
        </div>
      </div>
    </div>
  );
};

export default MaterialHandoverTracker;
