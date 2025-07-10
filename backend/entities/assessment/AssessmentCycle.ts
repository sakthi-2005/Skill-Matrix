import { EntitySchema } from "typeorm";
import { AssessmentCycleType } from "../../types/entities";
import { AssessmentScheduleType } from "../../enum/enum";

export const AssessmentCycle = new EntitySchema<AssessmentCycleType>({
  name: "AssessmentCycle",
  tableName: "assessment_cycles",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
      length: 255,
    },
    createdBy: {
      type: String,
      name: "created_by",
    },
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
    status: {
      type: "enum",
      enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    comments: {
      type: "text",
      nullable: true,
    },
    targetTeams: {
      type: "simple-array",
      name: "target_teams",
      nullable: true,
    },
    excludedUsers: {
      type: "simple-array",
      name: "excluded_users",
      nullable: true,
    },
    totalAssessments: {
      type: Number,
      name: "total_assessments",
      default: 0,
    },
    completedAssessments: {
      type: Number,
      name: "completed_assessments",
      default: 0,
    },
    createdAt: {
      type: "timestamp",
      name: "created_at",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      name: "updated_at",
      updateDate: true,
    },
    cycleNumber: {
      type: Number,
      name: "cycle_number",
      default: 1,
      comment: "Assessment cycle number for tracking multiple assessment cycles"
    },
  },
  relations: {
    assessments: {
      type: "one-to-many",
      target: "AssessmentRequest",
      inverseSide: "cycle",
    },
    cycleSkills: {
      type: "one-to-many",
      target: "AssessmentCycleSkill",
      inverseSide: "cycle",
    },
  },
});

export default AssessmentCycle;
