import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
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
  Building2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '../../types/admin';
import { toast } from 'sonner';

interface TeamManagementProps {
  onStatsUpdate: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ onStatsUpdate }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadTeams();
  }, [showDeleted]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTeams(showDeleted);
      if (response.success) {
        setTeams(response.data || []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        const response = await adminService.updateTeam(editingTeam.id, formData);
        if (response.success) {
          toast.success('Team updated successfully');
        }
      } else {
        const response = await adminService.createTeam(formData);
        if (response.success) {
          toast.success('Team created successfully');
        }
      }
      setIsDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
      loadTeams();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (team: Team) => {
    if (window.confirm(`Are you sure you want to delete "${team.name}"?`)) {
      try {
        await adminService.deleteTeam(team.id);
        toast.success('Team deleted successfully');
        loadTeams();
        onStatsUpdate();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete team');
      }
    }
  };

  const handleRestore = async (team: Team) => {
    try {
      await adminService.restoreTeam(team.id);
      toast.success('Team restored successfully');
      loadTeams();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore team');
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Management</h2>
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
                <span>Add Team</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? 'Edit Team' : 'Create New Team'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name</Label>
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
                    {editingTeam ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <Card key={team.id} className={team.deletedAt ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>{team.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {team.deletedAt ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant={team.isActive ? 'default' : 'secondary'}>
                        {team.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.description && (
                    <p className="text-sm text-gray-600">{team.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{team.subTeams?.length || 0} sub-teams</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{team.users?.length || 0} users</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {team.deletedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(team)}
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
                          onClick={() => openEditDialog(team)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(team)}
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

      {filteredTeams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No teams found</p>
        </div>
      )}
    </div>
  );
};