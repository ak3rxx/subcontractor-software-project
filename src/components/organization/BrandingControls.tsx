
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Save, Eye, Palette } from 'lucide-react';

interface BrandingControlsProps {
  organizationId?: string;
}

const BrandingControls: React.FC<BrandingControlsProps> = ({ organizationId }) => {
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('Your Company Name');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#64748B');
  const [accentColor, setAccentColor] = useState('#10B981');

  const handleLogoUpload = () => {
    // In real implementation, handle file upload
    console.log('Uploading logo...');
  };

  const saveBranding = () => {
    // In real implementation, save to database
    console.log('Saving branding:', {
      logoUrl,
      companyName,
      primaryColor,
      secondaryColor,
      accentColor
    });
  };

  const previewBranding = () => {
    // Show preview of how branding will look
    console.log('Previewing branding...');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Organization Branding
          </CardTitle>
          <CardDescription>
            Customize your organization's appearance across all modules and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logo" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logo">Logo & Identity</TabsTrigger>
              <TabsTrigger value="colors">Colors & Theme</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="logo" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {logoUrl ? (
                      <div className="space-y-2">
                        <img src={logoUrl} alt="Company Logo" className="h-16 mx-auto" />
                        <div className="text-sm text-gray-600">Current logo</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        <div className="text-sm text-gray-600">
                          Upload your company logo
                        </div>
                        <div className="text-xs text-gray-500">
                          Recommended: PNG or SVG, max 2MB
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleLogoUpload}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Used for buttons, links, and main interface elements
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#64748B"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Used for subtle elements and backgrounds
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Used for success states and highlights
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Color Preview</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="border rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Branding Preview</h3>
                  <p className="text-sm text-gray-600">
                    See how your branding will appear in the application
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-8" />
                    )}
                    <h4 className="font-semibold">{companyName}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      style={{ backgroundColor: primaryColor }}
                      className="text-white"
                    >
                      Primary Button
                    </Button>
                    <Button
                      variant="outline"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                    >
                      Secondary Button
                    </Button>
                    <div
                      className="inline-block px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Success Badge
                    </div>
                  </div>
                </div>

                <Button onClick={previewBranding} variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview in Full Application
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6 border-t">
            <Button onClick={saveBranding} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingControls;
