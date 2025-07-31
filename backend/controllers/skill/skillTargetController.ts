import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller } from '../../types/hapi';

import skillTargetService from "../../services/skill/SkillTargetServices";

const SkillTargetController: Controller = {

  createTarget: async (req: Request, h: ResponseToolkit) => {
    const { userId, skillId, from, to } = req.payload as { userId: string, skillId: number, from: number, to: number };
    
    try {
      // verify path already exist
      let targets = await skillTargetService.getSkillTargetbyUserId(userId);
      targets = targets.filter((val)=>{
        return (val.skillId === skillId) &&
        (val.fromLevel === from) &&
        (val.toLevel === to)
      })
      if(targets.length == 1)throw new Error("Path Already Exist");

      await skillTargetService.createTarget(userId, skillId, from, to);
      return h.response({success: true, message:"New learning Path Created successfully!"}).code(201);
    } catch (err) {
    
      return h.response({ message: err.message }).code(500);
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
  },

  getGuide: async (req: Request, h: ResponseToolkit) => {
    try {
      const payload = req.payload as any;
      const { skillId, fromLevel, toLevel } = payload;
      const guide = await skillTargetService.getGuide(skillId, fromLevel, toLevel);
      if (!guide) return h.response({ error: 'Guide not found' }).code(404);
      return h.response(guide).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },
};

export default SkillTargetController;