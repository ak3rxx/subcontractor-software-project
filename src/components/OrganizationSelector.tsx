
import React from 'react';
import { Building2, Users, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOrganizations } from '@/hooks/useOrganizations';

const OrganizationSelector = () => {
  const { organizations, currentOrganization, setCurrentOrganization, loading } = useOrganizations();

  if (loading) {
    return null; // Don't show loading state
  }

  if (organizations.length === 0) {
    return null; // Don't show if no organizations
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50 mb-4">
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organization Settings (Optional)
          <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-3">
          <Select
            value={currentOrganization?.id || ''}
            onValueChange={(value) => {
              const org = organizations.find(o => o.id === value);
              if (org) setCurrentOrganization(org);
            }}
          >
            <SelectTrigger className="w-full">
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
      </details>
    </div>
  );
};

export default OrganizationSelector;
