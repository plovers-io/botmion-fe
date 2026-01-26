export interface User {
  email: string;
  name: string;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoggingOut: (value: boolean) => void;
}
