// Company types matching backend models

export interface Company {
  id: number;
  name: string;
  slug: string;
  country_code?: string;
  status: string;
  logo_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreateRequest {
  name: string;
  country_code?: string;
  logo_url?: string;
}

export interface CompanyUpdateRequest {
  name?: string;
  country_code?: string;
  logo_url?: string;
}
