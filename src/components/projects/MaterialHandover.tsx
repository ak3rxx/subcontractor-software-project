
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

const MaterialHandover = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Material Handover Module</h3>
        <p className="text-gray-500 mb-6">
          This module will track material deliveries and handovers between trades.
          <br />
          Coming soon with features for delivery tracking, sign-offs, and material management.
        </p>
        <Button disabled className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Material Handover (Coming Soon)
        </Button>
      </div>
    </div>
  );
};

export default MaterialHandover;
