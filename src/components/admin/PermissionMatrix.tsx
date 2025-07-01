
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissionChecks, UserRole, Module, PermissionLevel } from '@/permissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PermissionMatrix: React.FC = () => {
  const { permissions, loading } = usePermissionChecks();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const roles: UserRole[] = [
    'developer', 'org_admin', 'project_manager', 'estimator', 
    'admin', 'site_supervisor', 'subcontractor', 'client'
  ];

  const modules: Module[] = [
    'admin_panel', 'organization_panel', 'projects', 'tasks', 'rfis',
    'qa_itp', 'variations', 'finance', 'documents', 'programme',
    'deliveries', 'handovers', 'notes', 'onboarding', 'diagnostics'
  ];

  const permissionLevels: PermissionLevel[] = ['none', 'read', 'write', 'admin'];

  const getPermissionLevel = (role: UserRole, module: Module): PermissionLevel => {
    const permission = permissions.find(p => p.role === role && p.module === module);
    return permission?.permission_level || 'none';
  };

  const updatePermission = async (role: UserRole, module: Module, level: PermissionLevel) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role,
          module,
          permission_level: level
        }, {
          onConflict: 'role,module'
        });

      if (error) throw error;

      // Note: In a real app, you'd refetch permissions here
      // For now, we'll just show success message
      toast({
        title: "Permission Updated",
        description: `${role} access to ${module} set to ${level}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getBadgeVariant = (level: PermissionLevel) => {
    switch (level) {
      case 'admin': return 'default';
      case 'write': return 'secondary';
      case 'read': return 'outline';
      default: return 'destructive';
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>
          Manage role-based access control across all system modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Role</TableHead>
                {modules.map(module => (
                  <TableHead key={module} className="text-center min-w-32">
                    {module.replace('_', ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role}>
                  <TableCell className="font-medium capitalize">
                    {role.replace('_', ' ')}
                  </TableCell>
                  {modules.map(module => {
                    const currentLevel = getPermissionLevel(role, module);
                    return (
                      <TableCell key={`${role}-${module}`} className="text-center">
                        <Select
                          value={currentLevel}
                          onValueChange={(value: PermissionLevel) => 
                            updatePermission(role, module, value)
                          }
                          disabled={updating}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue>
                              <Badge variant={getBadgeVariant(currentLevel)} className="text-xs">
                                {currentLevel}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {permissionLevels.map(level => (
                              <SelectItem key={level} value={level}>
                                <Badge variant={getBadgeVariant(level)} className="text-xs">
                                  {level}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionMatrix;
