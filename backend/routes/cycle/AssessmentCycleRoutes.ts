import AssessmentCycleController from "../../controllers/cycle/AssessmentCycleController";

const assessmentCycleRoutes = {
  name: "assessment-cycle-routes",
  register: async function (server, options) {
    server.route([
      // ===== NEW TEAM-BASED BULK ASSESSMENT ROUTES =====

      // HR initiates bulk assessment
      {
        method: "POST",
        path: "/bulk-assessment",
        handler: AssessmentCycleController.initiateBulkAssessment,
        options: {
          auth: 'jwt',
          description: 'HR initiates bulk assessment for all users or specific teams',
          tags: ['api', 'assessment', 'hr', 'bulk'],
        }
      },
      
      // Get assessment cycles (HR only)
      {
        method: "GET",
        path: "/cycles",
        handler: AssessmentCycleController.getAssessmentCycles,
        options: {
          auth: 'jwt',
          description: 'Get all assessment cycles for HR',
          tags: ['api', 'assessment', 'hr', 'cycles'],
        }
      },
      
      // Get specific assessment cycle details (HR only)
      {
        method: "GET",
        path: "/cycles/{cycleId}",
        handler: AssessmentCycleController.getAssessmentCycleDetails,
        options: {
          auth: 'jwt',
          description: 'Get specific assessment cycle details',
          tags: ['api', 'assessment', 'hr', 'cycles'],
        }
      },
      
      // Cancel assessment cycle (HR only)
      {
        method: "POST",
        path: "/cycles/{cycleId}/cancel",
        handler: AssessmentCycleController.cancelAssessmentCycle,
        options: {
          auth: 'jwt',
          description: 'Cancel assessment cycle and all associated assessments',
          tags: ['api', 'assessment', 'hr', 'cycles'],
        }
      },
    ]);
  },
};

export default assessmentCycleRoutes;