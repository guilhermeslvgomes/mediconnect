import { useContext } from "react";
import AuthContext, {
  type UserRole,
  type SessionUser,
} from "../context/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export function useRequireRole(allowed: UserRole | UserRole[]) {
  const { role, user, loading } = useAuth();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  const isAllowed = !!role && roles.includes(role);
  return {
    allowed: isAllowed,
    role,
    user: user as SessionUser | null,
    loading,
  };
}
