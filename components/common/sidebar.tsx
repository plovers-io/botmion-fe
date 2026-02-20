"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/lib/store/ui-store";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { AuthService } from "@/lib/services/auth-service";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Building2,
  Brain,
} from "lucide-react";

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
    label: "Company",
    href: "/company",
    icon: <Building2 size={20} />,
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
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch {
      logout();
      toast.info("Logged out locally");
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

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:bg-gray-100 lg:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/home" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Botmion</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet-50 text-violet-700 border border-violet-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={active ? "text-violet-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout at bottom */}
        <div className="border-t border-gray-200 p-3 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
