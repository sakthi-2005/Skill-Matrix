import { ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../../types/hapi';
import { MESSAGES } from '../../enum/enum';
import { ValidationHelpers, ResponseHelpers } from "../../controllers/helper/index";
import TeamAssessmentService from '../../services/team/TeamAssessmentService';

const TeamAssessmentController: Controller = {
// Get team assessments (for Team Lead)
  getTeamAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const assessments = await TeamAssessmentService.getTeamAssessments(leadId);

      return ResponseHelpers.success(h, assessments, MESSAGES.SUCCESS.TEAM_ASSESSMENTS_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting team assessments:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get team members (for Team Lead)
  getTeamMembers: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const members = await TeamAssessmentService.getTeamMembers(leadId);

      return ResponseHelpers.success(h, members, MESSAGES.SUCCESS.TEAM_MEMBERS_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting team members:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get team assessment statistics (for Team Lead)
  getTeamAssessmentStatistics: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const statistics = await TeamAssessmentService.getTeamAssessmentStatistics(leadId);

      return ResponseHelpers.success(h, statistics, MESSAGES.SUCCESS.TEAM_STATISTICS_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting team assessment statistics:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get pending team assessments (for Team Lead)
  getPendingTeamAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const assessments = await TeamAssessmentService.getPendingTeamAssessments(leadId);

      return ResponseHelpers.success(h, assessments, MESSAGES.SUCCESS.PENDING_ASSESSMENTS_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting pending team assessments:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get team member assessment (for Team Lead)
  getTeamMemberAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      const leadId = req.auth.credentials.user.id;
      
      const assessment = await TeamAssessmentService.getTeamMemberAssessment(leadId, userId);

      return ResponseHelpers.success(h, assessment, MESSAGES.SUCCESS.TEAM_MEMBER_ASSESSMENT_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting team member assessment:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Check access to specific assessment
  checkAssessmentAccess: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role?.name;
      const { assessmentId } = req.params;
      
      const hasAccess = await TeamAssessmentService.checkAssessmentAccess(
        userId, 
        userRole, 
        parseInt(assessmentId)
      );

      return ResponseHelpers.success(h, { hasAccess }, "Access check completed");
    } catch (error: any) {
      console.error("Error checking assessment access:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Check access to user assessment history
  checkUserAssessmentAccess: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const currentUserId = req.auth.credentials.user.id;
      const currentUserRole = req.auth.credentials.user.role?.name;
      const { userId } = req.params;
      
      const hasAccess = await TeamAssessmentService.checkUserAssessmentAccess(
        currentUserId, 
        currentUserRole, 
        userId
      );

      return ResponseHelpers.success(h, { hasAccess }, "Access check completed");
    } catch (error: any) {
      console.error("Error checking user assessment access:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get team summary (for HR)
  getTeamSummary: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { teamId } = req.params;
      const parsedId = ValidationHelpers.validateTeamId(teamId);
      
      const summary = await TeamAssessmentService.getTeamSummary(parsedId);

      return ResponseHelpers.success(h, summary, MESSAGES.SUCCESS.TEAM_SUMMARY_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting team summary:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

};

export default TeamAssessmentController;