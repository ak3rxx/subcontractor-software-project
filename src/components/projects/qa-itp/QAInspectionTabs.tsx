
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import QADetailsTab from './QADetailsTab';
import QAChecklistTab from './QAChecklistTab';
import QAAttachmentsTab from './QAAttachmentsTab';
import QAChangeHistory from './QAChangeHistory';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';

interface QAInspectionTabsProps {
  inspection: any;
  editData: any;
  isEditing: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataChange: (changes: any) => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onInspectionUpdate?: (updatedInspection: any) => void;
}

const QAInspectionTabs: React.FC<QAInspectionTabsProps> = ({
  inspection,
  editData,
  isEditing,
  activeTab,
  onTabChange,
  onDataChange,
  onUpdate,
  onInspectionUpdate
}) => {
  const { changeHistory, recordChange } = useQAChangeHistory(inspection?.id);
  
  return (
    <div className="flex-1 overflow-hidden">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
            {changeHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {changeHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="details" className="h-full mt-4">
            <QADetailsTab
              inspection={inspection}
              editData={editData}
              isEditing={isEditing}
              onDataChange={onDataChange}
              recordChange={recordChange}
            />
          </TabsContent>

          <TabsContent value="checklist" className="h-full mt-4">
            <QAChecklistTab
              inspection={inspection}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="attachments" className="h-full mt-4">
            <QAAttachmentsTab
              inspection={inspection}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="history" className="h-full mt-4">
            <QAChangeHistory
              inspectionId={inspection?.id}
              changeHistory={changeHistory}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default QAInspectionTabs;
