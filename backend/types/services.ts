// Common types used across services
import { UserType } from "./entities";
import { AssessmentRequestType, ScoreType, AuditType } from "./entities";


export interface AssessmentWithHistory extends Omit<AssessmentRequestType, 'Score'> {
  detailedScores: ScoreType[];
  history: AuditType[];
  currentCycle: number;
  nextScheduledDate?: Date;
  isAccessible: boolean;
  wasRecentlyRejected?: boolean;
  rejectionReason?: string;
}

export interface AssessmentCycle {
  id: number;
  assessmentId: number;
  cycleNumber: number;
  leadAssessmentDate?: Date;
  employeeResponseDate?: Date;
  employeeApproved: boolean;
  employeeComments?: string;
  hrFinalDecision?: 'APPROVED' | 'REJECTED';
  hrComments?: string;
  createdAt: Date;
}

export interface BulkAssessmentRequest {
  skillIds: number[];
  scheduledDate?: Date;
  comments: string;
  assessmentTitle: string;
  includeTeams: string[];
  excludeUsers: string[];
}

export interface BulkAssessmentResult {
  assessmentCycleId: number;
  title: string;
  totalAssessments: number;
  targetUsers: number;
  // skills: number[];
  createdAt: Date;
}

export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  roleId?: number;
  teamId?: number;
  positionId?: number;
  leadId?: string;
  hrId?: string;
  profilePhoto?: string;
  password?: string;
  [key: string]: any;
}

export interface addUser {
  name: string;
  email: string;
  role: string;
  position: string;
  team: string;
  subTeam: string;
  lead: string;
  hr: string;
}

export interface SkillData {
  id?: number;
  name: string;
  basic?: string
  low?: string;
  medium?: string;
  high?: string;
  expert?: string;
  createdBy?: string;
  position?: number[];
  [key: string]: any;
}

export interface ScoreData {
  id?: number;
  assessmentId: number;
  skillId: number;
  leadScore?: number;
  updatedAt?: Date;
  Skill?: any;
}

export interface AssessmentData {
  id?: number;
  userId: string;
  requestedAt?: Date;
  status?: string;
  nextApprover?: number;
  comments?: string;
  skillAssessments?: SkillAssessmentData[];
}

export interface SkillAssessmentData {
  skillId: number;
  selfScore: number;
}

export interface LeadSkillAssessmentData {
  skillId: number;
  leadScore: number;
}

export interface GuideData {
  id?: number;
  skillId: number;
  fromLevel: number;
  toLevel: number;
  guidance?: string;
  resourceLink?: string;
}

export interface ReviewData {
  leadScore?: number;
  status?: string;
  comments?: string;
  scoreUpdates?: Array<{
    skillId: number;
    score: number;
  }>;
  [key: string]: any;
}

export interface FilterOptions {
  role?: string;
  position?: string;
  teamName?: string;
  [key: string]: any;
}

export interface ScoreWithSkill {
  skillId: number;
  skillName: string;
  Score: number;
}

export interface UserWithScores extends UserType {
  mostRecentAssessmentScores: ScoreWithSkill[];
  hasRecentAssessment: boolean;
}

export interface LatestScore {
  id: number;
  self_score: number | null;
  lead_score: number | null;
  updated_at: Date;
  skill_name: string;
  skill_id: number;
  requestedAt: Date;
}

export interface SkillMatrixOverview {
  totalMembers: number;
  withAssessment: number;
  noAssessment: number;
  avgSkillLevel: number;
  users: UserWithScores[];
}

