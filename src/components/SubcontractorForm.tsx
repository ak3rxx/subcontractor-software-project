
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CompanyInformationSection from './subcontractor-form/CompanyInformationSection';
import ContactInformationSection from './subcontractor-form/ContactInformationSection';
import BusinessDetailsSection from './subcontractor-form/BusinessDetailsSection';
import EmployeeInformationSection from './subcontractor-form/EmployeeInformationSection';
import InsuranceInformationSection from './subcontractor-form/InsuranceInformationSection';
import DocumentUploadSection from './subcontractor-form/DocumentUploadSection';
import DeclarationSection from './subcontractor-form/DeclarationSection';
import AdminSection from './subcontractor-form/AdminSection';
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
    workersCompensationExpiry: '',
    publicLiabilityAmount: '',
    publicLiabilityExpiry: '',
    tradeType: '',
    licenseNumber: '',
    documentsCurrentAndTrue: false,
    complySafety: false,
    authorizedRepresentative: false,
    signatureDate: '',
    signatureFullName: '',
    approvedBy: '',
    approvedDate: '',
    adminNotes: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [isAdminView, setIsAdminView] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required checkboxes
    if (!formData.documentsCurrentAndTrue || !formData.complySafety || !formData.authorizedRepresentative) {
      toast({
        title: "Declaration Required",
        description: "Please complete all declaration checkboxes before submitting.",
        variant: "destructive"
      });
      return;
    }

    console.log('Submitting subcontractor form:', formData);
    console.log('Uploaded files:', uploadedFiles);
    
    // Simulate form submission and trigger automation tasks
    toast({
      title: "Subcontractor Submission Received",
      description: "The application has been submitted successfully. A review task has been created for the admin team, and a confirmation email will be sent shortly.",
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
      workersCompensationExpiry: '',
      publicLiabilityAmount: '',
      publicLiabilityExpiry: '',
      tradeType: '',
      licenseNumber: '',
      documentsCurrentAndTrue: false,
      complySafety: false,
      authorizedRepresentative: false,
      signatureDate: '',
      signatureFullName: '',
      approvedBy: '',
      approvedDate: '',
      adminNotes: ''
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Add New Subcontractor</CardTitle>
            <CardDescription>Register a new subcontractor for project assignments</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAdminView(!isAdminView)}
            className="text-xs"
          >
            {isAdminView ? 'Hide Admin' : 'Show Admin'}
          </Button>
        </div>
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
          
          <DeclarationSection 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
          
          <AdminSection 
            formData={formData} 
            onInputChange={handleInputChange} 
            isAdminView={isAdminView}
          />
          
          <FormActionsSection />
        </form>
      </CardContent>
    </Card>
  );
};

export default SubcontractorForm;
