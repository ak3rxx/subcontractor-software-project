
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useToast } from '@/hooks/use-toast';

const FeatureFlagManager: React.FC = () => {
  const { flags, loading, toggleFlag } = useFeatureFlags();
  const { toast } = useToast();

  const handleToggle = async (flagName: string) => {
    const success = await toggleFlag(flagName);
    if (success) {
      const flag = flags.find(f => f.flag_name === flagName);
      toast({
        title: "Feature Flag Updated",
        description: `${flagName} is now ${flag?.is_enabled ? 'disabled' : 'enabled'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update feature flag",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flag Manager</CardTitle>
        <CardDescription>
          Control system-wide feature toggles and experimental functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Toggle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.flag_name}>
                <TableCell className="font-medium">
                  {flag.flag_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableCell>
                <TableCell className="text-gray-600">
                  {flag.description || 'No description available'}
                </TableCell>
                <TableCell>
                  <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                    {flag.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => handleToggle(flag.flag_name)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FeatureFlagManager;
