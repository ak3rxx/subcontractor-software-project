
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import CompanyInformationSection from './subcontractor-form/CompanyInformationSection';
import ContactInformationSection from './subcontractor-form/ContactInformationSection';
import BusinessDetailsSection from './subcontractor-form/BusinessDetailsSection';
import EmployeeInformationSection from './subcontractor-form/EmployeeInformationSection';
import InsuranceInformationSection from './subcontractor-form/InsuranceInformationSection';
import DocumentUploadSection from './subcontractor-form/DocumentUploadSection';
import FormActionsSection from './subcontractor-form/FormActionsSection';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const SubcontractorForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    abn: '',
    director: '',
    address: '',
    mainTelephone: '',
    mobile: '',
    mainContactEmail: '',
    accountsContactEmail: '',
    gstRegistered: false,
    authorizedRepresentatives: '',
    numberOfEmployees: '',
    numberOfApprentices: '',
    workersCompensationAmount: '',
    publicLiabilityAmount: '',
    tradeType: '',
    licenseNumber: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const { toast } = useToast();

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
      abn: '',
      director: '',
      address: '',
      mainTelephone: '',
      mobile: '',
      mainContactEmail: '',
      accountsContactEmail: '',
      gstRegistered: false,
      authorizedRepresentatives: '',
      numberOfEmployees: '',
      numberOfApprentices: '',
      workersCompensationAmount: '',
      publicLiabilityAmount: '',
      tradeType: '',
      licenseNumber: ''
    });
    setUploadedFiles({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (docType: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [docType]: {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }
    }));
  };

  const handleFileRemove = (docType: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Subcontractor</CardTitle>
        <CardDescription>Register a new subcontractor for project assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CompanyInformationSection 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
          
          <ContactInformationSection 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
          
          <BusinessDetailsSection 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
          
          <EmployeeInformationSection 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
          
          <InsuranceInformationSection 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
          
          <DocumentUploadSection 
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
          />
          
          <FormActionsSection />
        </form>
      </CardContent>
    </Card>
  );
};

export default SubcontractorForm;
