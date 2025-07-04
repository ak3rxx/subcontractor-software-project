
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, List } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

interface VariationManagerHeaderProps {
  onNewVariation: () => void;
  activeTab?: 'list' | 'analytics';
  onTabChange?: (tab: 'list' | 'analytics') => void;
}

const VariationManagerHeader: React.FC<VariationManagerHeaderProps> = ({
  onNewVariation,
  activeTab = 'list',
  onTabChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Variations</h1>
        <p className="text-gray-600">Manage project variations and change orders</p>
      </div>
      
      <div className="flex items-center gap-4">
        {onTabChange && (
          <Tabs value={activeTab} onValueChange={onTabChange as (value: string) => void}>
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        <PermissionGate permission="create" showMessage={false}>
          <Button onClick={onNewVariation} data-tour="new-variation-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Variation
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
};

export default VariationManagerHeader;
