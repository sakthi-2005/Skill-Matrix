import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller } from '../../types/hapi';

import skillTargetService from "../../services/skill/SkillTargetServices";

const SkillTargetController: Controller = {

  createTarget: async (req: Request, h: ResponseToolkit) => {
    const { userId, skillId, from, to } = req.payload as { userId: string, skillId: number, from: number, to: number };
    
    try {

      await skillTargetService.createTarget(userId, skillId, from, to);
      return h.response({success: true, message:"New learning Path Created successfully!"}).code(201);
    } catch (err) {
    
      return h.response({ error: err.message }).code(500);
    }
  },

  deleteTarget: async(req: Request, h: ResponseToolkit)=>{

    const { id } = req.query as { id: number };

    try {

      await skillTargetService.deleteTargetbyId(id);
      return h.response({success: true, message:"learning Path deleted successfully!"}).code(200);

    } catch (err) {
      
      return h.response({ error: err.message }).code(500);
    }
  },

  getTarget: async(req: Request, h: ResponseToolkit)=>{
    const { userId } = req.query as { userId: string };

    try {

      let data = await skillTargetService.getSkillTargetbyUserId(userId);
      return h.response({success: true, data: data}).code(200);

    } catch (err) {
      
      return h.response({ error: err.message }).code(500);
    }
  }
};

export default SkillTargetController;