import { Repository, Not, IsNull } from "typeorm";
import { AppDataSource } from "../../config/dataSource";
import { Team } from "../../entities/Team";
import { SubTeam } from "../../entities/SubTeam";
import { Position } from "../../entities/Position";
import { TeamType, SubTeamType, PositionType } from "../../types/entities";
import { HTTP_STATUS } from "../../enum/enum";
import * as Boom from "@hapi/boom";

export class HRAdminService {
  private teamRepository: Repository<TeamType>;
  private subTeamRepository: Repository<SubTeamType>;
  private positionRepository: Repository<PositionType>;

  constructor() {
    this.teamRepository = AppDataSource.getRepository(Team);
    this.subTeamRepository = AppDataSource.getRepository(SubTeam);
    this.positionRepository = AppDataSource.getRepository(Position);
  }

  // ============ TEAMS ============

  async createTeam(teamData: Partial<TeamType>): Promise<TeamType> {
    try {
      // Check if team name already exists (only among active teams)
      const existingTeam = await this.teamRepository.findOne({
        where: {
          name: teamData.name,
          deletedAt: null,
        },
      });

      if (existingTeam) {
        throw Boom.conflict("Team name already exists");
      }

      const team = this.teamRepository.create({
        name: teamData.name,
        description: teamData.description,
        isActive: true,
      });

      return await this.teamRepository.save(team);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create team");
    }
  }

  async getAllTeams(includeDeleted: boolean = false): Promise<TeamType[]> {
    try {
      const whereCondition = includeDeleted ? {} : { deletedAt: null };
      
      return await this.teamRepository.find({
        where: whereCondition,
        relations: ["subTeams", "users"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw Boom.internal("Failed to fetch teams");
    }
  }

  async getTeamById(id: number, includeDeleted: boolean = false): Promise<TeamType> {
    try {
      const whereCondition = includeDeleted 
        ? { id } 
        : { id, deletedAt: null };

      const team = await this.teamRepository.findOne({
        where: whereCondition,
        relations: ["subTeams", "users"],
      });

      if (!team) {
        throw Boom.notFound("Team not found");
      }

      return team;
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to fetch team");
    }
  }

  async updateTeam(id: number, updateData: Partial<TeamType>): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id);

      // Check if new name conflicts with existing teams
      if (updateData.name && updateData.name !== team.name) {
        const existingTeam = await this.teamRepository.findOne({
          where: {
            name: updateData.name,
            deletedAt: null,
          },
        });

        if (existingTeam && existingTeam.id !== id) {
          throw Boom.conflict("Team name already exists");
        }
      }

      await this.teamRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      return await this.getTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update team");
    }
  }

