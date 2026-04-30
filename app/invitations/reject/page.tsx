"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldX, CheckCircle2, XCircle } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { WorkspaceMemberService } from "@/lib/services/workspace-member-service";

function Shell({
  title,
  description,
  action,
  icon = <ShieldX className="h-7 w-7 text-rose-200" />,
  accent = "from-slate-950 via-slate-900 to-rose-950",
}: {
  title: string;
  description: string;
  action?: import("react").ReactNode;
  icon?: import("react").ReactNode;
  accent?: string;
}) {
  return (
    <div className={`min-h-screen bg-linear-to-br ${accent} text-white`}>
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            {icon}
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">{description}</p>
          {action ? <div className="mt-8">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

type DeclineStatus = "idle" | "loading" | "success" | "already_declined" | "error";

function RejectInvitationPageInner() {
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState<DeclineStatus>("idle");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    const decline = async () => {
      if (!token || !accessToken) return;
      setStatus("loading");
      try {
        const result = await WorkspaceMemberService.declineInvitation(token);
        if (result.already_declined) {
          setStatus("already_declined");
          toast.success("Already declined", { description: result.detail });
        } else {
          setWorkspaceName(result.detail.replace("Invitation to ", "").replace(" declined", ""));
          setStatus("success");
          toast.success("Invitation declined", { description: result.detail });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Please try again.";
        setErrorMessage(msg);
        toast.error("Could not decline invitation", { description: msg });
        setStatus("error");
      }
    };

    void decline();
  }, [accessToken, token]);

  if (!token) {
    return (
      <Shell
        title="Invitation link is missing"
        description="This invitation URL is incomplete. Please open the invitation from your email again."
        action={<Link href="/auth/login" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">Go to login</Link>}
      />
    );
  }

  if (!accessToken) {
    return (
      <Shell
        title="This invitation needs your account"
        description="Sign in with the invited email to decline the invitation. If you only want to review the workspace later, you can ignore this page."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/auth/login?next=${encodeURIComponent(`/invitations/reject?token=${token}`)}`} className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">Sign in</Link>
            <Link href="/notifications" className="inline-flex rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Go to notifications</Link>
          </div>
        }
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <Shell
        title="Declining invitation"
        description="We are revoking this invitation now."
        action={
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing invitation
          </div>
        }
      />
    );
  }

  if (status === "already_declined") {
    return (
      <Shell
        title="Already declined"
        description="You have already declined this invitation."
        icon={<CheckCircle2 className="h-7 w-7 text-slate-200" />}
        accent="from-slate-950 via-slate-900 to-slate-800"
        action={<Link href="/notifications" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">Back to notifications</Link>}
      />
    );
  }

  if (status === "success") {
    return (
      <Shell
        title="Invitation declined"
        description={`The invitation to join ${workspaceName || "the workspace"} has been declined and your notification center has been updated.`}
        icon={<CheckCircle2 className="h-7 w-7 text-slate-200" />}
        accent="from-slate-950 via-slate-900 to-slate-800"
        action={<Link href="/notifications" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">Back to notifications</Link>}
      />
    );
  }

  // error
  return (
    <Shell
      title="We could not decline this invitation"
      description={errorMessage || "It may have already been acted on or expired."}
      icon={<XCircle className="h-7 w-7 text-rose-200" />}
      action={<Link href="/notifications" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">Open notifications</Link>}
    />
  );
}

export default function RejectInvitationPage() {
  return (
    <Suspense
      fallback={
        <Shell
          title="Loading invitation..."
          description="Please wait while we prepare your invitation."
          icon={<Loader2 className="h-7 w-7 animate-spin text-rose-200" />}
        />
      }
    >
      <RejectInvitationPageInner />
    </Suspense>
  );
}
