import { Worker } from "bullmq";
import {
  AppDataSource,
  positionRepo,
  roleRepo,
  subTeamRepo,
  teamRepo,
  userRepo
} from "../config/dataSource";
import { config } from "../config/redisConfig";
import UserService from "../services/UserService";

new Worker(
  "addUsers",
  async (job) => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const { users } = job.data;
    let count = 0;
    const errors: any[] = [];

    for (const [index, user] of users.entries()) {
      try {
        const userIdExists = await userRepo.findOneBy({ userId: user.userId });
        if (userIdExists) throw new Error("User ID already exists");

        const emailExists = await userRepo.findOneBy({ email: user.email });
        if (emailExists) throw new Error("Email already exists");

        const roleId = await roleRepo.findOneBy({ name: user.role });
        const positionId = await positionRepo.findOneBy({ name: user.position });
        const teamId = await teamRepo.findOneBy({ name: user.team });
        const subTeamId = await subTeamRepo.findOneBy({ name: user.subTeam });
        const leadId = await userRepo.findOneBy({ userId: user.lead });
        const hrId = await userRepo.findOneBy({ userId: user.hr });

        user.teamId = teamId?.id;
        user.positionId = positionId?.id;
        user.subTeamId = subTeamId?.id;
        user.leadId = leadId?.id || null;
        user.hrId = hrId?.id || null;
        user.roleId = roleId?.id || null;

        if (!user.roleId) throw new Error("Role must be entered and valid");

        // Clean up incoming fields
        delete user.role;
        delete user.position;
        delete user.team;
        delete user.subTeam;
        delete user.lead;
        delete user.hr;

        await UserService.createUser(user);
        count++;
      } catch (err: any) {
        errors.push({
          row: index + 1,
          userId: user.userId,
          email: user.email,
          reason: err.message,
        });
        console.log("Insert failed:", err.message);
      }
    }

    return {
      successCount: count,
      errorCount: errors.length,
      errors,
    };
  },
  config
);
