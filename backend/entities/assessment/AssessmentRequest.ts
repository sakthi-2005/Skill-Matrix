import { EntitySchema } from "typeorm";
import { AssessmentStatus, AssessmentScheduleType } from "../../enum/enum";
import { AssessmentRequestType } from "../../types/entities";

export const AssessmentRequest = new EntitySchema<AssessmentRequestType>({
  name: "AssessmentRequest",
  tableName: "assessment_requests",
  columns: {
    // Primary Key
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    
    // Core Assessment Information
    userId: {
      type: String,
      name: "user_id",
    },
    cycleId: {
      type: Number,
      name: "cycle_id",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: AssessmentStatus,
      default: AssessmentStatus.INITIATED,
    },
    initiatedBy: {
      type: String,
      name: "initiated_by",
    },
    nextApprover: {
      type: Number,
      name: "next_approver",
      nullable: true,
    },
    
    // Scheduling Information
    scheduledDate: {
      type: "timestamp",
      name: "scheduled_date",
      nullable: true,
    },
    scheduleType: {
      type: "enum",
      enum: AssessmentScheduleType,
      name: "schedule_type",
      default: AssessmentScheduleType.QUARTERLY,
    },
    deadlineDays: {
      type: Number,
      name: "deadline_days",
      default: 7,
    },
    deadlineDate: {
      type: "timestamp",
      name: "deadline_date",
      nullable: true,
    },
    currentCycle: {
      type: Number,
      name: "current_cycle",
      default: 1,
    },
    nextScheduledDate: {
      type: "timestamp",
      name: "next_scheduled_date",
      nullable: true,
    },
    
    // Timestamps
    requestedAt: {
      type: "timestamp",
      name: "requested_at",
      createDate: true,
    },
    completedAt: {
      type: "timestamp",
      name: "completed_at",
      nullable: true,
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "user_id",
      },
      eager: true,
      onDelete:'CASCADE'
    },
    cycle: {
      type: "many-to-one",
      target: "AssessmentCycle",
      joinColumn: {
        name: "cycle_id",
      },
      nullable: true,
    },
    scores: {
      type: "one-to-many",
      target: "Score",
      inverseSide: "assessment",
    },
  },
  indices: [
    {
      name: "IDX_ASSESSMENT_USER_ID",
      columns: ["userId"]
    },
    {
      name: "IDX_ASSESSMENT_STATUS", 
      columns: ["status"]
    },
    {
      name: "IDX_ASSESSMENT_INITIATED_BY",
      columns: ["initiatedBy"]
    },
    {
      name: "IDX_ASSESSMENT_NEXT_APPROVER",
      columns: ["nextApprover"]
    },
    {
      name: "IDX_ASSESSMENT_SCHEDULED_DATE",
      columns: ["scheduledDate"]
    },
    {
      name: "IDX_ASSESSMENT_CYCLE_ID",
      columns: ["cycleId"]
    },
    {
      name: "IDX_ASSESSMENT_CURRENT_CYCLE",
      columns: ["currentCycle"]
    }
  ],
});

// Helper functions for virtual properties (to maintain compatibility)
export const getDetailedScores = (assessment: AssessmentRequestType): any[] => {
  return assessment.scores || [];
};

export const getHistory = (assessment: AssessmentRequestType): any[] => {
  // This would be populated from audit logs in the service layer
  return assessment.history || [];
};

export default AssessmentRequest;