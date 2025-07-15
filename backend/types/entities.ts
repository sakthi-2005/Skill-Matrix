import { AssessmentStatus, AssessmentScheduleType } from '../enum/enum';

export interface AssessmentCycleType {
  id: number;
  title: string;
  createdBy: string;
  scheduledDate?: Date;
  scheduleType: AssessmentScheduleType;
  deadlineDays: number;
  deadlineDate?: Date;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  comments?: string;
  targetTeams?: string[];
  excludedUsers?: string[];
  totalAssessments: number;
  completedAssessments: number;
  cycleNumber: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  assessments?: any[];
  skills?: any[];
  cycleSkills?: any[];
}

export interface AssessmentCycleSkillType {
  cycleId: number;
  skillId: number;
  // Relations
  cycle?: any;
  skill?: any;
}

export interface AssessmentRequestType {
  id: number;
  userId: string;
  cycleId?: number;
  status: AssessmentStatus;
  initiatedBy: string;
  nextApprover?: number;
  scheduledDate?: Date;
  scheduleType: AssessmentScheduleType;
  deadlineDays: number;
  deadlineDate?: Date;
  currentCycle: number;
  nextScheduledDate?: Date;
  requestedAt: Date;
  completedAt?: Date;
  
  // Relations
  user?: any;
  cycle?: any;
  scores?: any[];
  
  // Virtual properties for compatibility (populated from audit table)
  detailedScores?: any[];
  history?: any[];
}

export interface UserType {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleId?: number;
  teamId?: number;
  subTeamId?: number;
  positionId?: number;
  leadId?: string;
  hrId?: string;
  profilePhoto?: string;
  createdAt: Date;
  
  // Relations
  Requests?: AssessmentRequestType;
  role?: RoleType;
  position?: PositionType;
  team?: TeamType;
  subTeam?: SubTeamType;
  Audit?: AuditType;
  target?: targetType
}

export interface TeamType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relations
  users?: UserType[];
  subTeams?: SubTeamType[];
}

export interface SubTeamType {
  id: number;
  name: string;
  description?: string;
  teamId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relations
  team?: TeamType;
  users?: UserType[];
}

export interface SkillUpgradeGuideType {
  id: number;
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink?: string;
  skillId: number;
  
  // Relations
  skill?: SkillType;
}

export interface SkillType {
  id: number;
  name: string;
  low?: string;
  medium?: string;
  average?: string;
  high?: string;
  createdAt: Date;
  createdBy?: string;
  position?: number[];
  
  // Relations
  upgradeGuides?: SkillUpgradeGuideType;
  assessmentRequest?: AssessmentRequestType;
  target?: targetType
}

export interface ScoreType {
  id: number;
  assessmentId: number;
  selfScore?: number;
  leadScore?: number;
  updatedAt: Date;
  skillId: number;
  
  // Relations
  Skill?: SkillType;
  AssessmentRequest?: AssessmentRequestType;
}

export interface RoleType {
  id: number;
  name: string;
  
  // Relations
  user?: UserType;
}

export interface PositionType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relations
  users?: UserType[];
}

export interface AuditType {
  id: number;
  assessmentId: number;
  auditType?: string; // Change Type - e.g., "score update", "comment", "status change"
  editorId: number; // Changed By - user ID who made the change
  userId?: string; // User ID related to the audit entry
  commentedBy?: string; // Who made the comment
  cycleNumber?: number; // Assessment Cycle/Stage - which cycle the audit refers to
  status?: string; // Status of the audit entry
  
  // Score tracking fields (for score-related audits)
  skillName?: string; // Skill Name - the specific skill being assessed or commented on
  previousScore?: number; // Previous Score - the score before the change
  currentScore?: number; // Current Score - the new or updated score
  
  // Comments and notes
  comments?: string; // Comments - renamed from reasonForChange
  
  // Timestamps
  auditedAt: Date; // Changed At - timestamp when change was made
  createdAt: Date;
  
  // Relations
  editor?: UserType; // The user who made the change
  assessmentRequest?: AssessmentRequestType;
}

export interface AuthType {
  id: number;
  email: string;
  // passwordHash?: string; // For legacy login - commented out for OAuth only
  
  // Relations
  user?: UserType;
}

export interface targetType{
  id: number,
  userId: string,
  fromLevel: number,
  toLevel: number,
  skillId: number,

  //Relations
  skill?: SkillType,
  user?: UserType
}