
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';

interface EditConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variationStatus: string;
  variationNumber: string;
}

const EditConfirmationDialog: React.FC<EditConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  variationStatus,
  variationNumber
}) => {
  const [understood, setUnderstood] = React.useState(false);

  const handleClose = () => {
    setUnderstood(false);
    onClose();
  };

  const handleConfirm = () => {
    if (understood) {
      onConfirm();
      handleClose();
    }
  };

  const getStatusBadge = () => {
    if (variationStatus === 'approved') {
      return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
    }
    if (variationStatus === 'rejected') {
      return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
    }
    return <Badge variant="outline">{variationStatus}</Badge>;
  };

  const getWarningMessage = () => {
    if (variationStatus === 'approved') {
      return "This variation is currently approved. Editing will revert it to pending approval status and require re-approval.";
    }
    if (variationStatus === 'rejected') {
      return "This variation is currently rejected. Editing will revert it to pending approval status and require fresh approval.";
    }
    return "This variation will be locked for editing after you save changes.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Edit Action
          </DialogTitle>
          <DialogDescription>
            You are about to edit variation {variationNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            {getStatusBadge()}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Consequences:</p>
                <p>{getWarningMessage()}</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• All changes will be tracked in audit history</li>
                  <li>• Previous approvals will be invalidated</li>
                  <li>• Re-approval will be required before implementation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <label
              htmlFor="understand"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand the consequences and want to proceed
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!understood}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Proceed with Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditConfirmationDialog;
