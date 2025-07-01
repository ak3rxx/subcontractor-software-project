
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
import { AlertTriangle, Info, ArrowDown } from 'lucide-react';

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

          {/* Enhanced Confirmation Section */}
          <div className={`border-2 rounded-lg p-4 transition-all duration-300 ${
            understood 
              ? 'border-green-200 bg-green-50' 
              : 'border-blue-200 bg-blue-50 animate-pulse'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="understand"
                  checked={understood}
                  onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                  className={`transition-all duration-200 ${
                    !understood ? 'border-blue-500 data-[state=unchecked]:border-blue-500' : ''
                  }`}
                />
                {!understood && (
                  <ArrowDown className="h-4 w-4 text-blue-500 animate-bounce" />
                )}
              </div>
              <div className="flex-1">
                <label
                  htmlFor="understand"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I understand the consequences and want to proceed
                </label>
                {!understood && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ← Please check this box to enable the confirm button
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <div className="relative">
            <Button
              onClick={handleConfirm}
              disabled={!understood}
              className={`transition-all duration-300 ${
                understood 
                  ? 'bg-amber-600 hover:bg-amber-700 scale-105 shadow-lg' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {understood ? '✓ ' : '⏳ '}Proceed with Edit
            </Button>
            {!understood && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                Check the confirmation box first
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditConfirmationDialog;
