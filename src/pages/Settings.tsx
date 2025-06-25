
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Database, Zap, Bell, Shield, Palette, Globe } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';

const Settings = () => {
  const { isDeveloper, isOrgAdmin, loading } = usePermissions();
  const [activeTab, setActiveTab] = useState('system');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isDeveloper() && !isOrgAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // If organization admin, show organization panel
  if (isOrgAdmin() && !isDeveloper()) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1">
          <OrganizationPanelDashboard />
        </div>
      </div>
    );
  }

  // Developer gets system settings only
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          </div>
          <p className="text-gray-600">
            Configure system-level settings and preferences.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Settings</CardTitle>
                  <CardDescription>Configure database connection and performance settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dbPool">Connection Pool Size</Label>
                    <Input id="dbPool" type="number" defaultValue="20" />
                  </div>
                  <div>
                    <Label htmlFor="dbTimeout">Query Timeout (seconds)</Label>
                    <Input id="dbTimeout" type="number" defaultValue="30" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="dbLogging" />
                    <Label htmlFor="dbLogging">Enable Query Logging</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Storage</CardTitle>
                  <CardDescription>Configure file upload and storage settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input id="maxFileSize" type="number" defaultValue="10" />
                  </div>
                  <div>
                    <Label htmlFor="allowedTypes">Allowed File Types</Label>
                    <Input id="allowedTypes" defaultValue="pdf,jpg,png,doc,docx" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="virusScanning" />
                    <Label htmlFor="virusScanning">Enable Virus Scanning</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Caching</CardTitle>
                  <CardDescription>Configure caching settings for better performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="enableCaching" defaultChecked />
                    <Label htmlFor="enableCaching">Enable Caching</Label>
                  </div>
                  <div>
                    <Label htmlFor="cacheExpiry">Cache Expiry (minutes)</Label>
                    <Input id="cacheExpiry" type="number" defaultValue="60" />
                  </div>
                  <Button variant="outline">Clear All Cache</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limiting</CardTitle>
                  <CardDescription>Configure API rate limiting settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rateLimit">Requests per minute</Label>
                    <Input id="rateLimit" type="number" defaultValue="100" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="rateLimitEnabled" defaultChecked />
                    <Label htmlFor="rateLimitEnabled">Enable Rate Limiting</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Configure system email notification settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input id="smtpServer" placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input id="smtpPort" type="number" defaultValue="587" />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input id="fromEmail" type="email" placeholder="noreply@grandscale.com" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="emailEnabled" defaultChecked />
                    <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>Configure authentication and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="24" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="mfaRequired" />
                    <Label htmlFor="mfaRequired">Require Multi-Factor Authentication</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="passwordComplexity" defaultChecked />
                    <Label htmlFor="passwordComplexity">Enforce Password Complexity</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Logging</CardTitle>
                  <CardDescription>Configure system audit and logging settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="auditLogging" defaultChecked />
                    <Label htmlFor="auditLogging">Enable Audit Logging</Label>
                  </div>
                  <div>
                    <Label htmlFor="logRetention">Log Retention (days)</Label>
                    <Input id="logRetention" type="number" defaultValue="90" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        <div className="flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
