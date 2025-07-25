import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Position } from '../../../types/admin';
import { 
  AlertTriangle, 
  Users, 
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  Mail,
  Building
} from 'lucide-react';

interface PositionActionModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  action: 'activate' | 'deactivate' | 'delete';
  availablePositions?: Position[];
  onConfirm: (positionId: number, newPositionId?: number) => void;
  loading?: boolean;
}

export const PositionActionModal: React.FC<PositionActionModalProps> = ({
  position,
  isOpen,
  onClose,
  action,
  availablePositions = [],
  onConfirm,
  loading = false
}) => {
  const [selectedNewPosition, setSelectedNewPosition] = useState<string>('');

  if (!position) return null;

  const hasUsers = position.user && position.user.length > 0;
  const userCount = position.user?.length || 0;

  const getActionConfig = () => {
    switch (action) {
      case 'activate':
        return {
          title: 'Activate Position',
          description: 'Are you sure you want to activate this position?',
          icon: <ToggleRight className="h-6 w-6 text-green-600" />,
          confirmText: 'Activate',
          confirmClass: 'bg-green-600 hover:bg-green-700',
          warningText: null
        };
      case 'deactivate':
        return {
          title: 'Deactivate Position',
          description: hasUsers 
            ? 'This position has users assigned to it. You need to reassign them before deactivating.'
            : 'Are you sure you want to deactivate this position?',
          icon: <ToggleLeft className="h-6 w-6 text-red-600" />,
          confirmText: 'Deactivate',
          confirmClass: 'bg-red-600 hover:bg-red-700',
          warningText: hasUsers ? 'Users must be reassigned before deactivation' : null
        };
      case 'delete':
        return {
          title: 'Delete Position',
          description: hasUsers 
            ? 'This position has users assigned to it. You need to reassign them before deleting.'
            : 'Are you sure you want to delete this position? This action cannot be undone.',
          icon: <Trash2 className="h-6 w-6 text-red-600" />,
          confirmText: 'Delete',
          confirmClass: 'bg-red-600 hover:bg-red-700',
          warningText: hasUsers ? 'Users must be reassigned before deletion' : 'This action cannot be undone'
        };
      default:
        return {
          title: '',
          description: '',
          icon: null,
          confirmText: '',
          confirmClass: '',
          warningText: null
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = () => {
    if (hasUsers && (action === 'deactivate' || action === 'delete')) {
      if (!selectedNewPosition) return;
      onConfirm(position.id, parseInt(selectedNewPosition));
    } else {
      onConfirm(position.id);
    }
  };

  const canConfirm = () => {
    if (action === 'activate') return true;
    if (!hasUsers) return true;
    return selectedNewPosition !== '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {config.icon}
            <span>{config.title}</span>
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Position Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{position.name}</h3>
                {position.description && (
                  <p className="text-sm text-gray-600 mt-1">{position.description}</p>
                )}
              </div>
              <Badge variant={position.isActive ? 'default' : 'secondary'}>
                {position.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Warning */}
          {config.warningText && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Warning</p>
                <p className="text-sm text-yellow-700 mt-1">{config.warningText}</p>
              </div>
            </div>
          )}

          {/* Users List */}
          {hasUsers && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-600" />
                <h4 className="font-medium">Assigned Users ({userCount})</h4>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2">
                {position.user?.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {user.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-medium text-sm">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.name}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.Team && (
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{user.Team.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Position Selection */}
              {(action === 'deactivate' || action === 'delete') && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                    <label className="font-medium text-sm">Reassign users to:</label>
                  </div>
                  
                  <Select value={selectedNewPosition} onValueChange={setSelectedNewPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position to reassign users" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePositions
                        .filter(p => p.id !== position.id && p.isActive)
                        .map((pos) => (
                          <SelectItem key={pos.id} value={pos.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{pos.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {pos.user?.length || 0} users
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm() || loading}
            className={config.confirmClass}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              config.confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};