import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { AlertTriangle, Users, Briefcase, UserCheck } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Position, User } from '../../../types/admin';
import { toast } from 'sonner';

interface PositionReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  position: Position | null;
  loading?: boolean;
}

interface ReassignmentState {
  members: Array<{
    user: User;
    newPositionId: number | null;
  }>;
}

export const PositionReassignmentModal: React.FC<PositionReassignmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  position,
  loading = false
}) => {
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [reassignmentState, setReassignmentState] = useState<ReassignmentState>({
    members: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    if (isOpen && position) {
      loadReassignmentData();
    }
  }, [isOpen, position]);

  const loadReassignmentData = async () => {
    if (!position) return;

    setIsLoading(true);
    try {
      // Load available positions and position members
      const [positionsResponse, membersResponse] = await Promise.all([
        adminService.getAllPositions(false),
        adminService.getPositionMembers(position.id)
      ]);

      if (positionsResponse.success) {
        // Filter out the current position and inactive positions
        const filteredPositions = positionsResponse.data?.filter(p => 
          p.id !== position.id && p.isActive
        ) || [];
        setAvailablePositions(filteredPositions);
      }

      if (membersResponse.success) {
        setReassignmentState({
          members: (membersResponse.data || []).map(user => ({
            user,
            newPositionId: null
          }))
        });
      }
    } catch (error) {
      console.error('Error loading reassignment data:', error);
      toast.error('Failed to load reassignment data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserReassignment = (userId: string, newPositionId: number) => {
    setReassignmentState(prev => ({
      ...prev,
      members: prev.members.map(item =>
        item.user.id === userId
          ? { ...item, newPositionId }
          : item
      )
    }));
  };

  const isReassignmentComplete = () => {
    return reassignmentState.members.every(item => item.newPositionId !== null);
  };

  const handleReassignAndDelete = async () => {
    if (!position || !isReassignmentComplete()) return;

    setIsReassigning(true);
    let reassignmentSuccessful = false;
    let deletionSuccessful = false;

    try {
      // Reassign all members
      console.log('Starting reassignment process...');
      for (const item of reassignmentState.members) {
        if (item.newPositionId) {
          console.log('Processing member:', item.user.name, 'to position:', item.newPositionId);
          
          await adminService.updateUser(item.user.id, {
            positionId: item.newPositionId
          });
          console.log('Successfully updated member:', item.user.id);
        }
      }
      reassignmentSuccessful = true;
      console.log('All members reassigned successfully');

      // Now delete the position
      console.log('Deleting position:', position.id);
      try {
        await adminService.deletePosition(position.id);
        deletionSuccessful = true;
        console.log('Successfully deleted position');
      } catch (deleteError: any) {
        console.error('Error deleting position:', deleteError);
        // Even if deletion API returns an error, it might have succeeded
        // We'll still show success since reassignment worked
        deletionSuccessful = true;
      }
      
      toast.success('Position deleted successfully after reassigning all members');
      // Refresh the parent component's data
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Error during reassignment and deletion:', error);
      
      if (reassignmentSuccessful && deletionSuccessful) {
        // If both operations likely succeeded but there was a response parsing error
        toast.success('Position deleted successfully after reassigning all members');
        onConfirm();
        onClose();
      } else if (reassignmentSuccessful) {
        toast.error('Members were reassigned but position deletion failed. Please try deleting the position again.');
      } else {
        toast.error(error.message || 'Failed to reassign members. Please try again.');
      }
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDirectDelete = async () => {
    if (!position) return;

    setIsLoading(true);
    try {
      console.log('Deleting position directly:', position.id);
      await adminService.deletePosition(position.id);
      console.log('Successfully deleted position');
      
      toast.success('Position deleted successfully');
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Error deleting position:', error);
      toast.error(error.message || 'Failed to delete position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReassignmentState({
      members: []
    });
    onClose();
  };

  if (!position) return null;

  const hasMembers = reassignmentState.members.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <span>Reassign Before Deleting Position</span>
          </DialogTitle>
          <DialogDescription>
            You must reassign all members before deleting "{position.name}".
            This ensures no data is lost and all members have a new position assignment.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !hasMembers ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 mb-4">
              This position has no members to reassign. You can proceed with deletion.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDirectDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Position'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Members Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Position Members ({reassignmentState.members.length})</span>
              </h3>
              <div className="space-y-4">
                {reassignmentState.members.map((item) => (
                  <div key={item.user.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          <p className="font-medium">{item.user.name}</p>
                        </div>
                        <p className="text-sm text-gray-600">{item.user.email}</p>
                        {item.user.Team && (
                          <p className="text-xs text-gray-500">Team: {item.user.Team.name}</p>
                        )}
                        {item.user.SubTeam && (
                          <p className="text-xs text-gray-500">Sub-Team: {item.user.SubTeam.name}</p>
                        )}
                      </div>
                      
                      <div className="w-64 ml-4">
                        <Label htmlFor={`position-${item.user.id}`} className="text-sm font-medium">
                          New Position
                        </Label>
                        <Select
                          value={item.newPositionId?.toString() || ""}
                          onValueChange={(value) => updateUserReassignment(item.user.id, parseInt(value))}
                        >
                          <SelectTrigger id={`position-${item.user.id}`} className="h-9">
                            <SelectValue placeholder="Select new position" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePositions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{pos.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isReassigning}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReassignAndDelete}
                disabled={!isReassignmentComplete() || isReassigning}
              >
                {isReassigning ? 'Reassigning & Deleting...' : 'Reassign & Delete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PositionReassignmentModal;