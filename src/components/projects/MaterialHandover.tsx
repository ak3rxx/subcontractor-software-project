
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Calendar, Truck } from 'lucide-react';
import MaterialHandoverForm from './MaterialHandoverForm';
import MaterialHandoverTracker from './MaterialHandoverTracker';
import DeliveryScheduler from './DeliveryScheduler';

const MaterialHandover = () => {
  const [activeForm, setActiveForm] = useState<'none' | 'handover' | 'schedule'>('none');

  return (
    <div className="space-y-6">
      {activeForm === 'schedule' ? (
        <DeliveryScheduler 
          onClose={() => setActiveForm('none')}
          onScheduled={() => setActiveForm('none')}
        />
      ) : activeForm === 'handover' ? (
        <MaterialHandoverForm onClose={() => setActiveForm('none')} />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Schedule & Material Handover</h3>
              <p className="text-gray-500">
                Plan deliveries in advance, then verify materials on-site with digital sign-offs and evidence collection.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveForm('schedule')} className="flex items-center gap-2" variant="outline">
                <Calendar className="h-4 w-4" />
                Schedule Delivery
              </Button>
              <Button onClick={() => setActiveForm('handover')} className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Material Handover
              </Button>
            </div>
          </div>

          <Tabs defaultValue="tracker" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tracker" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery & Handover Tracker
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Deliveries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracker" className="space-y-4">
              <MaterialHandoverTracker 
                onNewHandover={() => setActiveForm('handover')} 
                onScheduleDelivery={() => setActiveForm('schedule')}
              />
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Scheduled Deliveries</CardTitle>
                      <CardDescription>
                        View and manage upcoming material deliveries
                      </CardDescription>
                    </div>
                    <Button onClick={() => setActiveForm('schedule')} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Schedule New Delivery
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample scheduled deliveries */}
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">DEL-20240115-ABC1</h4>
                          <p className="text-sm text-gray-600">Timber Supply Co • 90x45 Framing Timber</p>
                          <p className="text-xs text-gray-500">Riverside Apartments • Level 3, North Wing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Jan 15, 2024</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            🟡 Scheduled
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => setActiveForm('handover')}>
                          Create Handover
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">DEL-20240114-XYZ2</h4>
                          <p className="text-sm text-gray-600">Door & Hardware Plus • Door Hardware Sets</p>
                          <p className="text-xs text-gray-500">Commercial Plaza • Ground Floor Lobby</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Jan 14, 2024</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🔴 High Priority
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => setActiveForm('handover')}>
                          Create Handover
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MaterialHandover;
