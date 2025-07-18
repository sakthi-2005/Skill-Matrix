import { ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../../types/hapi';
import { HTTP_STATUS, MESSAGES, AssessmentScheduleType, TIME_CONSTANTS } from '../../enum/enum';
import AssessmentCycleService from '../../services/cycle/AssessmentCycleService';
import { ValidationHelpers, ResponseHelpers } from "../helper/";

const AssessmentCycleController: Controller = {
  // ===== NEW TEAM-BASED BULK ASSESSMENT METHODS =====
  // HR initiates bulk assessment for all users or specific teams
  initiateBulkAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const {assessmentTitle, includeTeams, scheduledDate, scheduleType, deadlineDays, comments, excludeUsers } = req.payload as {
        assessmentTitle: string;
        includeTeams: string[];
        scheduledDate?: string;
        scheduleType?: AssessmentScheduleType;
        deadlineDays?: number;
        comments?: string;
        excludeUsers?: string[];
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
      
      const result = await AssessmentCycleService.initiateBulkAssessment(
        hrId,
        assessmentTitle,
        includeTeams,
        scheduledDate ? new Date(scheduledDate) : undefined,
        scheduleType ?? AssessmentScheduleType.QUARTERLY,
        finalDeadlineDays,
        comments ?? "",
        excludeUsers ?? []
      );

      return ResponseHelpers.success(
        h, 
        result, 
        MESSAGES.SUCCESS.BULK_ASSESSMENT_INITIATED, 
        HTTP_STATUS.CREATED
      );
    } catch (error: any) {
      console.error("Error initiating bulk assessment:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Get assessment cycles (for HR)
  getAssessmentCycles: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const cycles = await AssessmentCycleService.getAssessmentCycles();

      return ResponseHelpers.success(h, cycles, MESSAGES.SUCCESS.ASSESSMENT_CYCLES_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting assessment cycles:", error);
      return ResponseHelpers.error(h, error.message);
    }
  },

  // Get specific assessment cycle details
  getAssessmentCycleDetails: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { cycleId } = req.params;
      const parsedId = ValidationHelpers.validateCycleId(cycleId);
      
      const cycle = await AssessmentCycleService.getAssessmentCycleDetails(parsedId);

      return ResponseHelpers.success(h, cycle, MESSAGES.SUCCESS.CYCLE_DETAILS_RETRIEVED);
    } catch (error: any) {
      console.error("Error getting assessment cycle details:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },

  // Cancel assessment cycle (for HR)
  cancelAssessmentCycle: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { cycleId } = req.params;
      const { comments } = req.payload as { comments?: string };
      
      const parsedId = ValidationHelpers.validateCycleId(cycleId);
      const hrId = req.auth.credentials.user.id;
      
      const result = await AssessmentCycleService.cancelAssessmentCycle(hrId, parsedId, comments);

      return ResponseHelpers.success(h, result, MESSAGES.SUCCESS.CYCLE_CANCELLED);
    } catch (error: any) {
      console.error("Error cancelling assessment cycle:", error);
      const errorCode = ResponseHelpers.determineErrorCode(error.message);
      return ResponseHelpers.error(h, error.message, errorCode);
    }
  },
};

export default AssessmentCycleController;