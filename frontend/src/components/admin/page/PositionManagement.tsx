import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  Briefcase,
  Power,
  PowerOff,
  Target,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { skillService } from '../../../services/api';
import { Position, CreatePositionRequest } from '../../../types/admin';
import { toast } from 'sonner';
import { PositionDetailModal } from '../modals/PositionDetailModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { PositionSkillMapping } from '../PositionSkillMapping';

interface PositionManagementProps {
  onStatsUpdate: () => void;
}

interface PositionWithSkillCount extends Position {
  skillCount?: number;
}

export const PositionManagement: React.FC<PositionManagementProps> = ({ onStatsUpdate }) => {
  const [positions, setPositions] = useState<PositionWithSkillCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'deactivate' | 'activate';
    position: Position | null;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'delete',
    position: null,
    loading: false
  });
  const [formData, setFormData] = useState<CreatePositionRequest>({
    name: '',
    description: '',
  });
  const [skillRequirementsModal, setSkillRequirementsModal] = useState<{
    isOpen: boolean;
    position: Position | null;
  }>({
    isOpen: false,
    position: null
  });

  useEffect(() => {
    loadPositions();
  }, [showInactive]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const [positionsResponse, skillsResponse] = await Promise.all([
        adminService.getAllPositions(false), // Always load non-deleted, we'll filter by active/inactive
        skillService.getAllSkills()
      ]);
      
      if (positionsResponse.success) {
        const positionsData = positionsResponse.data || [];
        const skillsData = skillsResponse || [];
        
        // Calculate skill count for each position
        const positionsWithSkillCount = positionsData.map((position: Position) => {
          const skillCount = skillsData.filter((skill: any) => 
            skill.positionId === position.id
          ).length;
          
          return {
            ...position,
            skillCount
          };
        });
        
        setPositions(positionsWithSkillCount);
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

  const openConfirmationModal = (type: 'delete' | 'deactivate' | 'activate', position: Position) => {
    setConfirmationModal({
      isOpen: true,
      type,
      position,
      loading: false
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'delete',
      position: null,
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.position) return;

    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      switch (confirmationModal.type) {
        case 'activate':
          await adminService.activatePosition(confirmationModal.position.id);
          toast.success('Position activated successfully');
          break;
        case 'deactivate':
          await adminService.deactivatePosition(confirmationModal.position.id);
          toast.success('Position deactivated successfully');
          break;
        case 'delete':
          await adminService.deletePosition(confirmationModal.position.id);
          toast.success('Position deleted successfully');
          break;
      }
      
      loadPositions();
      onStatsUpdate();
      closeConfirmationModal();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmationModal.type} position`);
      setConfirmationModal(prev => ({ ...prev, loading: false }));
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

  const openDetailModal = (position: Position) => {
    setSelectedPosition(position);
    setIsDetailModalOpen(true);
  };

  const openSkillRequirementsModal = (position: Position) => {
    setSkillRequirementsModal({
      isOpen: true,
      position
    });
  };

  const closeSkillRequirementsModal = () => {
    setSkillRequirementsModal({
      isOpen: false,
      position: null
    });
  };

  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesActiveFilter = showInactive ? true : position.isActive;
    
    return matchesSearch && matchesActiveFilter && !position.deletedAt;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Position Management</h2>
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
                <span>Add Position</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPosition ? 'Edit Position' : 'Create New Position'}
                </DialogTitle>
                <DialogDescription>
                  {editingPosition 
                    ? 'Update the position information below.' 
                    : 'Fill in the details to create a new position.'}
                </DialogDescription>
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
            <Card 
              key={position.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${position.deletedAt ? 'opacity-60' : ''} compact-card`}
              onClick={() => openDetailModal(position)}
            >
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2 flex-1 min-w-0">
                    <Briefcase className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{position.name}</span>
                      <span className="text-sm text-gray-500 font-normal truncate">
                        {position.user?.length || 0} users • {position.skillCount || 0} skills
                      </span>
                    </div>
                  </CardTitle>
                  
                  {/* Action buttons beside the name */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSkillRequirementsModal(position);
                      }}
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                      title="Manage Skills"
                    >
                      <Target className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(position);
                      }}
                      className="h-7 w-7 p-0"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    {position.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirmationModal('deactivate', position);
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
                          openConfirmationModal('activate', position);
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
                        openConfirmationModal('delete', position);
                      }}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {position.description && (
                    <p className="text-sm text-gray-600">{position.description}</p>
                  )}
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

      <PositionDetailModal
        position={selectedPosition}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={
          confirmationModal.type === 'delete' 
            ? 'Delete Position' 
            : confirmationModal.type === 'deactivate'
            ? 'Deactivate Position'
            : 'Activate Position'
        }
        description={
          confirmationModal.type === 'delete'
            ? `Are you sure you want to delete "${confirmationModal.position?.name}"? This action cannot be undone.`
            : confirmationModal.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmationModal.position?.name}"? This will make the position inactive.`
            : `Are you sure you want to activate "${confirmationModal.position?.name}"? This will make the position active.`
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

      {skillRequirementsModal.position && (
        <PositionSkillMapping
          positionId={skillRequirementsModal.position.id}
          positionName={skillRequirementsModal.position.name}
          isOpen={skillRequirementsModal.isOpen}
          onClose={closeSkillRequirementsModal}
          onSave={loadPositions}
        />
      )}
    </div>
  );
};

export default PositionManagement;