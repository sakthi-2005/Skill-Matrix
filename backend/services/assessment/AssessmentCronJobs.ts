import { In, Between, LessThanOrEqual } from "typeorm";
import { assessmentRequestRepo } from "../../config/dataSource";
import { AssessmentStatus, CRON_SCHEDULES } from "../../enum/enum";
import { UtilityHelpers, DatabaseHelpers } from "../helpers";
import * as cron from 'node-cron';
 
const AssessmentCronJobs = {
  // Cron job to activate scheduled assessments
  initializeCronJobs: () => {
    // Run every day at 9 AM to check for assessments that should be activated
    cron.schedule(CRON_SCHEDULES.DAILY_9AM, async () => {
      try {
        const now = UtilityHelpers.getCurrentTime();

        const scheduledAssessments = await assessmentRequestRepo.find({
          where: {
            status: AssessmentStatus.INITIATED,
            scheduledDate: LessThanOrEqual(now)
          },
          relations: ["user"]
        });

        // Process assessments in parallel
        const activationPromises = scheduledAssessments
          .filter(assessment => assessment.user?.leadId)
          .map(async (assessment) => {
            assessment.status = AssessmentStatus.LEAD_WRITING;
            assessment.nextApprover = parseInt(assessment.user!.leadId!);
            
            const [savedAssessment] = await Promise.all([
              assessmentRequestRepo.save(assessment),
              DatabaseHelpers.createAuditEntry({
                assessmentId: assessment.id,
                auditType: "ACTIVATED",
                editorId: parseInt(assessment.initiatedBy),
                userId: assessment.userId,
                comments: "Assessment automatically activated",
                commentedBy: "system",
                status: "ACTIVATED",
                cycleNumber: assessment.currentCycle
              })
            ]);
            
            return savedAssessment;
          });

        await Promise.all(activationPromises);
      } catch (error) {
        console.error('Error in assessment activation cron job:', error);
      }
    });

    // Run every day at 6 PM to check for overdue assessments
    cron.schedule(CRON_SCHEDULES.DEADLINE_CHECK, async () => {
      try {
        const now = UtilityHelpers.getCurrentTime();
        
        const overdueAssessments = await assessmentRequestRepo.find({
          where: {
            status: In([
              AssessmentStatus.LEAD_WRITING,
              AssessmentStatus.EMPLOYEE_REVIEW,
              AssessmentStatus.EMPLOYEE_APPROVED,
              AssessmentStatus.HR_FINAL_REVIEW
            ]),
            deadlineDate: Between(new Date(0), now) // Less than current time
          },
          relations: ["user"]
        });

        // Log overdue assessments and create audit entries
        const overduePromises = overdueAssessments.map(async (assessment) => {
          console.log(`Assessment ${assessment.id} for user ${assessment.userId} is overdue. Deadline: ${assessment.deadlineDate}`);
          
          // Create audit entry for overdue assessment
          await DatabaseHelpers.createAuditEntry({
            assessmentId: assessment.id,
            auditType: "OVERDUE_NOTIFICATION",
            editorId: 0, // System
            userId: assessment.userId,
            comments: `Assessment is overdue. Deadline was ${assessment.deadlineDate?.toLocaleDateString()}`,
            commentedBy: "system",
            status: "OVERDUE",
            cycleNumber: assessment.currentCycle
          });
          
          // Here you can add logic to send notifications, escalate, etc.
          // For now, just logging
          return assessment;
        });

        await Promise.all(overduePromises);
        
        if (overdueAssessments.length > 0) {
          console.log(`Found ${overdueAssessments.length} overdue assessments`);
        }
      } catch (error) {
        console.error('Error in overdue assessment check cron job:', error);
      }
    });
  },    
};

export default AssessmentCronJobs;