"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/lib/store/ui-store";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { useNotificationStore } from "@/lib/store/notification-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useTheme } from "@/components/common/theme-provider";
import { AuthService } from "@/lib/services/auth-service";
import { WorkspaceMemberService } from "@/lib/services/workspace-member-service";
import { goeyToast as toast } from "goey-toast";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  User,
  Briefcase,
  Brain,
  LineChart,
  Coins,
  Sun,
  Moon,
  Bell,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Building2,
  ChevronDown,
  Eye,
  Pencil,
  Shield,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/home",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Workspace",
    href: "/workspace",
    icon: <Briefcase size={20} />,
  },
  {
    label: "Members",
    href: "/members",
    icon: <Users size={20} />,
  },
  {
    label: "Chatbots",
    href: "/chatbots",
    icon: <Bot size={20} />,
  },
  {
    label: "Training Center",
    href: "/training",
    icon: <Brain size={20} />,
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Conversation Analytics",
    href: "/conversations/analytics",
    icon: <LineChart size={20} />,
  },
  {
    label: "Token Tracker",
    href: "/token-tracker",
    icon: <Coins size={20} />,
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: <Plug size={20} />,
  },
  {
    label: "Subscription",
    href: "/subscription",
    icon: <CreditCard size={20} />,
  },
];

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: "Owner", icon: <Crown size={10} />, color: "bg-amber-100 text-amber-700" },
  admin: { label: "Admin", icon: <Shield size={10} />, color: "bg-purple-100 text-purple-700" },
  editor: { label: "Editor", icon: <Pencil size={10} />, color: "bg-blue-100 text-blue-700" },
  viewer: { label: "Viewer", icon: <Eye size={10} />, color: "bg-gray-100 text-gray-600" },
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const { user, logout, setLoggingOut, refreshToken } = useAuthStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const hasUnread = unreadCount > 0;
  const unreadBadge = unreadCount > 99 ? "99+" : unreadCount;
  const themeValue = theme === "system" ? resolvedTheme : theme;
  const emailPrefix = user?.email?.split("@")[0] ?? "";
  const displayName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    emailPrefix ||
    "Account";

  // Workspace state
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const currentRole = useWorkspaceStore((state) => state.currentRole);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace);
  const setCurrentRole = useWorkspaceStore((state) => state.setCurrentRole);
  const [workspaceLoading, setWorkspaceLoading] = React.useState(false);

  // Fetch workspaces on mount
  React.useEffect(() => {
    const loadWorkspaces = async () => {
      setWorkspaceLoading(true);
      try {
        const data = await WorkspaceMemberService.getWorkspaces();
        setWorkspaces(data);
        // Determine role for current workspace
        const currentWs = data.find((w) => w.id === currentWorkspaceId);
        if (currentWs) {
          if (String(currentWs.owner.id) === user?.id) {
            setCurrentRole("owner");
          } else {
            try {
              const membersData = await WorkspaceMemberService.getMembers(currentWs.id);
              setCurrentRole(membersData.current_user_role as any);
            } catch {
              setCurrentRole("viewer");
            }
          }
        }
      } catch {
        // silent fail
      } finally {
        setWorkspaceLoading(false);
      }
    };
    if (user) {
      loadWorkspaces();
    }
  }, [user, setWorkspaces, currentWorkspaceId, setCurrentRole]);

  const handleWorkspaceSwitch = async (workspaceId: number) => {
    setCurrentWorkspace(workspaceId);
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      if (String(ws.owner.id) === user?.id) {
        setCurrentRole("owner");
      } else {
        try {
          const membersData = await WorkspaceMemberService.getMembers(ws.id);
          setCurrentRole(membersData.current_user_role as any);
        } catch {
          setCurrentRole("viewer");
        }
      }
    }
    // Reload page to refresh workspace-scoped data
    router.refresh();
  };

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);
  const roleInfo = currentRole ? roleConfig[currentRole] : null;

  const navigationItems: NavItem[] = [...navItems];

  const handleThemeChange = (value: string) => {
    if (value === "light" || value === "dark") {
      setTheme(value);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      logout();
      toast.success("Logged Out", { description: "You have been signed out successfully" });
      router.push("/auth/login");
    } catch {
      logout();
      toast.info("Logged Out", { description: "Signed out from this device" });
      router.push("/auth/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/home") {
      return pathname === "/home";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = ({
    collapsed = false,
    showCollapseToggle = false,
  }: {
    collapsed?: boolean;
    showCollapseToggle?: boolean;
  }) => (
    <div className={`group/sidebar flex flex-col h-full bg-white text-gray-700 dark:bg-[#0f1225] dark:text-gray-300 transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
      <div className={`h-16 border-b border-gray-200/70 dark:border-white/6 transition-all duration-300 ${collapsed ? "px-2" : "px-5"}`}>
        <div className={`flex h-full items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <Link href="/home" className="flex items-center gap-3 group">
              <div className="bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 w-9 h-9">
                <Bot size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Botmion</span>
            </Link>
          )}

          {showCollapseToggle && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
              title={collapsed ? "Open sidebar" : "Close sidebar"}
              className={`group relative flex items-center justify-center rounded-xl border border-gray-200/70 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:border-white/10 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5 transition-all duration-200 ${collapsed ? "w-9 h-9" : "w-9 h-9"}`}
            >
              {collapsed ? (
                <>
                  <span className="transition-opacity duration-200 group-hover/sidebar:opacity-0">
                    <Bot size={18} className="text-emerald-600 dark:text-white" />
                  </span>
                  <span className="absolute inset-0 flex items-center cursor-pointer justify-center opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                    <PanelLeftOpen size={16} />
                  </span>
                </>
              ) : (
                <PanelLeftClose size={16} />
              )}
              <span className="pointer-events-none absolute left-full cursor-pointer ml-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-700 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                {collapsed ? "Open sidebar" : "Close sidebar"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Switcher */}
      {!collapsed && workspaces.length > 0 && (
        <div className="px-3 py-3 border-b border-gray-200/70 dark:border-white/6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-xl border border-gray-200/70 dark:border-white/10 bg-gray-50/80 dark:bg-white/4 px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-white/6 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {currentWorkspace?.name || "Select Workspace"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {roleInfo && (
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${roleInfo.color}`}>
                        <span className="mr-0.5">{roleInfo.icon}</span>
                        {roleInfo.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="start"
              sideOffset={4}
              className="w-64 border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-[#111526] dark:text-gray-100"
            >
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((ws) => {
                const isOwner = String(ws.owner.id) === user?.id;
                const wsRole = isOwner ? "owner" : undefined;
                const wsRoleInfo = wsRole ? roleConfig[wsRole] : null;
                return (
                  <DropdownMenuItem
                    key={ws.id}
                    className="cursor-pointer flex items-center gap-2"
                    onClick={() => handleWorkspaceSwitch(ws.id)}
                  >
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ws.name}</p>
                    </div>
                    {wsRoleInfo && (
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${wsRoleInfo.color}`}>
                        {wsRoleInfo.label}
                      </Badge>
                    )}
                    {currentWorkspaceId === ws.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className={`flex-1 py-5 space-y-0.5 overflow-y-auto overflow-x-visible no-scrollbar transition-all duration-300 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
            Menu
          </p>
        )}
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const showBadge = typeof item.badgeCount === "number" && item.badgeCount > 0;
          const badgeValue =
            typeof item.badgeCount === "number" && item.badgeCount > 99
              ? "99+"
              : item.badgeCount;
          const showActiveIndicator = active && !showBadge;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`group relative flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all duration-200 ${collapsed ? "px-2 justify-center" : "px-3 gap-3"} ${
                active
                  ? "bg-emerald-500/15 text-emerald-600 shadow-sm dark:text-emerald-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              <span className={`transition-colors duration-200 ${active ? "text-emerald-500 dark:text-emerald-400" : "text-gray-500 group-hover:text-gray-800 dark:text-gray-500 dark:group-hover:text-gray-300"}`}>
                {item.icon}
              </span>
              {!collapsed && item.label}
              {showBadge && !collapsed && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {badgeValue}
                </span>
              )}
              {showBadge && collapsed && (
                <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-rose-500 px-1 text-[9px] font-semibold leading-4 text-white ring-2 ring-white dark:ring-[#0f1225]">
                  {badgeValue}
                </span>
              )}
              {showActiveIndicator && (
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${collapsed ? "absolute right-2" : "ml-auto"}`} />
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-700 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`space-y-2 border-t border-gray-200/70 dark:border-white/6 transition-all duration-300 ${collapsed ? "p-2" : "p-3"}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Account menu"
              className={`group flex w-full cursor-pointer items-center rounded-xl bg-gray-50 transition-all duration-300 hover:bg-gray-100 dark:bg-white/4 dark:hover:bg-white/6 ${collapsed ? "px-2 justify-center py-2.5" : "px-3 gap-3 py-2.5"}`}
            >
              <div className={`relative bg-linear-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20 ${collapsed ? "w-7 h-7" : "w-9 h-9"}`}>
                <User size={15} className="text-emerald-400" />
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0f1225]" />
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate dark:text-gray-200">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate dark:text-gray-500">{user?.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align={collapsed ? "center" : "start"}
            sideOffset={8}
            className="w-56 border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-[#111526] dark:text-gray-100"
          >
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                {displayName}
              </p>
              <p className="text-[11px] text-gray-500 truncate dark:text-gray-400">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-gray-200/80 dark:bg-white/10" />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Appearance</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={themeValue} onValueChange={handleThemeChange}>
              <DropdownMenuRadioItem value="light" className="cursor-pointer">
                <Sun size={14} />
                Light Mode
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                <Moon size={14} />
                Dark Mode
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator className="bg-gray-200/80 dark:bg-white/10" />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                router.push("/notifications");
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            >
              <Bell size={14} />
              <span className="flex-1">Notifications</span>
              {hasUnread && (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {unreadBadge}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                router.push("/settings");
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            >
              <Settings size={14} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                router.push("/help-center");
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            >
              <LifeBuoy size={14} />
              Help Center
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200/80 dark:bg-white/10" />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={toggleSidebar}
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-gray-200/60 dark:border-gray-700/60"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </Button>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col lg:hidden border-r-0 bg-white dark:bg-[#0f1225]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen border-r border-gray-200/70 dark:border-white/6 flex-col z-40 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
        <SidebarContent collapsed={sidebarCollapsed} showCollapseToggle />
      </aside>
    </>
  );
}
