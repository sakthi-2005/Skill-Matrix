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
  Building
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Team, SubTeam, CreateSubTeamRequest, UpdateSubTeamRequest } from '../../types/admin';
import { toast } from 'sonner';

interface SubTeamManagementProps {
  onStatsUpdate: () => void;
}

export const SubTeamManagement: React.FC<SubTeamManagementProps> = ({ onStatsUpdate }) => {
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [editingSubTeam, setEditingSubTeam] = useState<SubTeam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSubTeamRequest>({
    name: '',
    description: '',
    teamId: 0,
  });

  useEffect(() => {
    loadData();
  }, [showDeleted, selectedTeamFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subTeamsResponse, teamsResponse] = await Promise.all([
        adminService.getAllSubTeams(
          selectedTeamFilter === 'all' ? undefined : parseInt(selectedTeamFilter),
          showDeleted
        ),
        adminService.getAllTeams(false)
      ]);

      if (subTeamsResponse.success) {
        setSubTeams(subTeamsResponse.data || []);
      }
      if (teamsResponse.success) {
        setTeams(teamsResponse.data || []);
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
      if (editingSubTeam) {
        const response = await adminService.updateSubTeam(editingSubTeam.id, formData);
        if (response.success) {
          toast.success('Sub-team updated successfully');
        }
      } else {
        const response = await adminService.createSubTeam(formData);
        if (response.success) {
          toast.success('Sub-team created successfully');
        }
      }
      setIsDialogOpen(false);
      setEditingSubTeam(null);
      setFormData({ name: '', description: '', teamId: 0 });
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (subTeam: SubTeam) => {
    if (window.confirm(`Are you sure you want to delete "${subTeam.name}"?`)) {
      try {
        await adminService.deleteSubTeam(subTeam.id);
        toast.success('Sub-team deleted successfully');
        loadData();
        onStatsUpdate();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete sub-team');
      }
    }
  };

  const handleRestore = async (subTeam: SubTeam) => {
    try {
      await adminService.restoreSubTeam(subTeam.id);
      toast.success('Sub-team restored successfully');
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore sub-team');
    }
  };

  const openEditDialog = (subTeam: SubTeam) => {
    setEditingSubTeam(subTeam);
    setFormData({
      name: subTeam.name,
      description: subTeam.description || '',
      teamId: subTeam.teamId,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSubTeam(null);
    setFormData({ name: '', description: '', teamId: 0 });
    setIsDialogOpen(true);
  };

  const filteredSubTeams = subTeams.filter(subTeam =>
    subTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subTeam.description && subTeam.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (subTeam.Team && subTeam.Team.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sub-Team Management</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center space-x-2"
          >
            {showDeleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showDeleted ? 'Hide Deleted' : 'Show Deleted'}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Sub-Team</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubTeam ? 'Edit Sub-Team' : 'Create New Sub-Team'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubTeam 
                    ? 'Update the sub-team information below.' 
                    : 'Fill in the details to create a new sub-team.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="teamId">Parent Team</Label>
                  <Select
                    value={formData.teamId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, teamId: parseInt(value) })}
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
                  <Label htmlFor="name">Sub-Team Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSubTeam ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sub-teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by team" />
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubTeams.map((subTeam) => (
            <Card key={subTeam.id} className={subTeam.deletedAt ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{subTeam.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {subTeam.deletedAt ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant={subTeam.isActive ? 'default' : 'secondary'}>
                        {subTeam.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{subTeam.Team?.name}</span>
                  </div>
                  
                  {subTeam.description && (
                    <p className="text-sm text-gray-600">{subTeam.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{subTeam.users?.length || 0} users</span>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {subTeam.deletedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(subTeam)}
                        className="flex items-center space-x-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(subTeam)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subTeam)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredSubTeams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sub-teams found</p>
        </div>
      )}
    </div>
  );
};

export default SubTeamManagement;