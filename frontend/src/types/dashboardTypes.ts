//components/dashboard/dashboardStats
export interface SkillDetail {
  skillName: string;
  skillCategory?: string;
  score: number;
}

export interface EmployeeSkill {
  id: string;
  name: string;
  email?: string;
  skills: SkillDetail[];
}

export interface SkillStats {
  basic: number;
  low: number;
  medium: number;
  high: number;
  expert: number;
}

export interface DetailedSkillStats {
  basic: {
    count: number;
    employees: EmployeeSkill[];
  };
  low: {
    count: number;
    employees: EmployeeSkill[];
  };
  medium: {
    count: number;
    employees: EmployeeSkill[];
  };
  high: {
    count: number;
    employees: EmployeeSkill[];
  };
  expert: {
    count: number;
    employees: EmployeeSkill[];
  };
}

export interface DashboardStatsProps {
  stats: SkillStats;
  detailedStats?: DetailedSkillStats;
  pendingRequests?: number;
  title: string;
  onSkillLevelClick?: (level: 'basic' | 'low' | 'medium' | 'high' | 'expert') => void;
}

//components/dashboard/EmployeeDashboard

export interface SkillProgressItem {
  id: string;
  name: string;
  current: number;
  target: number;
  category: string;
}