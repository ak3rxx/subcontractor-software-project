
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import MaterialHandoverForm from './MaterialHandoverForm';
import MaterialHandoverTracker from './MaterialHandoverTracker';

const MaterialHandover = () => {
  const [activeForm, setActiveForm] = useState(false);

  return (
    <div className="space-y-6">
      {activeForm ? (
        <MaterialHandoverForm onClose={() => setActiveForm(false)} />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Material Handover Register</h3>
              <p className="text-gray-500">
                Track material deliveries, verify condition, and manage handover records with digital sign-offs.
              </p>
            </div>
            <Button onClick={() => setActiveForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Material Handover
            </Button>
          </div>
          
          <MaterialHandoverTracker onNewHandover={() => setActiveForm(true)} />
        </>
      )}
    </div>
  );
};

export default MaterialHandover;
