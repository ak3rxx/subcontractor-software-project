import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Building2, Users, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface OrganizationOnboardingProps {
  isFirstTime?: boolean;
  onComplete?: () => void;
}

const OrganizationOnboarding: React.FC<OrganizationOnboardingProps> = ({
  isFirstTime = false,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState({
    name: '',
    industry: '',
    size: '',
    address: '',
    contact_email: '',
    contact_phone: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const industries = [
    { value: 'residential', label: 'Residential Construction' },
    { value: 'commercial', label: 'Commercial Construction' },
    { value: 'industrial', label: 'Industrial Construction' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'renovation', label: 'Renovation & Fit-out' },
    { value: 'other', label: 'Other' }
  ];

  const companySize = [
    { value: 'sole_trader', label: 'Sole Trader (1 person)' },
    { value: 'small', label: 'Small (2-10 people)' },
    { value: 'medium', label: 'Medium (11-50 people)' },
    { value: 'large', label: 'Large (50+ people)' }
  ];

  useEffect(() => {
    // Pre-fill data if user has existing organization
    if (user?.user_metadata?.company) {
      setOrganizationData(prev => ({
        ...prev,
        name: user.user_metadata.company,
        contact_email: user.email || ''
      }));
    }
  }, [user]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update organization details
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: organizationData.name,
          address: organizationData.address,
          contact_email: organizationData.contact_email,
          contact_phone: organizationData.contact_phone
        })
        .eq('created_by', user?.id);

      if (orgError) {
        console.error('Error updating organization:', orgError);
        toast({
          title: "Error",
          description: "Failed to complete organization setup",
          variant: "destructive"
        });
        return;
      }

      // Create organization settings with industry and size
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user?.id)
        .single();

      if (orgData) {
        await supabase
          .from('organization_settings')
          .upsert({
            organization_id: orgData.id,
            notification_settings: {
              industry: organizationData.industry,
              company_size: organizationData.size
            }
          });
      }

      toast({
        title: "Success",
        description: "Organization setup completed successfully!"
      });

      if (onComplete) {
        onComplete();
      } else {
        navigate('/organization-panel');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to complete organization setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Building2 className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Welcome to Grandscale!</h2>
              <p className="text-muted-foreground">
                Let's set up your organization to get you started with project management.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Your company name"
                  value={organizationData.name}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select 
                  value={organizationData.industry} 
                  onValueChange={(value) => setOrganizationData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="company-size">Company Size</Label>
                <Select 
                  value={organizationData.size} 
                  onValueChange={(value) => setOrganizationData(prev => ({ ...prev, size: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySize.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Building2 className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Contact Information</h2>
              <p className="text-muted-foreground">
                Add your business contact details for communication and compliance.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  placeholder="123 Business Street, City, State, Postcode"
                  value={organizationData.address}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="contact@yourcompany.com"
                  value={organizationData.contact_email}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={organizationData.contact_phone}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Check className="h-12 w-12 mx-auto text-success" />
              <h2 className="text-2xl font-bold">All Set!</h2>
              <p className="text-muted-foreground">
                Your organization is ready. You can now start managing projects and inviting team members.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{organizationData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="font-medium">
                    {industries.find(i => i.value === organizationData.industry)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">
                    {companySize.find(s => s.value === organizationData.size)?.label}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Email:</span>
                  <span className="font-medium">{organizationData.contact_email}</span>
                </div>
                {organizationData.contact_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{organizationData.contact_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Next steps: Invite team members, set up your first project, and configure compliance documents.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return organizationData.name && organizationData.industry && organizationData.size;
      case 2:
        return organizationData.contact_email;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {step} of 3
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStep()}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {step === 3 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationOnboarding;