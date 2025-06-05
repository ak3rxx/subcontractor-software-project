
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Phone, Mail, MapPin, Building } from 'lucide-react';

const SubcontractorForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    tradeType: '',
    licenseNumber: '',
    insuranceAmount: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting subcontractor form:', formData);
    
    toast({
      title: "Subcontractor Added",
      description: "The subcontractor has been successfully registered and is pending approval.",
    });

    // Reset form
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      tradeType: '',
      licenseNumber: '',
      insuranceAmount: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Subcontractor</CardTitle>
        <CardDescription>Register a new subcontractor for project assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="Enter contact person name"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Business Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  placeholder="Enter complete business address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeType">Trade Type</Label>
              <Select value={formData.tradeType} onValueChange={(value) => handleInputChange('tradeType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="drywall">Drywall</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="Enter license number"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceAmount">Insurance Coverage Amount</Label>
              <Input
                id="insuranceAmount"
                placeholder="e.g., $1,000,000"
                value={formData.insuranceAmount}
                onChange={(e) => handleInputChange('insuranceAmount', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Required Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Business License',
                'Insurance Certificate',
                'W-9 Form',
                'Safety Certification'
              ].map((docType) => (
                <div key={docType} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-construction-blue transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">{docType}</p>
                  <p className="text-xs text-gray-500 mb-2">Drag & drop or click to upload</p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button">
              Save as Draft
            </Button>
            <Button type="submit" className="bg-construction-blue hover:bg-blue-700">
              Submit for Approval
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubcontractorForm;
