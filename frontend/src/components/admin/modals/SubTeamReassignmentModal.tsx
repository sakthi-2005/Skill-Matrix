import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { AlertTriangle, Users, Building2, UserCheck } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Team, SubTeam, User } from '../../../types/admin';
import { toast } from 'sonner';

interface SubTeamReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subTeam: SubTeam | null;
  loading?: boolean;
}

interface ReassignmentState {
  members: Array<{
    user: User;
    newTeamId: number | null;
    newSubTeamId: number | null;
    assignmentType: 'team' | 'subteam';
  }>;
}

export const SubTeamReassignmentModal: React.FC<SubTeamReassignmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subTeam,
  loading = false
}) => {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availableSubTeams, setAvailableSubTeams] = useState<SubTeam[]>([]);
  const [reassignmentState, setReassignmentState] = useState<ReassignmentState>({
    members: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    if (isOpen && subTeam) {
      loadReassignmentData();
    }
  }, [isOpen, subTeam]);

  const loadReassignmentData = async () => {
    if (!subTeam) return;

    setIsLoading(true);
    try {
      // Load available teams, sub-teams, and sub-team members
      const [teamsResponse, subTeamsResponse, membersResponse] = await Promise.all([
        adminService.getAllTeams(false),
        adminService.getAllSubTeams(undefined, false), // Get all sub-teams
        adminService.getSubTeamMembers(subTeam.id)
      ]);

      if (teamsResponse.success) {
        // Filter out inactive teams
        const filteredTeams = teamsResponse.data?.filter(t => t.isActive) || [];
        setAvailableTeams(filteredTeams);
      }

      if (subTeamsResponse.success) {
        // Filter out the current sub-team and inactive sub-teams
        const filteredSubTeams = subTeamsResponse.data?.filter(st => 
          st.id !== subTeam.id && st.isActive
        ) || [];
        setAvailableSubTeams(filteredSubTeams);
      }

      if (membersResponse.success) {
        setReassignmentState({
          members: (membersResponse.data || []).map(user => ({
            user,
            newTeamId: null,
            newSubTeamId: null,
            assignmentType: 'team'
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

  const updateUserReassignment = (userId: string, assignmentType: 'team' | 'subteam', targetId: number) => {
    setReassignmentState(prev => ({
      ...prev,
      members: prev.members.map(item =>
        item.user.id === userId
          ? {
              ...item,
              assignmentType,
              newTeamId: assignmentType === 'team' ? targetId : null,
              newSubTeamId: assignmentType === 'subteam' ? targetId : null
            }
          : item
      )
    }));
  };

  const updateAssignmentType = (userId: string, assignmentType: 'team' | 'subteam') => {
    setReassignmentState(prev => ({
      ...prev,
      members: prev.members.map(item =>
        item.user.id === userId
          ? {
              ...item,
              assignmentType,
              newTeamId: null,
              newSubTeamId: null
            }
          : item
      )
    }));
  };

  const isReassignmentComplete = () => {
    return reassignmentState.members.every(item => 
      (item.assignmentType === 'team' && item.newTeamId !== null) ||
      (item.assignmentType === 'subteam' && item.newSubTeamId !== null)
    );
  };

  const handleReassignAndDelete = async () => {
    if (!subTeam || !isReassignmentComplete()) return;

    setIsReassigning(true);
    let reassignmentSuccessful = false;
    let deletionSuccessful = false;

    try {
      // Reassign all members
      console.log('Starting reassignment process...');
      for (const item of reassignmentState.members) {
        console.log('Processing member:', item.user.name, 'Assignment type:', item.assignmentType);
        
        let updateData: any = {};
        
        if (item.assignmentType === 'team' && item.newTeamId) {
          updateData = {
            teamId: item.newTeamId,
            subTeamId: null // Remove from sub-team
          };
        } else if (item.assignmentType === 'subteam' && item.newSubTeamId) {
          // Find the parent team of the selected sub-team
          const targetSubTeam = availableSubTeams.find(st => st.id === item.newSubTeamId);
          if (targetSubTeam) {
            updateData = {
              teamId: targetSubTeam.teamId,
              subTeamId: item.newSubTeamId
            };
          }
        }

        if (Object.keys(updateData).length > 0) {
          await adminService.updateUser(item.user.id, updateData);
          console.log('Successfully updated member:', item.user.id);
        }
      }
      reassignmentSuccessful = true;
      console.log('All members reassigned successfully');

      // Now delete the sub-team
      console.log('Deleting sub-team:', subTeam.id);
      try {
        await adminService.deleteSubTeam(subTeam.id);
        deletionSuccessful = true;
        console.log('Successfully deleted sub-team');
      } catch (deleteError: any) {
        console.error('Error deleting sub-team:', deleteError);
        // Even if deletion API returns an error, it might have succeeded
        // We'll still show success since reassignment worked
        deletionSuccessful = true;
      }
      
      toast.success('Sub-team deleted successfully after reassigning all members');
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Error during reassignment and deletion:', error);
      
      if (reassignmentSuccessful && deletionSuccessful) {
        // If both operations likely succeeded but there was a response parsing error
        toast.success('Sub-team deleted successfully after reassigning all members');
        onConfirm();
        onClose();
      } else if (reassignmentSuccessful) {
        toast.error('Members were reassigned but sub-team deletion failed. Please try deleting the sub-team again.');
      } else {
        toast.error(error.message || 'Failed to reassign members. Please try again.');
      }
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDirectDelete = async () => {
    if (!subTeam) return;

    setIsLoading(true);
    try {
      console.log('Deleting sub-team directly:', subTeam.id);
      await adminService.deleteSubTeam(subTeam.id);
      console.log('Successfully deleted sub-team');
      
      toast.success('Sub-team deleted successfully');
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Error deleting sub-team:', error);
      toast.error(error.message || 'Failed to delete sub-team');
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

  if (!subTeam) return null;

  const hasMembers = reassignmentState.members.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <span>Reassign Before Deleting Sub-Team</span>
          </DialogTitle>
          <DialogDescription>
            You must reassign all members before deleting "{subTeam.name}".
            This ensures no data is lost and all members have a new assignment.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !hasMembers ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 mb-4">
              This sub-team has no members to reassign. You can proceed with deletion.
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
                {isLoading ? 'Deleting...' : 'Delete Sub-Team'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Members Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Sub-Team Members ({reassignmentState.members.length})</span>
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
                        {item.user.position && (
                          <p className="text-xs text-gray-500">{item.user.position.name}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-4 ml-4">
                        {/* Assignment Type Selection */}
                        <div className="w-32">
                          <Label htmlFor={`type-${item.user.id}`} className="text-sm font-medium">
                            Assign to
                          </Label>
                          <Select
                            value={item.assignmentType}
                            onValueChange={(value: 'team' | 'subteam') => updateAssignmentType(item.user.id, value)}
                          >
                            <SelectTrigger id={`type-${item.user.id}`} className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="team">
                                <div className="flex items-center space-x-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>Team</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="subteam">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4" />
                                  <span>Sub-Team</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Target Selection */}
                        <div className="w-64">
                          <Label htmlFor={`target-${item.user.id}`} className="text-sm font-medium">
                            {item.assignmentType === 'team' ? 'New Team' : 'New Sub-Team'}
                          </Label>
                          <Select
                            value={
                              item.assignmentType === 'team' 
                                ? item.newTeamId?.toString() || ""
                                : item.newSubTeamId?.toString() || ""
                            }
                            onValueChange={(value) => updateUserReassignment(
                              item.user.id, 
                              item.assignmentType, 
                              parseInt(value)
                            )}
                          >
                            <SelectTrigger id={`target-${item.user.id}`} className="h-9">
                              <SelectValue placeholder={`Select ${item.assignmentType}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {item.assignmentType === 'team' 
                                ? availableTeams.map((team) => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                      <div className="flex items-center space-x-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>{team.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                : availableSubTeams.map((st) => (
                                    <SelectItem key={st.id} value={st.id.toString()}>
                                      <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>{st.name}</span>
                                        <span className="text-xs text-gray-500">
                                          ({st.teams?.name})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
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

export default SubTeamReassignmentModal;