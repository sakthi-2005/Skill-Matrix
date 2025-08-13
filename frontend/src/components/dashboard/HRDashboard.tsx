import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/custom/Card';
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from './DashboardStats';
import SkillDetailsModal from './SkillDetailsModal';
import { Building2, Target, AlertCircle, Users, BarChart3, FileText, Settings, ArrowRight } from 'lucide-react';
import { assessmentService, skillService, teamService, userService } from '@/services/api';
import { getAverageSkillLevel } from '@/utils/helper';
import { DetailedSkillStats, EmployeeSkill } from '@/types/dashboardTypes';

const HRDashboard = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ basic:0, low: 0, medium: 0, high: 0, expert:0 });
  const [detailedStats, setDetailedStats] = useState<DetailedSkillStats>({
    basic: { count: 0, employees: [] },
    low: { count: 0, employees: [] },
    medium: { count: 0, employees: [] },
    high: { count: 0, employees: [] },
    expert: { count: 0, employees: [] }
  });
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    skillLevel: 'basic' | 'low' | 'medium' | 'high' | 'expert' | null;
  }>({ isOpen: false, skillLevel: null });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [overdueAssessments, setOverdueAssessments] = useState(0);
  const [organizationStats, setOrganizationStats] = useState({
    totalEmployees: 0,
    teams: 0,
    skillCriteria: 0,
    avgOrgSkillLevel: 0
  });
  const [orgSkillStats, setOrgSkillStats] = useState({basic:0, low: 0, medium: 0, high: 0, expert:0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch org-wide skill stats
      const orgStats = await userService.getOrganizationSkillStats();
      setOrgSkillStats(orgStats);

      const matrix = await userService.getFullMatrix();
      const skillDetails = matrix.find((hr: any) => hr.userId === user.id)
      const pendingRequests = await assessmentService.getAssessmentsRequiringAction();
      const userSummaries = await assessmentService.getUserAssessmentSummaries();
      const teamsData = await teamService.getAllTeams();
      const criteria = await skillService.getAllSkills();
      
      // Check if skillDetails exists and has mostRecentAssessmentScores
      const userSkills = skillDetails?.mostRecentAssessmentScores || [];
      const skillStats = {
        basic:userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 1).length : 0,
        low: userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 2).length : 0,
        medium: userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 3).length : 0,
        high: userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 4).length : 0,
        expert:userSkills.length>0 ? userSkills.filter((skill)=>skill.score == 5).length:0,
      };
      const avg: number = matrix.length
                  ? parseFloat((
                      matrix.reduce(
                        (acc, m) => {
                          const skillLevel = getAverageSkillLevel(m);
                          return acc + skillLevel;
                        },
                        0
                      ) / matrix.length
                    ).toFixed(1))
                  : 0;

      // Calculate overdue assessments
      const summariesData = Array.isArray(userSummaries) ? userSummaries : userSummaries?.data || [];
      const now = new Date();
      const overdueCount = summariesData.filter((summary: any) => {
        const assessment = summary.latestAssessment;
        if (!assessment?.deadlineDate) return false;
        const deadline = new Date(assessment.deadlineDate);
        return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
      }).length;

      setStats(skillStats);
      setPendingRequests(Array.isArray(pendingRequests) ? pendingRequests.length : 
                       (pendingRequests?.data ? pendingRequests.data.length : 0));
      setOverdueAssessments(overdueCount);
      setOrganizationStats({
        totalEmployees: matrix?.length || 0,
        teams: teamsData?.length || 0,
        skillCriteria: criteria?.length || 0,
        avgOrgSkillLevel: avg
      });

      // Fetch detailed organization-wide skill data
      await fetchDetailedSkillData(matrix);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchDetailedSkillData = async (allUsers: any[]) => {
    try {
      // Reset detailed stats before calculating
      let newDetailedStats: DetailedSkillStats = {
        basic: { count: 0, employees: [] },
        low: { count: 0, employees: [] },
        medium: { count: 0, employees: [] },
        high: { count: 0, employees: [] },
        expert: { count: 0, employees: [] }
      };
      
      for(const orgUser of allUsers){
        try {
          const skillDetails = await assessmentService.getUserLatestApprovedScoresByUserId(orgUser.id);
          
          if (skillDetails.success && skillDetails.data && Array.isArray(skillDetails.data)) {
            const userSkills = skillDetails.data;
            
            // Helper function to create skill details
            const createSkillDetails = (skills: any[], level: 'basic' | 'low' | 'medium' | 'high' | 'expert') => {
              if (skills.length > 0) {
                const employeeSkill: EmployeeSkill = {
                  id: orgUser.id.toString(),
                  name: orgUser.name || 'Unknown',
                  email: orgUser.email,
                  skills: skills.map(skill => ({
                    skillName: skill.skill_name || skill.skillName || skill.name || 'Unknown Skill',
                    skillCategory: skill.skillCategory || skill.category,
                    score: skill.lead_score || skill.score || skill.Score || 0
                  }))
                };
                newDetailedStats[level].employees.push(employeeSkill);
                newDetailedStats[level].count += skills.length;
              }
            };
            
            const basicSkills = userSkills.filter((skill: any) => {
              const score = skill.lead_score || skill.score || skill.Score || 0;
              return score == 1;
            });

            const lowSkills = userSkills.filter((skill: any) => {
              const score = skill.lead_score || skill.score || skill.Score || 0;
              return score == 2;
            });
            
            const mediumSkills = userSkills.filter((skill: any) => {
              const score = skill.lead_score || skill.score || skill.Score || 0;
              return score == 3;
            });
            
            const highSkills = userSkills.filter((skill: any) => {
              const score = skill.lead_score || skill.score || skill.Score || 0;
              return score == 4;
            });

            const expertSkills = userSkills.filter((skill: any) => {
              const score = skill.lead_score || skill.score || skill.Score || 0;
              return score == 5;
            });
            
            // Update detailed stats
            createSkillDetails(basicSkills, 'basic');
            createSkillDetails(lowSkills, 'low');
            createSkillDetails(mediumSkills, 'medium');
            createSkillDetails(highSkills, 'high');
            createSkillDetails(expertSkills, 'expert');
            
          }
        } catch (error) {
          console.error(`Error fetching skills for user ${orgUser.id}:`, error);
        }
      }
      
      console.log('HR Dashboard detailed stats:', newDetailedStats);
      setDetailedStats(newDetailedStats);
    } catch (error) {
      console.error('Failed to fetch detailed skill data:', error);
    }
  };

  // Modal handlers
  const handleSkillLevelClick = (level: 'basic' | 'low' | 'medium' | 'high' | 'expert') => {
    setModalState({ isOpen: true, skillLevel: level });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, skillLevel: null });
  };

  // Get skill level color for modal
  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'expert': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const quickActions = [
    {
      title: 'Assessment Reviews',
      description: 'Review and approve pending assessments',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => onNavigate('hr-assessment-management')
    },
    {
      title: 'Team Analytics',
      description: 'View organization-wide skill analytics',
      icon: BarChart3,
      color: 'bg-green-500',
      action: () => onNavigate('team-overview')
    },
    {
      title: 'Skill Matrix',
      description: 'View comprehensive skill matrix',
      icon: Target,
      color: 'bg-orange-500',
      action: () => onNavigate('skill-matrix')
    },
    {
      title: 'Skill Criteria',
      description: 'Manage skill criteria and settings',
      icon: Settings,
      color: 'bg-red-500',
      action: () => onNavigate('skill-criteria')
    }
  ];
  
  return (
    <div className="space-y-8">
      <DashboardStats 
        stats={orgSkillStats}
        title="Organization Skills Overview"
        onSkillLevelClick={handleSkillLevelClick}
      />

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${action.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{organizationStats.totalEmployees}</div>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
              <div>
                <div className="text-lg font-semibold">{organizationStats.teams}</div>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
              <button 
                onClick={() => onNavigate('team-overview')} 
                className="w-full border h-9 rounded-md px-3 border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                View All Teams
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skill Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{organizationStats.skillCriteria}</div>
                <p className="text-sm text-gray-600">Active Criteria</p>
              </div>
              <div>
                <div className="text-lg font-semibold">{organizationStats.avgOrgSkillLevel}</div>
                <p className="text-sm text-gray-600">Average Org Skill Level</p>
              </div>
              <button 
                onClick={() => onNavigate('skill-criteria')} 
                className="w-full border h-9 rounded-md px-3 border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Manage Criteria
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-shadow ${
          overdueAssessments > 0 
            ? 'border-red-300 bg-red-50' 
            : 'border-orange-200 bg-orange-50'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              overdueAssessments > 0 ? 'text-red-800' : 'text-orange-800'
            }`}>
              <AlertCircle className="h-5 w-5" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={`text-xl font-bold ${
                    overdueAssessments > 0 ? 'text-red-900' : 'text-orange-900'
                  }`}>
                    {pendingRequests}
                  </div>
                  <p className={`text-xs ${
                    overdueAssessments > 0 ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    Final Approvals
                  </p>
                </div>
                {overdueAssessments > 0 && (
                  <div>
                    <div className="text-xl font-bold text-red-900">
                      {overdueAssessments}
                    </div>
                    <p className="text-xs text-red-700">
                      Overdue
                    </p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => onNavigate('hr-assessment-management')} 
                className={`w-full text-primary-foreground h-9 rounded-md px-3 ${
                  overdueAssessments > 0 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {overdueAssessments > 0 ? 'Urgent Review' : 'Review Now'}
              </button>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Skill Details Modal */}
      <SkillDetailsModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        skillLevel={modalState.skillLevel ? modalState.skillLevel.charAt(0).toUpperCase() + modalState.skillLevel.slice(1) : ''}
        employees={modalState.skillLevel ? detailedStats[modalState.skillLevel].employees : []}
        skillLevelColor={modalState.skillLevel ? getSkillLevelColor(modalState.skillLevel) : ''}
      />
    </div>
  );
};

export default HRDashboard;
