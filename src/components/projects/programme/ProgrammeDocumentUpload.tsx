import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface UploadedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  parsing_status: string;
  ai_confidence?: number;
  error_message?: string;
  created_at: string;
  page_count?: number;
  preview_url?: string;
}

interface ProgrammeDocumentUploadProps {
  projectId: string;
  onDocumentParsed: (documentId: string, parsedData: any) => void;
}

const ProgrammeDocumentUpload: React.FC<ProgrammeDocumentUploadProps> = ({
  projectId,
  onDocumentParsed
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // PDF processing is now handled entirely by the Edge Function

  const supportedFileTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-project'
  ];

  const getFileTypeLabel = (fileType: string): string => {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/vnd.ms-excel': 'Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'text/csv': 'CSV',
      'application/vnd.ms-project': 'MS Project'
    };
    return typeMap[fileType] || 'Unknown';
  };

  const validateFile = (file: File): boolean => {
    if (!supportedFileTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload PDF, Excel, CSV, or MS Project files only.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 50MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const uploadDocument = async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${projectId}/${fileName}`;

      // Upload file to Supabase Storage
      console.log('Uploading file to storage:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('programme-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // PDF metadata extraction is now handled by the Edge Function

      // Create database record
      console.log('Creating database record for document');
      const { data: documentData, error: dbError } = await supabase
        .from('programme_document_parsing')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          parsing_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Convert file to base64 for AI processing
      const fileContent = await fileToBase64(file);

      // Trigger AI parsing
      console.log('Triggering AI parsing for document:', documentData.id);
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-programme-document', {
        body: {
          fileContent,
          fileName: file.name,
          fileType: file.type,
          projectId,
          documentId: documentData.id
        }
      });

      if (parseError) {
        console.error('AI parsing error:', parseError);
        // Don't throw here - let the user know parsing failed but document is uploaded
        toast({
          title: "Parsing Warning",
          description: "Document uploaded but AI parsing failed. You can still create milestones manually.",
          variant: "destructive"
        });
      } else {
        console.log('AI parsing successful:', parseResult);
        onDocumentParsed(documentData.id, parseResult.data);
      }

      // Add to uploaded documents list
      setUploadedDocuments(prev => [...prev, documentData]);

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded and is being processed.`
      });

      // Poll for parsing status updates
      pollParsingStatus(documentData.id);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const pollParsingStatus = async (documentId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('programme_document_parsing')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error checking parsing status:', error);
        return;
      }

      // Update the document in our state
      setUploadedDocuments(prev => 
        prev.map(doc => doc.id === documentId ? data : doc)
      );

      if (data.parsing_status === 'completed') {
        toast({
          title: "Document Processed",
          description: `AI parsing completed with ${Math.round((data.ai_confidence || 0) * 100)}% confidence.`
        });
        if (data.parsed_data) {
          onDocumentParsed(documentId, data.parsed_data);
        }
      } else if (data.parsing_status === 'failed') {
        toast({
          title: "Processing Failed",
          description: data.error_message || "Document processing failed",
          variant: "destructive"
        });
      } else if (data.parsing_status === 'processing' && attempts < maxAttempts) {
        // Continue polling
        attempts++;
        setTimeout(checkStatus, 10000); // Check again in 10 seconds
      }
    };

    setTimeout(checkStatus, 5000); // Initial check after 5 seconds
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => uploadDocument(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => uploadDocument(file));
    
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeDocument = async (documentId: string) => {
    const document = uploadedDocuments.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('programme-documents')
        .remove([document.file_path]);

      // Delete from database
      await supabase
        .from('programme_document_parsing')
        .delete()
        .eq('id', documentId);

      // Remove from state
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));

      toast({
        title: "Document Removed",
        description: `${document.file_name} has been removed.`
      });
    } catch (error) {
      console.error('Error removing document:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove document",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Programme Documents
          </CardTitle>
          <CardDescription>
            Upload your construction programme documents (PDF, Excel, CSV, MS Project) for AI-powered parsing and milestone extraction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
            <p className="text-lg font-medium mb-2">
              {isDragOver ? 'Drop files here' : 'Drag and drop your documents here'}
            </p>
            <p className="text-gray-600 mb-4">or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-4"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Choose Files
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, Excel (.xlsx), CSV, MS Project (.mpp)
              <br />
              Maximum file size: 50MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.mpp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              Track the processing status of your uploaded programme documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(document.parsing_status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{document.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeLabel(document.file_type)}
                        </Badge>
                        <span>
                          {(document.file_size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        {document.page_count && (
                          <span>
                            {document.page_count} pages
                          </span>
                        )}
                        {document.ai_confidence && (
                          <span>
                            {Math.round(document.ai_confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      {document.parsing_status === 'processing' && (
                        <Progress value={50} className="mt-2 h-2" />
                      )}
                      {document.error_message && (
                        <p className="text-sm text-red-600 mt-1">
                          {document.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(document.parsing_status)}>
                      {document.parsing_status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(document.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgrammeDocumentUpload;