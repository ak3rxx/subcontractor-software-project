
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  UserPlus, 
  AlertTriangle, 
  CreditCard, 
  Activity, 
  TestTube, 
  Settings, 
  Flag, 
  BookOpen, 
  Shield,
  BarChart3,
  Wrench
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const globalManagementItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'clients', label: 'Client Management', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'issues', label: 'Issue Management', icon: AlertTriangle },
    { id: 'onboarding', label: 'Onboarding Editor', icon: BookOpen },
  ];

  const systemToolsItems = [
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'features', label: 'Feature Flags', icon: Flag },
    { id: 'testing', label: 'Test User Mode', icon: TestTube },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Activity },
    { id: 'qa-diagnostics', label: 'QA Diagnostics', icon: Wrench },
  ];

  const quickActions = [
    { id: 'invite-client', label: 'Invite New Client', icon: UserPlus },
    { id: 'system-status', label: 'System Status', icon: Activity },
  ];

  const MenuItem = ({ item, isActive, onClick }: { 
    item: typeof globalManagementItems[0], 
    isActive: boolean, 
    onClick: () => void 
  }) => (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={`w-full justify-start gap-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'}`}
      onClick={onClick}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Button>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Panel</h2>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6">
          {/* Global Management */}
          <div>
            <h3 className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Global Management
            </h3>
            <div className="space-y-1">
              {globalManagementItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* System Tools */}
          <div>
            <h3 className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              System Tools
            </h3>
            <div className="space-y-1">
              {systemToolsItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h3 className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdminSidebar;
