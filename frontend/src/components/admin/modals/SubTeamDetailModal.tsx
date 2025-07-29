import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { SubTeam } from '../../../types/admin';
import { 
  Users, 
  Calendar, 
  User, 
  Mail,
  MapPin,
  Clock,
  Building
} from 'lucide-react';

interface SubTeamDetailModalProps {
  subTeam: SubTeam | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SubTeamDetailModal: React.FC<SubTeamDetailModalProps> = ({ 
  subTeam, 
  isOpen, 
  onClose 
}) => {
  if (!subTeam) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{subTeam.name}</span>
            <Badge variant={subTeam.isActive ? 'default' : 'secondary'}>
              {subTeam.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {subTeam.deletedAt && (
              <Badge variant="destructive">Deleted</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the sub-team and its members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Sub-Team Name</label>
                <p className="text-sm">{subTeam.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Parent Team</label>
                <div className="flex items-center space-x-1 mt-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{subTeam.teams?.name || 'N/A'}</span>
                </div>
              </div>
              
              {subTeam.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm">{subTeam.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={subTeam.isActive ? 'default' : 'secondary'}>
                      {subTeam.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Sub-Team ID</label>
                  <p className="text-sm">#{subTeam.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(subTeam.createdAt)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(subTeam.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {subTeam.deletedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Deleted At</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-600">{formatDate(subTeam.deletedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sub-Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Sub-Team Members ({subTeam.user?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subTeam.user && subTeam.user.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subTeam.user.map((user) => (
                    <div key={user.id} className="border rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.profilePhoto ? (
                            <img 
                              src={user.profilePhoto} 
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.position && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{user.position.name}</span>
                            </div>
                          )}
                          {user.role && (
                            <Badge variant="outline" className="mt-1">
                              {user.role.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No sub-team members found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};