import { scoreRepo, skillRepo, SkillTargetRepo } from "../../config/dataSource";
import { AuditType } from "../../types/entities";

const skillTargetService = {
    createTarget : async(userId: string, skillId: number, fromLevel: number, toLevel: number, id?: number)=>{
        const target = SkillTargetRepo.create({
            userId,
            skillId,
            fromLevel,
            toLevel
        });

        await SkillTargetRepo.save(target);
    },

    updateTarget : async(Audits: AuditType[], userId: string, assessmentId: number)=>{

        for(const Audit of Audits){
            const skill = await skillRepo.findOne({
                where:{
                    name: Audit.skillName,
                }
            });

            const target = await SkillTargetRepo.findOne({
                where:{
                    userId: userId,
                    skillId: skill.id
                }
            });

            if(target){
                const score = await scoreRepo.findOne({
                    where:{
                        assessmentId: assessmentId,
                        skillId: skill.id
                    }
                })
                if(score.score === 4){
                    await SkillTargetRepo.delete({id: target.id});
                    continue;
                }
                target.fromLevel = score.score

                SkillTargetRepo.save(target)
            }

        }
       
    },

    deleteTargetbyId : async(id: number)=>{
        await SkillTargetRepo.delete({id});
    },

    getSkillTargetbyUserId : async(userId: string)=>{
        return await SkillTargetRepo.find({
            where:{
                userId: userId
            }
        })
    }
}

export default skillTargetService;