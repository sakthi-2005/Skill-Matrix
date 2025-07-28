import { EntitySchema } from "typeorm";
import { SkillType } from "../../types/entities";

export const Skill = new EntitySchema<SkillType>({
  name: "Skill",
  tableName: "skills",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    basic:{
      type: 'text',
    },
    low: {
      type: "text",
    },
    medium: {
      type: "text",
    },
    high: {
      type: "text",
    },
    expert:{
      type: 'text'
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    createdBy: {
      type: "varchar",
      nullable: true,
    },
    positionId: {
      name: "position_id",
      type: "integer",
      nullable:true
    },
  },
  relations: {
    upgradeGuides: {
      target: "SkillUpgradeGuide",
      type: "one-to-many",
      inverseSide: "skill",
    },
    assessmentRequest: {
      target: "AssessmentRequest",
      type: "one-to-many",
      inverseSide: "skill",
    },
    target: {
      target: "target",
      type: "one-to-many",
      inverseSide: "skill",
    },
    position: {
      target: "Position",
      type: "many-to-one",
      inverseSide: 'skill',
      joinColumn: {
        name: "position_id",
        referencedColumnName: "id",
      },
      onDelete:"CASCADE"
    }
  },
});