import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import DashboardStats from "./DashboardStats";
import SkillDetailsModal from "./SkillDetailsModal";
import { Users, BarChart3, AlertCircle, Target, FileText, BookOpen, Award, ArrowRight } from "lucide-react";
import { TeamMember } from "@/types/teamTypes";
import { userService,assessmentService } from "@/services/api";
import {toast} from "../../hooks/use-toast";
import { verifyLead } from "@/utils/helper";
import { getUserHierarchyLevel, isUserInLeadRole } from "@/utils/assessmentUtils";
import { Assessment } from './../../types/assessmentTypes';
import { DetailedSkillStats, EmployeeSkill } from "@/types/dashboardTypes";
const TeamLeadDashboard = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ basic:0, low: 0, medium: 0, high: 0, expert: 0 });
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
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    avgSkillLevel: 0,
    skillGaps: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  useEffect(()=>{
    if(user){
      console.log('Current user:', user);
      console.log('User hierarchy level:', getUserHierarchyLevel(user));
      console.log('Is user in lead role:', isUserInLeadRole(user));
      fetchTeamData();
      fetchDashboardData();
    }
  },[user]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [teamMembers]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScoreData = async(teamMembers: TeamMember[])=>{
    
    // Reset stats before calculating
    let newStats = { basic:0, low: 0, medium: 0, high: 0, expert:0 };
    let newDetailedStats: DetailedSkillStats = {
      basic: { count: 0, employees: [] },
      low: { count: 0, employees: [] },
      medium: { count: 0, employees: [] },
      high: { count: 0, employees: [] },
      expert: { count: 0, employees: [] }
    };
    
    for(const teamMember of teamMembers){
      try {
        const skillDetails = await assessmentService.getUserLatestApprovedScoresByUserId(teamMember.id);
        
        if (skillDetails.success && skillDetails.data && Array.isArray(skillDetails.data)) {
          const userSkills = skillDetails.data;
          
          // Helper function to create skill details
          const createSkillDetails = (skills: any[], level: 'basic' | 'low' | 'medium' | 'high' | 'expert') => {
            if (skills.length > 0) {
              const employeeSkill: EmployeeSkill = {
                id: teamMember.id.toString(),
                name: teamMember.name || 'Unknown',
                email: teamMember.email,
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
          
          const basicSkills = userSkills.filter((skill:any)=>{
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
          
          // Update counts
          newStats.basic += basicSkills.length;
          newStats.low += lowSkills.length;
          newStats.medium += mediumSkills.length;
          newStats.high += highSkills.length;
          newStats.expert += expertSkills.length;
          
          // Update detailed stats
          createSkillDetails(basicSkills, 'basic');
          createSkillDetails(lowSkills, 'low');
          createSkillDetails(mediumSkills, 'medium');
          createSkillDetails(highSkills, 'high');
          createSkillDetails(expertSkills, 'expert');
          
          console.log(`Stats for ${teamMember.id}: basic=${basicSkills.length} ,low=${lowSkills.length}, medium=${mediumSkills.length}, high=${highSkills.length}, expert=${expertSkills.length}`);
        } else {
          console.log(`No skill data found for team member ${teamMember.id}`);
        }
      } catch (error) {
        console.error(`Error fetching skills for team member ${teamMember.id}:`, error);
      }
    }
    
    // Set the final stats
    console.log('Final calculated stats:', newStats);
    console.log('Final detailed stats:', newDetailedStats);
    setStats(newStats);
    setDetailedStats(newDetailedStats);
  }
  
  const fetchDashboardData = async () => {
    try {
      // Fetch pending requests
      const pendingRes = await assessmentService.getPendingTeamAssessments();
      if (pendingRes.success) {
        setPendingRequests(pendingRes.data.length);
        
        // Calculate overdue assessments from pending requests
        const now = new Date();
        const overdueCount = pendingRes.data.filter((assessment: any) => {
          if (!assessment?.deadlineDate) return false;
          const deadline = new Date(assessment.deadlineDate);
          return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
        }).length;
        
        setOverdueAssessments(overdueCount);
      } else {
        setPendingRequests(0);
        setOverdueAssessments(0);
      }

      setTeamStats({
        totalMembers: teamMembers.length,
        avgSkillLevel: 2.8,
        skillGaps: 2,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setPendingRequests(0);
      setOverdueAssessments(0);
    }
  };

  const fetchTeamData = async () => {
      try {
        let data = [];
        
        // Check if user is a lead (await the async function)
        console.log('User object:', user);
        console.log('User ID:', user.id, 'Type:', typeof user.id);
        
        const isLead = await verifyLead(user.id);
        console.log('Is user a lead:', isLead);
        
        // Also check if user role contains 'lead' as a fallback
        const isLeadByRole = isUserInLeadRole(user);
        console.log('Is user in lead role (by role name):', isLeadByRole);
        
        if(isLead || isLeadByRole){
          // Get the user's hierarchy level to determine what team data to fetch
          const userLevel = getUserHierarchyLevel(user);
          console.log('User hierarchy level:', userLevel);
          console.log('User role:', user?.role?.name);
          
          if (userLevel === 1) {
            // Regular Lead - fetch team members (employees only, exclude self)
            console.log('Fetching team matrix for regular lead');
            const teamData = await userService.getTeamMatrix(user?.Team?.name);
            data = teamData || [];
            
            // Ensure the Lead is NOT included in their own team dashboard
            // Team Skills Overview should only show employees reporting to them
            data = data.filter(member => member.id !== user.id);
          } else if (userLevel >= 2) {
            // Head Lead or higher - fetch direct reports (other Leads)
            console.log('Fetching direct reports for head lead');
            const directReports = await userService.getAllUsers({ leadId: user.id.toString() });
            
            console.log('Direct reports response:', directReports);
            
            if (directReports.success && directReports.data) {
              // Get all direct reports (both Leads and employees)
              const allDirectReports = directReports.data.filter(member => 
                member.id !== user.id // Exclude self initially
              );
              
              console.log('All direct reports:', allDirectReports);
              
              // For Head Leads, we want to show skills of their direct reports only (exclude self)
              data = allDirectReports;
              
              // If no direct reports, fallback to team matrix (but exclude self)
              if (allDirectReports.length === 0) {
                console.log('No direct reports found, falling back to team matrix');
                const teamData = await userService.getTeamMatrix(user?.Team?.name);
                data = (teamData || []).filter(member => member.id !== user.id);
              }
            } else {
              // Fallback to team matrix if direct reports API fails (exclude self)
              console.log('Direct reports API failed, falling back to team matrix');
              const teamData = await userService.getTeamMatrix(user?.Team?.name);
              data = (teamData || []).filter(member => member.id !== user.id);
            }
          } else {
            // Fallback for other cases (exclude self)
            console.log('Fallback case - fetching team matrix');
            const teamData = await userService.getTeamMatrix(user?.Team?.name);
            data = (teamData || []).filter(member => member.id !== user.id);
          }
        } else {
          console.log('User is not a lead, fetching team matrix');
          const teamData = await userService.getTeamMatrix(user?.Team?.name);
          data = teamData || [];
        }
        
        console.log('Final team data:', data);
        console.log('Team data length:', data.length);
        
        setTeamMembers(data || []);
        if (data && data.length > 0) {
          await fetchScoreData(data);
        } else {
          // Reset stats if no team members
          setStats({ basic:0, low: 0, medium: 0, high: 0, expert:0 });
          setDetailedStats({
            basic: { count: 0, employees: [] },
            low: { count: 0, employees: [] },
            medium: { count: 0, employees: [] },
            high: { count: 0, employees: [] },
            expert: { count: 0, employees: [] }
          });
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
        toast({ title: "Failed to load team members", variant: "destructive" });
        setStats({ basic:0, low: 0, medium: 0, high: 0, expert:0 });
        setDetailedStats({
          basic: { count: 0, employees: [] },
          low: { count: 0, employees: [] },
          medium: { count: 0, employees: [] },
          high: { count: 0, employees: [] },
          expert: { count: 0, employees: [] }
        });
      } finally {
        setIsLoading(false);
      }
    };

  // Helper function to get team type label
  const getTeamTypeLabel = (userLevel: number) => {
    if (userLevel <= 1) {
      return "Team"; // Regular Lead managing employees
    } else if (userLevel === 2) {
      return "Lead"; // Head Lead managing Leads
    } else {
      // Head Head Lead, etc. managing lower-level Heads
      const headCount = userLevel - 2;
      return headCount === 0 ? "Lead" : `${'Head '.repeat(headCount)}Lead`;
    }
  };

  // Get context-aware title based on user hierarchy level
  const getDashboardTitle = () => {
    if (!user) return "Team Skills Overview";
    
    const userLevel = getUserHierarchyLevel(user);
    const roleName = user?.role?.name?.toLowerCase() || '';
    
    console.log('Dashboard title - User level:', userLevel);
    console.log('Dashboard title - Role name:', roleName);
    
    const teamType = getTeamTypeLabel(userLevel);
    return `${teamType} Skills Overview`;
  };

  // Get team overview section title
  const getTeamOverviewTitle = () => {
    if (!user) return "Team Overview";
    
    const userLevel = getUserHierarchyLevel(user);
    const teamType = getTeamTypeLabel(userLevel);
    return `${teamType} Overview`;
  };

  // Get member type label
  const getMemberTypeLabel = () => {
    if (!user) return "Team Members";
    
    const userLevel = getUserHierarchyLevel(user);
    if (userLevel <= 1) {
      return "Team Members"; // Regular Lead managing employees
    } else {
      return "Direct Reports"; // Head Lead and above managing other leads
    }
  };

  // Modal handlers
  const handleSkillLevelClick = (level: 'basic' | 'low' | 'medium' | 'high' | 'expert') => {
    setModalState({ isOpen: true, skillLevel: level });
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, skillLevel: null });
  };

  // Get skill level color
  const getSkillLevelColor = (level: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      low: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-blue-100 text-blue-800',
      expert: 'bg-green-100 text-green-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const quickActions = [
    {
      title: 'Team Assessments',
      description: 'Review and manage team assessments',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => onNavigate('team-assessment')
    },
    {
      title: 'Team Overview',
      description: 'View detailed team member information',
      icon: Users,
      color: 'bg-green-500',
      action: () => onNavigate('team-overview')
    },
    {
      title: 'Skill Matrix',
      description: 'View comprehensive team skill matrix',
      icon: BarChart3,
      color: 'bg-purple-500',
      action: () => onNavigate('skill-matrix')
    },
    {
      title: 'Skill Criteria',
      description: 'Review skill criteria and requirements',
      icon: Target,
      color: 'bg-orange-500',
      action: () => onNavigate('skill-criteria')
    },
    {
      title: 'Upgrade Guide',
      description: 'Access skill development guidelines',
      icon: BookOpen,
      color: 'bg-red-500',
      action: () => onNavigate('upgrade-guide')
    }
  ];

  return (
    <div className="space-y-8">
      <DashboardStats
        stats={stats}
        detailedStats={detailedStats}
        pendingRequests={pendingRequests}
        title={getDashboardTitle()}
        onSkillLevelClick={handleSkillLevelClick}
      />

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {getTeamOverviewTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.length}
                </div>
                <p className="text-sm text-gray-600">
                  {getMemberTypeLabel()}
                </p>
                
              </div>
              <div>
                <div className="text-2xl font-bold">
                </div>
              </div>
              <Button
                onClick={() => onNavigate("team-overview")}
                className="w-full"
                variant="outline"
              >
                View Team Details
              </Button>
              <Button
                onClick={() => onNavigate("team-overview")}
                className="w-full"
                variant="outline"
              >
                Team Overview
              </Button>
              <Button
                onClick={() => onNavigate("team-assessment")}
                className="w-full"
                variant="outline"
              >
                Team Assessments
              </Button>
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
                    Pending Reviews
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
              <Button 
                onClick={() => onNavigate('team-assessment')} 
                className={`w-full text-primary-foreground h-9 rounded-md px-3 ${
                  overdueAssessments > 0 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {overdueAssessments > 0 ? 'Urgent Review' : 'Review Assessments'}
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Skill Details Modal */}
      <SkillDetailsModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        skillLevel={modalState.skillLevel ? modalState.skillLevel.charAt(0).toUpperCase() + modalState.skillLevel.slice(1) : ''}
        employees={modalState.skillLevel ? detailedStats[modalState.skillLevel].employees : []}
        skillLevelColor={modalState.skillLevel ? getSkillLevelColor(modalState.skillLevel) : ''}
      />
    </div>
  );
};

export default TeamLeadDashboard;
