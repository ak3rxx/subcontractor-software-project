import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Utility function to parse URL fragment parameters
const parseUrlFragment = (hash: string) => {
  const params = new URLSearchParams(hash.substring(1));
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    type: params.get('type'),
    error: params.get('error'),
    error_description: params.get('error_description')
  };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Handle URL fragments and establish recovery session
  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Parse URL fragment for tokens
        const fragmentParams = parseUrlFragment(location.hash);
        
        // Check for errors in URL
        if (fragmentParams.error) {
          if (fragmentParams.error === 'access_denied' || fragmentParams.error_description?.includes('expired')) {
            setError('This password reset link has expired or is invalid. Please request a new one.');
          } else {
            setError(fragmentParams.error_description || 'Invalid password reset link.');
          }
          setCheckingSession(false);
          return;
        }

        // If we have tokens, establish the session
        if (fragmentParams.access_token && fragmentParams.refresh_token && fragmentParams.type === 'recovery') {
          const { data, error } = await supabase.auth.setSession({
            access_token: fragmentParams.access_token,
            refresh_token: fragmentParams.refresh_token
          });

          if (error) {
            console.error('Session error:', error);
            setError('Invalid or expired password reset link. Please request a new one.');
          } else if (data.session) {
            // Verify this is a recovery session
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              setValidSession(true);
              // Clear the URL fragment for security
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              setError('Invalid password reset session. Please request a new one.');
            }
          }
        } else {
          // No valid tokens found
          setError('Invalid password reset link. Please request a new one.');
        }
      } catch (err) {
        console.error('Password reset initialization error:', err);
        setError('An error occurred while processing the password reset link.');
      } finally {
        setCheckingSession(false);
      }
    };

    handlePasswordReset();
  }, [location.hash]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated. You can now sign in with your new password."
      });

      // Redirect to auth page after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleRequestNewLink = () => {
    navigate('/auth');
  };

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Grandscale</h1>
            <p className="text-gray-600 mt-2">Construction Project Management</p>
          </div>
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying password reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Grandscale</h1>
            <p className="text-gray-600 mt-2">Construction Project Management</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-700">Password Updated Successfully!</CardTitle>
              <CardDescription>
                Your password has been changed. You'll be redirected to sign in shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Continue to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Grandscale</h1>
          <p className="text-gray-600 mt-2">Construction Project Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              {validSession ? 'Enter your new password below' : 'Password Reset Link Required'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!validSession || error ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {error ? error : 'Please use a valid password reset link to access this page.'}
                </p>
                <Button onClick={handleRequestNewLink} className="w-full">
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleRequestNewLink}
                    className="text-sm text-blue-600 hover:text-blue-500 underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;