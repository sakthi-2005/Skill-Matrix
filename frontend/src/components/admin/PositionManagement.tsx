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
  Briefcase
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Position, CreatePositionRequest, UpdatePositionRequest } from '../../types/admin';
import { toast } from 'sonner';

interface PositionManagementProps {
  onStatsUpdate: () => void;
}

export const PositionManagement: React.FC<PositionManagementProps> = ({ onStatsUpdate }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePositionRequest>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadPositions();
  }, [showDeleted]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllPositions(showDeleted);
      if (response.success) {
        setPositions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        const response = await adminService.updatePosition(editingPosition.id, formData);
        if (response.success) {
          toast.success('Position updated successfully');
        }
      } else {
        const response = await adminService.createPosition(formData);
        if (response.success) {
          toast.success('Position created successfully');
        }
      }
      setIsDialogOpen(false);
      setEditingPosition(null);
      setFormData({ name: '', description: '' });
      loadPositions();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (position: Position) => {
    if (window.confirm(`Are you sure you want to delete "${position.name}"?`)) {
      try {
        await adminService.deletePosition(position.id);
        toast.success('Position deleted successfully');
        loadPositions();
        onStatsUpdate();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete position');
      }
    }
  };

  const handleRestore = async (position: Position) => {
    try {
      await adminService.restorePosition(position.id);
      toast.success('Position restored successfully');
      loadPositions();
      onStatsUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore position');
    }
  };

  const openEditDialog = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      description: position.description || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPosition(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const filteredPositions = positions.filter(position =>
    position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Position Management</h2>
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
                <span>Add Position</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPosition ? 'Edit Position' : 'Create New Position'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Position Name</Label>
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
                    {editingPosition ? 'Update' : 'Create'}
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
          placeholder="Search positions..."
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
          {filteredPositions.map((position) => (
            <Card key={position.id} className={position.deletedAt ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>{position.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {position.deletedAt ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant={position.isActive ? 'default' : 'secondary'}>
                        {position.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {position.description && (
                    <p className="text-sm text-gray-600">{position.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{position.users?.length || 0} users</span>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {position.deletedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(position)}
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
                          onClick={() => openEditDialog(position)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(position)}
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

      {filteredPositions.length === 0 && !loading && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No positions found</p>
        </div>
      )}
    </div>
  );
};

export default PositionManagement;