import React, { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface FileValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  compressedSize?: number;
  originalSize: number;
}

interface FilePreValidatorProps {
  files: File[];
  onValidationComplete: (results: FileValidationResult[]) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const FilePreValidator: React.FC<FilePreValidatorProps> = ({
  files,
  onValidationComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['image/*', '.pdf', '.doc', '.docx']
}) => {
  const [validationProgress, setValidationProgress] = useState(0);
  const [validating, setValidating] = useState(false);

  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    const result: FileValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      originalSize: file.size
    };

    // Check file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    });

    if (!isAllowedType) {
      result.errors.push(`File type not allowed: ${file.type}`);
      result.isValid = false;
    }

    // Check file size
    if (file.size > maxFileSize) {
      result.errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
      result.isValid = false;
    }

    // Warning for large files
    if (file.size > 5 * 1024 * 1024) {
      result.warnings.push('Large file - may take longer to upload');
    }

    // Check if image compression is beneficial
    if (file.type.startsWith('image/') && file.size > 500 * 1024) {
      result.warnings.push('Image will be compressed for faster upload');
      // Estimate compressed size (rough approximation)
      result.compressedSize = Math.max(file.size * 0.6, 500 * 1024);
    }

    return result;
  }, [maxFileSize, allowedTypes]);

  const validateAllFiles = useCallback(async () => {
    if (files.length === 0) return;

    setValidating(true);
    setValidationProgress(0);

    const results: FileValidationResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await validateFile(files[i]);
      results.push(result);
      setValidationProgress(((i + 1) / files.length) * 100);
    }

    setValidating(false);
    onValidationComplete(results);
  }, [files, validateFile, onValidationComplete]);

  React.useEffect(() => {
    validateAllFiles();
  }, [validateAllFiles]);

  if (!validating && files.length === 0) return null;

  return (
    <div className="space-y-2">
      {validating && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Validating files...</span>
            <span>({Math.round(validationProgress)}%)</span>
          </div>
          <Progress value={validationProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};

export default FilePreValidator;