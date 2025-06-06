
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye, Plus, Calendar, Package } from 'lucide-react';

interface MaterialHandoverTrackerProps {
  onNewHandover: () => void;
  onScheduleDelivery?: () => void;
}

const MaterialHandoverTracker: React.FC<MaterialHandoverTrackerProps> = ({ 
  onNewHandover, 
  onScheduleDelivery 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');

  // Extended sample data including both scheduled and completed handovers
  const deliveriesAndHandovers = [
    {
      id: 1,
      deliveryId: 'DEL-20240115-ABC1',
      project: 'Riverside Apartments',
      date: '2024-01-15',
      trade: 'Timber Supply Co',
      location: 'Level 3, North Wing',
      itemSummary: 'Framing Timber (120 pcs)',
      status: 'accepted',
      type: 'handover',
      submittedBy: 'John Smith',
      attachmentCount: 5
    },
    {
      id: 2,
      deliveryId: 'DEL-20240114-XYZ2',
      project: 'Commercial Plaza',
      date: '2024-01-14',
      trade: 'Door & Hardware Plus',
      location: 'Ground Floor Lobby',
      itemSummary: 'Door Hardware Set (15 sets)',
      status: 'conditional',
      type: 'handover',
      submittedBy: 'Sarah Johnson',
      attachmentCount: 8
    },
    {
      id: 3,
      deliveryId: 'DEL-20240113-STL3',
      project: 'Warehouse Extension',
      date: '2024-01-13',
      trade: 'Steel Fabricators Ltd',
      location: 'Section A-B',
      itemSummary: 'Steel Beams (25 units)',
      status: 'rejected',
      type: 'handover',
      submittedBy: 'Mike Davis',
      attachmentCount: 3
    },
    {
      id: 4,
      deliveryId: 'DEL-20240112-ELE4',
      project: 'Riverside Apartments',
      date: '2024-01-12',
      trade: 'Electrical Supplies',
      location: 'Level 2, All Units',
      itemSummary: 'Cable & Conduits',
      status: 'accepted',
      type: 'handover',
      submittedBy: 'Lisa Wang',
      attachmentCount: 12
    },
    {
      id: 5,
      deliveryId: 'DEL-20240118-TIM5',
      project: 'Commercial Plaza',
      date: '2024-01-18',
      trade: 'Timber Supply Co',
      location: 'Level 1, East Wing',
      itemSummary: 'Flooring Timber (200 m²)',
      status: 'scheduled',
      type: 'scheduled',
      submittedBy: 'Planning Team',
      attachmentCount: 0,
      priority: 'high'
    },
    {
      id: 6,
      deliveryId: 'DEL-20240120-PLU6',
      project: 'Warehouse Extension',
      date: '2024-01-20',
      trade: 'Plumbing Supplies',
      location: 'Ground Floor',
      itemSummary: 'Pipe Fittings & Valves',
      status: 'scheduled',
      type: 'scheduled',
      submittedBy: 'Planning Team',
      attachmentCount: 0,
      priority: 'normal'
    }
  ];

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'scheduled') {
      return <Badge className="bg-blue-100 text-blue-800">📅 Scheduled</Badge>;
    }
    
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 ml-2">🔴 High</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 ml-2">🟢 Low</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 ml-2">🟡 Normal</Badge>;
    }
  };

  const filteredData = deliveriesAndHandovers.filter(item => {
    const matchesSearch = item.itemSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.deliveryId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProject = projectFilter === 'all' || item.project === projectFilter;
    const matchesTrade = tradeFilter === 'all' || item.trade === tradeFilter;
    
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
              placeholder="Search deliveries, materials, trades..."
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
              <SelectItem value="scheduled">📅 Scheduled</SelectItem>
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
              <SelectItem value="Plumbing Supplies">Plumbing Supplies</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {onScheduleDelivery && (
            <Button onClick={onScheduleDelivery} variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Delivery
            </Button>
          )}
          <Button onClick={onNewHandover} className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            New Handover
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredData.length} of {deliveriesAndHandovers.length} deliveries and handovers
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery ID</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Trade/Location</TableHead>
              <TableHead>Item Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No deliveries or handovers found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.deliveryId}</TableCell>
                  <TableCell className="font-medium">{item.project}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.trade}</div>
                      <div className="text-sm text-gray-500">{item.location}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.itemSummary}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusBadge(item.status, item.type)}
                      {item.type === 'scheduled' && item.priority && getPriorityBadge(item.priority)}
                    </div>
                  </TableCell>
                  <TableCell>{item.submittedBy}</TableCell>
                  <TableCell>
                    {item.type === 'handover' ? (
                      <Badge variant="outline">{item.attachmentCount} files</Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">Pending handover</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {item.type === 'scheduled' ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={onNewHandover}
                          title="Create Handover"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-800 font-semibold">Scheduled</div>
          <div className="text-2xl font-bold text-blue-900">
            {deliveriesAndHandovers.filter(h => h.status === 'scheduled').length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-800 font-semibold">Accepted</div>
          <div className="text-2xl font-bold text-green-900">
            {deliveriesAndHandovers.filter(h => h.status === 'accepted').length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-yellow-800 font-semibold">Conditional</div>
          <div className="text-2xl font-bold text-yellow-900">
            {deliveriesAndHandovers.filter(h => h.status === 'conditional').length}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-red-800 font-semibold">Rejected</div>
          <div className="text-2xl font-bold text-red-900">
            {deliveriesAndHandovers.filter(h => h.status === 'rejected').length}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-800 font-semibold">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">{deliveriesAndHandovers.length}</div>
        </div>
      </div>
    </div>
  );
};

export default MaterialHandoverTracker;
