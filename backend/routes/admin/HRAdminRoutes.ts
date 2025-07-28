import { Server } from "@hapi/hapi";
import { HRAdminController } from "../../controllers/admin/HRAdminController";
import authorizeRoles from "../../middlewares/authorizeRole";

export const HRAdminRoutes = (server: Server) => {
  // ============ TEAMS ============
  server.route({
    method: "POST",
    path: "/teams",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.createTeam,
  });

  server.route({
    method: "GET",
    path: "/teams",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getAllTeams,
  });

  server.route({
    method: "GET",
    path: "/teams/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getTeamById,
  });

  server.route({
    method: "PUT",
    path: "/teams/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.updateTeam,
  });

  server.route({
    method: "DELETE",
    path: "/teams/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.deleteTeam,
  });

  // server.route({
  //   method: "POST",
  //   path: "/teams/{id}/restore",
  //   options: authorizeRoles(["admin", "hr"]),
  //   handler: HRAdminController.restoreTeam,
  // });

  server.route({
    method: "POST",
    path: "/teams/{id}/activate",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.activateTeam,
  });

  server.route({
    method: "POST",
    path: "/teams/{id}/deactivate",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.deactivateTeam,
  });

  // ============ SUB-TEAMS ============
  server.route({
    method: "POST",
    path: "/sub-teams",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.createSubTeam,
  });

  server.route({
    method: "GET",
    path: "/sub-teams",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getAllSubTeams,
  });

  server.route({
    method: "GET",
    path: "/sub-teams/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getSubTeamById,
  });

  server.route({
    method: "PUT",
    path: "/sub-teams/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.updateSubTeam,
  });

  server.route({
    method: "DELETE",
    path: "/sub-teams/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.deleteSubTeam,
  });

    server.route({
    method: "POST",
    path: "/sub-teams/{id}/activate",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.activateSubTeam,
  });

  server.route({
    method: "POST",
    path: "/sub-teams/{id}/deactivate",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.deactivateSubTeam,
  });

  // server.route({
  //   method: "POST",
  //   path: "/sub-teams/{id}/restore",
  //   options: authorizeRoles(["admin", "hr"]),
  //   handler: HRAdminController.restoreSubTeam,
  // });

  // ============ POSITIONS ============
  server.route({
    method: "POST",
    path: "/positions",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.createPosition,
  });

  server.route({
    method: "GET",
    path: "/positions",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getAllPositions,
  });

  server.route({
    method: "GET",
    path: "/positions/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getPositionById,
  });

  server.route({
    method: "PUT",
    path: "/positions/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.updatePosition,
  });

  server.route({
    method: "DELETE",
    path: "/positions/{id}",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.deletePosition,
  });

    server.route({
    method: "POST",
    path: "/positions/{id}/activate",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.activatePosition,
  });

  server.route({
    method: "POST",
    path: "/positions/{id}/deactivate",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.deactivatePosition,
  });

  // server.route({
  //   method: "POST",
  //   path: "/positions/{id}/restore",
  //   options: authorizeRoles(["admin", "hr"]),
  //   handler: HRAdminController.restorePosition,
  // });

  // ============ STATISTICS ============
  server.route({
    method: "GET",
    path: "/teams/{teamId}/members",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getTeamMembers,
  });

  server.route({
    method: "GET",
    path: "/stats",
    options: authorizeRoles(["admin", "hr"]),
    handler: HRAdminController.getOrganizationStats,
  });
};