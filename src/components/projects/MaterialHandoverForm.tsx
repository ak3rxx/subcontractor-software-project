import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Plus, Trash2, Link, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface MaterialHandoverFormProps {
  onClose: () => void;
}

interface MaterialItem {
  id: string;
  description: string;
  quantity: string;
  condition: 'good' | 'damaged' | 'missing';
  notes: string;
}

// Sample scheduled deliveries for demonstration
const scheduledDeliveries = [
  {
    id: 'DEL-20240115-ABC1',
    projectName: 'Riverside Apartments',
    plannedDate: '2024-01-15',
    tradeSupplier: 'Timber Supply Co',
    materialDescription: '90x45 Framing Timber, Galvanized Nails',
    quantityExpected: '120 pieces',
    deliveryLocation: 'Level 3, North Wing',
    priority: 'normal'
  },
  {
    id: 'DEL-20240114-XYZ2',
    projectName: 'Commercial Plaza',
    plannedDate: '2024-01-14',
    tradeSupplier: 'Door & Hardware Plus',
    materialDescription: 'Door Hardware Sets, Hinges',
    quantityExpected: '15 sets',
    deliveryLocation: 'Ground Floor Lobby',
    priority: 'high'
  }
];

const MaterialHandoverForm: React.FC<MaterialHandoverFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [isLinkedDelivery, setIsLinkedDelivery] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [formData, setFormData] = useState({
    projectName: '',
    handoverDate: '',
    submittedBy: '',
    supplier: '',
    deliveryLocation: '',
    receivedBy: '',
    handoverBy: '',
    status: '',
    comments: '',
    receivedBySignature: '',
    handoverBySignature: ''
  });

  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    { id: '1', description: '', quantity: '', condition: 'good', notes: '' }
  ]);

  const [requiresCompliance, setRequiresCompliance] = useState(false);

  // Handle delivery selection and auto-fill
  const handleDeliverySelection = (deliveryId: string) => {
    setSelectedDelivery(deliveryId);
    const delivery = scheduledDeliveries.find(d => d.id === deliveryId);
    
    if (delivery) {
      setFormData(prev => ({
        ...prev,
        projectName: delivery.projectName,
        supplier: delivery.tradeSupplier,
        deliveryLocation: delivery.deliveryLocation
      }));
      
      // Auto-fill material items from delivery
      setMaterialItems([{
        id: '1',
        description: delivery.materialDescription,
        quantity: delivery.quantityExpected,
        condition: 'good',
        notes: ''
      }]);
    }
  };

  const addMaterialItem = () => {
    const newItem: MaterialItem = {
      id: Date.now().toString(),
      description: '',
      quantity: '',
      condition: 'good',
      notes: ''
    };
    setMaterialItems(prev => [...prev, newItem]);
  };

  const removeMaterialItem = (id: string) => {
    setMaterialItems(prev => prev.filter(item => item.id !== id));
  };

  const updateMaterialItem = (id: string, field: keyof MaterialItem, value: string) => {
    setMaterialItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.receivedBySignature.trim() || !formData.handoverBySignature.trim()) {
      toast({
        title: "Signatures Required",
        description: "Both Received By and Handover By signatures are required.",
        variant: "destructive"
      });
      return;
    }

    console.log('Material Handover Submission:', { 
      formData, 
      materialItems, 
      linkedDelivery: isLinkedDelivery ? selectedDelivery : null 
    });
    
    toast({
      title: "Material Handover Completed",
      description: isLinkedDelivery 
        ? `Handover for delivery ${selectedDelivery} has been recorded and delivery marked as complete.`
        : "Handover record has been created and notifications sent to relevant team members.",
    });

    onClose();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">🔴 High Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">🟢 Low Priority</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Material Handover</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Linking Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link to Scheduled Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="linkDelivery"
                checked={isLinkedDelivery}
                onCheckedChange={(checked) => setIsLinkedDelivery(checked as boolean)}
              />
              <Label htmlFor="linkDelivery">This handover is for a scheduled delivery</Label>
            </div>

            {isLinkedDelivery && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDelivery">Select Scheduled Delivery</Label>
                  <Select value={selectedDelivery} onValueChange={handleDeliverySelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from scheduled deliveries..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduledDeliveries.map((delivery) => (
                        <SelectItem key={delivery.id} value={delivery.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{delivery.id} - {delivery.tradeSupplier}</span>
                            <span className="text-xs text-gray-500 ml-2">{delivery.plannedDate}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDelivery && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Selected Delivery Details
                    </h4>
                    {(() => {
                      const delivery = scheduledDeliveries.find(d => d.id === selectedDelivery);
                      if (!delivery) return null;
                      return (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Project:</span> {delivery.projectName}
                          </div>
                          <div>
                            <span className="font-medium">Planned Date:</span> {delivery.plannedDate}
                          </div>
                          <div>
                            <span className="font-medium">Supplier:</span> {delivery.tradeSupplier}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span> {delivery.deliveryLocation}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Materials:</span> {delivery.materialDescription}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Expected Quantity:</span> {delivery.quantityExpected}
                          </div>
                          <div>
                            {getPriorityBadge(delivery.priority)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project & Submission Info - only show if not linked or no delivery selected */}
        {(!isLinkedDelivery || !selectedDelivery) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project & Submission Information</CardTitle>
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
                  <Label htmlFor="handoverDate">Date of Handover</Label>
                  <Input
                    id="handoverDate"
                    type="date"
                    value={formData.handoverDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, handoverDate: e.target.value }))}
                    required
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="supplier">Material Supplier / Trade</Label>
                  <Select value={formData.supplier} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}>
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="deliveryLocation">Delivery Location / Site Area / Level</Label>
                  <Input
                    id="deliveryLocation"
                    placeholder="e.g. Level 3, North Wing, Grid A1-B3"
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Material Details */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Material Details</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addMaterialItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Description</TableHead>
                    <TableHead>Qty Delivered</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateMaterialItem(item.id, 'description', e.target.value)}
                          placeholder="e.g. 90x45 Framing Timber"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.quantity}
                          onChange={(e) => updateMaterialItem(item.id, 'quantity', e.target.value)}
                          placeholder="e.g. 120 pcs"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.condition} 
                          onValueChange={(value) => updateMaterialItem(item.id, 'condition', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">✅ Good</SelectItem>
                            <SelectItem value="damaged">❌ Damaged</SelectItem>
                            <SelectItem value="missing">⚠️ Missing</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notes}
                          onChange={(e) => updateMaterialItem(item.id, 'notes', e.target.value)}
                          placeholder="Additional notes..."
                        />
                      </TableCell>
                      <TableCell>
                        {materialItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterialItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Evidence & Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence & Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Photos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Attach at least 1 wide shot and 1 close-up of materials
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to browse or drag files here
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload Delivery Dockets / Invoices</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Attach signed delivery dockets or invoices (PDF or image)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to browse or drag files here
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresCompliance"
                checked={requiresCompliance}
                onCheckedChange={(checked) => setRequiresCompliance(checked as boolean)}
              />
              <Label htmlFor="requiresCompliance">Compliance Documents Required (MSDS, Spec Sheets)</Label>
            </div>

            {requiresCompliance && (
              <div className="space-y-2">
                <Label>Upload Compliance Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Attach MSDS, specification sheets, or compliance certificates
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to browse or drag files here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign-Off & Handover */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign-Off & Handover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receivedBy">Received By (Site Manager Name)</Label>
                <Input
                  id="receivedBy"
                  value={formData.receivedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handoverBy">Handover By (Supplier/Installer Name)</Label>
                <Input
                  id="handoverBy"
                  value={formData.handoverBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, handoverBy: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receivedBySignature">Received By - Digital Signature *</Label>
                <Textarea
                  id="receivedBySignature"
                  placeholder="Type your full legal name here as your digital signature"
                  value={formData.receivedBySignature}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedBySignature: e.target.value }))}
                  className="min-h-[80px] font-cursive italic border-2 border-blue-200 bg-blue-50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handoverBySignature">Handover By - Digital Signature *</Label>
                <Textarea
                  id="handoverBySignature"
                  placeholder="Type your full legal name here as your digital signature"
                  value={formData.handoverBySignature}
                  onChange={(e) => setFormData(prev => ({ ...prev, handoverBySignature: e.target.value }))}
                  className="min-h-[80px] font-cursive italic border-2 border-blue-200 bg-blue-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Handover Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">✅ Accepted</SelectItem>
                  <SelectItem value="rejected">❌ Rejected</SelectItem>
                  <SelectItem value="conditional">⚠️ Accepted with Defects/Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.status === 'rejected' || formData.status === 'conditional') && (
              <div className="space-y-2">
                <Label htmlFor="comments">
                  {formData.status === 'rejected' ? 'Rejection Reasons *' : 'Defects/Notes'}
                </Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder={formData.status === 'rejected' ? 'Please specify reasons for rejection...' : 'Describe defects or additional notes...'}
                  required={formData.status === 'rejected'}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Submit Material Handover
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaterialHandoverForm;