  async softDeleteTeam(id: number): Promise<void> {
    try {
      const team = await this.getTeamById(id);
      
      // Soft delete all sub-teams first
      await this.subTeamRepository.update(
        { teamId: id, deletedAt: null },
        { 
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        }
      );

      // Soft delete the team
      await this.teamRepository.update(id, {
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete team");
    }
  }

  async restoreTeam(id: number): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id, true);
      
      if (!team.deletedAt) {
        throw Boom.badRequest("Team is not deleted");
      }

      await this.teamRepository.update(id, {
        deletedAt: null,
        isActive: true,
        updatedAt: new Date(),
      });

      return await this.getTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore team");
    }
  }

  async activateTeam(id: number): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id);
      
      if (team.isActive) {
        throw Boom.badRequest("Team is already active");
      }

      await this.teamRepository.update(id, {
        isActive: true,
        updatedAt: new Date(),
      });

      return await this.getTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to activate team");
    }
  }

  async deactivateTeam(id: number): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id);
      
      if (!team.isActive) {
        throw Boom.badRequest("Team is already inactive");
      }

      await this.teamRepository.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });

      return await this.getTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to deactivate team");
    }
  }

  // ============ SUB-TEAMS ============

  async createSubTeam(subTeamData: Partial<SubTeamType>): Promise<SubTeamType> {
    try {
      // Verify parent team exists
      await this.getTeamById(subTeamData.teamId!);

      // Check if sub-team name already exists within the same team
      const existingSubTeam = await this.subTeamRepository.findOne({
        where: {
          name: subTeamData.name,
          teamId: subTeamData.teamId,
          deletedAt: null,
        },
      });

      if (existingSubTeam) {
        throw Boom.conflict("Sub-team name already exists within this team");
      }

      const subTeam = this.subTeamRepository.create({
        name: subTeamData.name,
        description: subTeamData.description,
        teamId: subTeamData.teamId,
        isActive: true,
      });

      return await this.subTeamRepository.save(subTeam);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create sub-team");
    }
  }

  async getAllSubTeams(teamId?: number, includeDeleted: boolean = false): Promise<SubTeamType[]> {
    try {
      const whereCondition: any = includeDeleted ? {} : { deletedAt: null };
      if (teamId) {
        whereCondition.teamId = teamId;
      }

      return await this.subTeamRepository.find({
        where: whereCondition,
        relations: ["Team", "users"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw Boom.internal("Failed to fetch sub-teams");
    }
  }

  async getSubTeamById(id: number, includeDeleted: boolean = false): Promise<SubTeamType> {
    try {
      const whereCondition = includeDeleted 
        ? { id } 
        : { id, deletedAt: null };

      const subTeam = await this.subTeamRepository.findOne({
        where: whereCondition,
        relations: ["Team", "users"],
      });

      if (!subTeam) {
        throw Boom.notFound("Sub-team not found");
      }

      return subTeam;
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to fetch sub-team");
    }
  }

  async updateSubTeam(id: number, updateData: Partial<SubTeamType>): Promise<SubTeamType> {
    try {
      const subTeam = await this.getSubTeamById(id);

      // Check if new name conflicts with existing sub-teams in the same team
      if (updateData.name && updateData.name !== subTeam.name) {
        const existingSubTeam = await this.subTeamRepository.findOne({
          where: {
            name: updateData.name,
            teamId: updateData.teamId || subTeam.teamId,
            deletedAt: null,
          },
        });

        if (existingSubTeam && existingSubTeam.id !== id) {
          throw Boom.conflict("Sub-team name already exists within this team");
        }
      }

      await this.subTeamRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      return await this.getSubTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update sub-team");
    }
  }

  async softDeleteSubTeam(id: number): Promise<void> {
    try {
      await this.getSubTeamById(id);
      
      await this.subTeamRepository.update(id, {
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete sub-team");
    }
  }

  async restoreSubTeam(id: number): Promise<SubTeamType> {
    try {
      const subTeam = await this.getSubTeamById(id, true);
      
      if (!subTeam.deletedAt) {
        throw Boom.badRequest("Sub-team is not deleted");
      }

      await this.subTeamRepository.update(id, {
        deletedAt: null,
        isActive: true,
        updatedAt: new Date(),
      });

      return await this.getSubTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore sub-team");
    }
  }

  // ============ POSITIONS ============

  async createPosition(positionData: Partial<PositionType>): Promise<PositionType> {
    try {
      // Check if position name already exists
      const existingPosition = await this.positionRepository.findOne({
        where: {
          name: positionData.name,
          deletedAt: null,
        },
      });

      if (existingPosition) {
        throw Boom.conflict("Position name already exists");
      }

      const position = this.positionRepository.create({
        name: positionData.name,
        description: positionData.description,
        isActive: true,
      });

      return await this.positionRepository.save(position);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create position");
    }
  }

  async getAllPositions(includeDeleted: boolean = false): Promise<PositionType[]> {
    try {
      const whereCondition = includeDeleted ? {} : { deletedAt: null };
      
      return await this.positionRepository.find({
        where: whereCondition,
        relations: ["users"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw Boom.internal("Failed to fetch positions");
    }
  }

  async getPositionById(id: number, includeDeleted: boolean = false): Promise<PositionType> {
    try {
      const whereCondition = includeDeleted 
        ? { id } 
        : { id, deletedAt: null };

      const position = await this.positionRepository.findOne({
        where: whereCondition,
        relations: ["users"],
      });

      if (!position) {
        throw Boom.notFound("Position not found");
      }

      return position;
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to fetch position");
    }
  }

  async updatePosition(id: number, updateData: Partial<PositionType>): Promise<PositionType> {
    try {
      const position = await this.getPositionById(id);

      // Check if new name conflicts with existing positions
      if (updateData.name && updateData.name !== position.name) {
        const existingPosition = await this.positionRepository.findOne({
          where: {
            name: updateData.name,
            deletedAt: null,
          },
        });

        if (existingPosition && existingPosition.id !== id) {
          throw Boom.conflict("Position name already exists");
        }
      }

      await this.positionRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      return await this.getPositionById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update position");
    }
  }

  async softDeletePosition(id: number): Promise<void> {
    try {
      await this.getPositionById(id);
      
      await this.positionRepository.update(id, {
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete position");
    }
  }

  async restorePosition(id: number): Promise<PositionType> {
    try {
      const position = await this.getPositionById(id, true);
      
      if (!position.deletedAt) {
        throw Boom.badRequest("Position is not deleted");
      }

      await this.positionRepository.update(id, {
        deletedAt: null,
        isActive: true,
        updatedAt: new Date(),
      });

      return await this.getPositionById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore position");
    }
  }

  // ============ STATISTICS ============

  async getOrganizationStats() {
    try {
      const [activeTeams, deletedTeams, activeSubTeams, deletedSubTeams, activePositions, deletedPositions] = await Promise.all([
        this.teamRepository.count({ where: { deletedAt: IsNull() } }),
        this.teamRepository.count({ where: { deletedAt: Not(IsNull()) } }),
        this.subTeamRepository.count({ where: { deletedAt: IsNull() } }),
        this.subTeamRepository.count({ where: { deletedAt: Not(IsNull()) } }),
        this.positionRepository.count({ where: { deletedAt: IsNull() } }),
        this.positionRepository.count({ where: { deletedAt: Not(IsNull()) } }),
      ]);

      return {
        teams: {
          active: activeTeams,
          deleted: deletedTeams,
          total: activeTeams + deletedTeams,
        },
        subTeams: {
          active: activeSubTeams,
          deleted: deletedSubTeams,
          total: activeSubTeams + deletedSubTeams,
        },
        positions: {
          active: activePositions,
          deleted: deletedPositions,
          total: activePositions + deletedPositions,
        },
      };
    } catch (error) {
      throw Boom.internal("Failed to fetch organization statistics");
    }
  }
}