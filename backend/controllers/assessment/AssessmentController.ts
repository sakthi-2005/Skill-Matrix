import AssessmentService from "../../services/assessment/AssessmentService";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../../types/hapi';
import { LeadSkillAssessmentData } from '../../types/services';
import { HTTP_STATUS, MESSAGES, role, AssessmentStatus, AssessmentScheduleType, TIME_CONSTANTS } from '../../enum/enum';
import { ValidationHelpers, ResponseHelpers, StatisticsHelpers } from "../../controllers/helper/index";

const AssessmentController: Controller = {
  // HR initiates assessment for employee or TL
  initiateAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { targetUserId, skillIds, scheduledDate, scheduleType, deadlineDays, comments } = req.payload as {
        targetUserId: string;
        skillIds: number[];
        scheduledDate?: string;
        scheduleType?: AssessmentScheduleType;
        deadlineDays?: number;
        comments?: string;
      };
      
      const hrId = req.auth.credentials.user.id;
      
      // Validate deadline days if provided
      const finalDeadlineDays = deadlineDays ?? 7;
      if (finalDeadlineDays < TIME_CONSTANTS.MIN_DEADLINE_DAYS || finalDeadlineDays > TIME_CONSTANTS.MAX_DEADLINE_DAYS) {
        return ResponseHelpers.error(
          h, 
          `Deadline days must be between ${TIME_CONSTANTS.MIN_DEADLINE_DAYS} and ${TIME_CONSTANTS.MAX_DEADLINE_DAYS}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
      
      const assessment = await AssessmentService.initiateAssessment(
        hrId,
        targetUserId,
        scheduledDate ? new Date(scheduledDate) : undefined,
        scheduleType ?? AssessmentScheduleType.QUARTERLY,
        finalDeadlineDays,
        comments ?? ""
      );

      return ResponseHelpers.success(
        h, 
        assessment, 
        MESSAGES.SUCCESS.ASSESSMENT_INITIATED, 
        HTTP_STATUS.CREATED
      );
    } catch (error: any) {
      console.error("Error initiating assessment:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Lead writes assessment for team member
  writeLeadAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { skillScores, comments } = req.payload as {
        skillScores: LeadSkillAssessmentData[];
        comments?: string;
      };
      
      // Validate assessmentId parameter
      const parsedId = ValidationHelpers.validateAssessmentId(assessmentId);
      
      const leadId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.writeLeadAssessment(
        leadId,
        parsedId,
        skillScores,
        comments ?? ""
      );

      return ResponseHelpers.success(
        h, 
        assessment, 
        MESSAGES.SUCCESS.LEAD_ASSESSMENT_WRITTEN
      );
    } catch (error: any) {
      console.error("Error writing lead assessment:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Employee reviews and approves/rejects assessment
  employeeReviewAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { approved, comments } = req.payload as {
        approved: boolean;
        comments?: string;
      };
      
      // Validate assessmentId parameter
      const parsedId = ValidationHelpers.validateAssessmentId(assessmentId);
      
      const employeeId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.employeeReviewAssessment(
        employeeId,
        parsedId,
        approved,
        comments ?? ""
      );

      return ResponseHelpers.success(
        h, 
        assessment, 
        MESSAGES.SUCCESS.EMPLOYEE_REVIEW_COMPLETED(approved)
      );
    } catch (error: any) {
      console.error("Error reviewing assessment:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // HR final review
  hrFinalReview: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { approved, comments } = req.payload as {
        approved: boolean;
        comments?: string;
      };
      
      // Validate assessmentId parameter
      const parsedId = ValidationHelpers.validateAssessmentId(assessmentId);
      
      const hrId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.hrFinalReview(
        hrId,
        parsedId,
        approved,
        comments ?? ""
      );

      return ResponseHelpers.success(
        h, 
        assessment, 
        MESSAGES.SUCCESS.HR_REVIEW_COMPLETED(approved)
      );
    } catch (error: any) {
      console.error("Error in HR final review:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

      // Cancel assessment (updated for new workflow)
  cancelAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { comments } = req.payload as { comments?: string };
      const currentUserId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role;
      
      const parsedId = ValidationHelpers.validateAssessmentId(assessmentId);
      ValidationHelpers.validateHRRole(userRole);
      
      const assessment = await AssessmentService.getAssessmentWithHistory(parsedId);
      
      if (!assessment) {
        return ResponseHelpers.error(h, "Assessment not found", HTTP_STATUS.NOT_FOUND);
      }
      
      // Cannot cancel completed assessments
      if (assessment.status === AssessmentStatus.COMPLETED) {
        return ResponseHelpers.error(h, MESSAGES.ERROR.CANNOT_CANCEL_COMPLETED, HTTP_STATUS.BAD_REQUEST);
      }
      
      const result = await AssessmentService.cancelAssessment(parsedId);

      return ResponseHelpers.success(h, result, MESSAGES.SUCCESS.ASSESSMENT_CANCELLED);
    } catch (error: any) {
      console.error("Error cancelling assessment:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

    // Get assessment with full history
  getAssessmentWithHistory: async (req: Request, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const parsedId = ValidationHelpers.validateAssessmentId(assessmentId);
      
      const assessment = await AssessmentService.getAssessmentWithHistory(parsedId);

      return ResponseHelpers.success(h, assessment);
    } catch (error: any) {
      console.error("Error getting assessment with history:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get assessments for specific user role
  getAssessmentsForRole: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role;
      
      const assessments = await AssessmentService.getAssessmentsForRole(
        userId,
        userRole?.name as role
      );

      return ResponseHelpers.success(h, assessments);
    } catch (error: any) {
      console.error("Error getting assessments for role:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get assessments requiring action from specific user
  getAssessmentsRequiringAction: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      
      const assessments = await AssessmentService.getAssessmentsRequiringAction(
        userId
      );

      return ResponseHelpers.success(h, assessments);
    } catch (error: any) {
      console.error("Error getting assessments requiring action:", error);
      return ResponseHelpers.error(h, error.message);
    }
  },



        // Get user assessment history (for history modal)
  getUserAssessmentHistory: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      const userRole = req.auth.credentials.user.role;
      
      ValidationHelpers.validateHRRole(userRole);
      
      if (!userId) {
        return ResponseHelpers.error(h, MESSAGES.ERROR.USER_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST);
      }
      
      const history = await AssessmentService.getUserAssessmentHistory(userId);
      
      return ResponseHelpers.success(h, history);
    } catch (error: any) {
      console.error("Error getting user assessment history:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get assessment score change history
  getAssessmentScoreHistory: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params as { assessmentId: string };
      
      if (!assessmentId) {
        return ResponseHelpers.error(h, "Assessment ID is required", HTTP_STATUS.BAD_REQUEST);
      }

      const scoreHistory = await AssessmentService.getAssessmentScoreHistory(parseInt(assessmentId));

      return ResponseHelpers.success(h, scoreHistory);
    } catch (error: any) {
      console.error("Error getting assessment score history:", error);
      return ResponseHelpers.error(h, error.message);
    }
  },

  // STOP

    // Check if assessment is accessible
  checkAssessmentAccessibility: async (req: Request, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const parsedId = ValidationHelpers.validateAssessmentId(assessmentId);
      
      const isAccessible = await AssessmentService.isAssessmentAccessible(parsedId);

      return ResponseHelpers.success(h, { isAccessible });
    } catch (error: any) {
      console.error("Error checking assessment accessibility:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

    // Get dashboard data for different user roles
  getDashboardData: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role;
      
      // Parallelize independent DB calls
      const [pendingAssessments, roleAssessments] = await Promise.all([
        AssessmentService.getAssessmentsRequiringAction(userId),
        AssessmentService.getAssessmentsForRole(userId, userRole?.name as role)
      ]);
      
      // Calculate dashboard data using helper
      const dashboardData = StatisticsHelpers.calculateDashboardData(pendingAssessments, roleAssessments);

      return ResponseHelpers.success(h, dashboardData);
    } catch (error: any) {
      console.error("Error getting dashboard data:", error);
      return ResponseHelpers.error(h, error.message);
    }
  },

    // Get assessment statistics (for HR dashboard)
  getAssessmentStatistics: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userRole = req.auth.credentials.user.role;
      ValidationHelpers.validateHRRole(userRole);
      
      const userId = req.auth.credentials.user.id;
      const allAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole?.name as role);
      
      // Calculate statistics using helper
      const statistics = StatisticsHelpers.calculateAssessmentStatistics(allAssessments);

      return ResponseHelpers.success(h, statistics);
    } catch (error: any) {
      console.error("Error getting assessment statistics:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  getUserLatestApprovedScores: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const scores = await AssessmentService.getUserLatestApprovedScores(userId);
      
      return ResponseHelpers.success(h, scores);
    } catch (error: any) {
      console.error("Error getting user's latest approved scores:", error);
      return ResponseHelpers.error(h, error.message, HTTP_STATUS.NOT_FOUND);
    }
  },

  getUserLatestApprovedScoresByUserId: async (req: AuthRequest, h: ResponseToolkit) => {
      try {
        const { userId } = req.params;
        
        if (!userId) {
          return ResponseHelpers.error(h, MESSAGES.ERROR.USER_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST);
        }
        
        const scores = await AssessmentService.getUserLatestApprovedScores(userId);
        
        return ResponseHelpers.success(h, scores);
      } catch (error: any) {
        console.error("Error getting user's latest approved scores by ID:", error);
        return ResponseHelpers.error(h, error.message, HTTP_STATUS.NOT_FOUND);
      }
    },

      // Get user assessment summaries (for HR All Assessments view)
  getUserAssessmentSummaries: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userRole = req.auth.credentials.user.role;
      
      // Only HR can access user assessment summaries
      if (userRole?.name !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can access user assessment summaries",
          })
          .code(403);
      }
      
      const summaries = await AssessmentService.getUserAssessmentSummaries();
      
      return h
        .response({
          success: true,
          data: summaries,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting user assessment summaries:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },
};

export default AssessmentController;