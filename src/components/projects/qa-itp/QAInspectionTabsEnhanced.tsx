import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import QADetailsTab from './QADetailsTab';
import QAChecklistTabEnhanced from './QAChecklistTabEnhanced';
import QAAttachmentsTabEnhanced from './QAAttachmentsTabEnhanced';
import QAChangeHistory from './QAChangeHistory';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { exportInspectionToPDF, downloadPDF } from '@/utils/pdfExport';

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
  const { changeHistory, loading: historyLoading } = useQAChangeHistory(inspection?.id);

  const handleSinglePDFExport = async () => {
    if (!inspection) return;
    
    try {
      // Create a temporary element with inspection data
      const tempElement = document.createElement('div');
      tempElement.setAttribute('data-inspection-viewer', 'true');
      tempElement.innerHTML = `
        <div data-project-name="${inspection.project_name}"></div>
        <div data-task-area="${inspection.task_area}"></div>
        <div data-location-reference="${inspection.location_reference}"></div>
        <div data-inspector-name="${inspection.inspector_name}"></div>
        <div data-inspection-date="${inspection.inspection_date}"></div>
        <div data-overall-status="${inspection.overall_status}"></div>
      `;
      
      const blob = await exportInspectionToPDF(tempElement, {
        id: inspection.id,
        inspection_number: inspection.inspection_number,
        project_name: inspection.project_name,
        task_area: inspection.task_area,
        inspector_name: inspection.inspector_name,
        inspection_date: inspection.inspection_date,
        overall_status: inspection.overall_status
      });
      
      downloadPDF(blob, `${inspection.inspection_number}_inspection_report.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleChecklistChange = (items: any[]) => {
    onDataChange({ checklistItems: items });
  };

  const handleAttachmentsChange = (files: string[]) => {
    onDataChange({ attachments: files });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleSinglePDFExport}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full">
          <TabsContent value="details" className="h-full overflow-y-auto mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 overflow-y-auto">
              <QADetailsTab
                inspection={inspection}
                editData={editData}
                isEditing={isEditing}
                onDataChange={onDataChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="h-full overflow-y-auto mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 overflow-y-auto">
              <QAChecklistTabEnhanced
                inspection={inspection}
                isEditing={isEditing}
                onChecklistChange={handleChecklistChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="h-full overflow-y-auto mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 overflow-y-auto">
              <QAAttachmentsTabEnhanced
                inspection={inspection}
                isEditing={isEditing}
                onAttachmentsChange={handleAttachmentsChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="audit" className="h-full overflow-y-auto mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 overflow-y-auto">
              <QAChangeHistory
                inspectionId={inspection?.id}
                changeHistory={changeHistory}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QAInspectionTabsEnhanced;