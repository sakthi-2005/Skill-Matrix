import { In } from "typeorm";
import { assessmentRequestRepo, scoreRepo, userRepo, AuditRepo, skillRepo } from "../../config/dataSource";
import {  AssessmentWithHistory, LeadSkillAssessmentData, LatestScore } from "../../types/services";
import { AssessmentStatus, role, AssessmentScheduleType } from "../../enum/enum";
import { AssessmentRequestType } from "../../types/entities";
import { ValidationHelpers, UtilityHelpers, DatabaseHelpers } from "../helpers";


const AssessmentService = {
  // HR initiates assessment for employee or TL
  initiateAssessment: async (
    hrId: string,
    targetUserId: string,
    scheduledDate?: Date,
    scheduleType: AssessmentScheduleType = AssessmentScheduleType.QUARTERLY,
    deadlineDays: number = 7,
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      const [hrUser, targetUser] = await Promise.all([
        ValidationHelpers.validateHRUser(hrId),
        ValidationHelpers.validateUserExists(targetUserId)
      ]);

      ValidationHelpers.validateTargetUserRole(targetUser);
      UtilityHelpers.validateDeadlineDays(deadlineDays);

      const finalScheduledDate = scheduledDate ?? UtilityHelpers.getCurrentTime();
      const deadlineDate = UtilityHelpers.calculateDeadlineDate(finalScheduledDate, deadlineDays);
      const skills = skillRepo.find({
        where:{
          positionId: targetUser.positionId
        }
      })

      const skillIds = (await skills).map(e=>e.id);


      const assessment = assessmentRequestRepo.create({
        userId: targetUserId,
        status: targetUser.leadId && new Date() >= finalScheduledDate ? AssessmentStatus.LEAD_WRITING : AssessmentStatus.INITIATED,
        initiatedBy: hrId,
        nextApprover: targetUser.leadId ? parseInt(targetUser.leadId) : null,
        scheduledDate: finalScheduledDate,
        scheduleType: scheduleType,
        deadlineDays: deadlineDays,
        deadlineDate: deadlineDate,
        currentCycle: 1,
        nextScheduledDate: UtilityHelpers.calculateNextScheduledDate(finalScheduledDate, scheduleType)
      });

      const savedAssessment=await assessmentRequestRepo.save(assessment);
      console.log("Saved assessment:", savedAssessment);
 
      if (skillIds?.length > 0) {
        console.log("Creating score entries for skills:", skillIds);
        await DatabaseHelpers.createScoreEntries(
          savedAssessment.id,
          skillIds
        );
      }

      // Create audit log
      await DatabaseHelpers.createAuditEntry({
        assessmentId: savedAssessment.id,
        auditType: "INITIATED",
        editorId: parseInt(hrId),
        userId: targetUserId, 
        comments: comments || "Assessment initiated by HR",
        commentedBy: hrId,
        status: "INITIATED",
        cycleNumber: 1
      });
      
      const result= await AssessmentService.getAssessmentWithHistory(savedAssessment.id);
      console.log("Full assessment with history:", result);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to initiate assessment: ${error.message}`);
    }
  },

  // Lead writes assessment for team member
  writeLeadAssessment: async (
    leadId: string,
    assessmentId: number,
    skillScores: LeadSkillAssessmentData[],
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"],
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Validate lead authorization
      if (assessment.user?.leadId !== leadId) {
        throw new Error("You are not authorized to write this assessment");
      }

      if (assessment.status !== AssessmentStatus.LEAD_WRITING) {
        throw new Error("Assessment is not in a writable state");
      }

      // Track score changes for audit trail
      const scoreChanges = [];
      const scoreUpdatePromises = [];

      // Process skill scores with validation and batch operations
      for (const skillScore of skillScores) {
        ValidationHelpers.validateSkillScore(skillScore.leadScore, skillScore.skillId);

        const scoreUpdatePromise = (async () => {
          const score = await scoreRepo.findOne({
            where: {
              assessmentId: assessmentId,
              skillId: skillScore.skillId
            },
            relations: ["Skill"]
          });

          if (!score) return null;

          const previousScore = score.score;
          const newScore = skillScore.leadScore;
          
          score.score = newScore;
          await scoreRepo.save(score);

          // Record score change for audit
          const scoreChange = {
            skillId: skillScore.skillId,
            skillName: score.Skill?.name || `Skill ${skillScore.skillId}`,
            previousScore: previousScore,
            newScore: newScore,
            changed: previousScore !== newScore
          };

          // Create detailed audit entry for each score change
          if (scoreChange.changed) {
            await DatabaseHelpers.createAuditEntry({
              assessmentId: assessmentId,
              auditType: "SCORE_UPDATED",
              editorId: parseInt(leadId),
              userId: assessment.userId,
              skillName: score.Skill?.name,
              previousScore: previousScore,
              currentScore: newScore,
              comments: comments || `Score updated for ${score.Skill?.name}`,
              commentedBy: leadId,
              status: "SCORE_UPDATED",
              cycleNumber: assessment.currentCycle
            });
          }

          return scoreChange;
        })();

        scoreUpdatePromises.push(scoreUpdatePromise);
      }

      // Wait for all score updates to complete
      const scoreUpdateResults = await Promise.all(scoreUpdatePromises);
      scoreChanges.push(...scoreUpdateResults.filter(Boolean));

      // Update assessment status
      assessment.status = AssessmentStatus.EMPLOYEE_REVIEW;
      assessment.nextApprover = parseInt(assessment.userId);
      await assessmentRequestRepo.save(assessment);

      // Create general audit log
      await DatabaseHelpers.createAuditEntry({
        assessmentId: assessmentId,
        auditType: "LEAD_ASSESSMENT_WRITTEN",
        editorId: parseInt(leadId),
        userId: assessment.userId,
        comments: comments || "Lead assessment completed",
        commentedBy: leadId,
        status: "LEAD_ASSESSMENT_WRITTEN",
        cycleNumber: assessment.currentCycle
      });

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to write lead assessment: ${error.message}`);
    }
  },

  // Employee reviews and approves/rejects assessment
  employeeReviewAssessment: async (
    employeeId: string,
    assessmentId: number,
    approved: boolean,
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"]
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Validate employee authorization
      if (assessment.userId !== employeeId) {
        throw new Error("You are not authorized to review this assessment");
      }

      if (assessment.status !== AssessmentStatus.EMPLOYEE_REVIEW) {
        throw new Error("Assessment is not in a reviewable state");
      }

      // Get current scores for audit trail
      const currentScores = await scoreRepo.find({
        where: { assessmentId: assessmentId },
        relations: ["Skill"]
      });

      const scoresSnapshot = currentScores.map(score => 

        `${score.Skill?.name}: ${score.leadScore}/5`

      ).join(', ');

      // Update assessment status based on employee decision
      if (approved) {
        assessment.status = AssessmentStatus.EMPLOYEE_APPROVED;
        assessment.nextApprover = parseInt(assessment.initiatedBy); // HR

        await DatabaseHelpers.createAuditEntry({
          assessmentId: assessmentId,
          auditType: "EMPLOYEE_APPROVED",
          editorId: parseInt(employeeId),
          userId: employeeId,
          comments: comments || "Employee approved the assessment",
          commentedBy: employeeId,
          status: "EMPLOYEE_APPROVED",
          cycleNumber: assessment.currentCycle,
        });
      } else {
        // Employee rejected - send back to Team Lead for revision
        assessment.status = AssessmentStatus.LEAD_WRITING;
        assessment.nextApprover = assessment.user?.leadId ? parseInt(assessment.user.leadId) : null;
        assessment.currentCycle += 1; // Increment cycle for rejection

        await DatabaseHelpers.createAuditEntry({
          assessmentId: assessmentId,
          auditType: "EMPLOYEE_REJECTED",
          editorId: parseInt(employeeId),
          userId: employeeId,
          comments: comments || "Employee rejected the assessment - requesting revision",
          commentedBy: employeeId,
          status: "EMPLOYEE_REJECTED",
          cycleNumber: assessment.currentCycle,
        });
      }

      await assessmentRequestRepo.save(assessment);

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to review assessment: ${error.message}`);
    }
  },

      // Schedule next assessment
  // scheduleNextAssessment: async (completedAssessment: AssessmentRequestType): Promise<void> => {
  //   try {
  //     const nextDate = UtilityHelpers.calculateNextScheduledDate(
  //       completedAssessment.scheduledDate || UtilityHelpers.getCurrentTime(),
  //       completedAssessment.scheduleType
  //     );
  //     const deadlineDate = UtilityHelpers.calculateDeadlineDate(nextDate, completedAssessment.deadlineDays);

  //     // Create a scheduled assessment record
  //     const scheduledAssessment = assessmentRequestRepo.create({
  //       userId: completedAssessment.userId,
  //       status: AssessmentStatus.INITIATED,
  //       initiatedBy: completedAssessment.initiatedBy,
  //       scheduledDate: nextDate,
  //       scheduleType: completedAssessment.scheduleType,
  //       deadlineDays: completedAssessment.deadlineDays,
  //       deadlineDate: deadlineDate,
  //       currentCycle: 1,
  //       nextScheduledDate: UtilityHelpers.calculateNextScheduledDate(nextDate, completedAssessment.scheduleType)
  //     });

  //     const [savedAssessment] = await Promise.all([
  //       assessmentRequestRepo.save(scheduledAssessment),
  //       DatabaseHelpers.createAuditEntry({
  //         assessmentId: scheduledAssessment.id,
  //         auditType: "SCHEDULED",
  //         editorId: parseInt(completedAssessment.initiatedBy),
  //         userId: completedAssessment.userId,
  //         comments: "Automatically scheduled assessment",
  //         commentedBy: completedAssessment.initiatedBy,
  //         status: "SCHEDULED",
  //         cycleNumber: 1
  //       })
  //     ]);
  //   } catch (error: any) {
  //     console.error('Failed to schedule next assessment:', error);
  //   }
  // },

  // HR final review
  hrFinalReview: async (
    hrId: string,
    assessmentId: number,
    approved: boolean,
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      // Parallel validation
      const [hrUser, assessment] = await Promise.all([
        ValidationHelpers.validateHRUser(hrId),
        ValidationHelpers.validateAssessmentExists(assessmentId)
      ]);

      if (![AssessmentStatus.EMPLOYEE_APPROVED, AssessmentStatus.HR_FINAL_REVIEW].includes(assessment.status)) {
        throw new Error("Assessment is not ready for HR final review");
      }

      if (approved) {
        // Assessment completed
        assessment.status = AssessmentStatus.COMPLETED;
        assessment.completedAt = UtilityHelpers.getCurrentTime();
        assessment.nextApprover = null;
        
        // Parallel operations: save assessment and create audit log
        const operations: Promise<any>[] = [
          assessmentRequestRepo.save(assessment),
          DatabaseHelpers.createAuditEntry({
            assessmentId: assessmentId,
            auditType: "HR_APPROVED",
            editorId: parseInt(hrId),
            userId: assessment.userId,
            comments: comments || "Assessment approved by HR",
            commentedBy: hrId,
            status: "HR_APPROVED",
            cycleNumber: assessment.currentCycle
          })
        ];

        // // Schedule next assessment if needed
        // if (assessment.nextScheduledDate) {
        //   operations.push(AssessmentService.scheduleNextAssessment(assessment));
        // }
        await Promise.all(operations);

      } else {
        // HR rejected - back to lead for revision
        assessment.status = AssessmentStatus.LEAD_WRITING;
        assessment.nextApprover = assessment.user?.leadId ? parseInt(assessment.user.leadId) : null;
        assessment.currentCycle += 1;

        await Promise.all([
          assessmentRequestRepo.save(assessment),
          DatabaseHelpers.createAuditEntry({
            assessmentId: assessmentId,
            auditType: "HR_REJECTED",
            editorId: parseInt(hrId),
            userId: assessment.userId,
            comments: comments || "Assessment rejected by HR - sent back for revision",
            commentedBy: hrId,
            status: "HR_REJECTED",
            cycleNumber: assessment.currentCycle
          })
        ]);
      }

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to perform HR final review: ${error.message}`);
    }
  },

  // Get assessment with full history
  getAssessmentWithHistory: async (assessmentId: number): Promise<AssessmentWithHistory> => {
    try {
      // Parallel fetch assessment and its related data
      const [assessment, { scores, history }, isAccessible] = await Promise.all([
        assessmentRequestRepo.findOne({
          where: { id: assessmentId },
          relations: ["user"]
        }),
        DatabaseHelpers.getAssessmentScoresAndHistory(assessmentId),
        AssessmentService.isAssessmentAccessible(assessmentId)
      ]);

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      console.log(`DEBUG: getAssessmentWithHistory - Assessment ${assessmentId} has ${scores.length} scores`);
      scores.forEach(score => {
        console.log(`DEBUG: Score ${score.id} - Skill ${score.skillId} (${score.Skill?.name}) - Lead Score: ${score.score}`);
      });

      // Enhance history entries using utility helper
      const enhancedHistory = UtilityHelpers.enhanceHistoryEntries(history);

      // Check if this assessment was recently rejected
      const latestAudit = enhancedHistory.length > 0 ? enhancedHistory[enhancedHistory.length - 1] : null;
      const wasRecentlyRejected = latestAudit?.auditType === 'EMPLOYEE_REJECTED';

      return {
        ...assessment,
        detailedScores: scores,
        history: enhancedHistory,
        currentCycle: assessment.currentCycle ?? 1,
        isAccessible,
        wasRecentlyRejected,
        rejectionReason: wasRecentlyRejected ? latestAudit?.comments : undefined
      };
    } catch (error: any) {
      throw new Error(`Failed to get assessment with history: ${error.message}`);
    }
  },

  // Check if assessment is accessible based on schedule
  isAssessmentAccessible: async (assessmentId: number): Promise<boolean> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({ id: assessmentId });
      if (!assessment) return false;

      const now = UtilityHelpers.getCurrentTime();
      const scheduledDate = assessment.scheduledDate ?? UtilityHelpers.getCurrentTime();
      
      // Assessment is accessible if conditions are met
      return now >= scheduledDate && 
             ![AssessmentStatus.COMPLETED, AssessmentStatus.Cancelled].includes(assessment.status);
    } catch (error: any) {
      return false;
    }
  },



  // Get assessments requiring action from specific user
  getAssessmentsRequiringAction: async (userId: string): Promise<AssessmentWithHistory[]> => {
    try {
      const assessments = await assessmentRequestRepo.find({
        where: {
          nextApprover: parseInt(userId),
          status: In([
            AssessmentStatus.LEAD_WRITING,
            AssessmentStatus.EMPLOYEE_REVIEW,
            AssessmentStatus.EMPLOYEE_APPROVED,
            AssessmentStatus.HR_FINAL_REVIEW
          ])
        },
        relations: ["user"],
        order: { requestedAt: "ASC" }
      });

      // Parallel processing of assessments
      const detailedAssessmentPromises = assessments.map(async (assessment) => {
        const detailed = await AssessmentService.getAssessmentWithHistory(assessment.id);
        return detailed.isAccessible ? detailed : null;
      });

      const detailedAssessments = await Promise.all(detailedAssessmentPromises);
      return detailedAssessments.filter(Boolean) as AssessmentWithHistory[];
    } catch (error: any) {
      throw new Error(`Failed to get assessments requiring action: ${error.message}`);
    }
  },


    // Get assessments for specific user role
  getAssessmentsForRole: async (userId: string, userRole: string): Promise<AssessmentWithHistory[]> => {
    try {
      let whereConditions: any = {};
      
      switch (userRole) {
        case role.HR:
          // HR can see all assessments
          whereConditions = {};
          break;
        case role.LEAD:
          // Lead can see assessments for their team members
          const teamMembers = await userRepo.find({
            where: { leadId: userId }
          });
          const teamMemberIds = teamMembers.map(member => member.id);
          whereConditions = {
            userId: In(teamMemberIds)
          };
          break;
        case role.EMPLOYEE:
          // Employee can only see their own assessments
          whereConditions = {
            userId: userId
          };
          break;
        default:
          throw new Error("Invalid user role");
      }

      const assessments = await assessmentRequestRepo.find({
        where: whereConditions,
        relations: ["user"],
        order: { requestedAt: "DESC" }
      });

      const detailedAssessments: AssessmentWithHistory[] = [];
      for (const assessment of assessments) {
        const detailed = await AssessmentService.getAssessmentWithHistory(assessment.id);
        detailedAssessments.push(detailed);
      }

      return detailedAssessments;
    } catch (error: any) {
      throw new Error(`Failed to get assessments for role: ${error.message}`);
    }
  },
  
  // Cancel assessment (HR only)
  cancelAssessment: async (assessmentId: number): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"]
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      if (assessment.status === AssessmentStatus.COMPLETED) {
        throw new Error("Cannot cancel completed assessment");
      }

      // Cancel the assessment
      assessment.status = AssessmentStatus.Cancelled;
      assessment.nextApprover = null;
      await assessmentRequestRepo.save(assessment);

      // Create audit log
      const currentTime = new Date();
      await AuditRepo.save({
        assessmentId: assessmentId,
        auditType: "CANCELLED",
        editorId: 0, // System cancellation
        userId: assessment.userId,
        comments: "Assessment cancelled",
        commentedBy: "system",
        status: "CANCELLED",
        cycleNumber: assessment.currentCycle,
        auditedAt: currentTime,
        createdAt: currentTime
      });

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to cancel assessment: ${error.message}`);
    }
  },

    // Get user's latest approved scores (only lead scores, no self scores)
  getUserLatestApprovedScores: async (userId: string): Promise<LatestScore[]> => {
      try {
        // Get all completed assessments for the user
        const completedAssessments = await assessmentRequestRepo.find({
          where: {
            userId: userId,
            status: AssessmentStatus.COMPLETED
          },
          order: { requestedAt: "DESC" }
        });
  
        if (completedAssessments.length === 0) {
          return [];
        }
  
        // Get all scores from completed assessments
        const assessmentIds = completedAssessments.map(a => a.id);
        const allScores = await scoreRepo.find({
          where: {
            assessmentId: In(assessmentIds)
          },
          relations: ["Skill"]
        });
  
        // Filter scores to only include those with lead scores
        const scoresWithLeadScore = allScores.filter(score => score.score !== null);
  
        // Group scores by skill and get the latest for each skill
        const latestScoresBySkill = new Map<number, any>();
        
        for (const score of scoresWithLeadScore) {
          const skillId = score.skillId;
          const assessment = completedAssessments.find(a => a.id === score.assessmentId);
          
          if (assessment && score.Skill) {
            if (!latestScoresBySkill.has(skillId) || 
                assessment.requestedAt > latestScoresBySkill.get(skillId).requestedAt) {
              latestScoresBySkill.set(skillId, {
                id: score.id,
                lead_score: score.score,
                updated_at: score.updatedAt,
                skill_name: score.Skill.name,
                skill_id: skillId,
                requestedAt: assessment.requestedAt
              });
            }
          }
        }
  
        return Array.from(latestScoresBySkill.values());
      } catch (error: any) {
        throw new Error(`Failed to get user's latest approved scores: ${error.message}`);
      }
  },

      // Get all assessments for a specific user (for history modal)
  getUserAssessmentHistory: async (userId: string): Promise<AssessmentWithHistory[]> => {
        try {
          const assessments = await assessmentRequestRepo.find({
            where: { userId: userId },
            relations: ["user"],
            order: { requestedAt: "DESC" }
          });
    
          const detailedAssessments: AssessmentWithHistory[] = [];
          for (const assessment of assessments) {
            const detailed = await AssessmentService.getAssessmentWithHistory(assessment.id);
            detailedAssessments.push(detailed);
          }
    
          return detailedAssessments;
        } catch (error: any) {
          throw new Error(`Failed to get user assessment history: ${error.message}`);
        }
},

      // Get detailed score change history for an assessment
  getAssessmentScoreHistory: async (assessmentId: number): Promise<any[]> => {
          try {
            // Get all score-related audit entries
            const scoreAudits = await AuditRepo.find({
              where: { 
                assessmentId: assessmentId,
                auditType: 'SCORE_UPDATED'
              },
              relations: ["editor"],
              order: { auditedAt: "ASC" }
            });
      
            // Parse the score changes from audit fields (no longer from comments)
            const scoreChanges = scoreAudits.map(audit => {
              return {
                id: audit.id,
                skillName: audit.skillName || 'Unknown Skill',
                previousScore: audit.previousScore,
                newScore: audit.currentScore,
                changedBy: audit.editor?.name || 'Unknown',
                changedAt: audit.auditedAt,
                cycleNumber: audit.cycleNumber,
                fullComment: audit.comments || ''
              };
            });
      
            return scoreChanges;
          } catch (error: any) {
            throw new Error(`Failed to get score change history: ${error.message}`);
          }
 },

   // Get user assessment summaries (only latest assessment per user with total cycles count)
  getUserAssessmentSummaries: async (): Promise<any[]> => {
    try {
      // Get all users with assessments
      const usersWithAssessments = await userRepo.find({
        relations: ["role", "Team", "position"],
        order: { name: "ASC" }
      });

      const userSummaries = [];

      for (const user of usersWithAssessments) {
        // Get all assessments for this user
        const userAssessments = await assessmentRequestRepo.find({
          where: { userId: user.id },
          order: { requestedAt: "DESC" }
        });

        if (userAssessments.length > 0) {
          // Get the latest assessment
          const latestAssessment = userAssessments[0];

          // Get detailed scores for the latest assessment
          const scores = await scoreRepo.find({
            where: { assessmentId: latestAssessment.id },
            relations: ["Skill"]
          });

          // Get audit history for the latest assessment
          const history = await AuditRepo.find({
            where: { assessmentId: latestAssessment.id },
            order: { auditedAt: "ASC" }
          });

          userSummaries.push({
            user: user,
            latestAssessment: {
              ...latestAssessment,
              detailedScores: scores,
              history: history,
              currentCycle: latestAssessment.currentCycle || 1,
              isAccessible: true
            },
            totalAssessments: userAssessments.length,
            totalCycles: Math.max(...userAssessments.map(a => a.currentCycle || 1)),
            allAssessments: userAssessments // This will be used for history modal
          });
        }
      }

      return userSummaries;
    } catch (error: any) {
      throw new Error(`Failed to get user assessment summaries: ${error.message}`);
    }
  },
};

export default AssessmentService;