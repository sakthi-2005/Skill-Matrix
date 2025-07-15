import {
  Team,
  SubTeam,
  Position,
  OrganizationStats,
  CreateTeamRequest,
  UpdateTeamRequest,
  CreateSubTeamRequest,
  UpdateSubTeamRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  ApiResponse,
} from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AdminService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // ============ TEAMS ============

  async createTeam(data: CreateTeamRequest): Promise<ApiResponse<Team>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/teams`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<Team>>(response);
  }

  async getAllTeams(includeDeleted: boolean = false): Promise<ApiResponse<Team[]>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/teams?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<Team[]>>(response);
  }

  async getTeamById(id: number, includeDeleted: boolean = false): Promise<ApiResponse<Team>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/teams/${id}?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<Team>>(response);
  }

  async updateTeam(id: number, data: UpdateTeamRequest): Promise<ApiResponse<Team>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/teams/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<Team>>(response);
  }

  async deleteTeam(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/teams/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<void>>(response);
  }

  async restoreTeam(id: number): Promise<ApiResponse<Team>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/teams/${id}/restore`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<Team>>(response);
  }

  // ============ SUB-TEAMS ============

  async createSubTeam(data: CreateSubTeamRequest): Promise<ApiResponse<SubTeam>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/sub-teams`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<SubTeam>>(response);
  }

  async getAllSubTeams(teamId?: number, includeDeleted: boolean = false): Promise<ApiResponse<SubTeam[]>> {
    const params = new URLSearchParams({
      includeDeleted: includeDeleted.toString(),
    });
    if (teamId) {
      params.append('teamId', teamId.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/hr/sub-teams?${params.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<SubTeam[]>>(response);
  }

  async getSubTeamById(id: number, includeDeleted: boolean = false): Promise<ApiResponse<SubTeam>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/sub-teams/${id}?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<SubTeam>>(response);
  }

  async updateSubTeam(id: number, data: UpdateSubTeamRequest): Promise<ApiResponse<SubTeam>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/sub-teams/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<SubTeam>>(response);
  }

  async deleteSubTeam(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/sub-teams/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<void>>(response);
  }

  async restoreSubTeam(id: number): Promise<ApiResponse<SubTeam>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/sub-teams/${id}/restore`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<SubTeam>>(response);
  }

  // ============ POSITIONS ============

  async createPosition(data: CreatePositionRequest): Promise<ApiResponse<Position>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/positions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<Position>>(response);
  }

  async getAllPositions(includeDeleted: boolean = false): Promise<ApiResponse<Position[]>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/positions?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<Position[]>>(response);
  }

  async getPositionById(id: number, includeDeleted: boolean = false): Promise<ApiResponse<Position>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/positions/${id}?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<Position>>(response);
  }

  async updatePosition(id: number, data: UpdatePositionRequest): Promise<ApiResponse<Position>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/positions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<Position>>(response);
  }

  async deletePosition(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/positions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<void>>(response);
  }

  async restorePosition(id: number): Promise<ApiResponse<Position>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/positions/${id}/restore`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<Position>>(response);
  }

  // ============ STATISTICS ============

  async getOrganizationStats(): Promise<ApiResponse<OrganizationStats>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<OrganizationStats>>(response);
  }
}

export const adminService = new AdminService();