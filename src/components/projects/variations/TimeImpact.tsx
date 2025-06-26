
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeImpactProps {
  formData: {
    requires_eot: boolean;
    requires_nod: boolean;
    eot_days: number;
    nod_days: number;
  };
  onInputChange: (field: string, value: any) => void;
}

const TimeImpact: React.FC<TimeImpactProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Impact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requires_eot"
              checked={formData.requires_eot}
              onChange={(e) => onInputChange('requires_eot', e.target.checked)}
            />
            <Label htmlFor="requires_eot">Requires Extension of Time (EOT)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requires_nod"
              checked={formData.requires_nod}
              onChange={(e) => onInputChange('requires_nod', e.target.checked)}
            />
            <Label htmlFor="requires_nod">Requires Notice of Delay (NOD)</Label>
          </div>
        </div>

        {(formData.requires_eot || formData.requires_nod) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.requires_eot && (
              <div>
                <Label htmlFor="eot_days">EOT Days</Label>
                <Input
                  id="eot_days"
                  type="number"
                  value={formData.eot_days}
                  onChange={(e) => onInputChange('eot_days', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            )}
            {formData.requires_nod && (
              <div>
                <Label htmlFor="nod_days">NOD Days</Label>
                <Input
                  id="nod_days"
                  type="number"
                  value={formData.nod_days}
                  onChange={(e) => onInputChange('nod_days', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeImpact;
