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
  BarChart3,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

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
    icon: <BarChart3 size={20} />,
  },
  {
    label: "Token Tracker",
    href: "/token-tracker",
    icon: <BarChart3 size={20} />,
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
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={20} />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { user, logout, setLoggingOut, refreshToken } = useAuthStore();

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0f1225] text-gray-300">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
        <Link href="/home" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Bot size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Botmion</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto no-scrollbar">
        <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Menu
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                active
                  ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                  : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
              }`}
            >
              <span className={`transition-colors duration-200 ${active ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300"}`}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2 border-t border-white/[0.06]">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 transition-all duration-200 cursor-pointer"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-500/20">
            <User size={15} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Logout button */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        onClick={toggleSidebar}
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-gray-200/60 dark:border-gray-700/60"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </Button>

      {/* Mobile sidebar using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col lg:hidden border-r-0 bg-[#0f1225]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-white/[0.06] flex-col z-40">
        <SidebarContent />
      </aside>
    </>
  );
}
