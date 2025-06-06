
import React from 'react';
import { Button } from '@/components/ui/button';

const FormActionsSection: React.FC = () => {
  return (
    <div className="flex justify-end space-x-4">
      <Button variant="outline" type="button">
        Save as Draft
      </Button>
      <Button type="submit" className="bg-construction-blue hover:bg-blue-700">
        Submit for Approval
      </Button>
    </div>
  );
};

export default FormActionsSection;
