import { Request, ResponseToolkit } from "@hapi/hapi";
import { HRAdminService } from "../../services/admin/HRAdminService";
import { HTTP_STATUS } from "../../enum/enum";
import * as Boom from "@hapi/boom";

export class HRAdminController {
  private hrAdminService: HRAdminService;

  constructor() {
    this.hrAdminService = new HRAdminService();
  }

  // ============ TEAMS ============

  createTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const team = await this.hrAdminService.createTeam(request.payload as any);
      return h.response({
        success: true,
        message: "Team created successfully",
        data: team,
      }).code(HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create team");
    }
  };

  getAllTeams = async (request: Request, h: ResponseToolkit) => {
    try {
      const includeDeleted = request.query.includeDeleted === 'true';
      const teams = await this.hrAdminService.getAllTeams(includeDeleted);
      return h.response({
        success: true,
        message: "Teams retrieved successfully",
        data: teams,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve teams");
    }
  };

  getTeamById = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const includeDeleted = request.query.includeDeleted === 'true';
      const team = await this.hrAdminService.getTeamById(Number(id), includeDeleted);
      return h.response({
        success: true,
        message: "Team retrieved successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve team");
    }
  };

  updateTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const team = await this.hrAdminService.updateTeam(Number(id), request.payload as any);
      return h.response({
        success: true,
        message: "Team updated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update team");
    }
  };

  deleteTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      await this.hrAdminService.softDeleteTeam(Number(id));
      return h.response({
        success: true,
        message: "Team deleted successfully",
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete team");
    }
  };

  restoreTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const team = await this.hrAdminService.restoreTeam(Number(id));
      return h.response({
        success: true,
        message: "Team restored successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore team");
    }
  };

  // ============ SUB-TEAMS ============

  createSubTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const subTeam = await this.hrAdminService.createSubTeam(request.payload as any);
      return h.response({
        success: true,
        message: "Sub-team created successfully",
        data: subTeam,
      }).code(HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create sub-team");
    }
  };

  getAllSubTeams = async (request: Request, h: ResponseToolkit) => {
    try {
      const teamId = request.query.teamId ? Number(request.query.teamId) : undefined;
      const includeDeleted = request.query.includeDeleted === 'true';
      const subTeams = await this.hrAdminService.getAllSubTeams(teamId, includeDeleted);
      return h.response({
        success: true,
        message: "Sub-teams retrieved successfully",
        data: subTeams,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve sub-teams");
    }
  };

  getSubTeamById = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const includeDeleted = request.query.includeDeleted === 'true';
      const subTeam = await this.hrAdminService.getSubTeamById(Number(id), includeDeleted);
      return h.response({
        success: true,
        message: "Sub-team retrieved successfully",
        data: subTeam,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve sub-team");
    }
  };

  updateSubTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const subTeam = await this.hrAdminService.updateSubTeam(Number(id), request.payload as any);
      return h.response({
        success: true,
        message: "Sub-team updated successfully",
        data: subTeam,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update sub-team");
    }
  };

  deleteSubTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      await this.hrAdminService.softDeleteSubTeam(Number(id));
      return h.response({
        success: true,
        message: "Sub-team deleted successfully",
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete sub-team");
    }
  };

  restoreSubTeam = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const subTeam = await this.hrAdminService.restoreSubTeam(Number(id));
      return h.response({
        success: true,
        message: "Sub-team restored successfully",
        data: subTeam,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore sub-team");
    }
  };

  // ============ POSITIONS ============

  createPosition = async (request: Request, h: ResponseToolkit) => {
    try {
      const position = await this.hrAdminService.createPosition(request.payload as any);
      return h.response({
        success: true,
        message: "Position created successfully",
        data: position,
      }).code(HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to create position");
    }
  };

  getAllPositions = async (request: Request, h: ResponseToolkit) => {
    try {
      const includeDeleted = request.query.includeDeleted === 'true';
      const positions = await this.hrAdminService.getAllPositions(includeDeleted);
      return h.response({
        success: true,
        message: "Positions retrieved successfully",
        data: positions,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve positions");
    }
  };

  getPositionById = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const includeDeleted = request.query.includeDeleted === 'true';
      const position = await this.hrAdminService.getPositionById(Number(id), includeDeleted);
      return h.response({
        success: true,
        message: "Position retrieved successfully",
        data: position,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve position");
    }
  };

  updatePosition = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const position = await this.hrAdminService.updatePosition(Number(id), request.payload as any);
      return h.response({
        success: true,
        message: "Position updated successfully",
        data: position,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to update position");
    }
  };

  deletePosition = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      await this.hrAdminService.softDeletePosition(Number(id));
      return h.response({
        success: true,
        message: "Position deleted successfully",
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to delete position");
    }
  };

  restorePosition = async (request: Request, h: ResponseToolkit) => {
    try {
      const { id } = request.params;
      const position = await this.hrAdminService.restorePosition(Number(id));
      return h.response({
        success: true,
        message: "Position restored successfully",
        data: position,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to restore position");
    }
  };

  // ============ STATISTICS ============

  getOrganizationStats = async (request: Request, h: ResponseToolkit) => {
    try {
      const stats = await this.hrAdminService.getOrganizationStats();
      return h.response({
        success: true,
        message: "Organization statistics retrieved successfully",
        data: stats,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to retrieve organization statistics");
    }
  };
}