import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../context/AuthContext";

interface ProtectedRouteProps {
  roles?: UserRole[]; // se vazio, apenas exige login
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  redirectTo = "/",
}) => {
  const { isAuthenticated, role, loading, user } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] VERIFICAÇÃO COMPLETA", {
    path: location.pathname,
    isAuthenticated,
    role,
    loading,
    requiredRoles: roles,
    user: user ? { id: user.id, nome: user.nome, email: user.email } : null,
    timestamp: new Date().toISOString(),
  });

  // Verificar localStorage para debug
  try {
    const stored = localStorage.getItem("appSession");
    console.log(
      "[ProtectedRoute] localStorage appSession:",
      stored ? JSON.parse(stored) : null
    );
  } catch (e) {
    console.error("[ProtectedRoute] Erro ao ler localStorage:", e);
  }

  if (loading) {
    console.log("[ProtectedRoute] ⏳ Ainda carregando sessão...");
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Verificando sessão...
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log(
      "[ProtectedRoute] ❌ NÃO AUTENTICADO! User:",
      user,
      "Redirecionando para:",
      redirectTo
    );
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  console.log("[ProtectedRoute] ✅ Autenticado! Verificando roles...");

  // Admin tem acesso a tudo
  if (role === "admin") {
    console.log("[ProtectedRoute] Admin detectado, permitindo acesso");
    return <Outlet />;
  }

  // Verificar roles permitidas
  if (roles && roles.length > 0) {
    // Tratar "user" como "paciente" para compatibilidade
    const userRole = role === "user" ? "paciente" : role;
    const allowedRoles = roles.map((r) => (r === "user" ? "paciente" : r));

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(
        "[ProtectedRoute] Role não permitida, redirecionando para:",
        redirectTo
      );
      return <Navigate to={redirectTo} replace />;
    }
  }

  console.log("[ProtectedRoute] Acesso permitido");
  return <Outlet />;
};

export default ProtectedRoute;
