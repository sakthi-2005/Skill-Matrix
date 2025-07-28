import UserService from "../services/UserService";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { UserType } from "../types/entities";
import { Queue } from "bullmq";
import { config } from "../config/redisConfig";

const UserController: Controller = {
  getUserById: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const user = await UserService.getUserById(userId);
      return h.response(user).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getAllUsers: async (req: Request, h: ResponseToolkit) => {
    try {
      const users = await UserService.getAllUsers(req.payload as any);
      return h.response(users).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  createUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const data = req.payload as any;
      
      if(!data || !data.length)throw new Error("Verify User Data!");

      const split = parseInt(process.env.UPLOAD_LIMIT);
      const queue = new Queue("addUsers",config);

      for(let i=0;i<data.length;i+=split){
        const queue_data = data.slice(i,i+split);
        await queue.add("users",{ users : queue_data });
      }
      // const created = await UserService.createUser(data);
      
      return h.response({message: "User Added successfully!<br/>Refresh after some time to see the changes"}).code(201);
    } catch (err: any) {
      return h.response({ error: err.message }).code(400);
    }
  },

  updateUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const updated = await UserService.updateUser(req.payload as any);
      return h.response({message: "Updated successfully!"}).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  deleteUser: async (req: Request, h: ResponseToolkit) => {
    try {
      await UserService.deleteUser(req.params.id);
      return h.response({message:"Successfully Deleted user with ID " + req.params.id + "!"}).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  hardDeleteUser: async (req: Request, h: ResponseToolkit) => {
    try {
      await UserService.hardDeleteUser(Number(req.params.id));
      return h.response({
        success: true,
        message: "User permanently deleted successfully"
      }).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getTeamMemebers: async (req: Request, h: ResponseToolkit) => {
    try {
      const teamId = req.params.teamId;
      if (!teamId) {
        return h.response({ error: "Team ID is required" }).code(400);
      }
      const members = await UserService.getTeamMembers(teamId);
      console.log("Fetched members:", members);
      return h.response(members).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getTeamMatrix: async (req: Request, h: ResponseToolkit) => {
    try {
      const matrix = await UserService.getSkillMatrixByTeam(req.params.teamName);
      return h.response(matrix).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getFullMatrix: async (req: Request, h: ResponseToolkit) => {
    try {
      const matrix = await UserService.getFullSkillMatrix();
      return h.response(matrix).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getAllDetails: async (req: Request, h: ResponseToolkit) => {
    try {
      const type = req.query.type as string || "all";
      let data;
      
      switch (type) {
        case "all":
          const positions = await UserService.getAllPositions();
          const roles = await UserService.getAllRoles();
          const teams = await UserService.getAllTeams();
          const subTeams = await UserService.getAllSubTeams();
          return h.response({ positions, roles, teams, subTeams }).code(200);
        case "position":
           data = await UserService.getAllPositions();
          break;
        case "role":
          data = await UserService.getAllRoles();
          break;
        case "team":
          data = await UserService.getAllTeams();
          break;
        case "subteam":
          data = await UserService.getAllSubTeams();
          break;
        default:
          return h.response({ error: "Invalid type parameter" }).code(400);
      }
      return h.response(data).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  // Organization-wide skill stats
  getOrganizationSkillStats: async (req: Request, h: ResponseToolkit) => {
    try {
      const stats = await UserService.getOrganizationSkillLevelStats();
      return h.response(stats).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },
};

export default UserController;