export interface AuthFormProps {
  isLogin: boolean;
  onToggle: () => void;
}

export interface DummyUser {
  email: string;
  password: string;
  name: string;
}
