import { EntitySchema } from "typeorm";
import { targetType } from "../types/entities";

export const SkillTarget = new EntitySchema<targetType>({
  name: "target",
  tableName: "target",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    fromLevel: {
      type: "int",
    },
    toLevel: {
      type: "int",
    },
    userId:{
        type: 'string',
    },
    skillId: {
      type: "int",
    }
  },
  relations: {
    skill: {
        target: "Skill",
        type: "many-to-one",
        joinColumn: { name: "skillId" },
        onDelete: "CASCADE",
    },
    user:{
        target: "User",
        type: "many-to-one",
        joinColumn: { name: "userId" },
        onDelete: "CASCADE",
    }
  },
});