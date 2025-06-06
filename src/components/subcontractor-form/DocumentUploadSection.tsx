
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface DocumentUploadSectionProps {
  uploadedFiles: Record<string, UploadedFile>;
  onFileUpload: (docType: string, file: File) => void;
  onFileRemove: (docType: string) => void;
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  uploadedFiles,
  onFileUpload,
  onFileRemove
}) => {
  const { toast } = useToast();

  const requiredDocuments = [
    'Certificate of Currency - Workers Compensation',
    'Certificate of Currency - Public Liability',
    'Business License',
    'W-9 Form',
    'Safety Certification'
  ];

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

    onFileUpload(docType, file);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
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
                    onClick={() => onFileRemove(docType)}
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
  );
};

export default DocumentUploadSection;
