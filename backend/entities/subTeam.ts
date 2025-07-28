import { EntitySchema } from "typeorm";
import { subTeamType } from "../types/entities";
 
export const subTeam = new EntitySchema<subTeamType>({
  name: "subTeam",
  tableName: "subteams",
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
    teamId: {
      type: "int",
      name: "team_id",
      nullable: true
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
      inverseSide: "subTeam",
    },
    teams: {
      target: "Team",
      type: "many-to-one",
      joinColumn: {
        name: "team_id",
        referencedColumnName: "id",
      },
      onDelete:"SET NULL"
    },
  },
});
 