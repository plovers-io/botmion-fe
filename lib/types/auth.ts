// User types
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  is_email_verified?: boolean;
}

// Auth tokens
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// Auth responses
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: {
    email: string;
    uuid: string;
  };
}

export interface OTPResponse {
  message: string;
  email: string;
}

export interface VerifyOTPResponse {
  message: string;
  verified: boolean;
  email: string;
  reset_token?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

// Auth request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

export interface GenerateOTPRequest {
  email: string;
  purpose: "register" | "forgot_password" | "password_reset";
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  purpose: "register" | "forgot_password" | "password_reset";
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// Google Auth types
export interface GoogleAuthURLResponse {
  authorization_url: string;
}

export interface GoogleLoginRequest {
  code: string;
  redirect_uri: string;
}

// Auth store
export interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoggingOut: (value: boolean) => void;
  clearAuth: () => void;
}
