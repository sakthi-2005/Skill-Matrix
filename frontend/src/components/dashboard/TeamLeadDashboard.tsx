import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import DashboardStats from "./DashboardStats";
import { Users, FileText, BarChart3 } from "lucide-react";
import { TeamMember } from "@/types/teamTypes";
import { userService,assessmentService } from "@/services/api";
import {toast} from "../../hooks/use-toast";
import { verifyLead } from "@/utils/helper";
import { getUserHierarchyLevel, isUserInLeadRole } from "@/utils/assessmentUtils";
const TeamLeadDashboard = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ basic:0, low: 0, medium: 0, high: 0, expert: 0 });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    avgSkillLevel: 0,
    skillGaps: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm,setSearchTerm]=useState("");
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
    console.log('fetchScoreData called with:', teamMembers);
    
    // Reset stats before calculating
    let newStats = { basic:0, low: 0, medium: 0, high: 0, expert:0 };
    
    for(const teamMember of teamMembers){
      try {
        console.log(`Fetching skills for team member: ${teamMember.id} (${teamMember.name || 'Unknown'})`);
        
        const skillDetails = await assessmentService.getUserLatestApprovedScoresByUserId(teamMember.id);
        
        console.log(`Skill details for ${teamMember.id}:`, skillDetails);
        
        if (skillDetails.success && skillDetails.data && Array.isArray(skillDetails.data)) {
          const userSkills = skillDetails.data;
          console.log(`User skills for ${teamMember.id}:`, userSkills);

          // Calculate skill stats for this team member
          // Try both lead_score and other possible field names
          const basicSkills =userSkills.filter((skill:any)=>{
            const score=skill.lead_score || skill.score || skill.Score || 0;
            return score==1;
          });

          const lowSkills = userSkills.filter((skill: any) => {
            const score = skill.lead_score || skill.score || skill.Score || 0;
            return score ==2;
          });
          
          const mediumSkills = userSkills.filter((skill: any) => {
            const score = skill.lead_score || skill.score || skill.Score || 0;
            return score > 1 && score == 3;
          });
          
          const highSkills = userSkills.filter((skill: any) => {
            const score = skill.lead_score || skill.score || skill.Score || 0;
            return score == 4;
          });

          const expertSkills = userSkills.filter((skill: any) => {
            const score = skill.lead_score || skill.score || skill.Score || 0;
            return score == 5;
          });
          newStats.basic+=basicSkills.length;
          newStats.low += lowSkills.length;
          newStats.medium += mediumSkills.length;
          newStats.high += highSkills.length;
          newStats.expert += expertSkills.length;
          
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
    setStats(newStats);
  }
  
  const fetchDashboardData = async () => {
    try {
      // Fetch pending requests
      const pendingRes = await assessmentService.getPendingTeamAssessments();
      if (pendingRes.success) {
        setPendingRequests(pendingRes.data.length);
      } else {
        setPendingRequests(0);
      }

      setTeamStats({
        totalMembers: teamMembers.length,
        avgSkillLevel: 2.8,
        skillGaps: 2,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
        toast({ title: "Failed to load team members", variant: "destructive" });
        setStats({ basic:0, low: 0, medium: 0, high: 0, expert:0 });
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
    return `${teamType} Team Overview`;
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

  return (
    <div className="space-y-8">
      <DashboardStats
        stats={stats}
        pendingRequests={pendingRequests}
        title={getDashboardTitle()}
      />

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
            </div>
          </CardContent>
        </Card>

        {/* <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingRequests}
                </div>
                <p className="text-sm text-gray-600">Skill Updates to Review</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  High Priority: 3
                </Badge>
                <Badge variant="outline" className="w-full justify-center">
                  Regular: 5
                </Badge>
              </div>
              <Button className="w-full">Review Requests</Button>
            </div>
          </CardContent>
        </Card> */}

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Skill Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {teamStats.skillGaps}
                </div>
                <p className="text-sm text-gray-600">Skill Gaps Identified</p>
              </div>
              
              <Button
                onClick={() => onNavigate("skill-matrix")}
                className="w-full"
                variant="outline"
              >
                View Matrix
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;
