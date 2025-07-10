import { userRepo, roleRepo } from "../../config/dataSource";

interface ReviewHistoryItem {
  createrRole: string;
  createdBy: string;
  createdAt: Date;
}

const SkillUpdateRequestService = {
  // Build review chain for a user
  buildReviewChain: async (userId: string): Promise<string[]> => {
    const reviewChain: string[] = [];
    let id = userId;
    
    while (id) {
      const record = await userRepo.findOneBy({ id: id });
      if (record && record.leadId) {
        reviewChain.push(record.leadId);
      }
      id = record && record.leadId ? record.leadId : null;
    }
    
    // Add HR if user has both lead and HR
    const user = await userRepo.findOneBy({ id: userId });
    if (user && user.hrId && user.leadId) {
      reviewChain.push(user.hrId);
    }
    
    return reviewChain;
  },

  // Create review history entry
  createReviewHistory: (createrRole: string, createdBy: string): ReviewHistoryItem[] => {
    return [{
      createrRole,
      createdBy,
      createdAt: new Date(),
    }];
  },

  // Validate user exists
  validateUser: async (userId: string) => {
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  // Validate edit permissions
  validateEditPermissions: async (reviewedBy: string, editedSkillScore: any): Promise<boolean> => {
    if (!editedSkillScore) return true; // No edit, no permission needed
    
    const user = await userRepo.findOneBy({ id: reviewedBy });
    const role = await roleRepo.findOneBy({ id: user?.roleId });
    
    // User must have a lead or be HR to edit skills
    if (!user?.leadId && role?.name !== "hr") {
      throw new Error("You are not allowed to edit skills");
    }
    
    return true;
  },

  createRequest: async (
    skillScore: any,
    targetUserId: string,
    reviewHistory: ReviewHistoryItem[],
    editedSkillScore: any,
    reviewChain: string[],
    currentReviewer: string | null
  ) => {
    // TODO: Implement actual database logic here
    return { 
      currentReviewer,
      id: Date.now(), // Mock ID
      targetUserId,
      skillScore,
      reviewHistory,
      editedSkillScore,
      reviewChain
    };
  },

  getRequestById: async (id: string) => {
    return { id };
  },

  getRequestForUser: async (userId: string) => {
    return [];
  },

  getAllRequests: async () => {
    return [];
  },

  getPendingRequests: async (reviewerId: string) => {
    return [];
  },

  cancelRequest: async (id: string) => {
    return true;
  },

  updateRequestStatus: async (
    id: string,
    status: string,
    reviewedBy: string,
    editedSkillScore: any,
    comments: any
  ) => {
    // Validate permissions before updating
    await SkillUpdateRequestService.validateEditPermissions(reviewedBy, editedSkillScore);
    
    // TODO: Implement actual update logic here
    return { currentReviewer: "next-reviewer" };
  }

  
};

export default SkillUpdateRequestService;