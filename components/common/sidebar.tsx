"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/lib/store/ui-store";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { useTheme } from "@/components/common/theme-provider";
import { AuthService } from "@/lib/services/auth-service";
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
  LifeBuoy,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
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

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
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
  const themeValue = theme === "system" ? resolvedTheme : theme;

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
    <div className={`group/sidebar flex flex-col h-full bg-[#0f1225] text-gray-300 transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
      <div className={`h-16 border-b border-white/6 transition-all duration-300 ${collapsed ? "px-2" : "px-5"}`}>
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
              className={`group relative flex items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-200 ${collapsed ? "w-9 h-9" : "w-9 h-9"}`}
            >
              {collapsed ? (
                <>
                  <span className="transition-opacity duration-200 group-hover/sidebar:opacity-0">
                    <Bot size={18} className="text-white" />
                  </span>
                  <span className="absolute inset-0 flex items-center cursor-pointer justify-center opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                    <PanelLeftOpen size={16} />
                  </span>
                </>
              ) : (
                <PanelLeftClose size={16} />
              )}
              <span className="pointer-events-none absolute left-full cursor-pointer ml-2 whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                {collapsed ? "Open sidebar" : "Close sidebar"}
              </span>
            </button>
          )}
        </div>
      </div>

      <nav className={`flex-1 py-5 space-y-0.5 overflow-y-auto overflow-x-visible no-scrollbar transition-all duration-300 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const active = isActive(item.href);
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
                  ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <span className={`transition-colors duration-200 ${active ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300"}`}>
                {item.icon}
              </span>
              {!collapsed && item.label}
              {active && (
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${collapsed ? "absolute right-2" : "ml-auto"}`} />
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`space-y-2 border-t border-white/6 transition-all duration-300 ${collapsed ? "p-2" : "p-3"}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Account menu"
              className={`group flex w-full items-center rounded-xl bg-white/4 transition-all duration-300 hover:bg-white/6 ${collapsed ? "px-2 justify-center py-2.5" : "px-3 gap-3 py-2.5"}`}
            >
              <div className={`bg-linear-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20 ${collapsed ? "w-7 h-7" : "w-9 h-9"}`}>
                <User size={15} className="text-emerald-400" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-200 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align={collapsed ? "center" : "start"}
            sideOffset={8}
            className="w-56 border-white/10 bg-[#111526] text-gray-100"
          >
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-400">Account</DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold text-gray-100 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-400">Appearance</DropdownMenuLabel>
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
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/notifications")}
            >
              <Bell size={14} />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <Settings size={14} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/help-center")}>
              <LifeBuoy size={14} />
              Help Center
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={handleLogout}>
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
        <SheetContent side="left" className="w-64 p-0 flex flex-col lg:hidden border-r-0 bg-[#0f1225]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen border-r border-white/6 flex-col z-40 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
        <SidebarContent collapsed={sidebarCollapsed} showCollapseToggle />
      </aside>
    </>
  );
}
