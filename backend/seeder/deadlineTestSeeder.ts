import { AppDataSource } from "../config/dataSource";
import { AssessmentRequest } from "../entities/assessment/AssessmentRequest";
import { AssessmentCycle } from "../entities/assessment/AssessmentCycle";
import { User } from "../entities/User";
import { Skill } from "../entities/assessment/Skill";
import { AssessmentStatus, AssessmentScheduleType } from "../enum/enum";
import { UtilityHelpers, DatabaseHelpers } from "../services/helpers";

/**
 * Seeder to create test data for deadline passed scenarios
 * This creates assessments with deadlines that have already passed
 */
export async function seedDeadlineTestData(): Promise<void> {
  try {
    const assessmentRequestRepo = AppDataSource.getRepository(AssessmentRequest);
    const assessmentCycleRepo = AppDataSource.getRepository(AssessmentCycle);
    const userRepo = AppDataSource.getRepository(User);
    const skillRepo = AppDataSource.getRepository(Skill);

    console.log("🕐 Starting deadline test data seeding...");

    // Get existing users (excluding HR and admin)
    const users = await userRepo.find({
      where: [
        { role: { name: "Product Engineer" } },
        { role: { name: "Quality Assurance" } },
        { role: { name: "Quality Assurance Automation" } },
        { role: { name: "COE/Product Management" } },
        { role: { name: "product Design" } },
        { role: { name: "Product Support" } }
      ],
      relations: ["role"],
      take: 5 // Limit to 5 users for testing
    });

    if (users.length === 0) {
      console.log("❌ No non-HR users found. Please run the main seeder first.");
      return;
    }

    // Get existing skills
    const skills = await skillRepo.find({ take: 3 });
    if (skills.length === 0) {
      console.log("❌ No skills found. Please run the main seeder first.");
      return;
    }

    // Get HR user for creating assessments
    const hrUser = await userRepo.findOne({
      where: { role: { name: "hr" } },
      relations: ["role"]
    });

    if (!hrUser) {
      console.log("❌ No HR user found. Please run the main seeder first.");
      return;
    }

    const now = new Date();

    // Create test assessment cycle with overdue deadline
    console.log("   📝 Creating overdue assessment cycle...");
    const overdueDeadlineDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)); // 5 days ago
    const overdueScheduledDate = new Date(now.getTime() - (12 * 24 * 60 * 60 * 1000)); // 12 days ago

    const overdueCycle = assessmentCycleRepo.create({
      title: "Q4 2024 Skills Assessment - OVERDUE TEST",
      createdBy: hrUser.id,
      scheduledDate: overdueScheduledDate,
      scheduleType: AssessmentScheduleType.QUARTERLY,
      deadlineDays: 7,
      deadlineDate: overdueDeadlineDate,
      status: 'ACTIVE',
      comments: "Test cycle for overdue deadline scenarios",
      targetTeams: ['all'],
      totalAssessments: users.length
    });

    const savedOverdueCycle = await assessmentCycleRepo.save(overdueCycle);

    // Create overdue assessments for different statuses
    const overdueAssessments = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const statuses = [
        AssessmentStatus.LEAD_WRITING,
        AssessmentStatus.EMPLOYEE_REVIEW,
        AssessmentStatus.EMPLOYEE_APPROVED,
        AssessmentStatus.HR_FINAL_REVIEW
      ];
      
      const status = statuses[i % statuses.length];
      
      const assessment = assessmentRequestRepo.create({
        userId: user.id,
        initiatedBy: hrUser.id,
        scheduledDate: overdueScheduledDate,
        scheduleType: AssessmentScheduleType.QUARTERLY,
        deadlineDays: 7,
        deadlineDate: overdueDeadlineDate,
        status: status,
        currentCycle: 1,
        nextApprover: user.leadId ? parseInt(user.leadId) : null,
        cycleId: savedOverdueCycle.id
      });

      overdueAssessments.push(assessment);
    }

    const savedOverdueAssessments = await assessmentRequestRepo.save(overdueAssessments);
    
    // Create score entries and audit entries for each assessment
    for (let i = 0; i < savedOverdueAssessments.length; i++) {
      const assessment = savedOverdueAssessments[i];
      const user = users[i];
      const skillIds = skills.slice(0, 2).map(s => s.id); // First 2 skills
      
      // Create score entries
      if (skillIds.length > 0) {
        await DatabaseHelpers.createScoreEntries(assessment.id, skillIds);
      }
      
      // Create audit entry
      await DatabaseHelpers.createAuditEntry({
        assessmentId: assessment.id,
        auditType: "INITIATED",
        editorId: parseInt(hrUser.id),
        userId: user.id,
        comments: `Test assessment for ${user.name} - OVERDUE by ${Math.floor((now.getTime() - overdueDeadlineDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
        commentedBy: "system",
        status: "INITIATED",
        cycleNumber: 1
      });
    }
    
    console.log(`   ✅ Created ${overdueAssessments.length} overdue assessments`);

    // Create assessments with deadlines approaching (1-2 days left)
    console.log("   📝 Creating assessments with approaching deadlines...");
    const approachingDeadlineDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1 day from now
    const approachingScheduledDate = new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000)); // 6 days ago

    const approachingCycle = assessmentCycleRepo.create({
      title: "Q1 2025 Skills Assessment - APPROACHING DEADLINE",
      createdBy: hrUser.id,
      scheduledDate: approachingScheduledDate,
      scheduleType: AssessmentScheduleType.QUARTERLY,
      deadlineDays: 7,
      deadlineDate: approachingDeadlineDate,
      status: 'ACTIVE',
      comments: "Test cycle for approaching deadline scenarios",
      targetTeams: ['all'],
      totalAssessments: Math.min(3, users.length)
    });

    const savedApproachingCycle = await assessmentCycleRepo.save(approachingCycle);

    const approachingAssessments = [];
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      
      const assessment = assessmentRequestRepo.create({
        userId: user.id,
        initiatedBy: hrUser.id,
        scheduledDate: approachingScheduledDate,
        scheduleType: AssessmentScheduleType.QUARTERLY,
        deadlineDays: 7,
        deadlineDate: approachingDeadlineDate,
        status: AssessmentStatus.LEAD_WRITING,
        currentCycle: 1,
        nextApprover: user.leadId ? parseInt(user.leadId) : null,
        cycleId: savedApproachingCycle.id
      });

      approachingAssessments.push(assessment);
    }

    const savedApproachingAssessments = await assessmentRequestRepo.save(approachingAssessments);
    
    // Create score entries and audit entries for each assessment
    for (let i = 0; i < savedApproachingAssessments.length; i++) {
      const assessment = savedApproachingAssessments[i];
      const user = users[i];
      const skillIds = skills.slice(1, 3).map(s => s.id); // Skills 2-3
      
      // Create score entries
      if (skillIds.length > 0) {
        await DatabaseHelpers.createScoreEntries(assessment.id, skillIds);
      }
      
      // Create audit entry
      await DatabaseHelpers.createAuditEntry({
        assessmentId: assessment.id,
        auditType: "INITIATED",
        editorId: parseInt(hrUser.id),
        userId: user.id,
        comments: `Test assessment for ${user.name} - Deadline approaching in 1 day`,
        commentedBy: "system",
        status: "INITIATED",
        cycleNumber: 1
      });
    }
    
    console.log(`   ✅ Created ${approachingAssessments.length} assessments with approaching deadlines`);

    // Create assessments that are severely overdue (10+ days)
    console.log("   📝 Creating severely overdue assessments...");
    const severelyOverdueDeadlineDate = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)); // 15 days ago
    const severelyOverdueScheduledDate = new Date(now.getTime() - (22 * 24 * 60 * 60 * 1000)); // 22 days ago

    const severelyOverdueCycle = assessmentCycleRepo.create({
      title: "Q3 2024 Skills Assessment - SEVERELY OVERDUE",
      createdBy: hrUser.id,
      scheduledDate: severelyOverdueScheduledDate,
      scheduleType: AssessmentScheduleType.QUARTERLY,
      deadlineDays: 7,
      deadlineDate: severelyOverdueDeadlineDate,
      status: 'ACTIVE',
      comments: "Test cycle for severely overdue deadline scenarios",
      targetTeams: ['all'],
      totalAssessments: Math.min(2, users.length)
    });

    const savedSeverelyOverdueCycle = await assessmentCycleRepo.save(severelyOverdueCycle);

    const severelyOverdueAssessments = [];
    for (let i = 0; i < Math.min(2, users.length); i++) {
      const user = users[i];
      
      const assessment = assessmentRequestRepo.create({
        userId: user.id,
        initiatedBy: hrUser.id,
        scheduledDate: severelyOverdueScheduledDate,
        scheduleType: AssessmentScheduleType.QUARTERLY,
        deadlineDays: 7,
        deadlineDate: severelyOverdueDeadlineDate,
        status: AssessmentStatus.EMPLOYEE_REVIEW,
        currentCycle: 1,
        nextApprover: user.leadId ? parseInt(user.leadId) : null,
        cycleId: savedSeverelyOverdueCycle.id
      });

      severelyOverdueAssessments.push(assessment);
    }

    const savedSeverelyOverdueAssessments = await assessmentRequestRepo.save(severelyOverdueAssessments);
    
    // Create score entries and audit entries for each assessment
    for (let i = 0; i < savedSeverelyOverdueAssessments.length; i++) {
      const assessment = savedSeverelyOverdueAssessments[i];
      const user = users[i];
      const skillIds = [skills[0].id]; // Just first skill
      
      // Create score entries
      if (skillIds.length > 0) {
        await DatabaseHelpers.createScoreEntries(assessment.id, skillIds);
      }
      
      // Create audit entry
      await DatabaseHelpers.createAuditEntry({
        assessmentId: assessment.id,
        auditType: "INITIATED",
        editorId: parseInt(hrUser.id),
        userId: user.id,
        comments: `Test assessment for ${user.name} - SEVERELY OVERDUE by 15+ days`,
        commentedBy: "system",
        status: "INITIATED",
        cycleNumber: 1
      });
    }
    
    console.log(`   ✅ Created ${severelyOverdueAssessments.length} severely overdue assessments`);

    console.log("✅ Deadline test data seeding complete!");
    console.log(`
📊 Summary of created test data:
   • ${overdueAssessments.length} overdue assessments (5 days past deadline)
   • ${approachingAssessments.length} assessments with approaching deadlines (1 day left)
   • ${severelyOverdueAssessments.length} severely overdue assessments (15+ days past deadline)
   
🎯 Test scenarios created:
   • Overdue assessments in different statuses (LEAD_WRITING, EMPLOYEE_REVIEW, etc.)
   • Color-coded severity levels (orange for recent, red for overdue, dark red for severe)
   • View details functionality with user lists
   • Deadline notifications and alerts
    `);

  } catch (error) {
    console.error("❌ Error during deadline test data seeding:", error);
    throw error;
  }
}

// Allow running this script directly
if (require.main === module) {
  console.log("🕐 Running deadline test seeder script independently...");
  
  AppDataSource.initialize()
    .then(async () => {
      console.log("✅ Database connection established");
      await seedDeadlineTestData();
      await AppDataSource.destroy();
      console.log("🔌 Database connection closed");
      console.log("🎉 Deadline test seeding completed successfully!");
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error("❌ Deadline test seeding failed:", error);
      process.exit(1);
    });
}