import { In } from "typeorm";
import { assessmentRequestRepo, scoreRepo, userRepo, AuditRepo } from "../../config/dataSource";
import { AssessmentWithHistory } from "../../types/services";
import { UserType } from "../../types/entities";
import { AssessmentStatus,  role, TIME_CONSTANTS } from "../../enum/enum";
import { ValidationHelpers, DatabaseHelpers } from "../helpers";


const TeamAssessmentService = {
    getTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
    try {
      // Validate team lead
      
      if (!await ValidationHelpers.validateTeamLead(leadId)) {
        throw new Error("Only team leads can access team assessments");
      }

      // Get team members under this lead
      const teamMembers = await userRepo.find({
        where: { leadId: leadId },
        relations: ["role"]
      });

      if (teamMembers.length === 0) {
        return [];
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Get assessments for team members only
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

  // Get team members (for Team Lead)
    getTeamMembers: async (leadId: string): Promise<UserType[]> => {
    try {
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
        // Validate team lead
        if (!await ValidationHelpers.validateTeamLead(leadId)) {
          throw new Error("Only team leads can access team member assessments");
        }
  
        // Validate that target user is in the team
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
          const scores = await scoreRepo.find({
            where: { assessmentId: assessment.id },
            relations: ["Skill"]
          });
  
          const history = await AuditRepo.find({
            where: { assessmentId: assessment.id },
            order: { auditedAt: "ASC" }
          });
  
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

        // Get pending team assessments (for Team Lead)
    getPendingTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
      try {
        await ValidationHelpers.validateTeamLead(leadId);
  
        // Get team members
        const teamMembers = await userRepo.find({
          where: { leadId: leadId }
        });
  
        if (teamMembers.length === 0) {
          return [];
        }
  
        const teamMemberIds = teamMembers.map(member => member.id);
  
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
  
};

export default TeamAssessmentService;