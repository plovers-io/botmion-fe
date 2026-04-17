import type { ReactNode, MutableRefObject } from "react";

export interface ProtectedLayoutProps {
  children: ReactNode;
}

export interface ProtectedLayoutWrapperProps extends ProtectedLayoutProps {
  isLoggingOut: MutableRefObject<boolean>;
}
