
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Unlock, Loader2 } from 'lucide-react';

interface UnlockVariationSectionProps {
  showUnlockActions: boolean;
  variation: any;
  isProjectManager: boolean;
  unlockReason: string;
  setUnlockReason: (value: string) => void;
  unlockTargetStatus: 'draft';
  setUnlockTargetStatus: (value: 'draft') => void;
  isSubmitting: boolean;
  onUnlock: () => void;
}

const UnlockVariationSection: React.FC<UnlockVariationSectionProps> = ({
  showUnlockActions,
  variation,
  isProjectManager,
  unlockReason,
  setUnlockReason,
  unlockTargetStatus,
  setUnlockTargetStatus,
  isSubmitting,
  onUnlock
}) => {
  if (!showUnlockActions) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <h4 className="font-medium mb-2 text-orange-700 flex items-center gap-2">
        <Unlock className="h-5 w-5" />
        Unlock {variation.status === 'approved' ? 'Approved' : 'Rejected'} Variation
        {isProjectManager && " (Project Manager Override)"}
      </h4>
      
      <div className="bg-orange-100 p-3 rounded-lg mb-4">
        <p className="text-sm text-orange-800">
          <strong>Warning:</strong> This will unlock the {variation.status} variation and revert it to draft status. 
          The variation can then be edited and resubmitted. This action creates an audit trail.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="unlock-target">Revert To</Label>
          <Select value={unlockTargetStatus} onValueChange={(value: 'draft') => setUnlockTargetStatus(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (Editable)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unlock-reason">Unlock Reason *</Label>
          <Textarea
            id="unlock-reason"
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            placeholder="Explain why you are unlocking this variation..."
            rows={3}
          />
        </div>
      </div>

      <Button 
        onClick={onUnlock}
        disabled={isSubmitting || !unlockReason.trim()}
        variant="outline"
        className="border-orange-500 text-orange-700 hover:bg-orange-50"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Unlock className="h-4 w-4 mr-2" />
        )}
        {isSubmitting ? 'Processing...' : 'Unlock & Revert to Draft'}
      </Button>
    </div>
  );
};

export default UnlockVariationSection;
