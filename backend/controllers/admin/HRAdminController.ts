import { Request, ResponseToolkit } from "@hapi/hapi";
import { HRAdminService } from "../../services/admin/HRAdminService";
import { HTTP_STATUS } from "../../enum/enum";
import * as Boom from "@hapi/boom";

export const HRAdminController = {

  // ============ TEAMS ============

  async createTeam(request: Request, h: ResponseToolkit){
    try {
      const team = await HRAdminService.createTeam(request.payload as any);
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
  },

  async getAllTeams(request: Request, h: ResponseToolkit){
    try {
      const teams = await HRAdminService.getAllTeams();
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
  },

  async getTeamById(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.getTeamById(Number(id));
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
  },

  async updateTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.updateTeam(Number(id), request.payload as any);
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
  },

  async deleteTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      await HRAdminService.softDeleteTeam(Number(id));
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
  },

  // async restoreTeam(request: Request, h: ResponseToolkit){
  //   try {
  //     const { id } = request.params;
  //     const team = await HRAdminService.restoreTeam(Number(id));
  //     return h.response({
  //       success: true,
  //       message: "Team restored successfully",
  //       data: team,
  //     }).code(HTTP_STATUS.OK);
  //   } catch (error) {
  //     if (error.isBoom) {
  //       throw error;
  //     }
  //     throw Boom.internal("Failed to restore team");
  //   }
  // },

  async activateTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.activateTeam(Number(id));
      return h.response({
        success: true,
        message: "Team activated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to activate team");
    }
  },

  async deactivateTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.deactivateTeam(Number(id));
      return h.response({
        success: true,
        message: "Team deactivated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to deactivate team");
    }
  },

  // ============ SUB-TEAMS ============

  async createSubTeam(request: Request, h: ResponseToolkit){
    try {
      const subTeam = await HRAdminService.createsubTeam(request.payload as any);
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
  },

  async getAllSubTeams(request: Request, h: ResponseToolkit){
    try {
      const teamId = request.query.teamId ? Number(request.query.teamId) : undefined;
      const subTeams = await HRAdminService.getAllsubTeams(teamId);
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
  },

  async getSubTeamById(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const subTeam = await HRAdminService.getsubTeamById(Number(id));
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
  },

  async updateSubTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const subTeam = await HRAdminService.updatesubTeam(Number(id), request.payload as any);
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
  },

  async deleteSubTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      await HRAdminService.softDeletesubTeam(Number(id));
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
  },

  async activateSubTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.activateSubTeam(Number(id));
      return h.response({
        success: true,
        message: "Sub-Team activated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to activate sub-team");
    }
  },

  async deactivateSubTeam(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.deactivateSubTeam(Number(id));
      return h.response({
        success: true,
        message: "Sub-Team deactivated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to deactivate sub-team");
    }
  },

  // async restoreSubTeam(request: Request, h: ResponseToolkit){
  //   try {
  //     const { id } = request.params;
  //     const subTeam = await HRAdminService.restoresubTeam(Number(id));
  //     return h.response({
  //       success: true,
  //       message: "Sub-team restored successfully",
  //       data: subTeam,
  //     }).code(HTTP_STATUS.OK);
  //   } catch (error) {
  //     if (error.isBoom) {
  //       throw error;
  //     }
  //     throw Boom.internal("Failed to restore sub-team");
  //   }
  // },


  // ============ POSITIONS ============

  async createPosition(request: Request, h: ResponseToolkit){
    try {
      const position = await HRAdminService.createPosition(request.payload as any);
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
  },

  async getAllPositions(request: Request, h: ResponseToolkit){
    try {
      const positions = await HRAdminService.getAllPositions();
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
  },

  async getPositionById(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const position = await HRAdminService.getPositionById(Number(id));
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
  },

  async updatePosition(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const position = await HRAdminService.updatePosition(Number(id), request.payload as any);
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
  },

  async deletePosition(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      await HRAdminService.softDeletePosition(Number(id));
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
  },

  async activatePosition(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.activatePosition(Number(id));
      return h.response({
        success: true,
        message: "Position activated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to activate Position");
    }
  },

  async deactivatePosition(request: Request, h: ResponseToolkit){
    try {
      const { id } = request.params;
      const team = await HRAdminService.deactivatePosition(Number(id));
      return h.response({
        success: true,
        message: "Position deactivated successfully",
        data: team,
      }).code(HTTP_STATUS.OK);
    } catch (error) {
      if (error.isBoom) {
        throw error;
      }
      throw Boom.internal("Failed to deactivate Position");
    }
  },

  // async restorePosition(request: Request, h: ResponseToolkit){
  //   try {
  //     const { id } = request.params;
  //     const position = await HRAdminService.restorePosition(Number(id));
  //     return h.response({
  //       success: true,
  //       message: "Position restored successfully",
  //       data: position,
  //     }).code(HTTP_STATUS.OK);
  //   } catch (error) {
  //     if (error.isBoom) {
  //       throw error;
  //     }
  //     throw Boom.internal("Failed to restore position");
  //   }
  // },

  // ============ STATISTICS ============

  async getOrganizationStats(request: Request, h: ResponseToolkit){
    try {
      const stats = await HRAdminService.getOrganizationStats();
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
  }
}