
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Palette, FolderPlus, CheckSquare } from 'lucide-react';
import EnhancedTeamManagement from '@/components/organization/EnhancedTeamManagement';
import DocumentCompliance from '@/components/organization/DocumentCompliance';
import ProjectSetupDefaults from '@/components/organization/ProjectSetupDefaults';
import BrandingControls from '@/components/organization/BrandingControls';
import MasterChecklist from '@/components/organization/MasterChecklist';

interface OrganizationPanelDashboardProps {
  organizationId?: string;
}

const OrganizationPanelDashboard: React.FC<OrganizationPanelDashboardProps> = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Organization Panel</h1>
        </div>
        <p className="text-gray-600">
          Manage your organization settings, team members, and compliance requirements.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            Project Defaults
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Invites</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License Limit</span>
                    <span className="font-semibold">25</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>SWMS Updated</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance Valid</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Licenses Current</span>
                    <span className="text-yellow-600 font-semibold">⚠</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="h-5 w-5" />
                  Project Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Default Folders</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Master Checklist</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Templates</span>
                    <span className="font-semibold">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <EnhancedTeamManagement organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="compliance">
          <DocumentCompliance organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="defaults">
          <ProjectSetupDefaults organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingControls organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationPanelDashboard;
