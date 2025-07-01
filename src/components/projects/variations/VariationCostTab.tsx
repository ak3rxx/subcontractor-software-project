
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, Calculator, Clock } from 'lucide-react';

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
  const handleInputChange = (field: string, value: any) => {
    onDataChange({ [field]: value });
  };

  const handleCostBreakdownChange = (index: number, field: string, value: any) => {
    const updatedBreakdown = [...(editData.cost_breakdown || [])];
    updatedBreakdown[index] = {
      ...updatedBreakdown[index],
      [field]: field === 'quantity' || field === 'rate' ? parseFloat(value) || 0 : value
    };
    
    // Recalculate subtotal
    if (field === 'quantity' || field === 'rate') {
      updatedBreakdown[index].subtotal = updatedBreakdown[index].quantity * updatedBreakdown[index].rate;
    }
    
    // Recalculate total
    const newTotal = updatedBreakdown.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const newGST = newTotal * 0.1;
    const newTotalWithGST = newTotal + newGST;
    
    onDataChange({
      cost_breakdown: updatedBreakdown,
      cost_impact: newTotal,
      gst_amount: newGST,
      total_amount: newTotalWithGST
    });
  };

  const addCostBreakdownItem = () => {
    const newItem: CostBreakdownItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      subtotal: 0
    };
    
    const updatedBreakdown = [...(editData.cost_breakdown || []), newItem];
    onDataChange({ cost_breakdown: updatedBreakdown });
  };

  const removeCostBreakdownItem = (index: number) => {
    const updatedBreakdown = editData.cost_breakdown.filter((_: any, i: number) => i !== index);
    
    // Recalculate total
    const newTotal = updatedBreakdown.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    const newGST = newTotal * 0.1;
    const newTotalWithGST = newTotal + newGST;
    
    onDataChange({
      cost_breakdown: updatedBreakdown,
      cost_impact: newTotal,
      gst_amount: newGST,
      total_amount: newTotalWithGST
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const costBreakdown = isEditing ? editData.cost_breakdown || [] : variation.cost_breakdown || [];
  const costImpact = isEditing ? editData.cost_impact || 0 : variation.cost_impact || 0;
  const gstAmount = isEditing ? editData.gst_amount || 0 : variation.gst_amount || 0;
  const totalAmount = isEditing ? editData.total_amount || 0 : variation.total_amount || 0;

  return (
    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
      <div className="space-y-6">
        {/* Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(costImpact)}
                </div>
                <div className="text-sm text-blue-800">Subtotal (excl. GST)</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(gstAmount)}
                </div>
                <div className="text-sm text-orange-800">GST (10%)</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-sm text-green-800">Total (incl. GST)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Time Impact (days)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editData.time_impact || 0}
                    onChange={(e) => handleInputChange('time_impact', parseInt(e.target.value) || 0)}
                    placeholder="Enter time impact in days"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Badge variant={variation.time_impact > 0 ? 'destructive' : variation.time_impact < 0 ? 'default' : 'secondary'}>
                      {variation.time_impact > 0 ? `+${variation.time_impact}d` : 
                       variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Impact Description</Label>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {variation.time_impact > 0 ? 'Extends project timeline' :
                   variation.time_impact < 0 ? 'Reduces project timeline' :
                   'No impact on timeline'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cost Breakdown
              </div>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCostBreakdownItem}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isEditing ? 'No cost breakdown items. Click "Add Item" to get started.' : 'No cost breakdown available.'}
              </div>
            ) : (
              <div className="space-y-4">
                {costBreakdown.map((item: CostBreakdownItem, index: number) => (
                  <div key={item.id || index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                    <div className="col-span-5">
                      <Label className="text-xs">Description</Label>
                      {isEditing ? (
                        <Input
                          value={item.description}
                          onChange={(e) => handleCostBreakdownChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded text-sm">{item.description}</div>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleCostBreakdownChange(index, 'quantity', e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded text-sm text-right">{item.quantity}</div>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Rate ($)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleCostBreakdownChange(index, 'rate', e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded text-sm text-right">{formatCurrency(item.rate)}</div>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="p-2 bg-blue-50 rounded text-sm text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostBreakdownItem(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Impact Analysis */}
        {totalAmount !== 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Impact Type:</span>
                  <Badge variant={totalAmount > 0 ? 'destructive' : 'default'}>
                    {totalAmount > 0 ? 'Cost Addition' : 'Cost Reduction'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Budget Impact:</span>
                  <span className={`font-medium ${totalAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalAmount > 0 ? '+' : ''}{formatCurrency(totalAmount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>GST Component:</span>
                  <span className="font-medium">{formatCurrency(gstAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default VariationCostTab;
