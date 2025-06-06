
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
import { Plus, BrainCircuit, FileText, Import } from 'lucide-react';

interface BudgetPlanningTableProps {
  projectName: string;
}

interface BudgetItem {
  id: string;
  trade: string;
  costType: string;
  description: string;
  quantity?: number;
  rate?: number;
  unit?: string;
  estimatedCost: number;
  suggested: boolean;
}

const BudgetPlanningTable: React.FC<BudgetPlanningTableProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    trade: '',
    costType: 'Labour',
    description: '',
    quantity: undefined,
    rate: undefined,
    unit: '',
    estimatedCost: 0,
    suggested: false
  });

  // Sample budget items
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    {
      id: 'b1',
      trade: 'Prelims',
      costType: 'Overheads',
      description: 'Site set-up',
      estimatedCost: 5000,
      suggested: true
    },
    {
      id: 'b2',
      trade: 'Prelims',
      costType: 'Overheads',
      description: 'Portable toilet hire',
      quantity: 3,
      rate: 250,
      unit: 'month',
      estimatedCost: 750,
      suggested: true
    },
    {
      id: 'b3',
      trade: 'Carpentry',
      costType: 'Labour',
      description: 'Framing and structural work',
      estimatedCost: 45000,
      suggested: false
    },
    {
      id: 'b4',
      trade: 'Carpentry',
      costType: 'Materials',
      description: 'Timber and fasteners',
      quantity: 1,
      rate: 18500,
      unit: 'lot',
      estimatedCost: 18500,
      suggested: false
    },
    {
      id: 'b5',
      trade: 'Plumbing',
      costType: 'Subcontract',
      description: 'Bathroom fixtures installation',
      estimatedCost: 22000,
      suggested: false
    },
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

  const costTypes = [
    'Labour',
    'Materials',
    'Plant',
    'Subcontract',
    'Overheads',
  ];

  const handleAddItem = () => {
    if (!newItem.trade || !newItem.description || !(newItem.estimatedCost > 0)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to add a budget item.",
        variant: "destructive"
      });
      return;
    }

    const item: BudgetItem = {
      id: `b${Date.now()}`,
      trade: newItem.trade,
      costType: newItem.costType || 'Labour',
      description: newItem.description,
      quantity: newItem.quantity,
      rate: newItem.rate,
      unit: newItem.unit,
      estimatedCost: newItem.estimatedCost,
      suggested: false
    };

    setBudgetItems([...budgetItems, item]);
    setNewItem({
      trade: '',
      costType: 'Labour',
      description: '',
      quantity: undefined,
      rate: undefined,
      unit: '',
      estimatedCost: 0,
      suggested: false
    });
    setIsAddingItem(false);
    
    toast({
      title: "Item Added",
      description: "Budget item has been added to the planning table.",
    });
  };

  const calculateTotal = () => {
    return budgetItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  };

  const handleSuggestItems = () => {
    // This would be connected to AI in the future
    const suggestedItems: BudgetItem[] = [
      {
        id: `b${Date.now()}`,
        trade: 'Prelims',
        costType: 'Overheads',
        description: 'Scaffolding',
        quantity: 1,
        rate: 8500,
        unit: 'lot',
        estimatedCost: 8500,
        suggested: true
      },
      {
        id: `b${Date.now()+1}`,
        trade: 'Prelims',
        costType: 'Overheads',
        description: 'Site cleanup',
        estimatedCost: 3500,
        suggested: true
      }
    ];
    
    setBudgetItems([...budgetItems, ...suggestedItems]);
    
    toast({
      title: "Items Suggested",
      description: "AI has suggested additional budget items based on project type.",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Budget Planning</CardTitle>
              <CardDescription>
                Create and manage the project budget by trade and cost category
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add Budget Item</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="trade" className="text-sm font-medium">Trade / Cost Category *</label>
                        <Select 
                          value={newItem.trade} 
                          onValueChange={(value) => setNewItem({...newItem, trade: value})}
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
                        <label htmlFor="costType" className="text-sm font-medium">Cost Type *</label>
                        <Select 
                          value={newItem.costType} 
                          onValueChange={(value) => setNewItem({...newItem, costType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cost type" />
                          </SelectTrigger>
                          <SelectContent>
                            {costTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">Description *</label>
                      <Input
                        id="description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Enter item description"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newItem.quantity || ''}
                          onChange={(e) => setNewItem({
                            ...newItem, 
                            quantity: e.target.value ? parseFloat(e.target.value) : undefined,
                            estimatedCost: e.target.value && newItem.rate 
                              ? parseFloat(e.target.value) * newItem.rate 
                              : newItem.estimatedCost
                          })}
                          placeholder="Quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="rate" className="text-sm font-medium">Rate</label>
                        <Input
                          id="rate"
                          type="number"
                          value={newItem.rate || ''}
                          onChange={(e) => setNewItem({
                            ...newItem, 
                            rate: e.target.value ? parseFloat(e.target.value) : undefined,
                            estimatedCost: e.target.value && newItem.quantity 
                              ? parseFloat(e.target.value) * newItem.quantity 
                              : newItem.estimatedCost
                          })}
                          placeholder="Rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="unit" className="text-sm font-medium">Unit</label>
                        <Input
                          id="unit"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                          placeholder="e.g. m², day"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="estimatedCost" className="text-sm font-medium">Estimated Cost *</label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        value={newItem.estimatedCost || ''}
                        onChange={(e) => setNewItem({...newItem, estimatedCost: parseFloat(e.target.value) || 0})}
                        placeholder="Enter estimated cost"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddItem}>
                      Add to Budget
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" className="flex items-center gap-2" onClick={handleSuggestItems}>
                <BrainCircuit className="h-4 w-4" />
                Suggest Items
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Import className="h-4 w-4" />
                Import CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade / Category</TableHead>
                <TableHead>Cost Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Est. Cost ($)</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.trade}</TableCell>
                  <TableCell>{item.costType}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity || '-'}</TableCell>
                  <TableCell className="text-right">{item.rate ? `$${item.rate.toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="text-right">{item.unit || '-'}</TableCell>
                  <TableCell className="text-right font-medium">${item.estimatedCost.toLocaleString()}</TableCell>
                  <TableCell>
                    {item.suggested ? (
                      <Badge className="bg-blue-100 text-blue-800">AI Suggested</Badge>
                    ) : (
                      <Badge variant="outline">Manual</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50">
                <TableCell colSpan={6} className="font-semibold">Total Budget</TableCell>
                <TableCell className="text-right font-bold">${calculateTotal().toLocaleString()}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <BrainCircuit className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800">AI Budget Assistant</h3>
              <p className="text-sm text-blue-700">
                The system has analyzed your project details (Residential, 3 bedrooms, single-story) and suggests 
                the following cost categories may be missing: 
              </p>
              <div className="mt-2 space-x-2">
                <Badge className="bg-blue-200 text-blue-800 cursor-pointer">+ Final Cleaning ($2,500)</Badge>
                <Badge className="bg-blue-200 text-blue-800 cursor-pointer">+ Insurance ($1,800)</Badge>
                <Badge className="bg-blue-200 text-blue-800 cursor-pointer">+ Supervision ($12,000)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetPlanningTable;
