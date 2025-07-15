import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Building, 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { Input } from '../ui/input';
import { adminService } from '../../services/adminService';
import { Team, SubTeam, Position, OrganizationStats } from '../../types/admin';
import { toast } from 'sonner';
import { TeamManagement } from './TeamManagement';
import { SubTeamManagement } from './SubTeamManagement';
import { PositionManagement } from './PositionManagement';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminService.getOrganizationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load organization statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR Admin Dashboard</h1>
          <p className="text-gray-600">Manage organizational structure and hierarchy</p>
        </div>
        <Button onClick={loadStats} variant="outline">
          Refresh Stats
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="sub-teams">Sub-Teams</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teams</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.teams.active}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">{stats?.teams.deleted} deleted</Badge>
                  <Badge variant="outline">{stats?.teams.total} total</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sub-Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.subTeams.active}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">{stats?.subTeams.deleted} deleted</Badge>
                  <Badge variant="outline">{stats?.subTeams.total} total</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positions</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.positions.active}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">{stats?.positions.deleted} deleted</Badge>
                  <Badge variant="outline">{stats?.positions.total} total</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setActiveTab('teams')} 
                  variant="outline" 
                  className="flex items-center justify-center space-x-2"
                >
                  <Building className="h-4 w-4" />
                  <span>Manage Teams</span>
                </Button>
                <Button 
                  onClick={() => setActiveTab('sub-teams')} 
                  variant="outline" 
                  className="flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Sub-Teams</span>
                </Button>
                <Button 
                  onClick={() => setActiveTab('positions')} 
                  variant="outline" 
                  className="flex items-center justify-center space-x-2"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Manage Positions</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <TeamManagement onStatsUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="sub-teams">
          <SubTeamManagement onStatsUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="positions">
          <PositionManagement onStatsUpdate={loadStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};