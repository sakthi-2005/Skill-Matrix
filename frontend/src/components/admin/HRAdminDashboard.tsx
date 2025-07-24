import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/custom/Card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, MapPin, ArrowLeft, Target } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import TeamManagement from './TeamManagement';
import SubTeamManagement from './SubTeamManagement';
import PositionManagement from './PositionManagement';
import UserManagement from './UserManagement';
import OrganizationOverview from './OrganizationOverview';
import SkillManagement from './SkillManagement';

const HRAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'users', 'teams', 'subteams', 'positions', 'skills'].includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview'); // Default to overview
    }
  }, [location.search]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleStatsUpdate = () => {
    // This function will be called when any management component updates data
    // It can be used to refresh organization stats or trigger other updates
    console.log('Stats updated');
  };

  return (
    <div className="space-y-6">
      

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Teams</span>
          </TabsTrigger>
          <TabsTrigger value="subteams" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Sub Teams</span>
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Positions</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Skills</span>
          </TabsTrigger>
        </TabsList> */}

        <TabsContent value="overview" className="space-y-4">
          <OrganizationOverview />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="subteams" className="space-y-4">
          <SubTeamManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <PositionManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillManagement onStatsUpdate={handleStatsUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRAdminDashboard;