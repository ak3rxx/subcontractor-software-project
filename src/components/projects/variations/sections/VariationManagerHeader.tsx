
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

interface VariationManagerHeaderProps {
  onNewVariation: () => void;
}

const VariationManagerHeader: React.FC<VariationManagerHeaderProps> = ({ onNewVariation }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Variations</h2>
        <p className="text-gray-600">Manage project variations and change orders</p>
      </div>
      <PermissionGate module="variations" requiredLevel="write">
        <Button onClick={onNewVariation} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Variation
        </Button>
      </PermissionGate>
    </div>
  );
};

export default VariationManagerHeader;
