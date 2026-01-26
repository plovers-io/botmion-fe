"use client";

import React from "react";
import { useUiStore } from "@/lib/store";
import { Menu, X } from "lucide-react";

export function Sidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:relative z-30`}
      >
        <nav className="pt-20 lg:pt-8 px-4 space-y-2">
          <a href="/" className="block py-2 px-4 rounded-lg hover:bg-gray-800">
            Dashboard
          </a>
          <a
            href="/users"
            className="block py-2 px-4 rounded-lg hover:bg-gray-800"
          >
            Users
          </a>
          <a
            href="/settings"
            className="block py-2 px-4 rounded-lg hover:bg-gray-800"
          >
            Settings
          </a>
        </nav>
      </aside>
    </>
  );
}
