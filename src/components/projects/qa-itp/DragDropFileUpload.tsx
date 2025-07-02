import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropFileUploadProps {
  onUpload: (filePaths: string[]) => void;
  allowMultiple?: boolean;
  acceptedTypes?: string;
  showProgress?: boolean;
  disabled?: boolean;
}

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({
  onUpload,
  allowMultiple = true,
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  showProgress = false,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      // Mock upload - in real implementation, upload to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockPaths = files.map((file, index) => `uploads/${Date.now()}-${index}-${file.name}`);
      onUpload(mockPaths);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [disabled, onUpload]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      // Mock upload - in real implementation, upload to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockPaths = files.map((file, index) => `uploads/${Date.now()}-${index}-${file.name}`);
      onUpload(mockPaths);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [onUpload]);

  return (
    <div 
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-all duration-200",
        isDragOver 
          ? "border-primary bg-primary/10" 
          : disabled 
            ? "border-muted-foreground/30 bg-muted/30" 
            : "border-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-6 text-center">
        <div className={cn(
          "mx-auto h-10 w-10 mb-3 transition-all duration-200",
          isDragOver ? "text-primary scale-110" : "text-muted-foreground"
        )}>
          {isDragOver ? (
            <Plus className="h-10 w-10" />
          ) : (
            <Upload className="h-10 w-10" />
          )}
        </div>
        
        <p className={cn(
          "text-sm font-medium transition-colors mb-1",
          isDragOver ? "text-primary" : "text-foreground"
        )}>
          {isDragOver 
            ? 'Drop files here!' 
            : isUploading
              ? 'Uploading...'
              : 'Drag & drop files or click to browse'
          }
        </p>
        <p className="text-xs text-muted-foreground">
          Supports {acceptedTypes}
        </p>

        <input
          type="file"
          accept={acceptedTypes}
          multiple={allowMultiple}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled || isUploading}
        />

        <Button
          variant={isDragOver ? "default" : "outline"}
          size="sm"
          className="mt-3 pointer-events-none"
          disabled={disabled || isUploading}
        >
          {isUploading ? 'Uploading...' : isDragOver ? 'Drop files!' : 'Choose Files'}
        </Button>
      </div>

      {isUploading && showProgress && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropFileUpload;