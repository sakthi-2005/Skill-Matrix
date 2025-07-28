import { Not, IsNull } from "typeorm";
import { teamRepo,subTeamRepo,positionRepo } from "../../config/dataSource";
import { TeamType, subTeamType, PositionType } from "../../types/entities";
import * as Boom from "@hapi/boom";

export const HRAdminService = {


  // ============ TEAMS ============

  async createTeam(teamData: Partial<TeamType>): Promise<TeamType> {
    try {
      // Check if team name already exists (only among active teams)
      const existingTeam = await teamRepo.findOne({
        where: {
          name: teamData.name,
          isActive: true,
        },
      });

      if (existingTeam) {
        throw Boom.conflict("Team name already exists");
      }

      const team = teamRepo.create({
        name: teamData.name,
        isActive: true,
      });

      return await teamRepo.save(team);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create team");
    }
  },

  async getAllTeams(includeDeleted: boolean = false): Promise<TeamType[]> {
    try {
      const whereCondition = includeDeleted ? {} : { isActive: true };
      
      return await teamRepo.find({
        where: whereCondition,
        relations: ["subteam", "user"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw Boom.internal("Failed to fetch teams");
    }
  },

  async getTeamById(id: number, includeDeleted: boolean = false): Promise<TeamType> {
    try {
      const whereCondition = includeDeleted 
        ? { id } 
        : { id, isActive: null };

      const team = await teamRepo.findOne({
        where: whereCondition,
        relations: ["subTeam", "user"],
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
  },

  async updateTeam(id: number, updateData: Partial<TeamType>): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id);

      // Check if new name conflicts with existing teams
      if (updateData.name && updateData.name !== team.name) {
        const existingTeam = await teamRepo.findOne({
          where: {
            name: updateData.name,
            isActive: null,
          },
        });

        if (existingTeam && existingTeam.id !== id) {
          throw Boom.conflict("Team name already exists");
        }
      }

      await teamRepo.update(id, {
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
  },

  async softDeleteTeam(id: number): Promise<void> {
    try {
      const team = await this.getTeamById(id);
      
      // Soft delete all sub-teams first
      await subTeamRepo.update(
        { teamId: id, isActive: null },
        { 
          isActive: false,
          updatedAt: new Date(),
        }
      );

      // Soft delete the team
      await teamRepo.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete team");
    }
  },

  async hardDeleteTeam(id: number): Promise<void> {
    try {
      const team = await this.getTeamById(id, true); // Include deleted to find any team
      
      // Hard delete all sub-teams first
      await subTeamRepo.delete({ teamId: id });

      // Hard delete the team
      await teamRepo.delete(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to permanently delete team");
    }
  },

  async activateTeam(id: number): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id);
      
      if (team.isActive) {
        throw Boom.badRequest("Team is already active");
      }

      await teamRepo.update(id, {
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
  },

  async deactivateTeam(id: number): Promise<TeamType> {
    try {
      const team = await this.getTeamById(id);
      
      if (!team.isActive) {
        throw Boom.badRequest("Team is already inactive");
      }

      await teamRepo.update(id, {
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
  },

  // ============ SUB-TEAMS ============

  async createsubTeam(subTeamData: Partial<subTeamType>): Promise<subTeamType> {
    try {
      // Verify parent team exists
      await this.getTeamById(subTeamData.teamId!);

      // Check if sub-team name already exists within the same team
      const existingsubTeam = await subTeamRepo.findOne({
        where: {
          name: subTeamData.name,
          teamId: subTeamData.teamId,
          isActive: null,
        },
      });

      if (existingsubTeam) {
        throw Boom.conflict("Sub-team name already exists within this team");
      }

      const subTeam = subTeamRepo.create({
        name: subTeamData.name,
        teamId: subTeamData.teamId,
        isActive: true,
      });

      return await subTeamRepo.save(subTeam);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create sub-team");
    }
  },

  async getAllsubTeams(teamId?: number, includeDeleted: boolean = false): Promise<subTeamType[]> {
    try {
      const whereCondition: any = includeDeleted ? {} : { isActive: true };
      if (teamId) {
        whereCondition.teamId = teamId;
      }

      return await subTeamRepo.find({
        where: whereCondition,
        relations: ["teams", "user"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw Boom.internal("Failed to fetch sub-teams");
    }
  },

  async getsubTeamById(id: number, includeDeleted: boolean = false): Promise<subTeamType> {
    try {
      const whereCondition = includeDeleted 
        ? { id } 
        : { id, isActive: true };

      const subTeam = await subTeamRepo.findOne({
        where: whereCondition,
        relations: ["teams", "user"],
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
  },

  async updatesubTeam(id: number, updateData: Partial<subTeamType>): Promise<subTeamType> {
    try {
      const subTeam = await this.getsubTeamById(id);

      // Check if new name conflicts with existing sub-teams in the same team
      if (updateData.name && updateData.name !== subTeam.name) {
        const existingsubTeam = await subTeamRepo.findOne({
          where: {
            name: updateData.name,
            teamId: updateData.teamId || subTeam.teamId,
            isActive: null,
          },
        });

        if (existingsubTeam && existingsubTeam.id !== id) {
          throw Boom.conflict("Sub-team name already exists within this team");
        }
      }

      await subTeamRepo.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      return await this.getsubTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update sub-team");
    }
  },

  async softDeletesubTeam(id: number): Promise<void> {
    try {
      await this.getsubTeamById(id);
      
      await subTeamRepo.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete sub-team");
    }
  },

  async hardDeletesubTeam(id: number): Promise<void> {
    try {
      await this.getsubTeamById(id, true); // Include deleted to find any sub-team
      
      // Hard delete the sub-team
      await subTeamRepo.delete(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to permanently delete sub-team");
    }
  },

  async restoresubTeam(id: number): Promise<subTeamType> {
    try {
      const subTeam = await this.getsubTeamById(id, true);
      
      if (!subTeam.isActive) {
        throw Boom.badRequest("Sub-team is not deleted");
      }

      await subTeamRepo.update(id, {
        isActive: true,
        updatedAt: new Date(),
      });

      return await this.getsubTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore sub-team");
    }
  },

  async activatesubTeam(id: number): Promise<subTeamType> {
    try {
      const subTeam = await this.getsubTeamById(id);
      
      if (subTeam.isActive) {
        throw Boom.badRequest("Sub-team is already active");
      }

      await subTeamRepo.update(id, {
        isActive: true,
        updatedAt: new Date(),
      });

      return await this.getsubTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to activate sub-team");
    }
  },

  async deactivatesubTeam(id: number): Promise<subTeamType> {
    try {
      const subTeam = await this.getsubTeamById(id);
      
      if (!subTeam.isActive) {
        throw Boom.badRequest("Sub-team is already inactive");
      }

      await subTeamRepo.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });

      return await this.getsubTeamById(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to deactivate sub-team");
    }
  },

  // ============ POSITIONS ============

  async createPosition(positionData: Partial<PositionType>): Promise<PositionType> {
    try {
      // Check if position name already exists
      const existingPosition = await positionRepo.findOne({
        where: {
          name: positionData.name,
          isActive: null,
        },
      });

      if (existingPosition) {
        throw Boom.conflict("Position name already exists");
      }

      const position = positionRepo.create({
        name: positionData.name,
        isActive: true,
      });

      return await positionRepo.save(position);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create position");
    }
  },

  async getAllPositions(includeDeleted: boolean = false): Promise<PositionType[]> {
    try {
      const whereCondition = includeDeleted ? {} : { isActive: true };
      
      return await positionRepo.find({
        where: whereCondition,
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw Boom.internal("Failed to fetch positions");
    }
  },

  async getPositionById(id: number, includeDeleted: boolean = false): Promise<PositionType> {
    try {
      const whereCondition = includeDeleted 
        ? { id } 
        : { id, isActive: null };

      const position = await positionRepo.findOne({
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
  },

  async updatePosition(id: number, updateData: Partial<PositionType>): Promise<PositionType> {
    try {
      const position = await this.getPositionById(id);

      // Check if new name conflicts with existing positions
      if (updateData.name && updateData.name !== position.name) {
        const existingPosition = await positionRepo.findOne({
          where: {
            name: updateData.name,
            isActive: null,
          },
        });

        if (existingPosition && existingPosition.id !== id) {
          throw Boom.conflict("Position name already exists");
        }
      }

      await positionRepo.update(id, {
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
  },

  async softDeletePosition(id: number): Promise<void> {
    try {
      await this.getPositionById(id);
      
      await positionRepo.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete position");
    }
  },

  async hardDeletePosition(id: number): Promise<void> {
    try {
      await this.getPositionById(id, true); // Include deleted to find any position
      
      // Hard delete the position
      await positionRepo.delete(id);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to permanently delete position");
    }
  },

  async restorePosition(id: number): Promise<PositionType> {
    try {
      const position = await this.getPositionById(id, true);
      
      if (!position.isActive) {
        throw Boom.badRequest("Position is not deleted");
      }

      await positionRepo.update(id, {
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
  },

  // ============ STATISTICS ============

  async getOrganizationStats() {
    try {
      const [activeTeams, deletedTeams, activesubTeams, deletedsubTeams, activePositions, deletedPositions] = await Promise.all([
        teamRepo.count({ where: { isActive: true } }),
        teamRepo.count({ where: { isActive: false } }),
        subTeamRepo.count({ where: { isActive: true } }),
        subTeamRepo.count({ where: { isActive: false } }),
        positionRepo.count({ where: { isActive: true } }),
        positionRepo.count({ where: { isActive: false } }),
      ]);

      return {
        teams: {
          active: activeTeams,
          deleted: deletedTeams,
          total: activeTeams + deletedTeams,
        },
        subTeams: {
          active: activesubTeams,
          deleted: deletedsubTeams,
          total: activesubTeams + deletedsubTeams,
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