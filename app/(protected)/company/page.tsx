"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { CompanyService } from "@/lib/services/company-service";
import { Company } from "@/lib/types/company";
import { goeyToast as toast } from "goey-toast";
import {
  Building2,
  Loader2,
  Plus,
  Pencil,
  X,
  Globe,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CompanyPage() {
  const { user, setUser } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCountryCode, setFormCountryCode] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getCompany();
      setCompany(data);
    } catch {
      // User doesn't have a company yet — that's okay
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Validation Error", { description: "Please enter a company name" });
      return;
    }

    setSubmitting(true);
    try {
      const newCompany = await CompanyService.createCompany({
        name: formName.trim(),
        country_code: formCountryCode.trim() || undefined,
        logo_url: formLogoUrl.trim() || undefined,
      });
      setCompany(newCompany);
      setShowForm(false);
      resetForm();

      // Update auth store so sidebar and other pages reflect the change
      if (user) {
        setUser({
          ...user,
          company: {
            id: newCompany.id,
            name: newCompany.name,
            slug: newCompany.slug,
            logo_url: newCompany.logo_url,
          },
        });
      }

      toast.success("Company Created", { description: "Your company profile is now set up" });
    } catch (error: any) {
      const msg = error?.detail || error?.message || "Failed to create company";
      toast.error("Creation Failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!formName.trim()) {
      toast.error("Validation Error", { description: "Please enter a company name" });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await CompanyService.updateCompany({
        name: formName.trim(),
        country_code: formCountryCode.trim() || undefined,
        logo_url: formLogoUrl.trim() || undefined,
      });
      setCompany(updated);
      setIsEditing(false);
      setShowForm(false);
      resetForm();

      // Update auth store
      if (user) {
        setUser({
          ...user,
          company: {
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            logo_url: updated.logo_url,
          },
        });
      }

      toast.success("Company Updated", { description: "Your changes have been saved successfully" });
    } catch (error: any) {
      const msg = error?.detail || error?.message || "Failed to update company";
      toast.error("Update Failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditForm = () => {
    if (company) {
      setFormName(company.name);
      setFormCountryCode(company.country_code || "");
      setFormLogoUrl(company.logo_url || "");
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCountryCode("");
    setFormLogoUrl("");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading company info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="text-white" size={20} />
            </div>
            Company
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Manage your company profile and settings.
          </p>
        </div>
        {company && !showForm && (
          <Button
            onClick={openEditForm}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <Pencil size={16} />
            Edit
          </Button>
        )}
      </div>

      {/* No Company State */}
      {!company && !showForm && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12 text-center animate-fade-in-up shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Building2 size={36} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No company yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
            Create your company to get started. A company is required to create
            and manage chatbots.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <Plus size={18} />
            Create Company
          </Button>
        </div>
      )}

      {/* Company Card */}
      {company && !showForm && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm animate-fade-in-up">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-16 h-16 rounded-xl bg-white object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 size={32} className="text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{company.name}</h2>
                <p className="text-emerald-200 text-sm mt-0.5">@{company.slug}</p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 rounded-xl border border-green-100/50 dark:border-green-500/20">
                <CheckCircle2 size={18} className="text-green-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {company.status}
                  </p>
                </div>
              </div>
              {company.country_code && (
                <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-500/10 dark:to-sky-500/10 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
                  <Globe size={18} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase">
                      {company.country_code}
                    </p>
                  </div>
                </div>
              )}
              {company.logo_url && (
                <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-100/50 dark:border-emerald-500/20 sm:col-span-2">
                  <LinkIcon size={18} className="text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logo URL</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {company.logo_url}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <p className="text-xs text-gray-400">
                Created {new Date(company.created_at).toLocaleDateString()} &middot; Last updated{" "}
                {new Date(company.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              {isEditing ? "Edit Company" : "Create Company"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="company-name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Acme Inc."
                autoFocus
              />
            </div>

            {/* Country Code */}
            <div className="space-y-2">
              <Label htmlFor="country-code">Country Code</Label>
              <Input
                id="country-code"
                value={formCountryCode}
                onChange={(e) => setFormCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="e.g. BD, US, UK"
                maxLength={2}
              />
              <p className="text-xs text-gray-400">Two-letter ISO country code (optional)</p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                type="url"
                value={formLogoUrl}
                onChange={(e) => setFormLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleUpdate : handleCreate}
              disabled={submitting || !formName.trim()}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Company"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
