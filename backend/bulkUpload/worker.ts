import { Worker } from "bullmq";
import { AppDataSource, positionRepo, roleRepo, subTeamRepo, teamRepo, userRepo } from "../config/dataSource";
import { config } from "../config/redisConfig";
import UserService from '../services/UserService';


new Worker("addUsers",
  async (job) => {
    await AppDataSource.initialize();
    const { users } = job.data;
    let count = 0;

    for (const user of users) {
      try {
        const userId = await userRepo.findOneBy({userId: user.userId});
        if(userId) throw new Error("userId Already Exist");
        const roleId = await roleRepo.findOneBy({name: user.role });
        const positionId = await positionRepo.findOneBy({ name: user.position });
        const teamId = await teamRepo.findOneBy({name: user.team });
        const subTeamId = await subTeamRepo.findOneBy({ name: user.subTeam });
        const leadId = await userRepo.findOneBy({ userId: user.lead });
        const hrId = await userRepo.findOneBy({ userId: user.hr });
        user.teamId = teamId?.id;
        user.positionId = positionId?.id;
        user.subTeamId = subTeamId?.id;
        user.leadId = leadId?.id || null;
        user.hrId = hrId?.id || null;
        user.roleId = roleId?.id || null;
        if(!user.roleId)throw new Error("Role Must be Entered and Valid");
        delete user.role;
        delete user.position;
        delete user.team;
        delete user.subTeam;
        delete user.lead;
        delete user.hr;
        await UserService.createUser(user);
        count++;

      } catch (err) {
        console.log("Insert failed:", err.message);
      }
    }
    return count;
  } , config
);