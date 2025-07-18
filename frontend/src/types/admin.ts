export interface Team {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  subTeams?: SubTeam[];
  users?: User[];
}

export interface SubTeam {
  id: number;
  name: string;
  description?: string;
  teamId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  Team?: Team;
  users?: User[];
}

export interface Position {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  users?: User[];
}

export interface User {
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
  createdAt: string;
  role?: Role;
  position?: Position;
  Team?: Team;
  SubTeam?: SubTeam;
}

export interface Role {
  id: number;
  name: string;
}

export interface OrganizationStats {
  teams: {
    active: number;
    deleted: number;
    total: number;
  };
  subTeams: {
    active: number;
    deleted: number;
    total: number;
  };
  positions: {
    active: number;
    deleted: number;
    total: number;
  };
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface CreateSubTeamRequest {
  name: string;
  description?: string;
  teamId: number;
}

export interface UpdateSubTeamRequest {
  name?: string;
  description?: string;
  teamId?: number;
}

export interface CreatePositionRequest {
  name: string;
  description?: string;
}

export interface UpdatePositionRequest {
  name?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}