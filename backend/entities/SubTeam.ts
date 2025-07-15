import { EntitySchema } from "typeorm";
import { SubTeamType } from "../types/entities";

export const SubTeam = new EntitySchema<SubTeamType>({
  name: "SubTeam",
  tableName: "sub_teams",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
      length: 255,
    },
    description: {
      type: "text",
      nullable: true,
    },
    teamId: {
      type: "int",
      name: "team_id",
    },
    isActive: {
      type: "boolean",
      default: true,
      name: "is_active",
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      name: "created_at",
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
    Team: {
      target: "Team",
      type: "many-to-one",
      joinColumn: {
        name: "team_id",
        referencedColumnName: "id",
      },
    },
    users: {
      target: "User",
      type: "one-to-many",
      inverseSide: "SubTeam",
    },
  },
  indices: [
    {
      name: "IDX_SUB_TEAM_NAME_TEAM",
      columns: ["name", "teamId"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ],
});