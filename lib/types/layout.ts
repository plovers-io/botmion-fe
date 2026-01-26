import { ReactNode } from "react";

export interface ProtectedLayoutProps {
  children: ReactNode;
}

export interface ProtectedLayoutWrapperProps extends ProtectedLayoutProps {
  isLoggingOut: React.MutableRefObject<boolean>;
}
