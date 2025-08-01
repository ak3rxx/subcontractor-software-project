import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, Users, LogIn, UserPlus, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  organization_name: string;
  invited_by_name: string;
}

const InvitationAcceptance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid' | 'auth_required'>('loading');
  const [message, setMessage] = useState('');
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const [authError, setAuthError] = useState('');

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');

  // Auth form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: ''
  });

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitationDetails();
  }, [token]);

  useEffect(() => {
    if (user && invitationDetails && status === 'auth_required') {
      // User just authenticated, now accept the invitation
      acceptInvitation();
    }
  }, [user, invitationDetails, status]);

  const loadInvitationDetails = async () => {
    if (!token) return;

    try {
      setLoading(true);
      console.log('🔍 Loading invitation details for token:', token);

      // Use the new database function to get invitation details without authentication
      const { data: result, error } = await supabase.rpc('get_invitation_details', {
        invitation_token: token
      });

      console.log('📊 Invitation details result:', result, error);

      if (error) {
        console.error('❌ Error loading invitation details:', error);
        setStatus('invalid');
        setMessage('Failed to load invitation details');
        setLoading(false);
        return;
      }

      const response = result as any;
      if (!result || !response.success) {
        console.log('❌ Invalid invitation result:', result);
        setStatus('invalid');
        setMessage(response?.message || 'Invalid or expired invitation');
        setLoading(false);
        return;
      }

      const invitationData = response.invitation;
      const details: InvitationDetails = {
        id: invitationData.id,
        email: invitationData.email,
        role: invitationData.role,
        organization_name: invitationData.organization_name,
        invited_by_name: invitationData.invited_by_name
      };

      console.log('✅ Invitation details loaded:', details);
      setInvitationDetails(details);

      // Pre-fill email in auth forms
      setLoginData(prev => ({ ...prev, email: details.email }));
      setSignupData(prev => ({ ...prev, email: details.email }));

      if (user) {
        // User is already authenticated
        if (user.email === details.email) {
          acceptInvitation();
        } else {
          setStatus('error');
          setMessage('This invitation was sent to a different email address. Please sign in with the correct account.');
          setLoading(false);
        }
      } else {
        // User needs to authenticate
        setStatus('auth_required');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!token || !user || !invitationDetails) return;

    try {
      setLoading(true);
      console.log('🔄 Starting invitation acceptance process');
      console.log('📧 User email:', user.email);
      console.log('🎫 Token from URL:', token);
      console.log('📝 Invitation details:', invitationDetails);

      // Check if email matches
      if (invitationDetails.email !== user.email) {
        console.log('❌ Email mismatch:', invitationDetails.email, 'vs', user.email);
        setStatus('error');
        setMessage('This invitation was sent to a different email address');
        setLoading(false);
        return;
      }

      // Validate token format as UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        console.log('❌ Invalid token format:', token);
        setStatus('error');
        setMessage('Invalid invitation token format');
        setLoading(false);
        return;
      }

      console.log('✅ Token format validated, calling database function...');
      
      // Accept the invitation - explicitly cast as UUID
      const { data: result, error } = await supabase.rpc('accept_organization_invitation', {
        invitation_token: token
      });

      console.log('📊 Database response:', { result, error });

      if (error) {
        console.error('❌ Database error accepting invitation:', error);
        setStatus('error');
        setMessage(`Failed to accept invitation: ${error.message}`);
        return;
      }

      const response = result as any;
      console.log('📋 Parsed response:', response);
      
      if (response.success) {
        console.log('🎉 Invitation accepted successfully!');
        setStatus('success');
        setMessage(response.message);
        
        toast({
          title: "Welcome!",
          description: `You've successfully joined ${invitationDetails.organization_name}`,
        });

        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        console.log('❌ Invitation acceptance failed:', response);
        setStatus('error');
        setMessage(response.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      setAuthError(error.message);
    } else {
      // Don't redirect here - let useEffect handle invitation acceptance
      setAuthError('');
    }
    
    setAuthLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (signupData.password !== signupData.confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthLoading(false);
      return;
    }

    const { error } = await signUp(signupData.email, signupData.password, {
      first_name: signupData.firstName,
      last_name: signupData.lastName,
      company: signupData.company,
      phone: signupData.phone
    });
    
    if (error) {
      setAuthError(error.message);
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account, then return to this page."
      });
    }
    
    setAuthLoading(false);
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Loading Invitation</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your invitation...
            </p>
          </div>
        );

      case 'auth_required':
        return (
          <div className="space-y-6">
            {invitationDetails && (
              <div className="text-center space-y-4 p-4 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold">You're Invited!</h3>
                  <p className="text-sm text-muted-foreground">
                    {invitationDetails.invited_by_name} has invited you to join{' '}
                    <strong>{invitationDetails.organization_name}</strong> as a{' '}
                    <strong>{invitationDetails.role.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-bold text-center mb-4">
                Sign in or create an account to accept this invitation
              </h2>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {authError && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                        disabled={invitationDetails?.email ? true : false}
                      />
                      {invitationDetails?.email && (
                        <p className="text-xs text-muted-foreground">
                          This invitation is for {invitationDetails.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? 'Signing In...' : 'Sign In & Accept Invitation'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={signupData.firstName}
                          onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={signupData.lastName}
                          onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                        disabled={invitationDetails?.email ? true : false}
                      />
                      {invitationDetails?.email && (
                        <p className="text-xs text-muted-foreground">
                          This invitation is for {invitationDetails.email}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signupPassword">Password</Label>
                        <Input
                          id="signupPassword"
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Create password"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={signupData.company}
                          onChange={(e) => setSignupData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={signupData.phone}
                          onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? 'Creating Account...' : 'Create Account & Accept Invitation'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-success" />
            <h2 className="text-2xl font-bold">
              Welcome to {invitationDetails?.organization_name}!
            </h2>
            <p className="text-muted-foreground">
              You've been added as a <strong>{invitationDetails?.role.replace('_', ' ')}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Invitation Error</h2>
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign In with Different Account
              </Button>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Invalid Invitation</h2>
            <p className="text-muted-foreground">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Go to Sign In
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BuildTrack Pro</h1>
          <p className="text-gray-600 mt-2">Professional Construction Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organization Invitation
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Processing your invitation...'}
              {status === 'auth_required' && 'Complete your invitation acceptance'}
              {status === 'success' && 'Invitation accepted successfully!'}
              {(status === 'error' || status === 'invalid') && 'Invitation Status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvitationAcceptance;