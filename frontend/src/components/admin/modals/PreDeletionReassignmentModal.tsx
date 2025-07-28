import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { AlertTriangle, Users, Building2 } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Team, SubTeam, User } from '../../../types/admin';
import { toast } from 'sonner';

interface PreDeletionReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: Team | null;
  loading?: boolean;
}

interface ReassignmentState {
  subTeams: Array<{
    subTeam: SubTeam;
    newParentTeamId: number | null;
    hasConflict?: boolean;
    suggestedName?: string;
  }>;
  teamMembers: Array<{
    user: User;
    newTeamId: number | null;
  }>;
}

export const PreDeletionReassignmentModal: React.FC<PreDeletionReassignmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  team,
  loading = false
}) => {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [reassignmentState, setReassignmentState] = useState<ReassignmentState>({
    subTeams: [],
    teamMembers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    if (isOpen && team) {
      loadReassignmentData();
    }
  }, [isOpen, team]);

  const loadReassignmentData = async () => {
    if (!team) return;

    setIsLoading(true);
    try {
      // Load available teams (excluding the current team)
      const [teamsResponse, subTeamsResponse, membersResponse] = await Promise.all([
        adminService.getAllTeams(false),
        adminService.getAllSubTeams(team.id, false),
        adminService.getTeamMembers(team.id)
      ]);

      if (teamsResponse.success) {
        // Filter out the current team and inactive teams
        const filteredTeams = teamsResponse.data?.filter(t => t.id !== team.id && t.isActive) || [];
        setAvailableTeams(filteredTeams);
      }

      if (subTeamsResponse.success && membersResponse.success) {
        setReassignmentState({
          subTeams: (subTeamsResponse.data || []).map(subTeam => ({
            subTeam,
            newParentTeamId: null,
            hasConflict: false,
            suggestedName: undefined
          })),
          teamMembers: (membersResponse.data || []).map(user => ({
            user,
            newTeamId: null
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

  const generateUniqueSubTeamName = (originalName: string, existingNames: string[], sourceTeamName: string): string => {
    const baseNames = [
      `${originalName} (from ${sourceTeamName})`,
      `${originalName} - ${sourceTeamName}`,
      `${sourceTeamName} - ${originalName}`,
      `${originalName} (Moved)`,
      `${originalName} (Relocated)`
    ];

    // Try base names first
    for (const baseName of baseNames) {
      if (!existingNames.some(existing => existing.toLowerCase() === baseName.toLowerCase())) {
        return baseName;
      }
    }

    // If all base names are taken, add a number suffix
    let counter = 1;
    let candidateName = `${originalName} (from ${sourceTeamName})`;
    
    while (existingNames.some(existing => existing.toLowerCase() === candidateName.toLowerCase())) {
      candidateName = `${originalName} (from ${sourceTeamName}) ${counter}`;
      counter++;
      
      // Safety check to prevent infinite loop
      if (counter > 100) {
        candidateName = `${originalName} ${Date.now()}`;
        break;
      }
    }

    return candidateName;
  };

  const updateSubTeamReassignment = async (subTeamId: number, newParentTeamId: number) => {
    // Check for naming conflicts
    const targetTeam = availableTeams.find(t => t.id === newParentTeamId);
    const currentSubTeam = reassignmentState.subTeams.find(item => item.subTeam.id === subTeamId);
    
    if (!targetTeam || !currentSubTeam) return;

    // Get existing sub-teams in the target team to check for conflicts
    try {
      const existingSubTeamsResponse = await adminService.getAllSubTeams(newParentTeamId, false);
      const existingSubTeams = existingSubTeamsResponse.success ? existingSubTeamsResponse.data : [];
      const existingNames = existingSubTeams.map(st => st.name);
      
      const hasConflict = existingNames.some(existing => 
        existing.toLowerCase() === currentSubTeam.subTeam.name.toLowerCase()
      );

      const suggestedName = hasConflict 
        ? generateUniqueSubTeamName(currentSubTeam.subTeam.name, existingNames, team?.name || 'Unknown')
        : undefined;

      setReassignmentState(prev => ({
        ...prev,
        subTeams: prev.subTeams.map(item =>
          item.subTeam.id === subTeamId
            ? { ...item, newParentTeamId, hasConflict, suggestedName }
            : item
        )
      }));
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      // Still allow the assignment but without conflict detection
      setReassignmentState(prev => ({
        ...prev,
        subTeams: prev.subTeams.map(item =>
          item.subTeam.id === subTeamId
            ? { ...item, newParentTeamId, hasConflict: false, suggestedName: undefined }
            : item
        )
      }));
    }
  };

  const updateUserReassignment = (userId: string, newTeamId: number) => {
    setReassignmentState(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map(item =>
        item.user.id === userId
          ? { ...item, newTeamId }
          : item
      )
    }));
  };

  const isReassignmentComplete = () => {
    const allSubTeamsReassigned = reassignmentState.subTeams.every(item => item.newParentTeamId !== null);
    const allMembersReassigned = reassignmentState.teamMembers.every(item => item.newTeamId !== null);
    return allSubTeamsReassigned && allMembersReassigned;
  };

  const handleReassignAndDelete = async () => {
    if (!team || !isReassignmentComplete()) return;

    setIsReassigning(true);
    try {
      // Reassign sub-teams (with renaming if there are conflicts)
      for (const item of reassignmentState.subTeams) {
        if (item.newParentTeamId) {
          console.log('Processing sub-team:', item.subTeam.name, 'to team:', item.newParentTeamId);
          
          let updateData: any = {
            teamId: item.newParentTeamId
          };
          
          // Always provide a new name if there's a detected conflict
          if (item.hasConflict) {
            // Use suggested name or generate a guaranteed unique one
            const safeName = item.suggestedName || `${item.subTeam.name}_moved_${Date.now()}`;
            updateData.name = safeName;
            console.log('Using safe name due to conflict:', safeName);
          }
          
          try {
            await adminService.updateSubTeam(item.subTeam.id, updateData);
            console.log('Successfully updated sub-team:', item.subTeam.id);
          } catch (subTeamError: any) {
            console.error('Failed to update sub-team:', item.subTeam.name, 'Error:', subTeamError.message);
            
            // Final fallback - always provide a unique name on conflict error
            if (subTeamError.message.includes('Sub-team name already exists')) {
              const fallbackName = `${item.subTeam.name}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
              console.log('Using ultimate fallback name:', fallbackName);
              
              await adminService.updateSubTeam(item.subTeam.id, {
                teamId: item.newParentTeamId,
                name: fallbackName
              });
              console.log('Successfully updated with fallback name');
            } else {
              throw subTeamError;
            }
          }
        }
      }

      // Reassign team members
      for (const item of reassignmentState.teamMembers) {
        if (item.newTeamId) {
          console.log('Processing team member:', item.user.name, 'to team:', item.newTeamId);
          await adminService.updateUser(item.user.id, {
            teamId: item.newTeamId
          });
          console.log('Successfully updated team member:', item.user.id);
        }
      }

      // Now delete the team
      console.log('Deleting team:', team.id);
      await adminService.deleteTeam(team.id);
      console.log('Successfully deleted team');
      
      toast.success('Team deleted successfully after reassigning all members');
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Error during reassignment and deletion:', error);
      toast.error(error.message || 'Failed to reassign and delete team');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleClose = () => {
    setReassignmentState({
      subTeams: [],
      teamMembers: []
    });
    onClose();
  };

  if (!team) return null;

  const hasSubTeams = reassignmentState.subTeams.length > 0;
  const hasMembers = reassignmentState.teamMembers.length > 0;
  const hasItemsToReassign = hasSubTeams || hasMembers;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <span>Reassign Before Deleting Team</span>
          </DialogTitle>
          <DialogDescription>
            You must reassign all sub-teams and team members before deleting "{team.name}".
            This ensures no data is lost and all members have a new parent team.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !hasItemsToReassign ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 mb-4">
              This team has no sub-teams or members to reassign. You can proceed with deletion.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Team'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sub-Teams Section */}
            {hasSubTeams && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Sub-Teams ({reassignmentState.subTeams.length})</span>
                </h3>
                <div className="space-y-3">
                  {reassignmentState.subTeams.map((item) => (
                    <div key={item.subTeam.id} className={`p-3 border rounded-lg ${item.hasConflict ? 'border-amber-300 bg-amber-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.subTeam.name}</p>
                          {item.subTeam.description && (
                            <p className="text-sm text-gray-600">{item.subTeam.description}</p>
                          )}
                          {item.hasConflict && item.suggestedName && (
                            <div className="mt-2 p-2 bg-amber-100 rounded text-sm">
                              <p className="text-amber-800 font-medium">⚠️ Name conflict detected!</p>
                              <p className="text-amber-700">
                                A sub-team with this name already exists in the target team. 
                                It will be renamed to: <strong>"{item.suggestedName}"</strong>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="w-64 ml-4">
                          <Label htmlFor={`subteam-${item.subTeam.id}`} className="text-sm font-medium">
                            New Parent Team
                          </Label>
                          <Select
                            value={item.newParentTeamId?.toString() || ""}
                            onValueChange={(value) => updateSubTeamReassignment(item.subTeam.id, parseInt(value))}
                          >
                            <SelectTrigger id={`subteam-${item.subTeam.id}`} className={item.hasConflict ? 'border-amber-300' : ''}>
                              <SelectValue placeholder="Select new parent team" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTeams.map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.name}
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
            )}

            {/* Team Members Section */}
            {hasMembers && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Team Members ({reassignmentState.teamMembers.length})</span>
                </h3>
                <div className="space-y-3">
                  {reassignmentState.teamMembers.map((item) => (
                    <div key={item.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.user.name}</p>
                        <p className="text-sm text-gray-600">{item.user.email}</p>
                        {item.user.position && (
                          <p className="text-xs text-gray-500">{item.user.position.name}</p>
                        )}
                      </div>
                      <div className="w-64">
                        <Label htmlFor={`user-${item.user.id}`} className="text-sm font-medium">
                          New Team
                        </Label>
                        <Select
                          value={item.newTeamId?.toString() || ""}
                          onValueChange={(value) => updateUserReassignment(item.user.id, parseInt(value))}
                        >
                          <SelectTrigger id={`user-${item.user.id}`}>
                            <SelectValue placeholder="Select new team" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeams.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

export default PreDeletionReassignmentModal;
