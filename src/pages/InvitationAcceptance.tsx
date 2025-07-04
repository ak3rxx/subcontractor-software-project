import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InvitationAcceptance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Invalid invitation link');
      setLoading(false);
      return;
    }

    if (!user) {
      // User not logged in, redirect to auth with return URL
      navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    acceptInvitation();
  }, [token, user]);

  const acceptInvitation = async () => {
    if (!token || !user) return;

    try {
      setLoading(true);

      // First, get invitation details for display
      const { data: invitationData, error: invitationError } = await supabase
        .from('organization_invitations')
        .select(`
          *,
          organizations (name)
        `)
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitationData) {
        setStatus('invalid');
        setMessage('Invalid or expired invitation');
        setLoading(false);
        return;
      }

      // Check if email matches
      if (invitationData.email !== user.email) {
        setStatus('error');
        setMessage('This invitation was sent to a different email address');
        setLoading(false);
        return;
      }

      setOrganizationName((invitationData.organizations as any)?.name || 'Unknown Organization');
      setRole(invitationData.role);

      // Accept the invitation
      const { data: result, error } = await supabase.rpc('accept_organization_invitation', {
        invitation_token: token
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        setStatus('error');
        setMessage('Failed to accept invitation');
        return;
      }

      const response = result as any;
      if (response.success) {
        setStatus('success');
        setMessage(response.message);
        
        toast({
          title: "Welcome!",
          description: `You've successfully joined ${organizationName}`,
        });

        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Processing Invitation</h2>
            <p className="text-muted-foreground">
              Please wait while we add you to the organization...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-success" />
            <h2 className="text-2xl font-bold">Welcome to {organizationName}!</h2>
            <p className="text-muted-foreground">
              You've been added as a <strong>{role.replace('_', ' ')}</strong>
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
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
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
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Invitation
          </CardTitle>
          <CardDescription>
            {status === 'loading' ? 'Processing your invitation...' : 'Invitation Status'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationAcceptance;