import { Server } from "@hapi/hapi";
import { HRAdminController } from "../../controllers/admin/HRAdminController";
import authorizeRoles from "../../middlewares/authorizeRole";
import Joi from "joi";


const teamCreateSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
});

const teamUpdateSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
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
    path: "/teams",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        payload: teamCreateSchema,
      },
    },
    handler: HRAdminController.createTeam,
  });

  server.route({
    method: "GET",
    path: "/teams",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/teams/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/teams/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/teams/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deleteTeam,
  });

  server.route({
    method: "DELETE",
    path: "/teams/{id}/permanent",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.hardDeleteTeam,
  });

  server.route({
    method: "POST",
    path: "/teams/{id}/activate",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/teams/{id}/deactivate",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/sub-teams",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        payload: subTeamCreateSchema,
      },
    },
    handler: HRAdminController.createSubTeam,
  });

  server.route({
    method: "GET",
    path: "/sub-teams",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/sub-teams/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/sub-teams/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/sub-teams/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deleteSubTeam,
  });

  server.route({
    method: "DELETE",
    path: "/sub-teams/{id}/permanent",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.hardDeleteSubTeam,
  });

  server.route({
    method: "POST",
    path: "/sub-teams/{id}/restore",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.restoreSubTeam,
  });

  server.route({
    method: "POST",
    path: "/sub-teams/{id}/activate",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.activateSubTeam,
  });

  server.route({
    method: "POST",
    path: "/sub-teams/{id}/deactivate",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deactivateSubTeam,
  });

  // ============ POSITIONS ============
  server.route({
    method: "POST",
    path: "/positions",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        payload: positionCreateSchema,
      },
    },
    handler: HRAdminController.createPosition,
  });

  server.route({
    method: "GET",
    path: "/positions",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/positions/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/positions/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/positions/{id}",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.deletePosition,
  });

  server.route({
    method: "DELETE",
    path: "/positions/{id}/permanent",
    options: {
      ...authorizeRoles(["admin", "hr"]),
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
    },
    handler: HRAdminController.hardDeletePosition,
  });

  server.route({
    method: "POST",
    path: "/positions/{id}/restore",
    options: {
      ...authorizeRoles(["admin", "hr"]),
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
    path: "/stats",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getOrganizationStats,
  });
};