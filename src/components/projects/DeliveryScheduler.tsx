
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Calendar, Truck } from 'lucide-react';

interface DeliverySchedulerProps {
  onClose: () => void;
  onScheduled?: () => void;
}

const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({ onClose, onScheduled }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    projectName: '',
    deliveryId: '',
    plannedDeliveryDate: '',
    tradeSupplier: '',
    materialDescription: '',
    quantityExpected: '',
    deliveryLocation: '',
    priority: 'normal',
    notes: '',
    submittedBy: ''
  });

  // Auto-generate delivery ID when form loads
  React.useEffect(() => {
    const generateDeliveryId = () => {
      const date = new Date();
      const id = `DEL-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setFormData(prev => ({ ...prev, deliveryId: id }));
    };
    generateDeliveryId();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Delivery Scheduled:', formData);
    
    toast({
      title: "Delivery Scheduled",
      description: `Delivery ${formData.deliveryId} has been scheduled for ${formData.plannedDeliveryDate}. Site team will be notified.`,
    });

    onScheduled?.();
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Schedule New Delivery</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project & Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Select value={formData.projectName} onValueChange={(value) => setFormData(prev => ({ ...prev, projectName: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riverside-apartments">Riverside Apartments</SelectItem>
                    <SelectItem value="commercial-plaza">Commercial Plaza</SelectItem>
                    <SelectItem value="warehouse-extension">Warehouse Extension</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryId">Delivery Reference ID</Label>
                <Input
                  id="deliveryId"
                  value={formData.deliveryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryId: e.target.value }))}
                  className="bg-gray-50"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedDeliveryDate">Planned Delivery Date</Label>
                <Input
                  id="plannedDeliveryDate"
                  type="date"
                  value={formData.plannedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, plannedDeliveryDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeSupplier">Trade / Supplier</Label>
                <Select value={formData.tradeSupplier} onValueChange={(value) => setFormData(prev => ({ ...prev, tradeSupplier: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier/trade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timber-supply-co">Timber Supply Co</SelectItem>
                    <SelectItem value="steel-fabricators">Steel Fabricators Ltd</SelectItem>
                    <SelectItem value="door-hardware-plus">Door & Hardware Plus</SelectItem>
                    <SelectItem value="electrical-supplies">Electrical Supplies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialDescription">Material Description</Label>
              <Textarea
                id="materialDescription"
                placeholder="e.g. 90x45 Framing Timber, Galvanized Nails, Door Hardware Sets"
                value={formData.materialDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, materialDescription: e.target.value }))}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantityExpected">Quantity Expected</Label>
                <Input
                  id="quantityExpected"
                  placeholder="e.g. 120 pieces, 5 pallets, 15 sets"
                  value={formData.quantityExpected}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantityExpected: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryLocation">Delivery Location</Label>
                <Input
                  id="deliveryLocation"
                  placeholder="e.g. Level 3, North Wing, Site Compound"
                  value={formData.deliveryLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                    <SelectItem value="normal">🟡 Normal</SelectItem>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="submittedBy">Submitted By</Label>
                <Input
                  id="submittedBy"
                  value={formData.submittedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, submittedBy: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Special Instructions</Label>
              <Textarea
                id="notes"
                placeholder="Any special delivery requirements, access instructions, or notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchase Orders & Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload PO / Order Docket</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Attach purchase orders, delivery schedules, or supplier confirmations
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to browse or drag files here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Schedule Delivery
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryScheduler;
