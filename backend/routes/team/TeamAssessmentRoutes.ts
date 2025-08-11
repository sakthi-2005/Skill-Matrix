import TeamAssessmentController from "../../controllers/team/TeamAssessmentController"

const TeamAssessmentRoutes = {
  name: "team-assessment-routes",
  register: async function (server, options) {
    server.route([
      // Get team assessments (Team Lead only)
      {
        method: "GET",
        path: "/team/assessments",
        handler: TeamAssessmentController.getTeamAssessments,
        options: {
          auth: 'jwt',
          description: 'Get all assessments for team members (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team members (Team Lead only)
      {
        method: "GET",
        path: "/team/members",
        handler: TeamAssessmentController.getTeamMembers,
        options: {
          auth: 'jwt',
          description: 'Get all team members (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team assessment statistics (Team Lead only)
      {
        method: "GET",
        path: "/team/statistics",
        handler: TeamAssessmentController.getTeamAssessmentStatistics,
        options: {
          auth: 'jwt',
          description: 'Get team assessment statistics (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team', 'statistics'],
        }
      },
      
      // Get pending team assessments (Team Lead only)
      {
        method: "GET",
        path: "/team/pending",
        handler: TeamAssessmentController.getPendingTeamAssessments,
        options: {
          auth: 'jwt',
          description: 'Get pending team assessments (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team member assessment (Team Lead only)
      {
        method: "GET",
        path: "/team/member/{userId}",
        handler: TeamAssessmentController.getTeamMemberAssessment,
        options: {
          auth: 'jwt',
          description: 'Get assessments for specific team member (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Check access to specific assessment (Team Lead/HR only)
      {
        method: "GET",
        path: "/team/assessment/{assessmentId}/access",
        handler: TeamAssessmentController.checkAssessmentAccess,
        options: {
          auth: 'jwt',
          description: 'Check if current user can access specific assessment',
          tags: ['api', 'assessment', 'lead', 'team', 'access'],
        }
      },
      
      // Check access to user assessment history (Team Lead/HR only)
      {
        method: "GET",
        path: "/team/user/{userId}/access",
        handler: TeamAssessmentController.checkUserAssessmentAccess,
        options: {
          auth: 'jwt',
          description: 'Check if current user can access specific user assessment history',
          tags: ['api', 'assessment', 'lead', 'team', 'access'],
        }
      },
      
      // Get team summary (HR only)
      {
        method: "GET",
        path: "/team/{teamId}/summary",
        handler: TeamAssessmentController.getTeamSummary,
        options: {
          auth: 'jwt',
          description: 'Get team summary for HR dashboard',
          tags: ['api', 'assessment', 'hr', 'team'],
        }
      },
    ]);
  }
};

export default TeamAssessmentRoutes;