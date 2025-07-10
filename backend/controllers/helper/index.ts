import { ResponseToolkit } from '@hapi/hapi';
import { HTTP_STATUS, MESSAGES, role, AssessmentStatus } from '../../enum/enum';

// Validation Helpers
export const ValidationHelpers = {
  validateAssessmentId: (assessmentId: string) => {
    if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
      throw new Error(MESSAGES.ERROR.INVALID_ASSESSMENT_ID);
    }
    
    const parsedId = parseInt(assessmentId);
    if (isNaN(parsedId)) {
      throw new Error(MESSAGES.ERROR.ASSESSMENT_ID_MUST_BE_NUMBER);
    }
    
    return parsedId;
  },

  validateCycleId: (cycleId: string) => {
    const parsedId = parseInt(cycleId);
    if (isNaN(parsedId)) {
      throw new Error(MESSAGES.ERROR.CYCLE_ID_MUST_BE_NUMBER);
    }
    return parsedId;
  },

  validateTeamId: (teamId: string) => {
    const parsedId = parseInt(teamId);
    if (isNaN(parsedId)) {
      throw new Error(MESSAGES.ERROR.TEAM_ID_MUST_BE_NUMBER);
    }
    return parsedId;
  },

  validateHRRole: (userRole: any) => {
    if (userRole?.name !== role.HR) {
      throw new Error(MESSAGES.ERROR.ONLY_HR_STATISTICS);
    }
  }
};

// Response Helpers
export const ResponseHelpers = {
  success: (h: ResponseToolkit, data: any, message?: string, code: number = HTTP_STATUS.OK) => {
    return h.response({
      success: true,
      ...(message && { message }),
      data
    }).code(code);
  },

  error: (h: ResponseToolkit, error: string, code: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
    return h.response({
      success: false,
      error
    }).code(code);
  },

  determineErrorCode: (errorMessage: string): number => {
    if (errorMessage.includes("Only HR can") || errorMessage.includes("not authorized")) {
      return HTTP_STATUS.FORBIDDEN;
    }
    if (errorMessage.includes("not found")) {
      return HTTP_STATUS.NOT_FOUND;
    }
    if (errorMessage.includes("Invalid") || errorMessage.includes("must be") || 
        errorMessage.includes("not in a") || errorMessage.includes("Cannot cancel")) {
      return HTTP_STATUS.BAD_REQUEST;
    }
    if (errorMessage.includes("already has") || errorMessage.includes("already cancelled")) {
      return HTTP_STATUS.CONFLICT;
    }
    return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
};

// Statistics Helpers
export const StatisticsHelpers = {
  calculateAssessmentStatistics: (assessments: any[]) => {
    const statusCounts = {
      initiated: 0,
      leadWriting: 0,
      employeeReview: 0,
      employeeApproved: 0,
      employeeRejected: 0,
      hrFinalReview: 0,
      completed: 0,
      cancelled: 0
    };

    let totalCycles = 0;
    let completedCount = 0;

    // Single pass through assessments for all calculations
    assessments.forEach(assessment => {
      totalCycles += assessment.currentCycle || 0;
      
      switch (assessment.status) {
        case AssessmentStatus.INITIATED:
          statusCounts.initiated++;
          break;
        case AssessmentStatus.LEAD_WRITING:
          statusCounts.leadWriting++;
          break;
        case AssessmentStatus.EMPLOYEE_REVIEW:
          statusCounts.employeeReview++;
          break;
        case AssessmentStatus.EMPLOYEE_APPROVED:
          statusCounts.employeeApproved++;
          break;
        case AssessmentStatus.EMPLOYEE_REJECTED:
          statusCounts.employeeRejected++;
          break;
        case AssessmentStatus.HR_FINAL_REVIEW:
          statusCounts.hrFinalReview++;
          break;
        case AssessmentStatus.COMPLETED:
          statusCounts.completed++;
          completedCount++;
          break;
        case AssessmentStatus.Cancelled:
          statusCounts.cancelled++;
          break;
      }
    });

    return {
      total: assessments.length,
      byStatus: statusCounts,
      averageCycle: assessments.length > 0 ? totalCycles / assessments.length : 0,
      completionRate: assessments.length > 0 ? (completedCount / assessments.length) * 100 : 0
    };
  },

  calculateDashboardData: (pendingAssessments: any[], roleAssessments: any[]) => {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    const recentAssessments = roleAssessments.filter(assessment => 
      assessment.requestedAt >= thirtyDaysAgo
    );

    return {
      pendingActions: pendingAssessments,
      recentAssessments,
      totalAssessments: roleAssessments.length,
      pendingCount: pendingAssessments.length
    };
  }
};




