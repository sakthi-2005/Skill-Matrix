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
    subTeamId: {
      type: "integer",
      name: "sub_team_id",
      nullable: true,
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
    },
    deletedAt: {
      type: "timestamp",
      nullable: true,
      name: "deleted_at",
    },
  },
  relations: {
    lead: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "lead_id",
        referencedColumnName: "id",
      },
    },
    hr: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "hr_id",
        referencedColumnName: "id",
      },
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
    },
    position: {
      target: "Position",
      type: "many-to-one",
      joinColumn: {
        name: "position_id",
        referencedColumnName: "id",
      },
    },
    Team: {
      target: "Team",
      type: "many-to-one",
      joinColumn: {
        name: "team_id",
        referencedColumnName: "id",
      },
    },
    SubTeam: {
      target: "SubTeam",
      type: "many-to-one",
      joinColumn: {
        name: "sub_team_id",
        referencedColumnName: "id",
      },
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