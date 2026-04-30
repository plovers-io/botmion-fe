"use client";

import { useWorkspaceStore, WorkspaceRole } from "@/lib/store/workspace-store";

export function useWorkspaceRole(): {
  role: WorkspaceRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
} {
  const role = useWorkspaceStore((state) => state.currentRole);

  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isEditor = role === "editor";
  const isViewer = role === "viewer";

  return {
    role,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    canEdit: isOwner || isAdmin || isEditor,
    canDelete: isOwner || isAdmin,
    canManage: isOwner || isAdmin,
  };
}
