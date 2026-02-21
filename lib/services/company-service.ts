import { apiClient } from "./api-client";
import {
  Company,
  CompanyCreateRequest,
  CompanyUpdateRequest,
} from "@/lib/types/company";

const COMPANY_BASE =
  process.env.NEXT_PUBLIC_COMPANY_URL || "http://localhost:8000/company";

export class CompanyService {
  /**
   * Get the authenticated user's company
   * GET /company/v1/me/
   */
  static async getCompany(): Promise<Company> {
    const response = await apiClient.get<Company>(
      `${COMPANY_BASE}/v1/me/`
    );
    return response.data;
  }

  /**
   * Create a company for the authenticated user
   * POST /company/v1/me/
   */
  static async createCompany(data: CompanyCreateRequest): Promise<Company> {
    const response = await apiClient.post<Company>(
      `${COMPANY_BASE}/v1/me/`,
      data
    );
    return response.data;
  }

  /**
   * Update the authenticated user's company
   * PUT /company/v1/me/
   */
  static async updateCompany(data: CompanyUpdateRequest): Promise<Company> {
    const response = await apiClient.put<Company>(
      `${COMPANY_BASE}/v1/me/`,
      data
    );
    return response.data;
  }
}
