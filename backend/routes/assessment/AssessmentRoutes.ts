import AssessmentController from "../../controllers/assessment/AssessmentController";
import AssessmentService from "../../services/assessment/AssessmentService";
import { role } from "../../enum/enum";

const assessmentRoutes = {
    name: "assessment-routes",
    register: async function (server, options) {
        server.route([
    // HR initiates assessment
      {
        method: "POST",
        path: "/initiate",
        handler: AssessmentController.initiateAssessment,
        options: {
          auth: 'jwt',
          description: 'HR initiates assessment for employee or team lead',
          tags: ['api', 'assessment', 'hr'],
        }
      },
      
      // Lead writes assessment
      {
        method: "POST",
        path: "/lead-assessment/{assessmentId}",
        handler: AssessmentController.writeLeadAssessment,
        options: {
          auth: 'jwt',
          description: 'Team lead writes assessment for team member',
          tags: ['api', 'assessment', 'lead'],
        }
      },
      
      // Employee reviews assessment
      {
        method: "POST",
        path: "/employee-review/{assessmentId}",
        handler: AssessmentController.employeeReviewAssessment,
        options: {
          auth: 'jwt',
          description: 'Employee reviews and approves/rejects assessment',
          tags: ['api', 'assessment', 'employee'],
        }
      },
      
      // HR final review
      {
        method: "POST",
        path: "/hr-final-review/{assessmentId}",
        handler: AssessmentController.hrFinalReview,
        options: {
          auth: 'jwt',
          description: 'HR performs final review of assessment',
          tags: ['api', 'assessment', 'hr'],
        }
      },
      
      // Get assessment with full history
      {
        method: "GET",
        path: "/history/{assessmentId}",
        handler: AssessmentController.getAssessmentWithHistory,
        options: {
          auth: 'jwt',
          description: 'Get assessment with complete history and audit trail',
          tags: ['api', 'assessment'],
        }
      },
      
      // Get assessments for user role
      {
        method: "GET",
        path: "/role-assessments",
        handler: AssessmentController.getAssessmentsForRole,
        options: {
          auth: 'jwt',
          description: 'Get assessments visible to current user based on role',
          tags: ['api', 'assessment'],
        }
      },
      
      // Get assessments requiring action
      {
        method: "GET",
        path: "/pending-actions",
        handler: AssessmentController.getAssessmentsRequiringAction,
        options: {
          auth: 'jwt',
          description: 'Get assessments requiring action from current user',
          tags: ['api', 'assessment'],
        }
      },
      
      // Check assessment accessibility // not-used +
      {
        method: "GET",
        path: "/accessibility/{assessmentId}",
        handler: AssessmentController.checkAssessmentAccessibility,
        options: {
          auth: 'jwt',
          description: 'Check if assessment is accessible based on schedule',
          tags: ['api', 'assessment'],
        }
      },
      
      // Get dashboard data // not-used -
      {
        method: "GET",
        path: "/dashboard",
        handler: AssessmentController.getDashboardData,
        // options: {
        //   auth: 'jwt',
        //   description: 'Get dashboard data for current user',
        //   tags: ['api', 'assessment', 'dashboard'],
        // }
      },

      // Get assessment score change history
      {
        method: "GET",
        path: "/score-history/{assessmentId}",
        handler: AssessmentController.getAssessmentScoreHistory,
        options: {
          auth: 'jwt',
          description: 'Get detailed score change history for an assessment',
          tags: ['api', 'assessment'],
        }
      },

      // Get assessment workflow status // not-used -
      {
        method: "GET",
        path: "/workflow-status/{assessmentId}",
        handler: async (request, h) => {
          try {
            const { assessmentId } = request.params;
            const assessment = await AssessmentService.getAssessmentWithHistory(parseInt(assessmentId));
            
            if (!assessment) {
              return h.response({ success: false, error: "Assessment not found" }).code(404);
            }
            
            return h.response({
              success: true,
              data: {
                currentStatus: assessment.status,
                currentCycle: assessment.currentCycle,
                nextApprover: assessment.nextApprover,
                isAccessible: assessment.isAccessible,
                completedSteps: assessment.history?.map(audit => audit.auditType) || []
              }
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get workflow status of assessment',
          tags: ['api', 'assessment', 'workflow'],
        }
      },

      // Get assessments by status // not-used +
      {
        method: "GET",
        path: "/by-status/{status}",
        handler: async (request, h) => {
          try {
            const { status } = request.params;
            const userId = request.auth.credentials.user.id;
            const userRole = request.auth.credentials.user.role;
            
            const roleAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
            const filteredAssessments = roleAssessments.filter(assessment => 
              assessment.status === status.toUpperCase()
            );
            
            return h.response({
              success: true,
              data: filteredAssessments
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get assessments by status',
          tags: ['api', 'assessment', 'filter'],
        }
      },

      // Get upcoming assessments // not-used -
      {
        method: "GET",
        path: "/upcoming",
        handler: async (request, h) => {
          try {
            const userId = request.auth.credentials.user.id;
            const userRole = request.auth.credentials.user.role;
            // let { userId, userRole } = request.query;
            // userRole = JSON.parse(userRole);
            
            const roleAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole?.name);
            
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const upcomingAssessments = roleAssessments.filter(assessment => {
              const scheduledDate = new Date(assessment.scheduledDate);
              return scheduledDate >= now && 
                     scheduledDate <= nextWeek &&
                     assessment.status === 'INITIATED';
            });
            
            return h.response({
              success: true,
              data: upcomingAssessments
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        // options: {
        //   auth: 'jwt',
        //   description: 'Get upcoming assessments in next 7 days',
        //   tags: ['api', 'assessment', 'upcoming'],
        // }
      },

      // Get overdue assessments (HR only) // not-used +
      {
        method: "GET",
        path: "/overdue",
        handler: async (request, h) => {
          try {
            const userRole = request.auth.credentials.user.role;
            
            if (userRole !== role.HR) {
              return h.response({
                success: false,
                error: "Only HR can access overdue assessments"
              }).code(403);
            }
            
            const userId = request.auth.credentials.user.id;
            const allAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
            
            const now = new Date();
            const overdueAssessments = allAssessments.filter(assessment => {
              const deadlineDate = new Date(assessment.deadlineDate);
              return deadlineDate < now && 
                     !['COMPLETED', 'CANCELLED'].includes(assessment.status);
            });
            
            return h.response({
              success: true,
              data: overdueAssessments
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get overdue assessments (HR only)',
          tags: ['api', 'assessment', 'hr', 'overdue'],
        }
      },

      // Get user assessment history
      {
        method: "GET",
        path: "/user-history/{userId}",
        handler: AssessmentController.getUserAssessmentHistory,
        options: {
          auth: 'jwt',
          description: 'Get full assessment history for a specific user',
          tags: ['api', 'assessment', 'hr'],
        }
      },

      // Get user scores (legacy)
      {
        method: "GET",
        path: "/scores",
        handler: AssessmentController.getUserLatestApprovedScores,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get user latest approved scores',
          tags: ['api', 'assessment', 'scores', 'legacy'],
        }
      },

      // Get user scores by ID (legacy)
      {
        method: "GET",
        path: "/scores/{userId}",
        handler: AssessmentController.getUserLatestApprovedScoresByUserId,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get user latest approved scores by user ID',
          tags: ['api', 'assessment', 'scores', 'legacy'],
        }
      },

      {
        method: "GET",
        path: "/user-summaries",
        handler: AssessmentController.getUserAssessmentSummaries,
        options: {
          auth: 'jwt',
          description: 'Get user assessment summaries (latest assessment per user)',
          tags: ['api', 'assessment', 'hr'],
        }
      }
    ]);
  },
};

export default assessmentRoutes;