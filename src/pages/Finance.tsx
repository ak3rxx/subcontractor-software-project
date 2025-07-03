
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, FileText, Calendar, CreditCard, BarChart3 } from 'lucide-react';
import TopNav from '@/components/TopNav';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import InvoiceManager from '@/components/finance/invoices/InvoiceManager';
import ProgressClaimManager from '@/components/finance/progress-claims/ProgressClaimManager';
import PaymentClaimManager from '@/components/finance/payment-claims/PaymentClaimManager';
import BudgetOverview from '@/components/finance/budget-tracking/BudgetOverview';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav />
      <main className="flex-1">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-2xl">Finance Management</CardTitle>
                  <p className="text-muted-foreground">
                    Comprehensive financial management across all projects
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Finance Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="progress-claims" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Progress Claims
              </TabsTrigger>
              <TabsTrigger value="payment-claims" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Claims
              </TabsTrigger>
              <TabsTrigger value="budget-tracking" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <FinanceDashboard />
            </TabsContent>

            <TabsContent value="invoices" className="mt-6">
              <InvoiceManager />
            </TabsContent>

            <TabsContent value="progress-claims" className="mt-6">
              <ProgressClaimManager />
            </TabsContent>

            <TabsContent value="payment-claims" className="mt-6">
              <PaymentClaimManager />
            </TabsContent>

            <TabsContent value="budget-tracking" className="mt-6">
              <BudgetOverview />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Finance;
