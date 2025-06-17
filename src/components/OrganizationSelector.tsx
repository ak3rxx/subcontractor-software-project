
import React from 'react';
import { Building2, Users, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOrganizations } from '@/hooks/useOrganizations';

const OrganizationSelector = () => {
  const { organizations, currentOrganization, setCurrentOrganization, loading } = useOrganizations();

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">No organizations</span>
      </div>
    );
  }

  return (
    <div className="border-b p-4">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Organization
      </label>
      <Select
        value={currentOrganization?.id || ''}
        onValueChange={(value) => {
          const org = organizations.find(o => o.id === value);
          if (org) setCurrentOrganization(org);
        }}
      >
        <SelectTrigger className="w-full mt-1">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{org.name}</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant={org.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {org.subscription_status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    {org.active_users_count}/{org.license_count}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrganizationSelector;
