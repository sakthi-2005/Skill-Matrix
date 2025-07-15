import { EntitySchema } from "typeorm";
import { TeamType } from "../types/entities";

export const Team = new EntitySchema<TeamType>({
  name: "Team",
  tableName: "teams",
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
    users: {
      target: "User",
      type: "one-to-many",
      inverseSide: "Team",
    },
    subTeams: {
      target: "SubTeam",
      type: "one-to-many",
      inverseSide: "Team",
    },
  },
  indices: [
    {
      name: "IDX_TEAM_NAME",
      columns: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ],
});