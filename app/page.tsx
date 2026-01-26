"use client";

import React, { useState } from "react";
import Image from "next/image";
import AuthForm from "@/components/features/auth-form";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Image Container - Fixed */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 lg:opacity-10"></div>
              <div className="relative h-full w-full flex items-center justify-center p-8">
                <Image
                  src="/login page.webp"
                  alt="Auth illustration"
                  width={400}
                  height={500}
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Form Container - Fixed Left */}
            <div className="relative flex flex-col justify-center p-8 lg:p-12">
              <div className="space-y-2 mb-8">
                {/* Animated title */}
                <h1
                  key={`title-${isLogin}`}
                  className="text-3xl lg:text-4xl font-bold text-gray-900 animate-fade-in"
                >
                  {isLogin ? "Welcome Back" : "Welcome"}
                </h1>

                {/* Animated subtitle */}
                <p
                  key={`subtitle-${isLogin}`}
                  className="text-gray-600 animate-fade-in"
                >
                  {isLogin
                    ? "Login to your account to continue"
                    : "Join us and get started today"}
                </p>
              </div>

              {/* Form with fade animation */}
              <div className="animate-fade-in">
                <AuthForm
                  isLogin={isLogin}
                  onToggle={() => setIsLogin(!isLogin)}
                />
              </div>
              <div className="mt-8 text-center text-gray-600 text-sm">
                <p>
                  Secure authentication with email or SSO • Your data is
                  encrypted and safe
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decorative elements */}
      </div>
    </div>
  );
};

export default AuthPage;
