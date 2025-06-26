
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus } from 'lucide-react';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {costBreakdown.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <Label>Description</Label>
              <Input
                value={item.description}
                onChange={(e) => updateCostBreakdown(index, 'description', e.target.value)}
                placeholder="Item description"
              />
            </div>
            <div className="col-span-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateCostBreakdown(index, 'quantity', parseFloat(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="col-span-2">
              <Label>Rate ($)</Label>
              <Input
                type="number"
                value={item.rate}
                onChange={(e) => updateCostBreakdown(index, 'rate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-span-2">
              <Label>Subtotal</Label>
              <Input
                value={`$${item.subtotal.toFixed(2)}`}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="col-span-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeCostItem(index)}
                disabled={costBreakdown.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button type="button" variant="outline" onClick={addCostItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>

        <Separator />

        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <Label>GST Rate (%)</Label>
            <Input
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className="text-right"
            />
          </div>
          <div>
            <Label>Subtotal</Label>
            <div className="text-lg font-semibold">${subtotal.toFixed(2)}</div>
          </div>
          <div>
            <Label>GST</Label>
            <div className="text-lg font-semibold">${gstAmount.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="text-right">
          <Label>Total Amount</Label>
          <div className="text-2xl font-bold text-green-600">${total.toFixed(2)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
