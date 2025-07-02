import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Image } from 'lucide-react';

interface FileThumbnailViewerProps {
  files: string[];
  className?: string;
}

const FileThumbnailViewer: React.FC<FileThumbnailViewerProps> = ({ 
  files,
  className = ""
}) => {
  if (!files || files.length === 0) {
    return null;
  }

  const handleFileClick = (filePath: string) => {
    const fileUrl = filePath.startsWith('http') 
      ? filePath 
      : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
    window.open(fileUrl, '_blank');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium">Evidence Files ({files.length})</h4>
      <div className="grid grid-cols-4 gap-2">
        {files.map((filePath, index) => {
          const fileName = filePath.split('/').pop() || `File ${index + 1}`;
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
          const isPDF = fileName.toLowerCase().endsWith('.pdf');
          const fileUrl = filePath.startsWith('http') 
            ? filePath 
            : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
          
          return (
            <Card key={index} className="relative group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleFileClick(filePath)}>
              <div className="aspect-square">
                {isImage ? (
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {isPDF ? (
                      <FileText className="h-8 w-8 text-red-600" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                )}
                
                {/* Overlay with filename and download */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="text-white text-xs font-medium truncate">
                    {fileName}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white hover:bg-white/20 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileClick(filePath);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FileThumbnailViewer;