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
import { AlertTriangle, Info, ArrowDown, RefreshCw } from 'lucide-react';

interface StatusChangeWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variationStatus: string;
  variationNumber: string;
}

const StatusChangeWarningDialog: React.FC<StatusChangeWarningDialogProps> = ({
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
    if (variationStatus === 'pending_approval') {
      return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Approval</Badge>;
    }
    return <Badge variant="outline">{variationStatus}</Badge>;
  };

  const getWarningMessage = () => {
    if (variationStatus === 'approved') {
      return "This variation is currently approved. Making changes will automatically revert it to 'Pending Approval' status and invalidate the current approval.";
    }
    if (variationStatus === 'rejected') {
      return "This variation is currently rejected. Making changes will automatically revert it to 'Pending Approval' status and require fresh approval.";
    }
    if (variationStatus === 'pending_approval') {
      return "This variation is pending approval. Only authorized users can make changes while maintaining workflow status.";
    }
    return "Making changes will affect the variation status and workflow.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Status Change Warning
          </DialogTitle>
          <DialogDescription>
            Editing variation {variationNumber} will change its status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">After Changes:</span>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 text-amber-500" />
              <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Approval</Badge>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Consequences:</p>
                <p>{getWarningMessage()}</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• All field changes will be tracked in audit history</li>
                  <li>• Current approval status will be invalidated</li>
                  <li>• Re-approval will be required before implementation</li>
                  <li>• Workflow will reset to pending approval state</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`border-2 rounded-lg p-4 transition-all duration-300 ${
            understood 
              ? 'border-green-200 bg-green-50' 
              : 'border-blue-200 bg-blue-50 animate-pulse'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="understand-status"
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
                  htmlFor="understand-status"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I understand the status change consequences and want to proceed
                </label>
                {!understood && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ← Please acknowledge to continue with editing
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeWarningDialog;