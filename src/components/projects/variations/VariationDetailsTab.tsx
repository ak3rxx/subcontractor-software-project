
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, User, Mail, Clock } from 'lucide-react';

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  );
};

export default VariationDetailsTab;
