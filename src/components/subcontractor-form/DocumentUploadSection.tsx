
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, X, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    {
      name: 'Certificate of Currency - Workers Compensation',
      helpText: 'Upload current insurance certificate. Must include expiry date and coverage value.'
    },
    {
      name: 'Certificate of Currency - Public Liability',
      helpText: 'Upload current insurance certificate. Must include expiry date and coverage value.'
    },
    {
      name: 'Trade/Builders License',
      helpText: 'Upload current trade or builders license certificate.'
    },
    {
      name: 'Trade/Qualification Certificates',
      helpText: 'Upload relevant trade qualification certificates.'
    },
    {
      name: 'SWMS (Safe Work Method Statement)',
      helpText: 'Upload Safe Work Method Statement for your trade activities.'
    }
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
    <TooltipProvider>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Required Documents (PDF Only)</h3>
        <p className="text-sm text-amber-600 font-medium">
          This onboarding must be completed before any site work begins.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocuments.map((doc) => (
            <div key={doc.name} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>{doc.name}</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{doc.helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {!uploadedFiles[doc.name] ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-construction-blue transition-colors cursor-pointer"
                  onDrop={(e) => handleFileDrop(doc.name, e)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">{doc.name}</p>
                  <p className="text-xs text-gray-500 mb-3">Drag & drop PDF file or click to upload</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileSelect(doc.name, e)}
                    className="hidden"
                    id={`file-${doc.name}`}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={() => document.getElementById(`file-${doc.name}`)?.click()}
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
                        <p className="text-sm font-medium text-green-800">{uploadedFiles[doc.name].name}</p>
                        <p className="text-xs text-green-600">{formatFileSize(uploadedFiles[doc.name].size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => onFileRemove(doc.name)}
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
    </TooltipProvider>
  );
};

export default DocumentUploadSection;
