import axios, { AxiosError } from "axios";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GenerateOTPRequest,
  OTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenResponse,
  GoogleAuthURLResponse,
  GoogleLoginRequest,
} from "@/lib/types/auth";
import { useAuthStore } from "@/lib/store/auth-store-v2";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/user";

export class AuthService {
  /**
   * User Registration
   * Registers a new user and sends OTP for email verification
   */
  static async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axios.post<RegisterResponse>(
        `${API_BASE_URL}/v1/register/`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * User Login
   * Authenticates user and returns tokens
   */
  static async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/v1/login/`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh Access Token
   * Gets new access token using refresh token
   */
  static async refreshToken(
    refreshToken: string
  ): Promise<RefreshTokenResponse> {
    try {
      const response = await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}/v1/refresh/`,
        { refresh_token: refreshToken }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout
   * Revokes the refresh token and logs out user
   */
  static async logout(refreshToken: string): Promise<{ detail: string }> {
    try {
      const token = this.getAccessToken();
      const response = await axios.post<{ detail: string }>(
        `${API_BASE_URL}/v1/logout/`,
        { refresh_token: refreshToken },
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate OTP
   * Sends OTP to user's email for verification or password reset
   */
  static async generateOTP(data: GenerateOTPRequest): Promise<OTPResponse> {
    try {
      const response = await axios.post<OTPResponse>(
        `${API_BASE_URL}/v1/otp/generate/`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify OTP
   * Verifies the OTP code sent to user's email
   */
  static async verifyOTP(
    data: VerifyOTPRequest
  ): Promise<VerifyOTPResponse> {
    try {
      const response = await axios.post<VerifyOTPResponse>(
        `${API_BASE_URL}/v1/otp/verify/`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset Password
   * Resets password using the reset token from OTP verification
   */
  static async resetPassword(
    data: ResetPasswordRequest
  ): Promise<{ message: string }> {
    try {
      const response = await axios.post<{ message: string }>(
        `${API_BASE_URL}/v1/forgot-password/confirm/`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change Password
   * Changes password for authenticated user
   */
  static async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await axios.post<{ message: string }>(
        `${API_BASE_URL}/v1/change-password/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Google Auth URL
   * Returns Google OAuth2 authorization URL
   */
  static async getGoogleAuthURL(redirectUri: string): Promise<GoogleAuthURLResponse> {
    try {
      const response = await axios.get<GoogleAuthURLResponse>(
        `${API_BASE_URL}/v1/auth/google/url/`,
        { params: { redirect_uri: redirectUri } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Google Login
   * Exchanges Google auth code for access/refresh tokens
   */
  static async googleLogin(data: GoogleLoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/v1/auth/google/login/`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get stored access token from zustand store (single source of truth)
   */
  private static getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }

  /**
   * Handle API errors
   */
  private static handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        detail?: string;
        error?: string;
      }>;
      
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "An error occurred";

      return new Error(errorMessage);
    }
    return new Error("An unexpected error occurred");
  }
}
