import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Palette, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';

const Settings = () => {
  const { user, loading } = useAuth();
  const isDeveloper = () => user?.email === 'huy.nguyen@dcsquared.com.au';
  const isOrgAdmin = () => false; // Simplified for now
  const [activeTab, setActiveTab] = useState('profile');

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

  // Show organization panel for org admins, but keep it within settings context
  if (isOrgAdmin()) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
              </div>
              <p className="text-gray-600">
                Manage your organization settings, team members, and compliance requirements.
              </p>
            </div>
            <OrganizationPanelDashboard />
          </div>
        </div>
      </div>
    );
  }

  // Regular user settings (including developers who want to access personal settings)
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your profile, preferences, and account settings.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Enter your first name" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Enter your last name" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone number" />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Enter your company name" />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" placeholder="Enter your job title" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Switch id="twoFactor" />
                    <Label htmlFor="twoFactor">Enable Two-Factor Authentication (Coming Soon)</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>Customize the appearance of your interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Color Theme</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark (Coming Soon)</SelectItem>
                        <SelectItem value="auto">Auto (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <Select defaultValue="blue">
                      <SelectTrigger>
                        <SelectValue placeholder="Select accent color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green (Coming Soon)</SelectItem>
                        <SelectItem value="purple">Purple (Coming Soon)</SelectItem>
                        <SelectItem value="orange">Orange (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>Configure how information is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="compactMode" />
                    <Label htmlFor="compactMode">Compact Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="showHelperText" defaultChecked />
                    <Label htmlFor="showHelperText">Show Helper Text</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="animateTransitions" defaultChecked />
                    <Label htmlFor="animateTransitions">Animate Transitions</Label>
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
                  <CardDescription>Configure when you receive email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="taskAssigned" defaultChecked />
                    <Label htmlFor="taskAssigned">When tasks are assigned to me</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="taskDue" defaultChecked />
                    <Label htmlFor="taskDue">When tasks are due soon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="projectUpdates" defaultChecked />
                    <Label htmlFor="projectUpdates">Project status updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="rfiUpdates" defaultChecked />
                    <Label htmlFor="rfiUpdates">RFI responses and updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="variationUpdates" defaultChecked />
                    <Label htmlFor="variationUpdates">Variation approvals and changes</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>In-App Notifications</CardTitle>
                  <CardDescription>Configure notifications within the application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="browserNotifications" />
                    <Label htmlFor="browserNotifications">Browser notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="soundNotifications" />
                    <Label htmlFor="soundNotifications">Sound notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="desktopNotifications" />
                    <Label htmlFor="desktopNotifications">Desktop notifications</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Frequency</CardTitle>
                  <CardDescription>How often you receive notification summaries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="digestFrequency">Daily Digest</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: Never
          </div>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
