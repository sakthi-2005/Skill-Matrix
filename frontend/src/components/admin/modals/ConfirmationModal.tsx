import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { AlertTriangle, Trash2, PowerOff } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  type: 'delete' | 'deactivate' | 'activate';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  type,
  loading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'deactivate':
        return <PowerOff className="h-6 w-6 text-red-600" />;
      case 'activate':
        return <PowerOff className="h-6 w-6 text-green-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'delete':
      case 'deactivate':
        return 'destructive';
      case 'activate':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'delete':
        return '';
      case 'deactivate':
        return 'text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50';
      case 'activate':
        return 'text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={onConfirm}
            disabled={loading}
            className={getButtonVariant() === 'outline' ? getButtonClass() : ''}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};