import { Worker } from "bullmq";
import { AppDataSource, positionRepo, roleRepo, subTeamRepo, teamRepo, userRepo } from "../config/dataSource";
import { config } from "../config/redisConfig";
import UserService from '../services/UserService';


new Worker("addUsers",
  async (job) => {
    await AppDataSource.initialize();
    const { users } = job.data;
    console.log(users);

    for (const user of users) {
      try {
        const roleId = await roleRepo.findOneBy({name: user.role });
        const positionId = await positionRepo.findOneBy({ name: user.position });
        const teamId = await teamRepo.findOneBy({name: user.team });
        const subTeamId = await subTeamRepo.findOneBy({ name: user.subTeam });
        const leadId = await userRepo.findOneBy({ userId: user.lead });
        const hrId = await userRepo.findOneBy({ userId: user.hr });
        user.teamId = teamId?.id || null;
        user.positionId = positionId?.id || null;
        user.subTeamId = subTeamId?.id || null;
        user.leadId = leadId?.id || null;
        user.hrId = hrId?.id || null;
        user.roleId = roleId?.id || null;
        delete user.role;
        delete user.position;
        delete user.team;
        delete user.subTeam;
        delete user.lead;
        delete user.hr;
        await UserService.createUser(user);

      } catch (err) {
        console.error("Insert failed:", err.message);
      }
    }
  } , config
);