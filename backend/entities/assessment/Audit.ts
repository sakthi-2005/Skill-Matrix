import { EntitySchema } from "typeorm";
import { AuditType } from '../../types/entities';

export const Audit = new EntitySchema<AuditType>({
  name: "Audit",
  tableName: "audit",
  columns: {
    // Primary Key
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    
    // Core audit information
    assessmentId: {
      type: "int",
      name: "assessment_id",
    },
    auditType: {
      type: "varchar",
      length: 50,
      nullable: true,
      name: "audit_type",
    },
    
    // User information
    editorId: {
      type: "int",
      name: "editor_id",
    },
    userId: {
      type: "varchar",
      length: 50,
      nullable: true,
      name: "user_id",
    },
    commentedBy: {
      type: "varchar",
      length: 50,
      nullable: true,
      name: "commented_by",
    },
    
    // Assessment context
    cycleNumber: {
      type: "int",
      nullable: true,
      name: "cycle_number",
    },
    status: {
      type: "varchar",
      length: 50,
      nullable: true,
      name: "status",
    },
    
    // Score tracking (for score-related audits)
    skillName: {
      type: "varchar",
      length: 100,
      nullable: true,
      name: "skill_name",
    },
    previousScore: {
      type: "decimal",
      precision: 3,
      scale: 1,
      nullable: true,
      name: "previous_score",
    },
    currentScore: {
      type: "decimal",
      precision: 3,
      scale: 1,
      nullable: true,
      name: "current_score",
    },
    
    // Comments and notes
    comments: {
      type: "text",
      nullable: true,
      name: "comments",
    },
    
    // Timestamps
    auditedAt: {
      type: "timestamp",
      name: "audited_at",
    },
    createdAt: {
      type: "timestamp",
      name: "created_at",
    }
  },
  relations: {
    editor: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "editor_id"
      },
      onDelete: "CASCADE",
    },
    assessmentRequest: {
      target: "AssessmentRequest",
      type: "many-to-one",
      joinColumn: {
        name: "assessment_id"
      },
      onDelete: "CASCADE",
    }
  },
  indices: [
    {
      name: "IDX_AUDIT_ASSESSMENT_ID",
      columns: ["assessmentId"]
    },
    {
      name: "IDX_AUDIT_EDITOR_ID", 
      columns: ["editorId"]
    },
    {
      name: "IDX_AUDIT_USER_ID",
      columns: ["userId"]
    },
    {
      name: "IDX_AUDIT_TYPE",
      columns: ["auditType"]
    },
    {
      name: "IDX_AUDIT_AUDITED_AT",
      columns: ["auditedAt"]
    },
    {
      name: "IDX_AUDIT_CYCLE_NUMBER",
      columns: ["cycleNumber"]
    }
  ],
});