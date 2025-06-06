
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardCheck, Package } from 'lucide-react';
import QAITPForm from '@/components/projects/QAITPForm';
import QAITPTracker from '@/components/projects/QAITPTracker';
import MaterialHandover from '@/components/projects/MaterialHandover';

const Projects = () => {
  const [activeQAForm, setActiveQAForm] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects Management</h1>
          <p className="text-muted-foreground">Manage quality assurance and material handovers</p>
        </div>
      </div>

      <Tabs defaultValue="qa-itp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qa-itp" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Quality Assurance / ITP
          </TabsTrigger>
          <TabsTrigger value="material-handover" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Material Handover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qa-itp" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Quality Assurance / ITP (Inspection Test Plan)</CardTitle>
                  <CardDescription>
                    Create and track inspection hold points, collect evidence, and generate sign-off records
                  </CardDescription>
                </div>
                <Button onClick={() => setActiveQAForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New QA Inspection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeQAForm ? (
                <QAITPForm onClose={() => setActiveQAForm(false)} />
              ) : (
                <QAITPTracker onNewInspection={() => setActiveQAForm(true)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material-handover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material Handover</CardTitle>
              <CardDescription>
                Track material deliveries and handovers between trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialHandover />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;
