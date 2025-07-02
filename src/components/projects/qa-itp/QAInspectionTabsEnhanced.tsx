import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import QADetailsTab from './QADetailsTab';
import QAChecklistTabEnhanced from './QAChecklistTabEnhanced';
import QAAttachmentsTabEnhanced from './QAAttachmentsTabEnhanced';

interface QAInspectionTabsEnhancedProps {
  inspection: any;
  editData: any;
  isEditing: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataChange: (changes: any) => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onInspectionUpdate?: (updatedInspection: any) => void;
}

const QAInspectionTabsEnhanced: React.FC<QAInspectionTabsEnhancedProps> = ({
  inspection,
  editData,
  isEditing,
  activeTab,
  onTabChange,
  onDataChange,
  onUpdate,
  onInspectionUpdate
}) => {
  const handleSinglePDFExport = () => {
    // TODO: Implement single PDF export
    console.log('Single PDF export for inspection:', inspection.inspection_number);
  };

  const handleChecklistChange = (items: any[]) => {
    onDataChange({ checklistItems: items });
  };

  const handleAttachmentsChange = (files: string[]) => {
    onDataChange({ attachments: files });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleSinglePDFExport}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
          <TabsContent value="details" className="flex-1 overflow-y-auto mt-0">
            <QADetailsTab
              inspection={inspection}
              editData={editData}
              isEditing={isEditing}
              onDataChange={onDataChange}
            />
          </TabsContent>

          <TabsContent value="checklist" className="flex-1 overflow-y-auto mt-0">
            <QAChecklistTabEnhanced
              inspection={inspection}
              isEditing={isEditing}
              onChecklistChange={handleChecklistChange}
            />
          </TabsContent>

          <TabsContent value="attachments" className="flex-1 overflow-y-auto mt-0">
            <QAAttachmentsTabEnhanced
              inspection={inspection}
              isEditing={isEditing}
              onAttachmentsChange={handleAttachmentsChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QAInspectionTabsEnhanced;