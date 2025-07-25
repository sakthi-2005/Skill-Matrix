import { Worker } from "bullmq";
import { AppDataSource } from "../config/dataSource";
import { config } from "../config/redisConfig";
import UserService from '../services/UserService';


new Worker("addUsers",
  async (job) => {
    await AppDataSource.initialize();
    const { users } = job.data;

    for (const user of users) {
        console.log(user);
      try {
        await UserService.createUser(user);

      } catch (err) {
        console.error("Insert failed:", err.message);
      }
    }
  } , config
);