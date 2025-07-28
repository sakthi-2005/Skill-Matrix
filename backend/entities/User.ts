import { EntitySchema } from "typeorm";
import { UserType } from "../types/entities";

export const User = new EntitySchema<UserType>({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "varchar",
      unique: true,
    },
    userId: {
      type: "varchar",
      unique: true,
      nullable: false,
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    roleId: {
      type: "integer",
      name: "role_id",
      nullable: true,
    },
    teamId: {
      type: "integer",
      name: "team_id",
      nullable: true,
    },
    subTeamId:{
      type: "integer",
      name: "subTeam_id",
      nullable: true
    },
    positionId: {
      type: "integer",
      name: "position_id",
      nullable: true,
    },
    leadId: {
      type: "integer",
      nullable: true,
      name: "lead_id",
    },
    hrId: {
      type: "integer",
      nullable: true,
      name: "hr_id",
    },
    profilePhoto: {
      type: "text",
      nullable: true,
    },
        // DottedLineManager: {
    //   type: "varchar",
    //   nullable: true,
    //   name: "dotted_line_manager"
    // },
    // Band : {
    //   type: "varchar",
    //   nullable: true
    // },
    // internAssociateId:{
    //   type: "varchar",
    //   nullable: true,
    //   name: "intern_associate_id"
    // },
    // pip :{
    //   type: "varchar",
    //   nullable: true,
    // },
    isActive: {
      type: "boolean",
      default: true,
      name: "is_active",
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
      name: "updated_at",
    }
  },
  relations: {
    lead: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "lead_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL"
    },
    hr: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "hr_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL"
    },
    Requests: {
      target: "AssessmentRequest",
      type: "one-to-many",
      inverseSide: "user",
    },
    role: {
      target: "Role",
      type: "many-to-one",
      joinColumn: {
        name: "role_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL"
    },
    position: {
      target: "Position",
      type: "many-to-one",
      joinColumn: {
        name: "position_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL"
    },
    Team: {
      target: "Team",
      type: "many-to-one",
      joinColumn: {
        name: "team_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL"
    },
    subTeam: {
      target: "subTeam",
      type: "many-to-one",
      joinColumn: {
        name: "subTeam_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL"
    },
    Audit: {
      target: "Audit",
      type: "one-to-many",
      inverseSide: "User",
    },
    target: {
      target: "target",
      type: "one-to-many",
      inverseSide: "user",
    }
  },
});