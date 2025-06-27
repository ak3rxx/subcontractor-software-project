
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Link, X } from 'lucide-react';

interface BudgetItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  crossModuleData?: any;
}

const BudgetItemForm: React.FC<BudgetItemFormProps> = ({ isOpen, onClose, crossModuleData }) => {
  const { toast } = useToast();
  const [budgetItem, setBudgetItem] = useState({
    description: '',
    tradeCategory: '',
    budgetedCost: '',
    quantity: '',
    unit: '',
    unitCost: '',
    referenceNumber: '',
    notes: ''
  });

  // Auto-populate when cross-module data is available
  useEffect(() => {
    if (crossModuleData?.fromVariation) {
      console.log('Auto-populating budget item form with cross-module data:', crossModuleData);
      
      setBudgetItem({
        description: crossModuleData.budget_description || crossModuleData.title || '',
        tradeCategory: crossModuleData.trade_category || crossModuleData.trade || crossModuleData.category || '',
        budgetedCost: crossModuleData.budgeted_cost?.toString() || '',
        quantity: '1',
        unit: 'item',
        unitCost: crossModuleData.budgeted_cost?.toString() || '',
        referenceNumber: crossModuleData.reference_number || crossModuleData.variationNumber || '',
        notes: `Created from variation: ${crossModuleData.variationNumber || 'N/A'}\n${crossModuleData.description || ''}`
      });
      
      toast({
        title: "Cross-Module Integration",
        description: `Budget item form auto-populated from variation ${crossModuleData.variationNumber}`,
      });
    }
  }, [crossModuleData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Budget Item:', budgetItem);
    
    toast({
      title: "Budget Item Created",
      description: `${budgetItem.description} has been added to the project budget.`,
    });

    setBudgetItem({
      description: '',
      tradeCategory: '',
      budgetedCost: '',
      quantity: '',
      unit: '',
      unitCost: '',
      referenceNumber: '',
      notes: ''
    });
    onClose();
  };

  const calculateBudgetedCost = () => {
    const quantity = parseFloat(budgetItem.quantity) || 0;
    const unitCost = parseFloat(budgetItem.unitCost) || 0;
    const total = quantity * unitCost;
    setBudgetItem(prev => ({ ...prev, budgetedCost: total.toString() }));
  };

  if (!isOpen) return null;

  return (
    <Card className={crossModuleData?.fromVariation ? "border-blue-200 bg-blue-50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Budget Item
            {crossModuleData?.fromVariation && (
              <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                <Link className="h-3 w-3" />
                From Variation {crossModuleData.variationNumber}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={budgetItem.description}
                onChange={(e) => setBudgetItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Budget item description"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeCategory">Trade Category</Label>
              <Select value={budgetItem.tradeCategory} onValueChange={(value) => setBudgetItem(prev => ({ ...prev, tradeCategory: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carpentry">Carpentry</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="tiling">Tiling</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="rendering">Rendering</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={budgetItem.quantity}
                onChange={(e) => setBudgetItem(prev => ({ ...prev, quantity: e.target.value }))}
                onBlur={calculateBudgetedCost}
                placeholder="1"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={budgetItem.unit} onValueChange={(value) => setBudgetItem(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">Item</SelectItem>
                  <SelectItem value="m2">m²</SelectItem>
                  <SelectItem value="m">Meter</SelectItem>
                  <SelectItem value="hr">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="lump">Lump Sum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost ($)</Label>
              <Input
                id="unitCost"
                type="number"
                value={budgetItem.unitCost}
                onChange={(e) => setBudgetItem(prev => ({ ...prev, unitCost: e.target.value }))}
                onBlur={calculateBudgetedCost}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetedCost">Total Cost ($)</Label>
              <Input
                id="budgetedCost"
                type="number"
                value={budgetItem.budgetedCost}
                onChange={(e) => setBudgetItem(prev => ({ ...prev, budgetedCost: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              value={budgetItem.referenceNumber}
              onChange={(e) => setBudgetItem(prev => ({ ...prev, referenceNumber: e.target.value }))}
              placeholder="VAR-001, RFI-002, etc."
              readOnly={crossModuleData?.fromVariation}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={budgetItem.notes}
              onChange={(e) => setBudgetItem(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or context"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Create Budget Item</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BudgetItemForm;
