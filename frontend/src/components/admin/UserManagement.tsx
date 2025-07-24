import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Search,
  Eye,
  EyeOff,
  Users,
  User,
  Power,
  PowerOff,
  Mail,
  Phone,
  Building,
  MapPin,
  Shield,
  Filter
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { userService, roleService, skillService, assessmentService } from '../../services/api';
import { toast } from 'sonner';
import { UserDetailModal } from './UserDetailModal';
import { ConfirmationModal } from './ConfirmationModal';

interface UserData {
  id: number;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  role?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
  };
  Team?: {
    id: number;
    name: string;
  };
  SubTeam?: {
    id: number;
    name: string;
  };
  lead?: {
    id: number;
    name: string;
    userId: string;
  };
  hr?: {
    id: number;
    name: string;
    userId: string;
  };
  leadId?: number;
  hrId?: number;
  roleId: number;
  positionId: number;
  teamId: number;
  subTeamId?: number;
  skills?: Array<{
    id: number;
    name: string;
    level: number;
    lastAssessed?: string;
  }>;
}

interface Team {
  id: number;
  name: string;
}

interface SubTeam {
  id: number;
  name: string;
  teamId: number;
}

interface Position {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface CreateUserRequest {
  userId: string;
  name: string;
  email?: string;
  roleId: number;
  positionId: number;
  teamId: number;
  subTeamId?: number;
  leadId?: number;
  hrId?: number;
  isActive?: boolean;
}

interface UserManagementProps {
  onStatsUpdate: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onStatsUpdate }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [potentialLeads, setPotentialLeads] = useState<UserData[]>([]);
  const [potentialHRs, setPotentialHRs] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'deactivate' | 'activate';
    user: UserData | null;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    user: null,
    loading: false
  });
  const [formData, setFormData] = useState<CreateUserRequest>({
    userId: '',
    name: '',
    email: '',
    roleId: 0,
    positionId: 0,
    teamId: 0,
    subTeamId: undefined,
    leadId: undefined,
    hrId: undefined,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, [showInactive, selectedTeamFilter, selectedPositionFilter, selectedRoleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, teamsResponse, subTeamsResponse, positionsResponse, rolesResponse] = await Promise.all([
        userService.getAllUsers({}), // Get all users
        adminService.getAllTeams(false),
        adminService.getAllSubTeams(undefined, false),
        adminService.getAllPositions(false),
        roleService.getAllRoles()
      ]);

      if (usersResponse) {
        console.log('Users response:', usersResponse);
        setUsers(usersResponse || []);
        // For admin users, all users can potentially be leads (except deleted ones)
        const leads = usersResponse.filter((user: UserData) => 
          !user.deletedAt && user.isActive !== false
        );
        // Filter potential HRs - only users with HR roles (for admin users to assign)
        const hrs = usersResponse.filter((user: UserData) => 
          user.role?.name === 'hr'
        );
        console.log('Potential leads:', leads);
        console.log('Potential HRs:', hrs);
        setPotentialLeads(leads || []);
        setPotentialHRs(hrs || []);
      }
      if (teamsResponse?.data) {
        setTeams(teamsResponse.data || []);
      }
      if (subTeamsResponse?.data) {
        setSubTeams(subTeamsResponse.data || []);
      }
      if (positionsResponse?.data) {
        setPositions(positionsResponse.data || []);
      }
      if (rolesResponse) {
        setRoles(rolesResponse || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.updateUser({ id: editingUser.id, ...formData });
        toast.success('User updated successfully');
      } else {
        await userService.createUser(formData);
        toast.success('User created successfully');
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        userId: '',
        name: '',
        email: '',
        roleId: 0,
        positionId: 0,
        teamId: 0,
        subTeamId: undefined,
        leadId: undefined,
        hrId: undefined,
        isActive: true,
      });
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const openConfirmationModal = (type: 'delete' | 'deactivate' | 'activate', user: UserData) => {
    setConfirmationModal({
      isOpen: true,
      type,
      user,
      loading: false
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'delete',
      user: null,
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.user) return;

    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      switch (confirmationModal.type) {
        case 'activate':
          // For now, we'll use update to change isActive status
          await userService.updateUser({ 
            id: confirmationModal.user.id, 
            isActive: true 
          });
          toast.success('User activated successfully');
          break;
        case 'deactivate':
          // For now, we'll use update to change isActive status
          await userService.updateUser({ 
            id: confirmationModal.user.id, 
            isActive: false 
          });
          toast.success('User deactivated successfully');
          break;
        case 'delete':
          await userService.deleteUser(confirmationModal.user.id);
          toast.success('User deleted successfully');
          break;
      }
      
      loadData();
      onStatsUpdate();
      closeConfirmationModal();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmationModal.type} user`);
      setConfirmationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRestore = async (user: UserData) => {
    try {
      // For now, we'll use update to restore user (remove deletedAt)
      await userService.updateUser({ 
        id: user.id, 
        isActive: true 
      });
      toast.success('User restored successfully');
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore user');
    }
  };

  const openEditDialog = (user: UserData) => {
    console.log('Editing user:', user);
    console.log('User lead:', user.lead);
    console.log('User hr:', user.hr);
    console.log('User leadId:', user.leadId);
    console.log('User hrId:', user.hrId);
    
    setEditingUser(user);
    const formDataToSet = {
      userId: user.userId,
      name: user.name,
      email: user.email || '',
      roleId: user.role?.id || user.roleId || 0,
      positionId: user.position?.id || user.positionId || 0,
      teamId: user.Team?.id || user.teamId || 0,
      subTeamId: user.SubTeam?.id || user.subTeamId,
      leadId: user.lead?.id || user.leadId,
      hrId: user.hr?.id || user.hrId,
      isActive: user.isActive !== false,
    };
    
    console.log('Form data to set:', formDataToSet);
    setFormData(formDataToSet);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      userId: '',
      name: '',
      email: '',
      roleId: 0,
      positionId: 0,
      teamId: 0,
      subTeamId: undefined,
      leadId: undefined,
      hrId: undefined,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openDetailModal = async (user: UserData) => {
    try {
      // For now, just show user details without skills since we need to implement 
      // a proper API endpoint for getting skills by position for admin users
      setSelectedUser(user);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error opening detail modal:', error);
      setSelectedUser(user);
      setIsDetailModalOpen(true);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.role && user.role.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position && user.position.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.Team && user.Team.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.SubTeam && user.SubTeam.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActiveFilter = showInactive ? true : (user.isActive !== false);
    const matchesTeamFilter = selectedTeamFilter === 'all' || user.Team?.id === parseInt(selectedTeamFilter);
    const matchesPositionFilter = selectedPositionFilter === 'all' || user.position?.id === parseInt(selectedPositionFilter);
    const matchesRoleFilter = selectedRoleFilter === 'all' || user.role?.id === parseInt(selectedRoleFilter);
    
    return matchesSearch && matchesActiveFilter && matchesTeamFilter && 
           matchesPositionFilter && matchesRoleFilter && !user.deletedAt;
  });



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center space-x-2"
          >
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showInactive ? 'Active' : 'Show Inactive'}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Create New User'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Update the user information below.' 
                    : 'Fill in the details to create a new user.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      placeholder="e.g., LMT20001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roleId">Role</Label>
                    <Select
                      value={formData.roleId.toString()}
                      onValueChange={(value) => setFormData({ ...formData, roleId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="positionId">Position</Label>
                    <Select
                      value={formData.positionId.toString()}
                      onValueChange={(value) => setFormData({ ...formData, positionId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id.toString()}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teamId">Team</Label>
                    <Select
                      value={formData.teamId.toString()}
                      onValueChange={(value) => {
                        const teamId = parseInt(value);
                        setFormData({ ...formData, teamId, subTeamId: undefined });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="subTeamId">Sub Team</Label>
                    <Select
                      value={formData.subTeamId?.toString() || ""}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        subTeamId: value === "unassigned" ? undefined : parseInt(value) 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sub team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {subTeams
                          .filter(subTeam => !formData.teamId || subTeam.teamId === formData.teamId)
                          .map((subTeam) => (
                            <SelectItem key={subTeam.id} value={subTeam.id.toString()}>
                              {subTeam.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leadId">Team Lead</Label>
                    <Select
                      value={formData.leadId ? formData.leadId.toString() : "unassigned"}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        leadId: value === "unassigned" ? undefined : parseInt(value) 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {potentialLeads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            {lead.name} ({lead.role?.name}) {lead.Team?.name && `- ${lead.Team.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="hrId">HR Manager</Label>
                    <Select
                      value={formData.hrId ? formData.hrId.toString() : "unassigned"}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        hrId: value === "unassigned" ? undefined : parseInt(value) 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an HR manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {potentialHRs.map((hr) => (
                          <SelectItem key={hr.id} value={hr.id.toString()}>
                            {hr.name} ({hr.role?.name}) {hr.Team?.name && `- ${hr.Team.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>



          <Select value={selectedPositionFilter} onValueChange={setSelectedPositionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((position) => (
                <SelectItem key={position.id} value={position.id.toString()}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${user.deletedAt ? 'opacity-60' : ''} compact-card`}
              onClick={() => openDetailModal(user)}
            >
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{user.name}</span>
                      <span className="text-sm text-gray-500 font-normal truncate">{user.userId}</span>
                    </div>
                  </CardTitle>
                  
                  {/* Action buttons beside the name */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {user.deletedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(user);
                        }}
                        className="h-7 w-7 p-0"
                        title="Restore"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(user);
                          }}
                          className="h-7 w-7 p-0"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        {(user.isActive !== false) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirmationModal('deactivate', user);
                            }}
                            className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700"
                            title="Deactivate"
                          >
                            <PowerOff className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirmationModal('activate', user);
                            }}
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                            title="Activate"
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmationModal('delete', user);
                          }}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.email || "N/A"}</span>
                    </div>
                  
                    <div className="flex items-center space-x-2 min-w-0">
                      <Shield className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.role?.name || "N/A"}</span>
                    </div>
                  
                    <div className="flex items-center space-x-2 min-w-0">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.position?.name || "N/A"}</span>
                    </div>
                  
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{user.Team?.name || "N/A"}</span>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={
          confirmationModal.type === 'delete' 
            ? 'Delete User' 
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate User'
            : 'Activate User'
        }
        description={
          confirmationModal.type === 'delete'
            ? `Are you sure you want to delete "${confirmationModal.user?.name}"? This action cannot be undone.`
            : confirmationModal.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmationModal.user?.name}"? This will make the user inactive.`
            : `Are you sure you want to activate "${confirmationModal.user?.name}"? This will make the user active.`
        }
        confirmText={
          confirmationModal.type === 'delete' 
            ? 'Delete' 
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate'
            : 'Activate'
        }
        type={confirmationModal.type}
        loading={confirmationModal.loading}
      />
    </div>
  );
};

export default UserManagement;