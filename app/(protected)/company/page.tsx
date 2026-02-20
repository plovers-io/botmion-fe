"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { CompanyService } from "@/lib/services/company-service";
import { Company } from "@/lib/types/company";
import { toast } from "react-toastify";
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
      toast.error("Please enter a company name");
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

      toast.success("Company created successfully!");
    } catch (error: any) {
      const msg = error?.detail || error?.message || "Failed to create company";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a company name");
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

      toast.success("Company updated successfully!");
    } catch (error: any) {
      const msg = error?.detail || error?.message || "Failed to update company";
      toast.error(msg);
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
          <Loader2 className="animate-spin text-violet-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading company info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-violet-600" size={28} />
            Company
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your company profile and settings.
          </p>
        </div>
        {company && !showForm && (
          <button
            onClick={openEditForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer"
          >
            <Pencil size={16} />
            Edit
          </button>
        )}
      </div>

      {/* No Company State */}
      {!company && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No company yet
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Create your company to get started. A company is required to create
            and manage chatbots.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Create Company
          </button>
        </div>
      )}

      {/* Company Card */}
      {company && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-8">
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
                <p className="text-violet-200 text-sm mt-0.5">@{company.slug}</p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 size={18} className="text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {company.status}
                  </p>
                </div>
              </div>
              {company.country_code && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe size={18} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-sm font-medium text-gray-900 uppercase">
                      {company.country_code}
                    </p>
                  </div>
                </div>
              )}
              {company.logo_url && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg sm:col-span-2">
                  <LinkIcon size={18} className="text-violet-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Logo URL</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {company.logo_url}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Acme Inc."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Country Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country Code
              </label>
              <input
                type="text"
                value={formCountryCode}
                onChange={(e) => setFormCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="e.g. BD, US, UK"
                maxLength={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Two-letter ISO country code (optional)</p>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                value={formLogoUrl}
                onChange={(e) => setFormLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={isEditing ? handleUpdate : handleCreate}
              disabled={submitting || !formName.trim()}
              className="flex-1 px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  {isEditing ? "Saving..." : "Creating..."}
                </span>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Company"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
