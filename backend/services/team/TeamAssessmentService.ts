import { In } from "typeorm";
import { assessmentRequestRepo, scoreRepo, userRepo, AuditRepo } from "../../config/dataSource";
import { AssessmentWithHistory } from "../../types/services";
import { UserType } from "../../types/entities";
import { AssessmentStatus,  role, TIME_CONSTANTS } from "../../enum/enum";
import { ValidationHelpers, DatabaseHelpers } from "../helpers";


const TeamAssessmentService = {
    getTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
    try {
      // Get the current user's details to check role
      const currentUser = await userRepo.findOne({
        where: { id: leadId },
        relations: ["role"]
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      let teamMemberIds: string[] = [];

      // HR can access all assessments
      if (currentUser.role?.name === role.HR) {
        // For HR users, get all users
        const allUsers = await userRepo.find({
          relations: ["role"]
        });
        teamMemberIds = allUsers.map(user => user.id);
      } else {
        // For non-HR users, validate team lead status  
        if (!await ValidationHelpers.validateTeamLead(leadId)) {
          throw new Error("Only team leads and HR can access team assessments");
        }

        // Get team members under this lead
        const teamMembers = await userRepo.find({
          where: { leadId: leadId },
          relations: ["role"]
        });

        if (teamMembers.length === 0) {
          return [];
        }

        teamMemberIds = teamMembers.map(member => member.id);
      }

      // Get assessments for team members
      const assessments = await assessmentRequestRepo.find({
        where: {
          userId: In(teamMemberIds)
        },
        relations: ["user", "user.role", "cycle"],
        order: { requestedAt: "DESC" }
      });

      // Get detailed scores and history for each assessment in parallel
      const assessmentPromises = assessments.map(async (assessment) => {
        const { scores, history } = await DatabaseHelpers.getAssessmentScoresAndHistory(assessment.id);

        // Check if this assessment was recently rejected
        const latestAudit = history.length > 0 ? history[history.length - 1] : null;
        const wasRecentlyRejected = latestAudit?.auditType === 'EMPLOYEE_REJECTED';

        return {
          ...assessment,
          detailedScores: scores,
          history: history,
          currentCycle: assessment.currentCycle,
          isAccessible: true,
          wasRecentlyRejected: wasRecentlyRejected,
          rejectionReason: wasRecentlyRejected ? latestAudit?.comments : undefined
        };
      });

      const assessmentsWithHistory = await Promise.all(assessmentPromises);
      return assessmentsWithHistory;
    } catch (error: any) {
      throw new Error(`Failed to get team assessments: ${error.message}`);
    }
    },

  // Get team members (for Team Lead and HR)
    getTeamMembers: async (leadId: string): Promise<UserType[]> => {
    try {
      // Get the current user's details to check role
      const currentUser = await userRepo.findOne({
        where: { id: leadId },
        relations: ["role"]
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      // HR can access all team members
      if (currentUser.role?.name === role.HR) {
        const allUsers = await userRepo.find({
          relations: ["role", "Team", "position"],
          order: { name: "ASC" }
        });
        return allUsers;
      }

      // For non-HR users, validate team lead status
      await ValidationHelpers.validateTeamLead(leadId);

      const teamMembers = await userRepo.find({
        where: { leadId: leadId },
        relations: ["role", "Team", "position"],
        order: { name: "ASC" }
      });

      return teamMembers;
    } catch (error: any) {
      throw new Error(`Failed to get team members: ${error.message}`);
    }
    },

    // Get team assessment statistics (for Team Lead)
    getTeamAssessmentStatistics: async (leadId: string): Promise<any> => {
      try {
        // Validate team lead
        if (!ValidationHelpers.validateTeamLead(leadId)) {
          throw new Error("Only team leads can access team statistics");
        }
  
        // Get team members
        const teamMembers = await userRepo.find({
          where: { leadId: leadId },
          relations: ["role"]
        });
  
        if (teamMembers.length === 0) {
          return {
            totalTeamMembers: 0,
            assessments: { total: 0, byStatus: {} },
            averageScores: {},
            recentActivity: []
          };
        }
  
        const teamMemberIds = teamMembers.map(member => member.id);
  
        // Get assessments for team
        const teamAssessments = await assessmentRequestRepo.find({
          where: { userId: In(teamMemberIds) },
          relations: ["user"]
        });        // Calculate statistics using optimized filtering
          const statusCounts = {
            initiated: 0,
            leadWriting: 0,
            employeeReview: 0,
            completed: 0
          };
  
          let pendingActions = 0;
          let recentAssessments = 0;
          const thirtyDaysAgo = new Date(Date.now() - TIME_CONSTANTS.THIRTY_DAYS_MS);
  
          // Single pass through assessments for all calculations
          teamAssessments.forEach(assessment => {
            // Count by status
            switch (assessment.status) {
              case AssessmentStatus.INITIATED:
                statusCounts.initiated++;
                pendingActions++;
                break;
              case AssessmentStatus.LEAD_WRITING:
                statusCounts.leadWriting++;
                pendingActions++;
                break;
              case AssessmentStatus.EMPLOYEE_REVIEW:
                statusCounts.employeeReview++;
                break;
              case AssessmentStatus.COMPLETED:
                statusCounts.completed++;
                break;
            }
  
            // Count recent assessments
            if (assessment.requestedAt >= thirtyDaysAgo) {
              recentAssessments++;
            }
          });
  
          const statistics = {
            totalTeamMembers: teamMembers.length,
            assessments: {
              total: teamAssessments.length,
              byStatus: statusCounts
            },
            pendingActions,
            recentAssessments
          };
  
        return statistics;
      } catch (error: any) {
        throw new Error(`Failed to get team statistics: ${error.message}`);
      }
    },
  

    // Get assessment for specific team member (with team validation)
    getTeamMemberAssessment: async (leadId: string, targetUserId: string): Promise<AssessmentWithHistory[]> => {
      try {
        // Get the current user's details to check role
        const currentUser = await userRepo.findOne({
          where: { id: leadId },
          relations: ["role"]
        });

        if (!currentUser) {
          throw new Error("User not found");
        }

        // HR can access any user's assessments
        if (currentUser.role?.name === role.HR) {
          // For HR users, bypass team validation and get assessments directly
          const assessments = await assessmentRequestRepo.find({
            where: { userId: targetUserId },
            relations: ["user", "user.role", "cycle"],
            order: { requestedAt: "DESC" }
          });

          const assessmentsWithHistory = [];
          for (const assessment of assessments) {
            const { scores, history } = await DatabaseHelpers.getAssessmentScoresAndHistory(assessment.id);

            assessmentsWithHistory.push({
              ...assessment,
              detailedScores: scores,
              history: history,
              currentCycle: assessment.currentCycle,
              isAccessible: true
            });
          }

          return assessmentsWithHistory;
        }

        // For non-HR users, validate team lead status
        if (!await ValidationHelpers.validateTeamLead(leadId)) {
          throw new Error("Only team leads and HR can access team member assessments");
        }
  
        // Validate that target user is in the team (for team leads)
        const targetUser = await userRepo.findOne({
          where: { id: targetUserId, leadId: leadId },
          relations: ["role"]
        });
  
        if (!targetUser) {
          throw new Error("User not found in your team or access denied");
        }
  
        // Get assessments for this team member
        const assessments = await assessmentRequestRepo.find({
          where: { userId: targetUserId },
          relations: ["user", "user.role","cycle"],
          order: { requestedAt: "DESC" }
        });
  
        // Add detailed scores and history
        const assessmentsWithHistory = [];
        for (const assessment of assessments) {
          const { scores, history } = await DatabaseHelpers.getAssessmentScoresAndHistory(assessment.id);
  
          assessmentsWithHistory.push({
            ...assessment,
            detailedScores: scores,
            history: history,
            currentCycle: assessment.currentCycle,
            isAccessible: true
          });
        }
  
        return assessmentsWithHistory;
      } catch (error: any) {
        throw new Error(`Failed to get team member assessment: ${error.message}`);
      }
    },

      // Get team summary for HR
    getTeamSummary: async (teamId: number): Promise<any> => {
        try {
          // Get team members
          const teamMembers = await userRepo.find({
            where: { teamId: teamId },
            relations: ["role", "Team"]
          });
    
          if (teamMembers.length === 0) {
            return {
              teamId: teamId,
              teamName: "Unknown Team",
              totalMembers: 0,
              assessments: { total: 0, byStatus: {} },
              recentActivity: []
            };
          }
    
          const teamMemberIds = teamMembers.map(member => member.id);
          const teamName = teamMembers[0].Team?.name || "Unknown Team";
    
          // Get assessments for team
          const teamAssessments = await assessmentRequestRepo.find({
            where: { userId: In(teamMemberIds) },
            relations: ["user"],
            order: { requestedAt: "DESC" }
          });
    
          // Calculate team statistics
          const summary = {
            teamId: teamId,
            teamName: teamName,
            totalMembers: teamMembers.length,
            assessments: {
              total: teamAssessments.length,
              byStatus: {
                initiated: teamAssessments.filter(a => a.status === AssessmentStatus.INITIATED).length,
                leadWriting: teamAssessments.filter(a => a.status === AssessmentStatus.LEAD_WRITING).length,
                employeeReview: teamAssessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_REVIEW).length,
                completed: teamAssessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
                cancelled: teamAssessments.filter(a => a.status === AssessmentStatus.Cancelled).length,
              }
            },
            recentActivity: teamAssessments.slice(0, 10), // Last 10 assessments
            activeAssessments: teamAssessments.filter(a => 
              ![AssessmentStatus.COMPLETED, AssessmentStatus.Cancelled].includes(a.status)
            ).length
          };
    
          return summary;
        } catch (error: any) {
          throw new Error(`Failed to get team summary: ${error.message}`);
        }
    },

        // Get pending team assessments (for Team Lead and HR)
    getPendingTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
      try {
        // Get the current user's details to check role
        const currentUser = await userRepo.findOne({
          where: { id: leadId },
          relations: ["role"]
        });

        if (!currentUser) {
          throw new Error("User not found");
        }

        let teamMemberIds: string[] = [];

        // HR can access all pending assessments
        if (currentUser.role?.name === role.HR) {
          const allUsers = await userRepo.find({
            relations: ["role"]
          });
          teamMemberIds = allUsers.map(user => user.id);
        } else {
          // For non-HR users, validate team lead status
          await ValidationHelpers.validateTeamLead(leadId);
    
          // Get team members
          const teamMembers = await userRepo.find({
            where: { leadId: leadId }
          });
    
          if (teamMembers.length === 0) {
            return [];
          }
    
          teamMemberIds = teamMembers.map(member => member.id);
        }
  
        // Get pending assessments for team - only those requiring TL action
        const pendingAssessments = await assessmentRequestRepo.find({
          where: {
            userId: In(teamMemberIds),
            status: In([
              AssessmentStatus.INITIATED,
              AssessmentStatus.LEAD_WRITING
            ])
          },
          relations: ["user", "user.role","cycle"],
          order: { scheduledDate: "ASC" }
        });
  
        // Process assessments in parallel
        const assessmentPromises = pendingAssessments.map(async (assessment) => {
          const { scores, history } = await DatabaseHelpers.getAssessmentScoresAndHistory(assessment.id);
  
          // Check if this assessment was recently rejected
          const latestAudit = history.length > 0 ? history[history.length - 1] : null;
          const wasRecentlyRejected = latestAudit?.auditType === 'EMPLOYEE_REJECTED';
  
          return {
            ...assessment,
            detailedScores: scores,
            history: history,
            currentCycle: assessment.currentCycle,
            isAccessible: true,
            wasRecentlyRejected: wasRecentlyRejected,
            rejectionReason: wasRecentlyRejected ? latestAudit?.comments : undefined
          };
        });
  
        const assessmentsWithHistory = await Promise.all(assessmentPromises);
  
        // Sort assessments: recently rejected ones first, then by scheduled date
        return assessmentsWithHistory.sort((a, b) => {
          if (a.wasRecentlyRejected && !b.wasRecentlyRejected) return -1;
          if (!a.wasRecentlyRejected && b.wasRecentlyRejected) return 1;
          const aDate = new Date(a.scheduledDate ?? a.requestedAt);
          const bDate = new Date(b.scheduledDate ?? b.requestedAt);
          return aDate.getTime() - bDate.getTime();
        });
      } catch (error: any) {
        throw new Error(`Failed to get pending team assessments: ${error.message}`);
      }
    },

    // Check if user can access specific assessment
    checkAssessmentAccess: async (currentUserId: string, currentUserRole: string, assessmentId: number): Promise<boolean> => {
      try {
        // HR can access all assessments
        if (currentUserRole === role.HR) {
          return true;
        }

        // Get the assessment to check who it belongs to
        const assessment = await assessmentRequestRepo.findOne({
          where: { id: assessmentId },
          relations: ["user"]
        });

        if (!assessment) {
          throw new Error("Assessment not found");
        }

        // If user is the assessment owner, they can access it
        if (assessment.userId === currentUserId) {
          return true;
        }

        // If user is a team lead, check if they can access team member assessments
        if (await ValidationHelpers.validateTeamLead(currentUserId)) {
          // Get team members under this lead
          const teamMembers = await userRepo.find({
            where: { leadId: currentUserId }
          });

          const teamMemberIds = teamMembers.map(member => member.id);
          return teamMemberIds.includes(assessment.userId);
        }

        return false;
      } catch (error: any) {
        console.error(`Error checking assessment access: ${error.message}`);
        return false;
      }
    },

    // Check if user can access specific user's assessment history
    checkUserAssessmentAccess: async (currentUserId: string, currentUserRole: string, targetUserId: string): Promise<boolean> => {
      try {
        // HR can access all user assessment histories
        if (currentUserRole === role.HR) {
          return true;
        }

        // User can access their own assessment history
        if (currentUserId === targetUserId) {
          return true;
        }

        // If user is a team lead, check if target user is their team member
        if (await ValidationHelpers.validateTeamLead(currentUserId)) {
          const teamMembers = await userRepo.find({
            where: { leadId: currentUserId }
          });

          const teamMemberIds = teamMembers.map(member => member.id);
          return teamMemberIds.includes(targetUserId);
        }

        return false;
      } catch (error: any) {
        console.error(`Error checking user assessment access: ${error.message}`);
        return false;
      }
    },
  
  };

export default TeamAssessmentService;