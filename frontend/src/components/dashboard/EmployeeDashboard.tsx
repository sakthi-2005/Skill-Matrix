/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import DashboardStats from "./DashboardStats";
import { Target, TrendingUp, BookOpen, User, Settings, Award, ArrowRight } from "lucide-react";
import { userService, skillService, assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {SkillProgressItem} from "../../types/dashboardTypes";
import { AssessmentWithHistory } from "@/types/assessmentTypes";

const EmployeeDashboard = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    basic:0,
    low: 0,
    medium: 0,
    high: 0,
    expert: 0,
  });
  const [pendingStatus, setPendingStatus] = useState(0);
  const [skillProgress, setSkillProgress] = useState<SkillProgressItem[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<
    { id: string; name: string; category: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReviews,setPendingReviews]=useState<AssessmentWithHistory[]>([]);
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Get user profile with skills
      const profileData = await userService.getProfile();
      const skillDetails = await assessmentService.getUserLatestApprovedScores();
      const userSkills = skillDetails.data;
      console.log(userSkills)
      // Calculate skill stats
      const skillStats = {
        basic:userSkills.filter((skill: any) => skill.score == 1).length,
        low: userSkills.filter((skill: any) => skill.score == 2).length,
        medium: userSkills.filter(
          (skill: any) =>  skill.score == 3
        ).length,
        high: userSkills.filter(
          (skill: any) =>  skill.score == 4
        ).length,
        expert: userSkills.filter((skill: any) => skill.score ==5).length,
      };
      setStats(skillStats);

      try {
            const [allAssessments, requiresAction] = await Promise.all([
              assessmentService.getAssessmentsForRole(),
              assessmentService.getAssessmentsRequiringAction(),
            ]);
            if (requiresAction.success) setPendingReviews(requiresAction.data);
          } catch (error) {
            console.error("Error loading assessments:", error);
            toast({
              title: "Error",
              description: "Failed to load assessments",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }

      // Get pending assessments
      const assessmentsData =
        await assessmentService.getUserLatestApprovedScores();
      setPendingStatus(0);

      // Get skill progress 
      const skillProgressData = userSkills
        .filter((skill: any) => 4 > skill.score)
        .map((skill: any) => ({
          id: skill.skillId,
          name: skill.skill_name,
          current: skill.score,
          target: 5, //(skill.target_level) Need to change this later
        }))
        .slice(0, 3);

      setSkillProgress(skillProgressData);

      // Get suggested skills based on user position
      if (profileData?.positionId) {
        const positionSkills = await skillService.getSkillsByPosition();

        // Filter out skills the user already has
        const userSkillIds = userSkills.map((skill: any) => skill.skillId);
        const suggestedSkillsData = positionSkills
          .filter((skill: any) => !userSkillIds.includes(skill.id))
          .map((skill: any) => ({
            id: skill.id,
            name: skill.name,
          }))
          .slice(0, 5); // Show top 5 suggestions

        setSuggestedSkills(suggestedSkillsData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'My Assessments',
      description: 'View and manage your assessments',
      icon: Award,
      color: 'bg-blue-500',
      action: () => onNavigate('employee-assessment-review')
    },
    {
      title: 'Skill Development',
      description: 'Track your skill development journey',
      icon: TrendingUp,
      color: 'bg-green-500',
      action: () => onNavigate('skill-development')
    },
    {
      title: 'Learning Resources',
      description: 'Access learning materials and guides',
      icon: BookOpen,
      color: 'bg-purple-500',
      action: () => onNavigate('learning-resources')
    },
    {
      title: 'My Profile',
      description: 'View and update your profile',
      icon: User,
      color: 'bg-orange-500',
      action: () => onNavigate('profile')
    },
    {
      title: 'Skill Matrix',
      description: 'View your personal skill matrix',
      icon: Target,
      color: 'bg-red-500',
      action: () => onNavigate('skill-matrix')
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardStats stats={stats} title="My Skills Overview" />

      {/* Quick Actions Section - Team Lead UI Style */}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Skill Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillProgress.length > 0 ? (
              skillProgress.map((skill, index) => (
                <div key={skill.id || index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill.name}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Level {skill.current}</span>
                      <span>Target: {skill.target}</span>
                    </div>
                    <Progress
                      value={(skill.current / skill.target) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No skills in progress. Start by setting target levels for your
                skills.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-shadow ${
          pendingReviews.length > 0 
            ? 'border-orange-200 bg-orange-50' 
            : 'border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              pendingReviews.length > 0 ? 'text-orange-800' : 'text-gray-800'
            }`}>
              <Target className="h-5 w-5" />
              Assessment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${
                pendingReviews.length > 0 ? 'bg-orange-100' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Pending Reviews</h4>
                    <p className="text-sm text-gray-600">
                      {pendingReviews.length} assessments awaiting action
                    </p>
                  </div>
                  <Badge variant={pendingReviews.length > 0 ? "default" : "secondary"}>
                    {pendingReviews.length}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={() => onNavigate("employee-assessment-review")}
                className={`w-full ${
                  pendingReviews.length > 0 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : ''
                }`}
                size="lg"
              >
                {pendingReviews.length > 0 ? 'Review Assessments' : 'View My Assessments'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
   </div>
  );
};

export default EmployeeDashboard;
