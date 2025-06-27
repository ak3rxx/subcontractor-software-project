
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Calculator } from 'lucide-react';

interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

interface CostBreakdownProps {
  costBreakdown: CostBreakdownItem[];
  setCostBreakdown: (breakdown: CostBreakdownItem[]) => void;
  gstRate: number;
  setGstRate: (rate: number) => void;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  costBreakdown,
  setCostBreakdown,
  gstRate,
  setGstRate
}) => {
  const updateCostBreakdown = (index: number, field: keyof CostBreakdownItem, value: any) => {
    const updated = [...costBreakdown];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updated[index].subtotal = updated[index].quantity * updated[index].rate;
    }
    
    setCostBreakdown(updated);
  };

  const addCostItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      subtotal: 0
    };
    setCostBreakdown([...costBreakdown, newItem]);
  };

  const removeCostItem = (index: number) => {
    if (costBreakdown.length > 1) {
      const filtered = costBreakdown.filter((_, i) => i !== index);
      setCostBreakdown(filtered);
    }
  };

  const calculateTotals = () => {
    const subtotal = costBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  // Determine cost impact severity
  const getCostImpactBadge = (amount: number) => {
    if (amount > 50000) {
      return <Badge variant="destructive" className="ml-2">High Impact</Badge>;
    } else if (amount > 10000) {
      return <Badge className="bg-yellow-100 text-yellow-800 ml-2">Medium Impact</Badge>;
    } else if (amount > 0) {
      return <Badge className="bg-green-100 text-green-800 ml-2">Low Impact</Badge>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cost Breakdown
          {getCostImpactBadge(total)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost breakdown items */}
        <div className="space-y-3">
          {costBreakdown.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
              <div className="col-span-5">
                <Label className="text-xs font-medium text-gray-600">Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateCostBreakdown(index, 'description', e.target.value)}
                  placeholder="Enter item description"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-medium text-gray-600">Qty</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateCostBreakdown(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-medium text-gray-600">Rate ($)</Label>
                <Input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateCostBreakdown(index, 'rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-medium text-gray-600">Subtotal</Label>
                <div className="mt-1 p-2 bg-white border rounded-md text-right font-medium">
                  ${item.subtotal.toFixed(2)}
                </div>
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCostItem(index)}
                  disabled={costBreakdown.length === 1}
                  className="w-full"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={addCostItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Cost Item
        </Button>

        <Separator />

        {/* Summary Section */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Label className="text-sm font-medium text-gray-600">GST Rate (%)</Label>
              <Input
                type="number"
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="mt-1 text-center font-medium"
              />
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium text-gray-600">Subtotal</Label>
              <div className="mt-1 p-2 bg-white border rounded-md text-lg font-semibold">
                ${subtotal.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium text-gray-600">GST Amount</Label>
              <div className="mt-1 p-2 bg-white border rounded-md text-lg font-semibold">
                ${gstAmount.toFixed(2)}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-center">
            <Label className="text-lg font-medium text-gray-800">Total Amount</Label>
            <div className="mt-2 p-4 bg-white border-2 border-green-200 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                ${total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Including GST at {gstRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Cost Impact Summary */}
        {total > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Financial Impact:</span>
              <div className="flex items-center">
                <span className="font-medium">
                  {total > 0 ? 'Cost Addition' : 'Cost Reduction'}
                </span>
                {getCostImpactBadge(total)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
