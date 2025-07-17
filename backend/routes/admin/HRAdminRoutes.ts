import { Server } from "@hapi/hapi";
import { HRAdminController } from "../../controllers/admin/HRAdminController";
import authorizeRoles from "../../middlewares/authorizeRole";
import Joi from "joi";


const teamCreateSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().allow("", null).optional(),
});

const teamUpdateSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  description: Joi.string().allow("", null).optional(),
});

const subTeamCreateSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().allow("", null).optional(),
  teamId: Joi.number().integer().required(),
});

const subTeamUpdateSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  description: Joi.string().allow("", null).optional(),
  teamId: Joi.number().integer().optional(),
});

const positionCreateSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().allow("", null).optional(),
});

const positionUpdateSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  description: Joi.string().allow("", null).optional(),
});

export const HRAdminRoutes = (server: Server) => {
  // ============ TEAMS ============
  server.route({
    method: "POST",
    path: "/admin/hr/teams",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        payload: teamCreateSchema,
      },
    },
    handler: HRAdminController.createTeam,
  });

  server.route({
    method: "GET",
    path: "/admin/hr/teams",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        query: Joi.object({
          includeDeleted: Joi.boolean().default(false),
        }),
      },
    },
    handler: HRAdminController.getAllTeams,
  });

  server.route({
    method: "GET",
    path: "/admin/hr/teams/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
        query: Joi.object({
          includeDeleted: Joi.boolean().default(false),
        }),
      },
    },
    handler: HRAdminController.getTeamById,
  });

  server.route({
    method: "PUT",
    path: "/admin/hr/teams/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
        payload: teamUpdateSchema,
      },
    },
    handler: HRAdminController.updateTeam,
  });

  server.route({
    method: "DELETE",
    path: "/admin/hr/teams/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deleteTeam,
  });

  server.route({
    method: "POST",
    path: "/admin/hr/teams/{id}/restore",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.restoreTeam,
  });

  server.route({
    method: "POST",
    path: "/admin/hr/teams/{id}/activate",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.activateTeam,
  });

  server.route({
    method: "POST",
    path: "/admin/hr/teams/{id}/deactivate",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deactivateTeam,
  });

  // ============ SUB-TEAMS ============
  server.route({
    method: "POST",
    path: "/admin/hr/sub-teams",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        payload: subTeamCreateSchema,
      },
    },
    handler: HRAdminController.createSubTeam,
  });

  server.route({
    method: "GET",
    path: "/admin/hr/sub-teams",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        query: Joi.object({
          teamId: Joi.number().integer().optional(),
          includeDeleted: Joi.boolean().default(false),
        }),
      },
    },
    handler: HRAdminController.getAllSubTeams,
  });

  server.route({
    method: "GET",
    path: "/admin/hr/sub-teams/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
        query: Joi.object({
          includeDeleted: Joi.boolean().default(false),
        }),
      },
    },
    handler: HRAdminController.getSubTeamById,
  });

  server.route({
    method: "PUT",
    path: "/admin/hr/sub-teams/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
        payload: subTeamUpdateSchema,
      },
    },
    handler: HRAdminController.updateSubTeam,
  });

  server.route({
    method: "DELETE",
    path: "/admin/hr/sub-teams/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deleteSubTeam,
  });

  server.route({
    method: "POST",
    path: "/admin/hr/sub-teams/{id}/restore",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.restoreSubTeam,
  });

  // ============ POSITIONS ============
  server.route({
    method: "POST",
    path: "/admin/hr/positions",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        payload: positionCreateSchema,
      },
    },
    handler: HRAdminController.createPosition,
  });

  server.route({
    method: "GET",
    path: "/admin/hr/positions",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        query: Joi.object({
          includeDeleted: Joi.boolean().default(false),
        }),
      },
    },
    handler: HRAdminController.getAllPositions,
  });

  server.route({
    method: "GET",
    path: "/admin/hr/positions/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
        query: Joi.object({
          includeDeleted: Joi.boolean().default(false),
        }),
      },
    },
    handler: HRAdminController.getPositionById,
  });

  server.route({
    method: "PUT",
    path: "/admin/hr/positions/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
        payload: positionUpdateSchema,
      },
    },
    handler: HRAdminController.updatePosition,
  });

  server.route({
    method: "DELETE",
    path: "/admin/hr/positions/{id}",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deletePosition,
  });

  server.route({
    method: "POST",
    path: "/admin/hr/positions/{id}/restore",
    options: {
      ...authorizeRoles(["hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.restorePosition,
  });

  // ============ STATISTICS ============
  server.route({
    method: "GET",
    path: "/admin/hr/stats",
    options: {
      ...authorizeRoles(["hr"]),
    },
    handler: HRAdminController.getOrganizationStats,
  });
};