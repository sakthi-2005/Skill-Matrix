import { In } from "typeorm";
import { assessmentRequestRepo, scoreRepo, userRepo, skillRepo, AuditRepo, assessmentCycleRepo, assessmentCycleSkillRepo, positionRepo } from "../../config/dataSource";
import { BulkAssessmentResult } from "../../types/services";
import { AssessmentCycleType, UserType } from "../../types/entities";
import { AssessmentStatus, role, AssessmentScheduleType } from "../../enum/enum";
import { ValidationHelpers, UtilityHelpers, DatabaseHelpers } from "../helpers";

const AssessmentCycleService = {
// HR initiates bulk assessment for all users or specific teams
  initiateBulkAssessment: async (
    hrId: string,
    assessmentTitle: string,
    includeTeams: string[],
    scheduledDate?: Date,
    scheduleType: AssessmentScheduleType = AssessmentScheduleType.QUARTERLY,
    deadlineDays: number = 7,
    comments: string = "",
    excludeUsers: string[] = []
  ): Promise<BulkAssessmentResult> => {
    try {
      // Parallel validation
      const [hrUser] = await Promise.all([
        ValidationHelpers.validateHRUser(hrId),
        // skillRepo.findBy({ id: In(skillIds) })
      ]);


      UtilityHelpers.validateDeadlineDays(deadlineDays);

      const finalScheduledDate = scheduledDate ?? UtilityHelpers.getCurrentTime();
      const deadlineDate = UtilityHelpers.calculateDeadlineDate(finalScheduledDate, deadlineDays);

      // Create assessment cycle
      const assessmentCycle = assessmentCycleRepo.create({
        title: assessmentTitle,
        createdBy: hrId,
        scheduledDate: finalScheduledDate,
        scheduleType: scheduleType,
        deadlineDays: deadlineDays,
        deadlineDate: deadlineDate,
        status: 'ACTIVE',
        comments: comments,
        targetTeams: includeTeams.includes('all') ? ['all'] : includeTeams.map(String),
        excludedUsers: excludeUsers,
        totalAssessments: 0,
        completedAssessments: 0
      });

      const savedCycle = await assessmentCycleRepo.save(assessmentCycle);

      // Get target users based on team selection
      let targetUsers: UserType[] = [];
      
      console.log('DEBUG: includeTeams:', includeTeams);
      
      if (includeTeams.includes('all')) {
        // Get all employees and team leads
        targetUsers = await userRepo.find({
          relations: ["role", "Team"]
        });
        console.log('DEBUG: Found users (all):', targetUsers.length);
      } else {
        // Get users from specific teams
        const teamIds = includeTeams.filter(id => id !== 'all').map(Number);
        console.log('DEBUG: teamIds:', teamIds);
        targetUsers = await userRepo.find({
          where: {
            teamId: In(teamIds),
            role: { name: In([role.EMPLOYEE, role.LEAD]) }
          },
          relations: ["role", "Team"]
        });
        console.log('DEBUG: Found users (teams):', targetUsers.length);
      }

      console.log('DEBUG: targetUsers before exclusion:', targetUsers.length);
      
      // Filter out excluded users
      const eligibleUsers = excludeUsers.length > 0 
        ? targetUsers.filter(user => !excludeUsers.includes(user.id))
        : targetUsers;
      
      console.log('DEBUG: eligibleUsers final count:', eligibleUsers.length);

      // Use optimized bulk operations
      const assessments = await DatabaseHelpers.bulkCreateAssessments(
        eligibleUsers, 
        hrId, 
        finalScheduledDate, 
        scheduleType, 
        deadlineDays, 
        deadlineDate
      );

      console.log(`DEBUG: Created ${assessments.length} assessments in bulk`);

      // Create score entries and audit entries in parallel
      const scoreAndAuditPromises = assessments.map(async (assessment, index) => {
        const user = eligibleUsers[index];

        const userPosition = await userRepo.findOneBy({ id: assessment.userId });
        let skills = await skillRepo.find({
          where:{
            positionId: userPosition.positionId
          }
        });
        // skills = skills.map(e=>e.id);
        
        // Create score entries for this assessment
        const scorePromises = skills.map(async (skill) => {
          // const skill = await skillRepo.findOneBy({ id: skill.id });
          if (skill) {
            const score = scoreRepo.create({
              assessmentId: assessment.id,
              skillId: skill.id,
              score: null
            });
            return await scoreRepo.save(score);
          }
          return null;
        });

        // Create audit entry
        const auditPromise = DatabaseHelpers.createAuditEntry({
          assessmentId: assessment.id,
          auditType: 'ASSESSMENT_INITIATED',
          editorId: parseInt(hrId),
          userId: user.id,
          comments: 'Assessment initiated as part of cycle',
          commentedBy: hrId,
          status: 'ASSESSMENT_INITIATED'
        });

        return await auditPromise;
      });

      await Promise.all(scoreAndAuditPromises);

      // Link skills to cycle in parallel
      // const cycleSkillPromises = skillIds.map(async (skillId) => {
      //   const cycleSkill = assessmentCycleSkillRepo.create({
      //     cycleId: savedCycle.id,
      //     skillId: skillId
      //   });
      //   return await assessmentCycleSkillRepo.save(cycleSkill);
      // });

      // await Promise.all(cycleSkillPromises);

      // Update cycle with assessment count
      savedCycle.totalAssessments = assessments.length;
      await assessmentCycleRepo.save(savedCycle);

      return {
        assessmentCycleId: savedCycle.id,
        title: savedCycle.title,
        totalAssessments: assessments.length,
        targetUsers: eligibleUsers.length,
        // skills: skillIds,
        createdAt: savedCycle.createdAt
      };
    } catch (error: any) {
      throw new Error(`Failed to initiate bulk assessment: ${error.message}`);
    }
  },

// Get assessment cycles (for HR)
  getAssessmentCycles: async (): Promise<AssessmentCycleType[]> => {
      try {
        const cycles = await assessmentCycleRepo.find({
          relations: ["assessments"],
          order: { createdAt: "DESC" }
        }) as AssessmentCycleType[];
  
        // Get skills for each cycle
        for (const cycle of cycles) {
          const cycleSkills = await assessmentCycleSkillRepo.find({
            where: { cycleId: cycle.id },
            relations: ["skill"]
          });
          cycle.skills = cycleSkills.map(cs => cs.skill);
        }
  
        return cycles;
      } catch (error: any) {
        throw new Error(`Failed to get assessment cycles: ${error.message}`);
      }
  },
  
  // Get specific assessment cycle details
  getAssessmentCycleDetails: async (cycleId: number): Promise<AssessmentCycleType> => {
      try {
        const cycle = await assessmentCycleRepo.findOne({
          where: { id: cycleId },
          relations: ["assessments"]
        }) as AssessmentCycleType;
  
        if (!cycle) {
          throw new Error("Assessment cycle not found");
        }
  
        // Get skills for this cycle
        const cycleSkills = await assessmentCycleSkillRepo.find({
          where: { cycleId: cycle.id },
          relations: ["skill"]
        });
        cycle.skills = cycleSkills.map(cs => cs.skill);
  
        return cycle;
      } catch (error: any) {
        throw new Error(`Failed to get assessment cycle details: ${error.message}`);
      }
  },

  // Cancel assessment cycle (for HR)
  cancelAssessmentCycle: async (hrId: string, cycleId: number, comments?: string): Promise<AssessmentCycleType> => {
        try {
          // Validate HR user
          const hrUser = await userRepo.findOne({ 
            where: { id: hrId },
            relations: ["role"]
          });
          if (!hrUser || hrUser.role?.name !== role.HR) {
            throw new Error("Only HR can cancel assessment cycles");
          }
    
          const cycle = await assessmentCycleRepo.findOne({
            where: { id: cycleId },
            relations: ["assessments"]
          });
    
          if (!cycle) {
            throw new Error("Assessment cycle not found");
          }
    
          if (cycle.status === "CANCELLED") {
            throw new Error("Assessment cycle is already cancelled");
          }
    
          if (cycle.status === "COMPLETED") {
            throw new Error("Cannot cancel completed assessment cycle");
          }
    
          // Cancel all active assessments in this cycle
          const activeAssessments = await assessmentRequestRepo.find({
            where: {
              status: In([
                AssessmentStatus.INITIATED,
                AssessmentStatus.LEAD_WRITING,
                AssessmentStatus.EMPLOYEE_REVIEW,
                AssessmentStatus.EMPLOYEE_APPROVED,
                AssessmentStatus.EMPLOYEE_REJECTED,
                AssessmentStatus.HR_FINAL_REVIEW
              ])
            }
          });
    
          for (const assessment of activeAssessments) {
            assessment.status = AssessmentStatus.Cancelled;
            // Note: comments property doesn't exist in AssessmentRequestType, so we'll add it to audit instead
            await assessmentRequestRepo.save(assessment);
    
            // Create audit entry
            const auditEntry = AuditRepo.create({
              assessmentId: assessment.id,
              auditType: 'ASSESSMENT_CANCELLED',
              editorId: parseInt(hrId),
              userId: assessment.userId,
              comments: 'Assessment cancelled as part of cycle cancellation',
              commentedBy: hrId,
              status: 'ASSESSMENT_CANCELLED',
              auditedAt: new Date(),
              createdAt: new Date()
            });
            await AuditRepo.save(auditEntry);
          }
    
          // Update cycle status
          cycle.status = "CANCELLED";
          cycle.comments = `${cycle.comments || ''}\n\nCancelled by HR: ${comments || 'No reason provided'}`;
          const savedCycle = await assessmentCycleRepo.save(cycle) as AssessmentCycleType;
    
          return savedCycle;
        } catch (error: any) {
          throw new Error(`Failed to cancel assessment cycle: ${error.message}`);
        }
  },

};

export default AssessmentCycleService;