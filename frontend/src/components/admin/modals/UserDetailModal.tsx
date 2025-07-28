import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  User, 
  Calendar, 
  Mail,
  MapPin,
  Clock,
  Building,
  Users,
  Shield,
  Phone,
  UserCheck
} from 'lucide-react';
import { UserData } from '../../../types/admin';

interface UserDetailModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  openConfirmationModal?: (type: 'delete' | 'deactivate' | 'activate', user: UserData) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  openConfirmationModal
}) => {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSkillLevelColor = (level: number) => {
    if (level <= 1) return 'bg-red-100 text-red-800';
    if (level <= 2) return 'bg-yellow-100 text-yellow-800';
    if (level <= 3) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getSkillLevelText = (level: number) => {
    if (level <= 1) return 'Beginner';
    if (level <= 2) return 'Intermediate';
    if (level <= 3) return 'Advanced';
    return 'Expert';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{user.name}</span>
            <Badge variant={(user.isActive !== false) ? 'default' : 'secondary'}>
              {(user.isActive !== false) ? 'Active' : 'Inactive'}
            </Badge>
            {user.deletedAt && (
              <Badge variant="destructive">Deleted</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the user and their profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Basic Information</CardTitle>
                {!user.deletedAt && openConfirmationModal && (
                  <Button
                    variant={(user.isActive !== false) ? "destructive" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmationModal((user.isActive !== false) ? 'deactivate' : 'activate', user);
                    }}
                    className={(user.isActive !== false) ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                  >
                    {(user.isActive !== false) ? 'Deactivate' : 'Activate'} User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  {user.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-medium text-xl">
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-500">ID: {user.userId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.email || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={(user.isActive !== false) ? 'default' : 'secondary'}>
                      {(user.isActive !== false) ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm">#{user.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(user.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {user.deletedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Deleted At</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-600">{formatDate(user.deletedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.role?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.position?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Team</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.Team?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Sub Team</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.subTeam?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Team Lead</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.lead?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">HR Manager</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.hr?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Information */}
          {user.skills && user.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Skills ({user.skills.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.skills.map((skill) => (
                    <div key={skill.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{skill.name}</h4>
                        <Badge className={getSkillLevelColor(skill.level)}>
                          {getSkillLevelText(skill.level)}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Level: {skill.level}/4</span>
                          {skill.lastAssessed && (
                            <span>Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(skill.level / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};