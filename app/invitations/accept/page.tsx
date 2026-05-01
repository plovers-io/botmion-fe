"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck, XCircle, Building2 } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { WorkspaceMemberService } from "@/lib/services/workspace-member-service";
import type { WorkspaceDetail } from "@/lib/services/workspace-member-service";

function InvitationShell({
  title,
  description,
  action,
  accent = "from-slate-950 via-slate-900 to-cyan-900",
  icon = <ShieldCheck className="h-7 w-7 text-cyan-200" />,
}: {
  title: string;
  description: string;
  action?: import("react").ReactNode;
  accent?: string;
  icon?: import("react").ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-linear-to-br ${accent} text-white`}>
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            {icon}
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
            {description}
          </p>
          {action ? <div className="mt-8">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

type AcceptStatus = "idle" | "loading" | "success" | "already_accepted" | "error";

function AcceptInvitationPageInner() {
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState<AcceptStatus>("idle");
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    const accept = async () => {
      if (!token || !accessToken) {
        return;
      }

      setStatus("loading");
      try {
        const result = await WorkspaceMemberService.acceptInvitation(token);
        setWorkspace(result.workspace);

        if (result.already_accepted) {
          setStatus("already_accepted");
          toast.success("Already a member", {
            description: result.detail,
          });
        } else {
          setStatus("success");
          toast.success("Invitation accepted", {
            description: result.detail,
          });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Please try again.";
        setErrorMessage(msg);
        toast.error("Could not accept invitation", {
          description: msg,
        });
        setStatus("error");
      }
    };

    void accept();
  }, [accessToken, token]);

  if (!token) {
    return (
      <InvitationShell
        title="Invitation link is missing"
        description="This invitation URL is incomplete. Please open the invitation from your email again."
        action={
          <Link href="/auth/login" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
            Go to login
          </Link>
        }
      />
    );
  }

  if (!accessToken) {
    return (
      <InvitationShell
        title="You have a workspace invitation waiting"
        description="Sign in or create your account with the same email address. After signup, the invitation will appear in your notifications and you can accept it from there."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/auth/login?next=${encodeURIComponent(`/invitations/accept?token=${token}`)}`} className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Sign in
            </Link>
            <Link href={`/auth/register?next=${encodeURIComponent(`/invitations/accept?token=${token}`)}`} className="inline-flex rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Create account
            </Link>
          </div>
        }
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <InvitationShell
        title="Accepting your invitation"
        description="We are confirming your access and adding this workspace to your account."
        action={
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing invitation
          </div>
        }
      />
    );
  }

  if (status === "already_accepted") {
    return (
      <InvitationShell
        title="You're already a member"
        description={`You have already accepted the invitation to join ${workspace?.name ?? "this workspace"}. You can access it from your workspace dashboard.`}
        icon={<Building2 className="h-7 w-7 text-emerald-200" />}
        accent="from-slate-950 via-slate-900 to-emerald-900"
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/workspace" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Go to workspace
            </Link>
            <Link href="/members" className="inline-flex rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              View members
            </Link>
          </div>
        }
      />
    );
  }

  if (status === "success") {
    return (
      <InvitationShell
        title="Invitation accepted"
        description={`You are now a member of ${workspace?.name ?? "the workspace"}. You can start collaborating with your team right away.`}
        icon={<CheckCircle2 className="h-7 w-7 text-emerald-200" />}
        accent="from-slate-950 via-slate-900 to-emerald-900"
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/workspace" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Go to workspace
            </Link>
            <Link href="/members" className="inline-flex rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              View members
            </Link>
            <Link href="/notifications" className="inline-flex rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Open notifications
            </Link>
          </div>
        }
      />
    );
  }

  // error state
  return (
    <InvitationShell
      title="We could not accept this invitation"
      description={errorMessage || "The invitation may have expired, been revoked, or the email address does not match the signed-in account."}
      icon={<XCircle className="h-7 w-7 text-rose-200" />}
      accent="from-slate-950 via-slate-900 to-rose-950"
      action={
        <div className="flex flex-wrap gap-3">
          <Link href="/notifications" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
            Open notifications
          </Link>
          <Link href="/auth/login" className="inline-flex rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Try another account
          </Link>
        </div>
      }
    />
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <InvitationShell
          title="Loading invitation..."
          description="Please wait while we prepare your invitation."
          icon={<Loader2 className="h-7 w-7 animate-spin text-cyan-200" />}
        />
      }
    >
      <AcceptInvitationPageInner />
    </Suspense>
  );
}
