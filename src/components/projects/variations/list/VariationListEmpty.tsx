
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

interface VariationListEmptyProps {
  onCreateFirst?: () => void;
}

const VariationListEmpty: React.FC<VariationListEmptyProps> = ({ onCreateFirst }) => {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Variations Yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Get started by creating your first variation. Track scope changes, cost impacts, and manage approvals all in one place.
        </p>
        {onCreateFirst && (
          <Button onClick={onCreateFirst} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create First Variation
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationListEmpty;
