"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Mail,
  X,
  Loader,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Ban,
} from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { WorkspaceMemberService, WorkspaceMember, WorkspaceInvitation, WorkspaceDetail } from "@/lib/services/workspace-member-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
  import { Separator } from "@/components/ui/separator";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";

export default function MembersPage() {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Global workspace store
  const globalWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setGlobalWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace);
  const setGlobalRole = useWorkspaceStore((state) => state.setCurrentRole);

  // State
  const [workspaces, setWorkspaces] = useState<WorkspaceDetail[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(globalWorkspaceId);
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [revokingInvitationId, setRevokingInvitationId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Confirmation modals
  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; memberId: number | null; memberName: string }>({ open: false, memberId: null, memberName: "" });
  const [revokeConfirm, setRevokeConfirm] = useState<{ open: boolean; invitationId: number | null; email: string }>({ open: false, invitationId: null, email: "" });

  // Load data
  useEffect(() => {
    if (!accessToken) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }

    setAuthChecked(true);
    void loadWorkspaces();
  }, [accessToken]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      void loadWorkspaceData(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  // Sync with global workspace store
  useEffect(() => {
    if (globalWorkspaceId && globalWorkspaceId !== selectedWorkspaceId) {
      setSelectedWorkspaceId(globalWorkspaceId);
    }
  }, [globalWorkspaceId]);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const availableWorkspaces = await WorkspaceMemberService.getWorkspaces();
      setWorkspaces(availableWorkspaces);

      if (availableWorkspaces.length > 0) {
        const targetId = globalWorkspaceId || availableWorkspaces[0].id;
        setSelectedWorkspaceId(targetId);
        setGlobalWorkspace(targetId);
      } else {
        setWorkspace(null);
        setMembers([]);
        setInvitations([]);
        setCurrentUserRole(null);
      }
    } catch (error) {
      toast.error("Failed to load workspaces", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceData = async (workspaceId: number) => {
    setLoading(true);
    try {
      const response = await WorkspaceMemberService.getMembers(workspaceId);
      setWorkspace(response.workspace);
      setMembers(response.members);
      setCurrentUserRole(response.current_user_role);
      setGlobalRole(response.current_user_role as any);

      // Only fetch invitations if user can manage members (admin/owner)
      if (response.current_user_role === "owner" || response.current_user_role === "admin") {
        const invites = await WorkspaceMemberService.getInvitations(workspaceId);
        setInvitations(invites);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      toast.error("Failed to load members", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast.error("Email required", {
        description: "Please enter an email address",
      });
      return;
    }

    if (!selectedWorkspaceId) {
      toast.error("Workspace missing", {
        description: "Select a workspace before inviting members.",
      });
      return;
    }

    setInviting(true);
    try {
      const result: any = await WorkspaceMemberService.inviteMember(selectedWorkspaceId, inviteEmail, inviteRole);
      if (result && result.invited_user_exists === false) {
        toast.success("Invitation sent", {
          description: `Invitation sent to ${inviteEmail}. Note: this email has no Botmion account; they will receive an email with instructions to sign up and accept the invite.`,
        });
      } else {
        toast.success("Invitation sent", {
          description: `Invitation sent to ${inviteEmail}`,
        });
      }
      setInviteEmail("");
      setInviteRole("editor");
      setShowInviteModal(false);
      
      // Reload data
      await loadWorkspaceData(selectedWorkspaceId);
    } catch (error) {
      // Try to extract structured validation payload from backend
      let description = "Failed to send invitation";
      try {
        const anyErr: any = error;
        if (anyErr && anyErr.responseData) {
          const rd = anyErr.responseData;
          if (rd.detail && rd.current !== undefined && rd.limit !== undefined) {
            description = `${rd.detail} (current: ${rd.current} / limit: ${rd.limit})`;
          } else if (rd.detail) {
            description = rd.detail;
          } else {
            description = JSON.stringify(rd);
          }
        } else if (error instanceof Error) {
          description = error.message;
        }
      } catch (e) {
        // fallback
        description = error instanceof Error ? error.message : String(error);
      }

      toast.error("Invitation failed", {
        description,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    const memberId = removeConfirm.memberId;
    if (!memberId) return;
    setRemoveConfirm({ open: false, memberId: null, memberName: "" });

    if (!selectedWorkspaceId) {
      toast.error("Workspace missing", {
        description: "Select a workspace before removing members.",
      });
      return;
    }

    setRemovingMemberId(memberId);
    try {
      await WorkspaceMemberService.removeMember(selectedWorkspaceId, memberId);
      toast.success("Member removed", {
        description: "The member has been removed from the workspace",
      });
      await loadWorkspaceData(selectedWorkspaceId);
    } catch (error) {
      toast.error("Failed to remove member", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateMemberRole = async (memberId: number, role: string) => {
    if (!selectedWorkspaceId) {
      toast.error("Workspace missing", {
        description: "Select a workspace before updating roles.",
      });
      return;
    }

    setUpdatingMemberId(memberId);
    try {
      await WorkspaceMemberService.updateMemberRole(selectedWorkspaceId, memberId, role);
      toast.success("Role updated", {
        description: "Member access has been updated.",
      });
      await loadWorkspaceData(selectedWorkspaceId);
    } catch (error) {
      toast.error("Failed to update role", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRevokeInvitation = async () => {
    const invitationId = revokeConfirm.invitationId;
    if (!invitationId) return;
    setRevokeConfirm({ open: false, invitationId: null, email: "" });

    if (!selectedWorkspaceId) {
      toast.error("Workspace missing", {
        description: "Select a workspace before revoking invitations.",
      });
      return;
    }

    setRevokingInvitationId(invitationId);
    try {
      await WorkspaceMemberService.revokeInvitation(selectedWorkspaceId, invitationId);
      toast.success("Invitation revoked", {
        description: "The invitation has been revoked",
      });
      await loadWorkspaceData(selectedWorkspaceId);
    } catch (error) {
      toast.error("Failed to revoke invitation", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setRevokingInvitationId(null);
    }
  };

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  if (authChecked && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 text-center shadow-lg">
          <Users size={32} className="mx-auto text-blue-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Members access requires login
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in again to load your workspace members and invitations.
          </p>
          <Link href="/auth/login" className="mt-5 inline-flex">
            <Button>Go to login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/workspace">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Users className="text-white" size={20} />
              </div>
              Members
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
              {workspace?.name}
            </p>
          </div>
        </div>
        {workspaces.length > 1 && (
          <div className="min-w-64">
            <Label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
              Workspace
            </Label>
            <Select
              value={selectedWorkspaceId ? String(selectedWorkspaceId) : undefined}
              onValueChange={(value) => setSelectedWorkspaceId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {canManageMembers && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus size={18} />
            Invite Member
          </Button>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Invite Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {workspace && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {workspace.members_count + 1}/{workspace.max_members ?? "Unlimited"} members
                </p>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole} disabled={inviting}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                    <SelectItem value="editor">Editor (Can edit)</SelectItem>
                    <SelectItem value="admin">Admin (Full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {inviting ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members List */}
          <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Team Members ({members.length})
              </h2>
              
              {members.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">No members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {member.user.first_name} {member.user.last_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            member.role === "owner"
                              ? "default"
                              : member.role === "admin"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.role}
                        </Badge>
                        {canManageMembers && member.role !== "owner" && (
                          <Select
                            value={member.role}
                            onValueChange={(value) => void handleUpdateMemberRole(member.id, value)}
                            disabled={updatingMemberId === member.id}
                          >
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {canManageMembers && member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemoveConfirm({ open: true, memberId: member.id, memberName: `${member.user.first_name} ${member.user.last_name}`.trim() || member.user.email })}
                            disabled={removingMemberId === member.id}
                          >
                            {removingMemberId === member.id ? (
                              <Loader className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} className="text-red-500" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Pending Invitations ({invitations.filter(i => i.status === "pending").length})
                </h2>
                
                {invitations.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No pending invitations</p>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Invited as <span className="font-medium">{invitation.role}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invitation.status === "pending" ? (
                            <>
                              <Clock size={16} className="text-yellow-500" />
                              <span className="text-xs text-yellow-700 dark:text-yellow-200">Pending</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="text-green-500" />
                              <span className="text-xs text-green-700 dark:text-green-200">Accepted</span>
                            </>
                          )}
                          {invitation.status === "pending" && canManageMembers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRevokeConfirm({ open: true, invitationId: invitation.id, email: invitation.email })}
                              disabled={revokingInvitationId === invitation.id}
                            >
                              {revokingInvitationId === invitation.id ? (
                                <Loader className="animate-spin" size={16} />
                              ) : (
                                <Ban size={16} className="text-red-500" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workspace Info */}
          <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Workspace Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Owner</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {workspace?.owner.first_name} {workspace?.owner.last_name}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-500 dark:text-gray-400">Members</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {workspace?.members_count}{workspace?.max_members ? ` / ${workspace.max_members}` : " / Unlimited"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-500 dark:text-gray-400">Your Role</p>
                <Badge className="mt-1">
                  {currentUserRole}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Help */}
          <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm p-6">
            <AlertCircle size={16} className="text-blue-600 mb-2" />
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Member Roles
            </h3>
            <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-blue-700 dark:text-blue-300">Full access to manage workspace</p>
              </div>
              <div>
                <p className="font-medium">Editor</p>
                <p className="text-blue-700 dark:text-blue-300">Can edit content</p>
              </div>
              <div>
                <p className="font-medium">Viewer</p>
                <p className="text-blue-700 dark:text-blue-300">Read-only access</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Remove Member Confirmation Modal */}
      <AlertDialog open={removeConfirm.open} onOpenChange={(open) => setRemoveConfirm((p) => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeConfirm.memberName}</strong> from this workspace?
              They will lose all access immediately and any accepted invitation will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveConfirm({ open: false, memberId: null, memberName: "" })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invitation Confirmation Modal */}
      <AlertDialog open={revokeConfirm.open} onOpenChange={(open) => setRevokeConfirm((p) => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation sent to <strong>{revokeConfirm.email}</strong>?
              They will no longer be able to join this workspace using this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRevokeConfirm({ open: false, invitationId: null, email: "" })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeInvitation}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Revoke invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
