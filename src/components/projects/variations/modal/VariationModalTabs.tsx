
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VariationDetailsTab from '../VariationDetailsTab';
import VariationCostTab from '../VariationCostTab';
import VariationFilesTab from '../VariationFilesTab';
import EnhancedVariationApprovalTab from '../EnhancedVariationApprovalTab';

interface VariationModalTabsProps {
  variation: any;
  editData: any;
  isEditing: boolean;
  canEditVariation: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataChange: (changes: any) => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

const VariationModalTabs: React.FC<VariationModalTabsProps> = ({
  variation,
  editData,
  isEditing,
  canEditVariation,
  activeTab,
  onTabChange,
  onDataChange,
  onUpdate,
  onVariationUpdate
}) => {
  return (
    <div className="flex-1 overflow-hidden">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="cost">Cost & Time</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="details" className="h-full mt-4">
            <VariationDetailsTab
              variation={variation}
              editData={editData}
              isEditing={isEditing && canEditVariation}
              onDataChange={onDataChange}
              isBlocked={!canEditVariation}
            />
          </TabsContent>

          <TabsContent value="cost" className="h-full mt-4">
            <VariationCostTab
              variation={variation}
              editData={editData}
              isEditing={isEditing && canEditVariation}
              onDataChange={onDataChange}
              isBlocked={!canEditVariation}
            />
          </TabsContent>

          <TabsContent value="files" className="h-full mt-4">
            <VariationFilesTab
              variation={variation}
              isEditing={isEditing && canEditVariation}
              isBlocked={!canEditVariation}
            />
          </TabsContent>

          <TabsContent value="approval" className="h-full mt-4">
            <EnhancedVariationApprovalTab
              variation={variation}
              onUpdate={onUpdate || (() => Promise.resolve())}
              onStatusChange={() => onVariationUpdate?.(variation)}
              isBlocked={isEditing}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default VariationModalTabs;
