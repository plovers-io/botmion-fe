"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { userService } from "@/lib/services/user-service";
import { AuthService } from "@/lib/services/auth-service";
import { goeyToast as toast } from "goey-toast";
import { Settings, User, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSavingProfile(true);
    try {
      const response = await userService.updateUser(user.id, {
        first_name: firstName,
        last_name: lastName,
      });
      setUser({ ...user, first_name: firstName, last_name: lastName });
      toast.success("Profile Updated", { description: "Your profile changes have been saved" });
    } catch (error: any) {
      toast.error("Update Failed", { description: error?.message || "Failed to update profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !currentPassword) {
      toast.error("Validation Error", { description: "Please fill in all password fields" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Validation Error", { description: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Validation Error", { description: "Password must be at least 8 characters long" });
      return;
    }

    setUpdatingPassword(true);
    try {
      await AuthService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password Updated", { description: "Your password has been changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Update Failed", { description: error?.message || "Failed to update password" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Settings className="text-white" size={20} />
          </div>
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
          Manage your account and workspace settings.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="mb-6 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-lg flex items-center justify-center">
              <User size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email || ""}
              disabled
              className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400"
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            {savingProfile ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button
            onClick={handleUpdatePassword}
            disabled={updatingPassword}
            variant="default"
          >
            {updatingPassword ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
