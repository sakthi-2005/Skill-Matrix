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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class AdminService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use a generic message
        if (response.status >= 500) {
          errorMessage = 'An internal server error occurred';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found';
        } else {
          errorMessage = 'Network error occurred';
        }
      }
      
      // Handle specific token-related errors
      if (response.status === 401) {
        // Clear the token if it's invalid
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error(errorMessage);
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

  async activateTeam(id: number): Promise<ApiResponse<Team>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/teams/${id}/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<Team>>(response);
  }

  async deactivateTeam(id: number): Promise<ApiResponse<Team>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/teams/${id}/deactivate`, {
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

  async activateSubTeam(id: number): Promise<ApiResponse<SubTeam>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/sub-teams/${id}/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<SubTeam>>(response);
  }

  async deactivateSubTeam(id: number): Promise<ApiResponse<SubTeam>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/sub-teams/${id}/deactivate`, {
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

  async activatePosition(id: number): Promise<ApiResponse<Position>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/positions/${id}/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<Position>>(response);
  }

  async deactivatePosition(id: number): Promise<ApiResponse<Position>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/positions/${id}/deactivate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<Position>>(response);
  }

  // ============ USERS ============

  async getAllUsers(includeDeleted: boolean = false): Promise<ApiResponse<any[]>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/users?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<any[]>>(response);
  }

  async getUserById(id: number, includeDeleted: boolean = false): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hr/users/${id}?includeDeleted=${includeDeleted}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<ApiResponse<any>>(response);
  }

  async createUser(data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<any>>(response);
  }

  async updateUser(id: number, data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ApiResponse<any>>(response);
  }

  async deleteUser(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<void>>(response);
  }

  async restoreUser(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/users/${id}/restore`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<any>>(response);
  }

  async activateUser(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/users/${id}/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<any>>(response);
  }

  async deactivateUser(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/users/${id}/deactivate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<any>>(response);
  }

  // ============ ROLES ============

  async getAllRoles(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/admin/hr/roles`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<any[]>>(response);
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