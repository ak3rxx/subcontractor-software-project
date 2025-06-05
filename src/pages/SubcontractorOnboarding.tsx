
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Plus, Users, FileCheck, AlertCircle, Clock } from 'lucide-react';
import SubcontractorForm from '@/components/SubcontractorForm';
import SubcontractorList from '@/components/SubcontractorList';
import PendingApprovals from '@/components/PendingApprovals';

const SubcontractorOnboarding = () => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Subcontractor Onboarding System</h1>
              <p className="text-gray-600">Comprehensive system for managing subcontractor registration and approval processes</p>
            </div>
            <Button 
              className="bg-construction-blue hover:bg-blue-700"
              onClick={() => setActiveTab('new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Subcontractor
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Subcontractors</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-green-500">+3 this month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-amber-500">2 require action</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Documents Needed</CardTitle>
                <FileCheck className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-red-500">3 expired</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
                <AlertCircle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-gray-500">Review required</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="list">All Subcontractors</TabsTrigger>
              <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
              <TabsTrigger value="new">Add New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <SubcontractorList />
            </TabsContent>
            
            <TabsContent value="pending">
              <PendingApprovals />
            </TabsContent>
            
            <TabsContent value="new">
              <SubcontractorForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubcontractorOnboarding;
