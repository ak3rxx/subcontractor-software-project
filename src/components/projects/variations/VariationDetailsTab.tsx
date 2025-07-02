
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Mail, FileText, Calendar, AlertTriangle } from 'lucide-react';
import SmartTradeSelector from './SmartTradeSelector';

interface VariationDetailsTabProps {
  variation: any;
  editData: any;
  isEditing: boolean;
  onDataChange: (data: any) => void;
  isBlocked?: boolean;
}

const VariationDetailsTab: React.FC<VariationDetailsTabProps> = ({
  variation,
  editData,
  isEditing,
  onDataChange,
  isBlocked = false
}) => {
  const handleInputChange = (field: string, value: any) => {
    if (isBlocked) return;
    onDataChange({ [field]: value });
  };

  const effectiveIsEditing = isEditing && !isBlocked;

  return (
    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
      <div className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Variation Title *</Label>
                {effectiveIsEditing ? (
                  <Input
                    id="title"
                    value={editData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter variation title"
                    disabled={isBlocked}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md font-medium">
                    {variation.title}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                {effectiveIsEditing ? (
                  <Select 
                    value={editData.priority || 'medium'} 
                    onValueChange={(value) => handleInputChange('priority', value)}
                    disabled={isBlocked}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Badge variant={
                      variation.priority === 'high' ? 'destructive' :
                      variation.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {variation.priority?.charAt(0).toUpperCase() + variation.priority?.slice(1)} Priority
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              {effectiveIsEditing ? (
                <Textarea
                  id="description"
                  value={editData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the variation in detail"
                  rows={4}
                  disabled={isBlocked}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                  {variation.description || 'No description provided'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="justification">Justification</Label>
              {effectiveIsEditing ? (
                <Textarea
                  id="justification"
                  value={editData.justification || ''}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  placeholder="Explain why this variation is necessary"
                  rows={3}
                  disabled={isBlocked}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md min-h-[80px]">
                  {variation.justification || 'No justification provided'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Trade Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Trade Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location/Area</Label>
                {effectiveIsEditing ? (
                  <Input
                    id="location"
                    value={editData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Level 2, Unit 5, Kitchen"
                    disabled={isBlocked}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {variation.location || 'Location not specified'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="trade">Trade</Label>
                {effectiveIsEditing ? (
                  <SmartTradeSelector
                    value={editData.trade || ''}
                    onChange={(value) => handleInputChange('trade', value)}
                    disabled={isBlocked}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {variation.trade || 'Trade not specified'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              {effectiveIsEditing ? (
                <Select 
                  value={editData.category || ''} 
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={isBlocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="fixtures">Fixtures & Fittings</SelectItem>
                    <SelectItem value="finishes">Finishes</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="landscaping">Landscaping</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <Badge variant="outline" className="capitalize">
                    {variation.category || 'Uncategorized'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_email">Client Email</Label>
              {effectiveIsEditing ? (
                <Input
                  id="client_email"
                  type="email"
                  value={editData.client_email || ''}
                  onChange={(e) => handleInputChange('client_email', e.target.value)}
                  placeholder="client@example.com"
                  disabled={isBlocked}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {variation.client_email || 'No client email provided'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="request_date">Request Date</Label>
                <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {variation.request_date ? new Date(variation.request_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>

              <div>
                <Label>Requested By</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {variation.requested_by || 'Not specified'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Legal Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="requires_eot"
                  checked={effectiveIsEditing ? (editData.requires_eot || false) : (variation.requires_eot || false)}
                  onCheckedChange={(checked) => handleInputChange('requires_eot', checked)}
                  disabled={!effectiveIsEditing}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="requires_eot" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Requires Extension of Time (EOT)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This variation will extend the project timeline
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="requires_nod"
                  checked={effectiveIsEditing ? (editData.requires_nod || false) : (variation.requires_nod || false)}
                  onCheckedChange={(checked) => handleInputChange('requires_nod', checked)}
                  disabled={!effectiveIsEditing}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="requires_nod" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Requires Notice of Dispute (NOD)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This variation may be subject to dispute
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default VariationDetailsTab;
