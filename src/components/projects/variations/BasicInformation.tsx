
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategorySelector from './CategorySelector';
import SmartTradeSelector from './SmartTradeSelector';

interface BasicInformationProps {
  formData: {
    title: string;
    description: string;
    location: string;
    category: string;
    trade: string;
    priority: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Variation Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              required
              placeholder="Enter variation title"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => onInputChange('location', e.target.value)}
              placeholder="Enter location"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            rows={3}
            required
            placeholder="Describe the variation work"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Category</Label>
            <CategorySelector
              value={formData.category}
              onChange={(value) => onInputChange('category', value)}
              selectedTrade={formData.trade}
            />
          </div>
          <div>
            <Label>Trade</Label>
            <SmartTradeSelector
              value={formData.trade}
              onChange={(value) => onInputChange('trade', value)}
              description={formData.description}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => onInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInformation;
