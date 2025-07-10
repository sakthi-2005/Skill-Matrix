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
const TeamLeadDashboard = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ low: 0, medium: 0, average: 0, high: 0 });
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
      fetchTeamData();
      fetchDashboardData();
    }
  },[user]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [teamMembers]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScoreData = async(teamMembers: TeamMember[])=>{
    for(const teamMember of teamMembers){
        const skillDetails = await assessmentService.getUserLatestApprovedScoresByUserId(teamMember.id);
            const userSkills = skillDetails.data;

            // Calculate skill stats
            setStats((oldState)=>{
              return {
                low: oldState.low + userSkills.filter((skill: any) => skill.lead_score <= 1).length,
                medium: oldState.medium + userSkills.filter(
                  (skill: any) => skill.lead_score > 1 && skill.lead_score <= 2
                ).length,
                average: oldState.average + userSkills.filter(
                  (skill: any) => skill.lead_score > 2 && skill.lead_score <= 3
                ).length,
                high: oldState.high + userSkills.filter((skill: any) => skill.lead_score > 3).length,
              }
            });
      }
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
        let data;
        if (user?.role?.name === "hr") {
          // HR sees all members
          data = await userService.getFullMatrix();
        } else if (user?.role?.name === "lead") {
          // Team lead sees team members
          data = await userService.getTeamMatrix(user?.Team?.name);
        } else {
          // Regular users see team members
          data = await userService.getTeamMatrix(user?.Team?.name);
        }
        console.log(data);
        setTeamMembers(data);
        fetchScoreData(data);
      } catch (err) {
        toast({ title: "Failed to load team members", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="space-y-8">
      <DashboardStats
        stats={stats}
        pendingRequests={pendingRequests}
        title="Team Skills Overview"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.length}
                </div>
                <p className="text-sm text-gray-600">Team Members</p>
                
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
              <div className="text-sm text-gray-600">
                Most needed skills:
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="destructive" className="text-xs">
                    React
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    Leadership
                  </Badge>
                </div>
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
