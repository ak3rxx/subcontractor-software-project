
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, AlertTriangle, FileText, CalendarDays } from 'lucide-react';

interface ActualCostTrackerProps {
  projectName: string;
}

interface ActualCost {
  id: string;
  trade: string;
  description: string;
  actualCost: number;
  relatedRef: string;
  date: string;
  notes: string;
  status: 'paid' | 'outstanding' | 'over-budget';
}

const ActualCostTracker: React.FC<ActualCostTrackerProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [newCost, setNewCost] = useState<Partial<ActualCost>>({
    trade: '',
    description: '',
    actualCost: 0,
    relatedRef: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'outstanding'
  });

  // Sample actual costs
  const [actualCosts, setActualCosts] = useState<ActualCost[]>([
    {
      id: 'c1',
      trade: 'Prelims',
      description: 'Site set-up',
      actualCost: 5200,
      relatedRef: 'PO-001',
      date: '2024-01-18',
      notes: 'Additional fencing required',
      status: 'paid'
    },
    {
      id: 'c2',
      trade: 'Prelims',
      description: 'Portable toilet hire',
      actualCost: 900,
      relatedRef: 'PO-002',
      date: '2024-01-20',
      notes: 'Monthly rental',
      status: 'paid'
    },
    {
      id: 'c3',
      trade: 'Carpentry',
      description: 'Framing and structural work',
      actualCost: 48000,
      relatedRef: 'VAR-001',
      date: '2024-02-15',
      notes: 'Additional beam reinforcement',
      status: 'over-budget'
    },
    {
      id: 'c4',
      trade: 'Carpentry',
      description: 'Timber and fasteners',
      actualCost: 17800,
      relatedRef: 'PO-004',
      date: '2024-02-10',
      notes: '',
      status: 'paid'
    }
  ]);

  const tradeCategories = [
    'Prelims',
    'Carpentry',
    'Plumbing',
    'Electrical',
    'HVAC',
    'Roofing',
    'Flooring',
    'Painting',
    'Landscaping',
    'Concrete',
    'Masonry',
    'Other'
  ];

  const handleAddCost = () => {
    if (!newCost.trade || !newCost.description || !(newCost.actualCost > 0) || !newCost.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to add an actual cost.",
        variant: "destructive"
      });
      return;
    }

    const cost: ActualCost = {
      id: `c${Date.now()}`,
      trade: newCost.trade,
      description: newCost.description,
      actualCost: newCost.actualCost,
      relatedRef: newCost.relatedRef || '',
      date: newCost.date,
      notes: newCost.notes || '',
      status: newCost.status as 'paid' | 'outstanding' | 'over-budget',
    };

    setActualCosts([...actualCosts, cost]);
    setNewCost({
      trade: '',
      description: '',
      actualCost: 0,
      relatedRef: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'outstanding'
    });
    setIsAddingCost(false);
    
    toast({
      title: "Cost Added",
      description: "Actual cost has been added to the tracker.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'outstanding':
        return <Badge className="bg-yellow-100 text-yellow-800">Outstanding</Badge>;
      case 'over-budget':
        return <Badge className="bg-red-100 text-red-800">Over Budget</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateTotal = () => {
    return actualCosts.reduce((sum, item) => sum + item.actualCost, 0);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Actual Cost Tracker</CardTitle>
              <CardDescription>
                Track actual project expenses and link to purchase orders or variations
              </CardDescription>
            </div>
            <Dialog open={isAddingCost} onOpenChange={setIsAddingCost}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Cost
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Actual Cost</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="trade" className="text-sm font-medium">Trade / Cost Category *</label>
                      <Select 
                        value={newCost.trade} 
                        onValueChange={(value) => setNewCost({...newCost, trade: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradeCategories.map(trade => (
                            <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="date" className="text-sm font-medium">Date *</label>
                      <Input
                        id="date"
                        type="date"
                        value={newCost.date}
                        onChange={(e) => setNewCost({...newCost, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description *</label>
                    <Input
                      id="description"
                      value={newCost.description}
                      onChange={(e) => setNewCost({...newCost, description: e.target.value})}
                      placeholder="Enter cost description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="actualCost" className="text-sm font-medium">Actual Cost ($) *</label>
                      <Input
                        id="actualCost"
                        type="number"
                        value={newCost.actualCost || ''}
                        onChange={(e) => setNewCost({...newCost, actualCost: parseFloat(e.target.value) || 0})}
                        placeholder="Enter actual cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="relatedRef" className="text-sm font-medium">Related PO/Variation</label>
                      <Input
                        id="relatedRef"
                        value={newCost.relatedRef}
                        onChange={(e) => setNewCost({...newCost, relatedRef: e.target.value})}
                        placeholder="e.g. PO-001, VAR-003"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="status" className="text-sm font-medium">Status *</label>
                      <Select 
                        value={newCost.status} 
                        onValueChange={(value) => setNewCost({...newCost, status: value as 'paid' | 'outstanding' | 'over-budget'})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="outstanding">Outstanding</SelectItem>
                          <SelectItem value="over-budget">Over Budget</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                      <Input
                        id="notes"
                        value={newCost.notes}
                        onChange={(e) => setNewCost({...newCost, notes: e.target.value})}
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingCost(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCost}>
                    Add Cost
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade / Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Related PO/Variation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actual Cost ($)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actualCosts.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>{cost.trade}</TableCell>
                  <TableCell>{cost.description}</TableCell>
                  <TableCell>{cost.relatedRef || '-'}</TableCell>
                  <TableCell>{cost.date}</TableCell>
                  <TableCell className="text-right font-medium">${cost.actualCost.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(cost.status)}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{cost.notes || '-'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50">
                <TableCell colSpan={4} className="font-semibold">Total Actual Costs</TableCell>
                <TableCell className="text-right font-bold">${calculateTotal().toLocaleString()}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800">Cost Alerts</h3>
              <p className="text-sm text-yellow-700">
                The following items require your attention:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Carpentry is <strong>$3,000</strong> over budget (7% variance)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>No actual cost exists for <strong>Scaffolding</strong> (scheduled for 14 days ago)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActualCostTracker;
