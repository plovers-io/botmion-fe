import { apiClient } from "./api-client";

export interface WorkspaceMember {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  role: "owner" | "admin" | "editor" | "viewer";
  joined_at: string;
  is_active: boolean;
}

export interface WorkspaceInvitation {
  id: number;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invited_by_user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export interface WorkspaceDetail {
  id: number;
  owner: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  name: string;
  members_count: number;
  max_members: number | null;
}

export interface MembersListResponse {
  workspace: WorkspaceDetail;
  members: WorkspaceMember[];
  current_user_role: string;
}

export class WorkspaceMemberService {
  static async getWorkspaces(): Promise<WorkspaceDetail[]> {
    try {
      const response = await apiClient.get<WorkspaceDetail[]>("/v1/workspaces/");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getMembers(workspaceId: number): Promise<MembersListResponse> {
    try {
      const response = await apiClient.get<MembersListResponse>(
        `/v1/workspaces/${workspaceId}/members/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async inviteMember(
    workspaceId: number,
    email: string,
    role: string = "editor"
  ): Promise<WorkspaceInvitation> {
    try {
      const response = await apiClient.post<WorkspaceInvitation>(
        `/v1/workspaces/${workspaceId}/members/invite/`,
        { email, role }
      );
      return response.data;
    } catch (error) {
      // Surface DRF validation payloads to the caller for friendly UI messages
      // Handles: {"detail": "..."}, ["..."], {"detail": [...]}, or plain string
      const err: any = error;
      if (err && err.response && err.response.data) {
        const payload = err.response.data;
        let message: string;
        if (Array.isArray(payload)) {
          message = payload[0];
        } else if (typeof payload === "object" && payload !== null) {
          if (Array.isArray(payload.detail)) {
            message = payload.detail[0];
          } else {
            message = payload.detail || JSON.stringify(payload);
          }
        } else {
          message = typeof payload === "string" ? payload : JSON.stringify(payload);
        }
        const out = new Error(message);
        (out as any).responseData = payload;
        throw out;
      }
      throw error;
    }
  }

  static async getInvitations(workspaceId: number): Promise<WorkspaceInvitation[]> {
    try {
      const response = await apiClient.get<WorkspaceInvitation[]>(
        `/v1/workspaces/${workspaceId}/members/invitations/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async revokeInvitation(
    workspaceId: number,
    invitationId: number
  ): Promise<{ detail: string }> {
    try {
      const response = await apiClient.post(
        `/v1/workspaces/${workspaceId}/members/revoke-invitation/`,
        { invitation_id: invitationId }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async acceptInvitation(
    token: string
  ): Promise<{ detail: string; member: WorkspaceMember; workspace: WorkspaceDetail; already_accepted?: boolean }> {
    try {
      const response = await apiClient.post(
        `/v1/invitations/accept/`,
        { token }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async declineInvitation(token: string): Promise<{ detail: string; already_declined?: boolean }> {
    try {
      const response = await apiClient.post(`/v1/invitations/decline/`, { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async removeMember(
    workspaceId: number,
    memberId: number
  ): Promise<{ detail: string }> {
    try {
      const response = await apiClient.delete(
        `/v1/workspaces/${workspaceId}/members/${memberId}/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateMemberRole(
    workspaceId: number,
    memberId: number,
    role: string
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.patch<WorkspaceMember>(
        `/v1/workspaces/${workspaceId}/members/${memberId}/`,
        { role }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
