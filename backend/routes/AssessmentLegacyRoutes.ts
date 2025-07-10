import AssessmentLegacyController from "../controllers/AssessmentLegacyControllers";

const AssessmentLegacyRoutes = {
  name: "assessment-legacy-routes",
  register: async function (server) {
    server.route([
    // LEGACY ROUTES (for backward compatibility)
      // Create assessment (legacy) - DEPRECATED
      {
        method: "POST",
        path: "/create",
        handler: async (request, h) => {
          return h
            .response({
              success: false,
              error: "Self-assessment functionality has been removed. Assessments must be initiated by HR and written by team leads.",
              message: "Use the new workflow: HR initiates -> Lead writes -> Employee reviews -> HR approves"
            })
            .code(410); // Gone
        },
        options: {
          auth: 'jwt',
          description: 'Legacy: Create assessment (DEPRECATED)',
          tags: ['api', 'assessment', 'legacy', 'deprecated'],
        }
      },
      
      // Get assessment by ID (legacy)
      {
        method: "GET",
        path: "/{id}",
        handler: AssessmentLegacyController.getAssessmentById,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get assessment by ID (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Get all assessments (legacy)
      {
        method: "GET",
        path: "/all",
        handler: AssessmentLegacyController.getAllAssessments,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get all assessments (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Review assessment (legacy)
      {
        method: "POST",
        path: "/review/{assessmentId}",
        handler: AssessmentLegacyController.reviewAssessment,
        options: {
          auth: 'jwt',
          description: 'Legacy: Review assessment (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Get assigned assessments (legacy)
      {
        method: "GET",
        path: "/assigned",
        handler: AssessmentLegacyController.getMyAssignedAssessments,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get assigned assessments (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
    ]);
  }
};

export default AssessmentLegacyRoutes;