import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Image } from 'lucide-react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';

interface QAAttachmentsTabProps {
  inspection: any;
  isEditing: boolean;
}

const QAAttachmentsTab: React.FC<QAAttachmentsTabProps> = ({
  inspection,
  isEditing
}) => {
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const { getChecklistItems } = useQAInspectionsSimple();

  useEffect(() => {
    const fetchAllFiles = async () => {
      if (inspection?.id) {
        try {
          const items = await getChecklistItems(inspection.id);
          const files: string[] = [];
          items.forEach(item => {
            if (item.evidence_files && Array.isArray(item.evidence_files)) {
              files.push(...item.evidence_files);
            }
          });
          setAllFiles(files);
        } catch (error) {
          console.error('Error fetching inspection files:', error);
        }
      }
    };

    fetchAllFiles();
  }, [inspection?.id, getChecklistItems]);

  const handleFileClick = (filePath: string) => {
    const fileUrl = filePath.startsWith('http') 
      ? filePath 
      : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inspection Attachments</span>
            {isEditing && (
              <Button size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allFiles.map((filePath, index) => {
                const fileName = filePath.split('/').pop() || `File ${index + 1}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                const isPDF = fileName.toLowerCase().endsWith('.pdf');
                const fileUrl = filePath.startsWith('http') 
                  ? filePath 
                  : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
                
                return (
                  <Card 
                    key={index} 
                    className="relative group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleFileClick(filePath)}
                  >
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
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attachments found</p>
              {isEditing && (
                <Button className="mt-4" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First File
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAAttachmentsTab;