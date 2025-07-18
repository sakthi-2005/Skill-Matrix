export enum AssessmentStatus{
    Pending = "Pending",
    Approved = "Approved", 
    Cancelled = "Cancelled",
    Forwarded = "Forwarded",
    
    // New workflow statuses
    INITIATED = 'INITIATED',
    LEAD_WRITING = 'LEAD_WRITING',
    EMPLOYEE_REVIEW = 'EMPLOYEE_REVIEW',
    EMPLOYEE_APPROVED = 'EMPLOYEE_APPROVED',
    EMPLOYEE_REJECTED = 'EMPLOYEE_REJECTED',
    HR_FINAL_REVIEW = 'HR_FINAL_REVIEW',
    COMPLETED = 'COMPLETED'
}

export enum role{
  EMPLOYEE = "employee",
  LEAD = "lead",
  HR = "hr",
}


export enum AssessmentScheduleType {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  HALF_YEARLY = "HALF_YEARLY",
  YEARLY = "YEARLY"
}

// HTTP Status Code Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Response Messages
export const MESSAGES = {
  SUCCESS: {
    ASSESSMENT_INITIATED: "Assessment initiated successfully",
    LEAD_ASSESSMENT_WRITTEN: "Lead assessment written successfully",
    EMPLOYEE_REVIEW_COMPLETED: (approved: boolean) => `Assessment ${approved ? 'approved' : 'rejected'} successfully`,
    HR_REVIEW_COMPLETED: (approved: boolean) => `HR final review completed: ${approved ? 'approved' : 'rejected'}`,
    ASSESSMENT_CANCELLED: "Assessment cancelled successfully",
    BULK_ASSESSMENT_INITIATED: "Bulk assessment initiated successfully",
    ASSESSMENT_CYCLES_RETRIEVED: "Assessment cycles retrieved successfully",
    CYCLE_DETAILS_RETRIEVED: "Assessment cycle details retrieved successfully",
    CYCLE_CANCELLED: "Assessment cycle cancelled successfully",
    TEAM_ASSESSMENTS_RETRIEVED: "Team assessments retrieved successfully",
    TEAM_MEMBERS_RETRIEVED: "Team members retrieved successfully",
    TEAM_STATISTICS_RETRIEVED: "Team assessment statistics retrieved successfully",
    PENDING_ASSESSMENTS_RETRIEVED: "Pending team assessments retrieved successfully",
    TEAM_MEMBER_ASSESSMENT_RETRIEVED: "Team member assessment retrieved successfully",
    TEAM_SUMMARY_RETRIEVED: "Team summary retrieved successfully"
  },
  ERROR: {
    INVALID_ASSESSMENT_ID: "Invalid assessment ID provided",
    ASSESSMENT_ID_MUST_BE_NUMBER: "Assessment ID must be a valid number",
    CYCLE_ID_MUST_BE_NUMBER: "Cycle ID must be a valid number",
    TEAM_ID_MUST_BE_NUMBER: "Team ID must be a valid number",
    USER_ID_REQUIRED: "User ID is required",
    ONLY_HR_STATISTICS: "Only HR can access assessment statistics",
    ONLY_HR_CANCEL: "Only HR can cancel assessments",
    ONLY_HR_SUMMARIES: "Only HR can access user assessment summaries",
    ONLY_HR_HISTORY: "Only HR can access user assessment history",
    LEGACY_METHOD_INITIATE: "Legacy method. Use /initiate instead",
    LEGACY_METHOD_REVIEW: "Legacy method. Use /employee-review/{assessmentId} instead",
    CANNOT_CANCEL_COMPLETED: "Cannot cancel completed assessments"
  }
} as const;

// Constants
export const TIME_CONSTANTS = {
  THREE_MONTHS_MS: 90 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS_MS: 30 * 24 * 60 * 60 * 1000,
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  SCORE_MIN: 1,
  SCORE_MAX: 4,
  MIN_DEADLINE_DAYS: 1,
  MAX_DEADLINE_DAYS: 30
} as const;

export const CRON_SCHEDULES = {
  DAILY_9AM: '0 9 * * *',
  DEADLINE_CHECK: '0 18 * * *' // 6 PM daily for deadline checks
} as const;