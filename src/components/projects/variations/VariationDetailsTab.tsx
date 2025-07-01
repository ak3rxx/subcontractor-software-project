
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Calendar, User, Mail, Clock, Wrench, AlertTriangle, FileText } from 'lucide-react';

interface VariationDetailsTabProps {
  variation: any;
  editData: any;
  isEditing: boolean;
  onDataChange: (data: any) => void;
}

const VariationDetailsTab: React.FC<VariationDetailsTabProps> = ({
  variation,
  editData,
  isEditing,
  onDataChange
}) => {
  const handleInputChange = (field: string, value: any) => {
    onDataChange({ [field]: value });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
      <div className="space-y-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                {isEditing ? (
                  <Input
                    id="title"
                    value={editData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">{variation.title}</div>
                )}
              </div>
              
              <div>
                <Label>Priority</Label>
                {isEditing ? (
                  <Select 
                    value={editData.priority} 
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2">
                    {getPriorityBadge(variation.priority)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Location</Label>
                {isEditing ? (
                  <Input
                    value={editData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{variation.location}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Category</Label>
                {isEditing ? (
                  <Select 
                    value={editData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <Badge variant="outline" className="capitalize">
                      {variation.category}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label>Trade</Label>
                {isEditing ? (
                  <Select 
                    value={editData.trade || ''} 
                    onValueChange={(value) => handleInputChange('trade', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="carpentry">Carpentry</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="flooring">Flooring</SelectItem>
                      <SelectItem value="roofing">Roofing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Wrench className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">{variation.trade || 'Not specified'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{variation.client_email}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Time Impact (days)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editData.time_impact}
                    onChange={(e) => handleInputChange('time_impact', parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {variation.time_impact > 0 ? `+${variation.time_impact}d` : 
                       variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NOD/EOT Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Notice of Delay & Extension of Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <Checkbox
                      id="requires_nod"
                      checked={editData.requires_nod || false}
                      onCheckedChange={(checked) => handleInputChange('requires_nod', checked)}
                    />
                  ) : (
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      variation.requires_nod ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {variation.requires_nod && <span className="text-white text-xs">✓</span>}
                    </div>
                  )}
                  <Label htmlFor="requires_nod" className="font-medium">
                    Requires Notice of Delay (NOD)
                  </Label>
                </div>
                
                {(isEditing ? editData.requires_nod : variation.requires_nod) && (
                  <div>
                    <Label>NOD Days</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.nod_days || 0}
                        onChange={(e) => handleInputChange('nod_days', parseInt(e.target.value) || 0)}
                        placeholder="Enter NOD days"
                      />
                    ) : (
                      <div className="p-2 bg-blue-50 rounded-md">
                        <span className="font-medium">{variation.nod_days || 0} days</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <Checkbox
                      id="requires_eot"
                      checked={editData.requires_eot || false}
                      onCheckedChange={(checked) => handleInputChange('requires_eot', checked)}
                    />
                  ) : (
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      variation.requires_eot ? 'bg-green-600 border-green-600' : 'border-gray-300'
                    }`}>
                      {variation.requires_eot && <span className="text-white text-xs">✓</span>}
                    </div>
                  )}
                  <Label htmlFor="requires_eot" className="font-medium">
                    Requires Extension of Time (EOT)
                  </Label>
                </div>
                
                {(isEditing ? editData.requires_eot : variation.requires_eot) && (
                  <div>
                    <Label>EOT Days</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.eot_days || 0}
                        onChange={(e) => handleInputChange('eot_days', parseInt(e.target.value) || 0)}
                        placeholder="Enter EOT days"
                      />
                    ) : (
                      <div className="p-2 bg-green-50 rounded-md">
                        <span className="font-medium">{variation.eot_days || 0} days</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                placeholder="Enter variation description..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-md">
                {variation.description}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Justification */}
        <Card>
          <CardHeader>
            <CardTitle>Justification</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.justification}
                onChange={(e) => handleInputChange('justification', e.target.value)}
                rows={3}
                placeholder="Enter justification for this variation..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-md">
                {variation.justification}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Submitted:</span>
                <span>{variation.request_date}</span>
              </div>
              
              {variation.requested_by && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Submitted by:</span>
                  <span>{variation.requested_by}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default VariationDetailsTab;
