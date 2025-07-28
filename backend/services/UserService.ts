import { AppDataSource } from "../config/dataSource";
import { FindOptionsWhere } from "typeorm";
import { UserData, FilterOptions, ScoreWithSkill, UserWithScores } from "../types/services";
import { 
  userRepo,
  roleRepo,
  positionRepo,
  teamRepo,
  subTeamRepo,
  assessmentRequestRepo,
  scoreRepo,
} from '../config/dataSource';
import { AssessmentStatus } from '../enum/enum';
import { PositionType, RoleType, TeamType, subTeamType, UserType } from "../types/entities";

const UserService = {
  // General user operations
  getUserById: async (id: number | string): Promise<UserType> => {
    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.position", "position")
      .leftJoinAndSelect("user.Team", "team")
      .leftJoinAndSelect("user.subTeam", "subteam")
      .leftJoinAndSelect("user.hr", "hr")
      .leftJoinAndSelect("user.lead", "lead")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) throw new Error("User not found");
    return user;
  },

  getAllUsers: async (filter: FilterOptions = {}): Promise<UserType[]> => {
    const where: FindOptionsWhere<UserType> = {};

    // Handle filtering by related entities
    if (filter.leadId) {
      where.leadId = filter.leadId;
    }
    if (filter.position) {
      const position = await positionRepo.findOneBy({ name: filter.position });
      if (position) where.positionId = position.id;
    }
    if (filter.teamName) {
      const team = await teamRepo.findOneBy({ name: filter.teamName });
      if (team) where.teamId = team.id;
    }
    return await userRepo.find({
      where,
      relations:["role","position","Team","subTeam","lead","hr"],
    })
  },

  // Hr CRUD Operations
  createUser: async (data: UserType): Promise<void> => {
    console.log(data);

    const id = await AppDataSource.query(`
      SELECT COALESCE(MAX(id::bigInt), 0) FROM users
      `);
    await AppDataSource.query(`
    SELECT setval(
      pg_get_serial_sequence('auths', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM auths)
      )`);

    // Convert role, position, and team names to IDs if provided as names
    // const userData: UserData = { ...data };
    // let user : UserType = {

    // }

    // if (data.role && typeof data.role === "string") {
    //   const role = await roleRepo.findOneBy({ name: data.role });
    //   if (role) userData.roleId = role.id;
    // }
    // delete userData.role;

    // if (data.position && typeof data.position === "string") {
    //   const position = await positionRepo.findOneBy({ name: data.position });
    //   if (position) userData.positionId = position.id;
    // }
    // delete userData.position;

    // if (data.teamName && typeof data.teamName === "string") {
    //   const team = await teamRepo.findOneBy({ name: data.teamName });
    //   if (team) userData.teamId = team.id;
    // }    // If this user is assigned as a lead to someone, update their role to 'lead'
    // if (data.subTeamName && typeof data.subTeamName === "string") {
    //   const team = await subTeamRepo.findOneBy({ name: data.subTeamName });
    //   if (team) userData.subTeamId = team.id;
    // } 
    // if (data.leadId) {
    //   await UserService.ensureLeadRole(data.leadId);
    // }
    try{
      data.id = (id + 1).toString();
      await userRepo.save(data);
    }
    catch(err){
      console.log(err);
    }
  },

  updateUser: async (data: UserData): Promise<UserType> => {
    const id: string = data.id;
    const user = await userRepo.findOneBy({ id: id  });
    if (!user) throw new Error("User not found");

    // Check if leadId is being updated
    const leadIdChanged = data.leadId && data.leadId !== user.leadId;

    // Convert role, position, and team names to IDs if provided as names
    const userData: UserData = { ...data };

    if (data.role && typeof data.role === "string") {
      const role = await roleRepo.findOneBy({ name: data.role });
      if (role) userData.roleId = role.id;
    }
    
    if (data.position && typeof data.position === "string") {
      const position = await positionRepo.findOneBy({ name: data.position });
      if (position) userData.positionId = position.id;
    }
    
    if (data.teamName && typeof data.teamName === "string") {
      const team = await teamRepo.findOneBy({ name: data.teamName });
      if (team) userData.teamId = team.id;
    }
    delete userData.role;
    delete userData.position;
    delete userData.teamName;

    userRepo.merge(user, userData as any); // accepts only the valid fields for update
    const updatedUser = await userRepo.save(user);

    // If leadId was updated, ensure the lead has the 'lead' role
    if (leadIdChanged) {
      await UserService.ensureLeadRole(data.leadId);
    }

    return updatedUser;
  },

  // Helper method to ensure a user has the 'lead' role
  ensureLeadRole: async (userId: string): Promise<void> => {
    const lead = await userRepo.findOne({
      where: { id: userId },
      relations: ["role"],
    });
    if (!lead) throw new Error("Lead user not found");

  },

  deleteUser: async (id: string) => {
    const user = await userRepo.findOneBy({ id });
    if (!user) throw new Error("User not found");
    await userRepo.delete({id:user.id});
  },

  hardDeleteUser: async (id: number) => {
    const user = await userRepo.findOneBy({ id: id.toString() });
    if (!user) throw new Error("User not found");
    await userRepo.delete(id);
  },

  getTeamMembers: async (teamId: number): Promise<UserType[]> => {
    try {
      const members = await userRepo.find({
        where: { teamId: teamId },
        relations: ["role", "position", "Requests"],
      });
      return members;
    } catch (error: any) {
      console.error(`Error getting team members for team ${teamId}:`, error);
      throw new Error(`Failed to get team members: ${error.message}`);
    }
  },

  getMostRecentApprovedScores: async (userId: number | string): Promise<ScoreWithSkill[]> => {
    try {
     const status = 'COMPLETED'
      // Get the most recent approved assessment for the user
      const latestApprovedAssessment = await assessmentRequestRepo.findOne({
        where: {
          userId: userId.toString(),
          status: status as unknown as AssessmentStatus,
        },
        order: {
          requestedAt: "DESC",
        },
      });

      if (!latestApprovedAssessment) {
        return [];
      }

      // Get all scores for this assessment with skill details
      const scores = await scoreRepo.find({
        where: {
          assessmentId: latestApprovedAssessment.id,
        },
        relations: ["Skill"],
      });

      return scores.map((score) => ({
        skillId: score.skillId,
        skillName: score.Skill.name,
        Score: score.score
      }));
    } catch (error: any) {
      console.error(`Error getting recent scores for user ${userId}:`, error);
      return [];
    }
  },

  getSkillMatrixByTeam: async (teamName: string): Promise<UserWithScores[]> => {
    try {
      // Find the team by name first
      const team = await teamRepo.findOneBy({ name: teamName });
      if (!team) throw new Error("Team not found");

      const users = await userRepo.find({
        where: {
          teamId: team.id,
        },
        select: ["id", "userId","name"],
        relations: ["role", "position", "Team"],
      });

      // Get the most recent approved assessment scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          const recentScores = await UserService.getMostRecentApprovedScores(
            user.id
          );
          return {
            ...user,
            mostRecentAssessmentScores: recentScores,
            hasRecentAssessment: recentScores.length > 0,
          };
        })
      );

      return usersWithScores;
    } catch (error: any) {
      throw new Error(`Failed to get skill matrix by team: ${error.message}`);
    }
  },

  getFullSkillMatrix: async (): Promise<UserWithScores[]> => {
    try {
      const users = await userRepo.find({
        select:["id","name","userId"],
        relations: ["role", "position", "Team"],
      });
      
      // Get the most recent approved assessment scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          const recentScores = await UserService.getMostRecentApprovedScores(
            user.id
          );
          return {
            ...user,
            mostRecentAssessmentScores: recentScores,
            hasRecentAssessment: recentScores.length > 0,
          };
        })
      );

    return usersWithScores;

  } catch (error: any) {
    throw new Error(`Failed to get full skill matrix overview: ${error.message}`);
  }
  },

  getAllPositions: async (): Promise<PositionType[]> => {
    return await positionRepo.find();
  },
  
  getAllRoles: async (): Promise<RoleType[]> => {
    return await roleRepo.find();
  },
  

  // Organization-wide skill level stats
  getOrganizationSkillLevelStats: async (): Promise<{ low: number; medium: number; average: number; high: number }> => {
    try {
      // Get all users
      const users = await userRepo.find({ select: ["id"] });
      // Get all most recent approved scores for all users
      const allScores: number[] = [];
      for (const user of users) {
        const scores = await UserService.getMostRecentApprovedScores(user.id);
        for (const score of scores) {
          if (typeof score.Score === 'number') {
            allScores.push(score.Score);
          }
        }
      }
      // Count by level
      const stats = { low: 0, medium: 0, average: 0, high: 0 };
      for (const score of allScores) {
        if (score <= 1) stats.low++;
        else if (score > 1 && score <= 2) stats.medium++;
        else if (score > 2 && score <= 3) stats.average++;
        else if (score > 3) stats.high++;
      }
      return stats;
    } catch (error: any) {
      throw new Error(`Failed to get organization skill level stats: ${error.message}`);
    }
  },

  getAllTeams: async (): Promise<TeamType[]> => {
    return await teamRepo.find();
  },

  getAllSubTeams: async (): Promise<subTeamType[]> => {
    return await subTeamRepo.find({
      where: { isActive: true },
      relations: ['teams'],
      order: { name: 'ASC' }
    });
  },
};

export default UserService;