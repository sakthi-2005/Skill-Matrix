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
      unique: true,
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
  },
  relations: {
    user: {
      target: "User",
      type: "one-to-many",
      inverseSide: "Team",
    },
    subteam: {
      target: "subTeam",
      type: "one-to-many",
      inverseSide: 'teams'
    }
  }
});