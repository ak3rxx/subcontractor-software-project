
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Gavel } from 'lucide-react';
import PaymentScheduleManager from '@/components/projects/payment-schedules/PaymentScheduleManager';

const PaymentClaimManager = () => {
  const [activeTab, setActiveTab] = useState('payment-claims');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <div>
              <CardTitle className="text-2xl">Payment Claims & Schedules</CardTitle>
              <p className="text-muted-foreground">
                Manage payment claims and ACT Security of Payment compliance
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Claims Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment-claims" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Claims Overview
          </TabsTrigger>
          <TabsTrigger value="payment-schedules" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Payment Schedules (ACT SOP)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment-claims" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Payment Claims</CardTitle>
              <p className="text-muted-foreground">
                Overview of payment claims across all projects
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Project Payment Claims</h3>
                <p className="text-gray-600">
                  Global payment claims dashboard will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-schedules" className="mt-6">
          {/* Use the existing PaymentScheduleManager without project-specific filtering */}
          <PaymentScheduleManager 
            projectName="All Projects" 
            projectId="" // Empty project ID to show all projects
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentClaimManager;
