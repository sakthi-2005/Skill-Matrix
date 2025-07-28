import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { AlertTriangle, Users, Building } from 'lucide-react';
import { Team, SubTeam, User } from '../../../types/admin';
import { adminService } from '../../../services/adminService';
import { userService } from '../../../services/api';
import { toast } from 'sonner';

interface TeamReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: Team | null;
  actionType: 'delete' | 'deactivate';
  loading: boolean;
}

interface ReassignmentData {
  subTeams: Array<{ subTeamId: number; newTeamId: number | null }>;
  users: Array<{ userId: string; newTeamId: number | null; newSubTeamId: number | null }>;
}

export const TeamReassignmentModal: React.FC<TeamReassignmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  team,
  actionType,
  loading
}) => {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availableSubTeams, setAvailableSubTeams] = useState<SubTeam[]>([]);
  const [teamDetails, setTeamDetails] = useState<Team | null>(null);
  const [reassignmentData, setReassignmentData] = useState<ReassignmentData>({
    subTeams: [],
    users: []
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load team details and available teams when modal opens
  useEffect(() => {
    if (isOpen && team) {
      loadTeamDetails();
      loadAvailableTeams();
    }
  }, [isOpen, team]);

  const loadTeamDetails = async () => {
    if (!team) return;
    
    setIsLoadingDetails(true);
    try {
      const response = await adminService.getTeamById(team.id);
      const details = response.data;
      if (!details) {
        throw new Error('No team data received');
      }
      setTeamDetails(details);
      
      // Initialize reassignment data
      const subTeamsData = details.subteam?.map(subTeam => ({
        subTeamId: subTeam.id,
        newTeamId: null
      })) || [];
      
      const usersData = details.user?.map(user => ({
        userId: user.id,
        newTeamId: null,
        newSubTeamId: null
      })) || [];

      setReassignmentData({
        subTeams: subTeamsData,
        users: usersData
      });
    } catch (error: any) {
      toast.error('Failed to load team details');
      console.error('Error loading team details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadAvailableTeams = async () => {
    try {
      const response = await adminService.getAllTeams(false);
      const teams = response.data || [];
      // Filter out the current team
      const filteredTeams = teams.filter(t => t.id !== team?.id && t.isActive);
      setAvailableTeams(filteredTeams);
    } catch (error: any) {
      toast.error('Failed to load available teams');
      console.error('Error loading teams:', error);
    }
  };

  const loadSubTeamsForTeam = async (teamId: number) => {
    try {
      const response = await adminService.getAllSubTeams(teamId, false);
      const subTeams = response.data || [];
      return subTeams.filter(st => st.teamId === teamId && st.isActive);
    } catch (error: any) {
      console.error('Error loading sub-teams:', error);
      return [];
    }
  };

  const handleSubTeamReassignment = (subTeamId: number, newTeamId: string) => {
    const teamId = newTeamId ? parseInt(newTeamId) : null;
    setReassignmentData(prev => ({
      ...prev,
      subTeams: prev.subTeams.map(st => 
        st.subTeamId === subTeamId 
          ? { ...st, newTeamId: teamId }
          : st
      )
    }));
  };

  const handleUserReassignment = async (userId: string, newTeamId: string, newSubTeamId?: string) => {
    const teamId = newTeamId ? parseInt(newTeamId) : null;
    const subTeamId = newSubTeamId ? parseInt(newSubTeamId) : null;

    setReassignmentData(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.userId === userId 
          ? { ...user, newTeamId: teamId, newSubTeamId: subTeamId }
          : user
      )
    }));

    // Load sub-teams for the selected team
    if (teamId) {
      try {
        const subTeams = await loadSubTeamsForTeam(teamId);
        setAvailableSubTeams(subTeams);
      } catch (error) {
        console.error('Failed to load sub-teams for team:', error);
        setAvailableSubTeams([]);
      }
    } else {
      setAvailableSubTeams([]);
    }
  };

  const handleConfirmReassignment = async () => {
    setIsProcessing(true);
    try {
      // Process sub-team reassignments
      for (const subTeamReassignment of reassignmentData.subTeams) {
        if (subTeamReassignment.newTeamId) {
          await adminService.updateSubTeam(subTeamReassignment.subTeamId, {
            teamId: subTeamReassignment.newTeamId
          });
        }
      }

      // Process user reassignments
      for (const userReassignment of reassignmentData.users) {
        if (userReassignment.newTeamId) {
          await userService.updateUser({
            id: parseInt(userReassignment.userId),
            teamId: userReassignment.newTeamId,
            subTeamId: userReassignment.newSubTeamId || undefined
          });
        }
      }

      toast.success('Reassignments completed successfully');
      onConfirm(); // Proceed with the original action (delete/deactivate)
    } catch (error: any) {
      toast.error('Failed to complete reassignments');
      console.error('Error during reassignment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = () => {
    if (!hasItemsToReassign()) {
      return true; // No items to reassign, can proceed
    }

    // Check if all sub-teams have been reassigned (if any exist)
    const unassignedSubTeams = reassignmentData.subTeams.filter(st => !st.newTeamId);
    
    // Check if all users have been reassigned (if any exist)
    const unassignedUsers = reassignmentData.users.filter(user => !user.newTeamId);
    
    return unassignedSubTeams.length === 0 && unassignedUsers.length === 0;
  };

  const hasItemsToReassign = () => {
    return (teamDetails?.subteam && teamDetails.subteam.length > 0) || 
           (teamDetails?.user && teamDetails.user.length > 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Team Reassignment Required
          </DialogTitle>
          <DialogDescription>
            Before {actionType === 'delete' ? 'deleting' : 'deactivating'} the team "{team?.name}", 
            you need to reassign all sub-teams and members to other teams.
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="flex justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading team details...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {!hasItemsToReassign() ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  This team has no sub-teams or members to reassign. You can proceed with the {actionType}.
                </div>
              </div>
            ) : (
              <>
                {/* Sub-Teams Reassignment */}
                {teamDetails?.subteam && teamDetails.subteam.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building className="h-4 w-4" />
                        Sub-Teams ({teamDetails.subteam.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {teamDetails.subteam.map((subTeam) => (
                        <div key={subTeam.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{subTeam.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {subTeam.users?.length || 0} members
                            </div>
                          </div>
                          <div className="w-48">
                            <Label className="text-xs">Reassign to Team</Label>
                            <Select 
                              value={reassignmentData.subTeams.find(st => st.subTeamId === subTeam.id)?.newTeamId?.toString() || ""}
                              onValueChange={(value) => handleSubTeamReassignment(subTeam.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select team..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTeams.map((team) => (
                                  <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Users Reassignment */}
                {teamDetails?.user && teamDetails.user.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Team Members ({teamDetails.user.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {teamDetails.user.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex gap-2 w-96">
                            <div className="flex-1">
                              <Label className="text-xs">New Team</Label>
                              <Select 
                                value={reassignmentData.users.find(u => u.userId === user.id)?.newTeamId?.toString() || ""}
                                onValueChange={(value) => handleUserReassignment(user.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTeams.map((team) => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                      {team.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs">New Sub-Team (Optional)</Label>
                              <Select 
                                value={reassignmentData.users.find(u => u.userId === user.id)?.newSubTeamId?.toString() || ""}
                                onValueChange={(value) => handleUserReassignment(
                                  user.id, 
                                  reassignmentData.users.find(u => u.userId === user.id)?.newTeamId?.toString() || "", 
                                  value
                                )}
                                disabled={!reassignmentData.users.find(u => u.userId === user.id)?.newTeamId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sub-team..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No Sub-Team</SelectItem>
                                  {availableSubTeams.map((subTeam) => (
                                    <SelectItem key={subTeam.id} value={subTeam.id.toString()}>
                                      {subTeam.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isProcessing || loading}>
                Cancel
              </Button>
              <Button 
                onClick={hasItemsToReassign() ? handleConfirmReassignment : onConfirm}
                disabled={hasItemsToReassign() ? (!canProceed() || isProcessing) : loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? 'Processing...' : loading ? 'Processing...' : 
                 hasItemsToReassign() ? `Reassign & ${actionType === 'delete' ? 'Delete' : 'Deactivate'}` : 
                 actionType === 'delete' ? 'Delete Team' : 'Deactivate Team'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
