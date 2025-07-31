import { AssessmentWithHistory, AssessmentStatus } from "@/types/assessmentTypes";

export interface User {
  id: string | number;
  role?: {
    name: string;
  };
  leadId?: number;
}

/**
 * Determines the hierarchical level of a user in the assessment tree
 * Employee -> Lead -> Head Lead -> Head Head Lead, etc.
 */
export const getUserHierarchyLevel = (user: User): number => {
  const roleName = user.role?.name?.toLowerCase() || '';
  
  // Count the number of "head" prefixes in the role name
  const headCount = (roleName.match(/head/g) || []).length;
  
  if (roleName.includes('employee') || (!roleName.includes('lead') && !roleName.includes('head'))) {
    return 0; // Employee level (lowest)
  } else if (roleName === 'lead' || (roleName.includes('lead') && headCount === 0)) {
    return 1; // Lead level
  } else {
    return 1 + headCount; // Head Lead levels (2+)
  }
};

/**
 * Determines if a user is in a Lead role (any level of Lead)
 */
export const isUserInLeadRole = (user: User): boolean => {
  const roleName = user.role?.name?.toLowerCase() || '';
  return roleName.includes('lead');
};

/**
 * Determines the assessment context based on user role and assessment data
 */
export const determineAssessmentContext = (
  user: User, 
  assessments: AssessmentWithHistory[]
): 'employee' | 'lead' => {
  // If user is not in a Lead role, they're always in employee context
  const isLead = isUserInLeadRole(user);
  
  if (!isLead) {
    return 'employee';
  }
  
  // If user is a Lead, check if they have assessments where they are being assessed
  // AND the assessment is in a state where they need to review it
  const hasLeadAssessmentsToReview = assessments.some(assessment => {
    const isUserAssessment = assessment.userId === user.id?.toString();
    const isReviewableStatus = (
      assessment.status === AssessmentStatus.EMPLOYEE_REVIEW || 
      assessment.status === AssessmentStatus.EMPLOYEE_APPROVED || 
      assessment.status === AssessmentStatus.EMPLOYEE_REJECTED || 
      assessment.status === AssessmentStatus.HR_FINAL_REVIEW || 
      assessment.status === AssessmentStatus.COMPLETED
    );
    
    return isUserAssessment && isLead && isReviewableStatus;
  });
  
  return hasLeadAssessmentsToReview ? 'lead' : 'employee';
};

/**
 * Gets the appropriate assessor label based on user hierarchy level
 */
export const getAssessorLabel = (userLevel: number): string => {
  if (userLevel === 0) {
    return 'Team Lead'; // Employee is assessed by Team Lead
  } else if (userLevel === 1) {
    return 'Head Lead'; // Lead is assessed by Head Lead
  } else {
    // Head Lead is assessed by Head Head Lead, etc.
    const headPrefix = 'Head '.repeat(userLevel);
    return `${headPrefix}Lead`;
  }
};

/**
 * Gets context-specific labels and descriptions for the assessment interface
 */
export const getAssessmentContextLabels = (context: 'employee' | 'lead', userLevel: number = 0) => {
  const assessorLabel = getAssessorLabel(userLevel);
  
  if (context === 'lead') {
    return {
      title: "My Lead Assessments",
      description: "Review and manage your skill assessments as a Lead",
      pendingTitle: "Action Required - Lead Assessment Review",
      pendingDescription: `The following assessments from your ${assessorLabel.toLowerCase()} require your review`,
      assessorLabel,
      reviewInstructions: [
        `• Review the skill ratings provided by your ${assessorLabel.toLowerCase()}`,
        "• If you agree with the assessment, click \"Approve\"",
        "• If you disagree, click \"Request Changes\" with your feedback",
        "• Your decision will be sent to HR for final review"
      ]
    };
  } else {
    return {
      title: "My Assessments",
      description: "Review and manage your skill assessments",
      pendingTitle: "Action Required",
      pendingDescription: "The following assessments require your review",
      assessorLabel,
      reviewInstructions: [
        `• Review the skill ratings provided by your ${assessorLabel.toLowerCase()}`,
        "• If you agree with the assessment, click \"Approve\"",
        "• If you disagree, click \"Request Changes\" with your feedback",
        "• Your decision will be sent to HR for final review"
      ]
    };
  }
};

/**
 * Determines the next approver in the hierarchy chain
 */
export const getNextApprover = (currentUserLevel: number): string => {
  if (currentUserLevel === 0) {
    return 'HR'; // Employee -> HR after Lead approval
  } else {
    return 'HR'; // All Lead levels -> HR for final review
  }
};

/**
 * Validates if a user can assess another user based on hierarchy
 */
export const canUserAssessTarget = (assessorUser: User, targetUser: User): boolean => {
  const assessorLevel = getUserHierarchyLevel(assessorUser);
  const targetLevel = getUserHierarchyLevel(targetUser);
  
  // Assessor must be at least one level higher than target
  return assessorLevel > targetLevel;
};

/**
 * Gets the workflow status transitions based on user context
 */
export const getWorkflowTransitions = (context: 'employee' | 'lead') => {
  if (context === 'lead') {
    return {
      approvedStatus: 'EMPLOYEE_APPROVED', // Lead approved their assessment
      rejectedStatus: 'EMPLOYEE_REJECTED', // Lead rejected their assessment
      nextStage: 'HR_FINAL_REVIEW'
    };
  } else {
    return {
      approvedStatus: 'EMPLOYEE_APPROVED', // Employee approved their assessment
      rejectedStatus: 'EMPLOYEE_REJECTED', // Employee rejected their assessment
      nextStage: 'HR_FINAL_REVIEW'
    };
  }
};