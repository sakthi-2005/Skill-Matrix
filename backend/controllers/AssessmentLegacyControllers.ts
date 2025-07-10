import { ResponseToolkit, Request } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { HTTP_STATUS, MESSAGES } from '../enum/enum';
import { ResponseHelpers } from './helper/';
import AssessmentController from './assessment/AssessmentController';

const AssessmentLegacyController: Controller = {
// LEGACY METHODS FOR BACKWARD COMPATIBILITY
  createAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    return ResponseHelpers.error(h, MESSAGES.ERROR.LEGACY_METHOD_INITIATE, HTTP_STATUS.BAD_REQUEST);
  },

  getAssessmentById: async (req: Request, h: ResponseToolkit) => {
    // Legacy method - redirect to new workflow
    // Map the old 'id' parameter to the new 'assessmentId' parameter
    const { id } = req.params;
    req.params.assessmentId = id;
    return AssessmentController.getAssessmentWithHistory(req, h);
  },

  getAllAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    return AssessmentController.getAssessmentsForRole(req, h);
  },

  reviewAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    return ResponseHelpers.error(h, MESSAGES.ERROR.LEGACY_METHOD_REVIEW, HTTP_STATUS.BAD_REQUEST);
  },

  getMyAssignedAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    return AssessmentController.getAssessmentsRequiringAction(req, h);
  },
}

export default AssessmentLegacyController;