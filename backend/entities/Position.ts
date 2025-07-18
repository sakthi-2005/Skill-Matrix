import { EntitySchema } from "typeorm";
import { PositionType } from "../types/entities";

export const Position = new EntitySchema<PositionType>({
  name: "Position",
  tableName: "positions",
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
    roleId: {
      type: "integer",
      name: "role_id"
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
      inverseSide: "position",
    },
    role: {
      target: "Role",
      type: "many-to-one",
      joinColumn: {
        name: "role_id",
        referencedColumnName: "id",
      },
    },
    skill: {
      target: "Skill",
      type: "one-to-many",
      inverseSide: "position"
    }
  }
});