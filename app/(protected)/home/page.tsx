"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { LogOut } from "lucide-react";
import { toast } from "react-toastify";

const HomePage = () => {
  const router = useRouter();
  const { user, logout, setLoggingOut } = useAuthStore();

  const handleLogout = () => {
    setLoggingOut(true);
    logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-violet-600">Welcome</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Hello, {user?.name}! 👋
          </h2>
          <p className="text-gray-600 mb-6">
            You have successfully logged in to our platform.
          </p>
          <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-sm font-medium text-gray-700 mt-2">
                <strong>Name:</strong> {user?.name}
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              This is a protected page that only authenticated users can access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
