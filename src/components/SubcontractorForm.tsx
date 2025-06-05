
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Phone, Mail, MapPin, Building, File, X, CheckCircle } from 'lucide-react';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

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

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const { toast } = useToast();

  const requiredDocuments = [
    'Business License',
    'Insurance Certificate',
    'W-9 Form',
    'Safety Certification'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting subcontractor form:', formData);
    console.log('Uploaded files:', uploadedFiles);
    
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
    setUploadedFiles({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (docType: string, file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload only PDF files.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [docType]: {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }
    }));

    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const handleFileDrop = (docType: string, e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(docType, files[0]);
    }
  };

  const handleFileSelect = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(docType, files[0]);
    }
  };

  const removeFile = (docType: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Subcontractor</CardTitle>
        <CardDescription>Register a new subcontractor for project assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
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
            <h3 className="text-lg font-semibold">Required Documents (PDF Only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredDocuments.map((docType) => (
                <div key={docType} className="space-y-2">
                  <Label>{docType}</Label>
                  {!uploadedFiles[docType] ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-construction-blue transition-colors cursor-pointer"
                      onDrop={(e) => handleFileDrop(docType, e)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => e.preventDefault()}
                    >
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-1">{docType}</p>
                      <p className="text-xs text-gray-500 mb-3">Drag & drop PDF file or click to upload</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(docType, e)}
                        className="hidden"
                        id={`file-${docType}`}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button"
                        onClick={() => document.getElementById(`file-${docType}`)?.click()}
                      >
                        Choose PDF File
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-green-800">{uploadedFiles[docType].name}</p>
                            <p className="text-xs text-green-600">{formatFileSize(uploadedFiles[docType].size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => removeFile(docType)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
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
