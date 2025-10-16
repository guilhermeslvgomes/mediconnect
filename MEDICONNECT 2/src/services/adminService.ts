// Service para funcionalidades administrativas
import { http, ApiResponse } from "./http";
import ENDPOINTS from "./endpoints";

export type RoleType = "admin" | "gestor" | "medico" | "secretaria" | "user";

export interface UserRoleData {
  id?: string;
  user_id: string;
  role: RoleType;
  created_at?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: RoleType;
}

export interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    full_name: string;
    phone?: string | null;
    role: string;
  };
  error?: string;
}

// Listar roles de usuários
export async function listUserRoles(params?: {
  user_id?: string;
  role?: RoleType;
}): Promise<ApiResponse<UserRoleData[]>> {
  try {
    const queryParams: Record<string, string> = { select: "*" };

    if (params?.user_id) {
      queryParams["user_id"] = `eq.${params.user_id}`;
    }

    if (params?.role) {
      queryParams["role"] = `eq.${params.role}`;
    }

    const response = await http.get<UserRoleData[]>(ENDPOINTS.USER_ROLES, {
      params: queryParams,
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [response.data],
      };
    }

    return {
      success: false,
      error: response.error || "Erro ao listar roles",
    };
  } catch (error) {
    console.error("Erro ao listar roles:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// Criar novo usuário (via Edge Function)
export async function createUser(
  data: CreateUserInput
): Promise<CreateUserResponse> {
  try {
    const response = await http.post<CreateUserResponse>(
      "/functions/v1/create-user",
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    return {
      success: false,
      error: response.error || "Erro ao criar usuário",
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar usuário",
    };
  }
}

// Adicionar role a um usuário
export async function addUserRole(
  user_id: string,
  role: RoleType
): Promise<ApiResponse<UserRoleData>> {
  try {
    const data = {
      user_id,
      role,
    };

    const response = await http.post<UserRoleData>(ENDPOINTS.USER_ROLES, data, {
      headers: { Prefer: "return=representation" },
    });

    if (response.success && response.data) {
      const userRole = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      return {
        success: true,
        data: userRole,
        message: "Role adicionada com sucesso",
      };
    }

    return {
      success: false,
      error: response.error || "Erro ao adicionar role",
    };
  } catch (error) {
    console.error("Erro ao adicionar role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao adicionar role",
    };
  }
}

// Remover role de um usuário
export async function removeUserRole(
  roleId: string
): Promise<ApiResponse<void>> {
  try {
    const response = await http.delete(
      `${ENDPOINTS.USER_ROLES}?id=eq.${roleId}`
    );

    if (response.success) {
      return {
        success: true,
        message: "Role removida com sucesso",
      };
    }

    return {
      success: false,
      error: response.error || "Erro ao remover role",
    };
  } catch (error) {
    console.error("Erro ao remover role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao remover role",
    };
  }
}

export default {
  listUserRoles,
  createUser,
  addUserRole,
  removeUserRole,
};
