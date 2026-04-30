import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface Workspace {
  id: number;
  name: string;
  owner: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  members_count: number;
  max_members: number | null;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspaceId: number | null;
  currentRole: WorkspaceRole | null;
  isLoading: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspaceId: number | null) => void;
  setCurrentRole: (role: WorkspaceRole | null) => void;
  setLoading: (loading: boolean) => void;
  getCurrentWorkspace: () => Workspace | null;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,
      currentRole: null,
      isLoading: false,
      setWorkspaces: (workspaces) => {
        set({ workspaces });
        // Auto-select first workspace if none selected
        const state = get();
        if (!state.currentWorkspaceId && workspaces.length > 0) {
          set({ currentWorkspaceId: workspaces[0].id });
        }
      },
      setCurrentWorkspace: (workspaceId) => {
        set({ currentWorkspaceId: workspaceId });
      },
      setCurrentRole: (role) => {
        set({ currentRole: role });
      },
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      getCurrentWorkspace: () => {
        const state = get();
        return (
          state.workspaces.find((w) => w.id === state.currentWorkspaceId) || null
        );
      },
    }),
    {
      name: "workspace-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        currentRole: state.currentRole,
      }),
    }
  )
);
