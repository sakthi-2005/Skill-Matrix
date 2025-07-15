import { AppDataSource } from "../config/dataSource";
import { Team } from "../entities/Team";
import { SubTeam } from "../entities/SubTeam";
import { Position } from "../entities/Position";
import { TeamType, SubTeamType, PositionType } from "../types/entities";

export async function seedHRAdminData() {
  try {
    await AppDataSource.initialize();
    
    const teamRepository = AppDataSource.getRepository(Team);
    const subTeamRepository = AppDataSource.getRepository(SubTeam);
    const positionRepository = AppDataSource.getRepository(Position);

    // Clear existing data
    await subTeamRepository.delete({});
    await teamRepository.delete({});
    await positionRepository.delete({});

    // Seed Teams
    const teams: TeamType[] = [
      {
        id: 1,
        name: "InfoRiver",
        description: "Advanced data visualization and analytics platform",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "InfoBridge",
        description: "Data integration and connectivity solutions",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Valq",
        description: "Planning and budgeting application",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const savedTeams = await teamRepository.save(teams);
    console.log("Teams seeded successfully");

    // Seed Sub-Teams
    const subTeams: Partial<SubTeamType>[] = [
      // InfoRiver Sub-Teams
      {
        name: "Frontend Development",
        description: "React and Angular development team",
        teamId: savedTeams[0].id,
        isActive: true,
      },
      {
        name: "Backend Development",
        description: "API and server-side development",
        teamId: savedTeams[0].id,
        isActive: true,
      },
      {
        name: "Quality Assurance",
        description: "Testing and quality control",
        teamId: savedTeams[0].id,
        isActive: true,
      },
      
      // InfoBridge Sub-Teams
      {
        name: "Data Engineering",
        description: "Data pipeline and ETL processes",
        teamId: savedTeams[1].id,
        isActive: true,
      },
      {
        name: "Integration Team",
        description: "Third-party integrations and APIs",
        teamId: savedTeams[1].id,
        isActive: true,
      },
      
      // Valq Sub-Teams
      {
        name: "Product Development",
        description: "Core product features and enhancements",
        teamId: savedTeams[2].id,
        isActive: true,
      },
      {
        name: "Analytics Team",
        description: "Business intelligence and reporting",
        teamId: savedTeams[2].id,
        isActive: true,
      },
    ];

    await subTeamRepository.save(subTeams);
    console.log("Sub-teams seeded successfully");

    // Seed Positions
    const positions: Partial<PositionType>[] = [
      {
        name: "Frontend Developer",
        description: "Develops user interfaces and client-side applications",
        isActive: true,
      },
      {
        name: "Backend Developer",
        description: "Develops server-side applications and APIs",
        isActive: true,
      },
      {
        name: "Full Stack Developer",
        description: "Works on both frontend and backend development",
        isActive: true,
      },
      {
        name: "Quality Assurance Engineer",
        description: "Tests applications and ensures quality standards",
        isActive: true,
      },
      {
        name: "DevOps Engineer",
        description: "Manages deployment and infrastructure",
        isActive: true,
      },
      {
        name: "Data Engineer",
        description: "Builds and maintains data pipelines",
        isActive: true,
      },
      {
        name: "Product Manager",
        description: "Manages product development and strategy",
        isActive: true,
      },
      {
        name: "HR Manager",
        description: "Manages human resources and organizational development",
        isActive: true,
      },
      {
        name: "Team Lead",
        description: "Leads development teams and provides technical guidance",
        isActive: true,
      },
      {
        name: "Senior Developer",
        description: "Experienced developer with leadership responsibilities",
        isActive: true,
      },
    ];

    await positionRepository.save(positions);
    console.log("Positions seeded successfully");

    console.log("HR Admin data seeded successfully!");
  } catch (error) {
    console.error("Error seeding HR Admin data:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedHRAdminData();
}