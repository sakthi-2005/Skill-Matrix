//components/dashboard/dashboardStats
export interface SkillStats {
  basic:number;
  low: number;
  medium: number;
  high: number;
  expert: number;
}

export interface DashboardStatsProps {
  stats: SkillStats;
  pendingRequests?: number;
  title: string;
}

//components/dashboard/EmployeeDashboard

export interface SkillProgressItem {
  id: string;
  name: string;
  current: number;
  target: number;
  category: string;
}