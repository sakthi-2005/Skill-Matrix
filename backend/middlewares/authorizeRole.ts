import Boom from "@hapi/boom";
import { Request, ResponseToolkit, RequestAuth } from "@hapi/hapi";
import { ValidationHelpers } from '../services/helpers/index';

// Define types for the auth middleware
interface UserCredentials {
  user: {
    id: string,
    role: {
      name: string;
    };
  };
}

interface AuthenticatedRequest extends Request {
  auth: RequestAuth & {
    credentials: UserCredentials;
  };
}

const authorizeRoles = (allowedRoles: string[]) => {
  return {
    auth: "jwt",
    pre: [
      {
        method: async(req: AuthenticatedRequest, h: ResponseToolkit) => {
          const user = req.auth.credentials.user;

          if(!user){
            throw Boom.forbidden("Access Denied: Unauthorized access");
          }

          const lead = await ValidationHelpers.validateTeamLead(user.id);
          const hr = await ValidationHelpers.validateHRUser(user.id);

          if(lead && allowedRoles.includes('lead')){
            return h.continue;
          }
          if(hr && allowedRoles.includes('hr')){
            return h.continue;
          }
          if(!lead && !hr && (allowedRoles.length == 0 || allowedRoles.includes('employee'))){
            return h.continue
          }
          throw Boom.forbidden("Access Denied: insufficient permissions.");

        },
      },
    ],
  };
};

export default authorizeRoles;
