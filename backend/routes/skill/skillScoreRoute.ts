import SkillTargetController from "../../controllers/skill/skillTargetController";
import SkillUpdateRequestController from "../../controllers/skill/SkillUpdateRequestController";
import { role } from "../../enum/enum";
import authorizeRoles from "../../middlewares/authorizeRole";
// import { ServerRegisterOptions } from "@hapi/hapi";

const skillScoreRoutes = {
  name: "score-routes",
  register: async function (server, options) {
    server.route([
    //   {
    //     method: "POST",
    //     path: "/create",
    //     options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
    //     handler: SkillUpdateRequestController.createRequest,
    //   }

      {
        method: "GET",
        path: "/create",
        // options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.createTarget,
      },

      {
        method: "GET",
        path: "/skillTarget",
        // options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.getTarget,
      },

      {
        method: "DELETE",
        path: "/create",
        // options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.createTarget,
      },


    ]);
  },
};

export default skillScoreRoutes;