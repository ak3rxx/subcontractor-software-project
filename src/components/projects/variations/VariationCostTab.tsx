
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Calculator, DollarSign } from 'lucide-react';

interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

interface VariationCostTabProps {
  variation: any;
  editData: any;
  isEditing: boolean;
  onDataChange: (data: any) => void;
}

const VariationCostTab: React.FC<VariationCostTabProps> = ({
  variation,
  editData,
  isEditing,
  onDataChange
}) => {
  const costBreakdown = editData.cost_breakdown || [];
  const gstRate = 10; // Default GST rate

  const handleCostItemChange = (index: number, field: keyof CostBreakdownItem, value: any) => {
    const updated = [...costBreakdown];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updated[index].subtotal = updated[index].quantity * updated[index].rate;
    }
    
    updateTotals(updated);
  };

  const addCostItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      subtotal: 0
    };
    const updated = [...costBreakdown, newItem];
    updateTotals(updated);
  };

  const removeCostItem = (index: number) => {
    if (costBreakdown.length > 1) {
      const filtered = costBreakdown.filter((_: any, i: number) => i !== index);
      updateTotals(filtered);
    }
  };

  const updateTotals = (breakdown: CostBreakdownItem[]) => {
    const subtotal = breakdown.reduce((sum, item) => sum + item.subtotal, 0);
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;
    
    onDataChange({
      cost_breakdown: breakdown,
      total_amount: total,
      gst_amount: gstAmount
    });
  };

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

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const subtotal = editData.total_amount - editData.gst_amount || 0;
  const gstAmount = editData.gst_amount || 0;
  const total = editData.total_amount || variation.total_amount || variation.cost_impact || 0;

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Summary
            {getCostImpactBadge(total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-600">Subtotal</Label>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(subtotal)}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-600">GST ({gstRate}%)</Label>
              <div className="text-2xl font-bold text-gray-600 mt-2">
                {formatCurrency(gstAmount)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(total)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              {/* Editable Cost Items */}
              <div className="space-y-3">
                {costBreakdown.map((item: CostBreakdownItem, index: number) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-5">
                      <Label className="text-xs font-medium text-gray-600">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleCostItemChange(index, 'description', e.target.value)}
                        placeholder="Enter item description"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-medium text-gray-600">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleCostItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleCostItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-medium text-gray-600">Subtotal</Label>
                      <div className="mt-1 p-2 bg-white border rounded-md text-right font-medium">
                        {formatCurrency(item.subtotal)}
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
            </>
          ) : (
            <>
              {/* Read-only Cost Items */}
              {costBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {costBreakdown.map((item: CostBreakdownItem, index: number) => (
                    <div key={item.id || index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-5">
                        <span className="font-medium">{item.description}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span>{item.quantity}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span>{formatCurrency(item.rate)}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No detailed cost breakdown available</p>
                  <p className="text-sm">Total cost impact: {formatCurrency(total)}</p>
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Cost Impact Analysis */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Financial Impact Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Impact Type:</span>
                <span className="ml-2 font-medium">
                  {total > 0 ? 'Cost Addition' : total < 0 ? 'Cost Reduction' : 'No Impact'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Budget Impact:</span>
                <span className="ml-2 font-medium">
                  {total > 0 ? `+${((total / 100000) * 100).toFixed(1)}%` : 'Reduction'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VariationCostTab;
