import api from "./api";
import { ApiResponse } from "./http";

export interface UserInfo {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export interface UserProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  disabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPermissions {
  isAdmin?: boolean;
  isManager?: boolean;
  isDoctor?: boolean;
  isSecretary?: boolean;
  isAdminOrManager?: boolean;
}

export interface FullUserInfo {
  user: UserInfo;
  profile?: UserProfile | null;
  roles?: string[];
  permissions?: UserPermissions;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "gestor" | "medico" | "secretaria" | "user";
  created_at: string;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  email?: string;
  disabled?: boolean;
  roles?: string[];
}

class AdminUserService {
  /**
   * Busca informações do usuário autenticado
   */
  async getCurrentUserInfo(): Promise<ApiResponse<FullUserInfo>> {
    try {
      console.log(
        "[adminUserService] Buscando informações do usuário atual..."
      );

      const response = await api.get<FullUserInfo>("/functions/v1/user-info");

      console.log("[adminUserService] Usuário atual:", response.data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao buscar usuário:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao buscar informações do usuário";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Busca roles de um usuário
   */
  async getUserRoles(userId: string): Promise<ApiResponse<UserRole[]>> {
    try {
      console.log("[adminUserService] Buscando roles do usuário:", userId);

      const response = await api.get(
        `/rest/v1/user_roles?user_id=eq.${userId}`
      );

      console.log("[adminUserService] Roles encontrados:", response.data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao buscar roles:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao buscar roles do usuário";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Busca roles de todos os usuários
   */
  async getAllUserRoles(): Promise<ApiResponse<UserRole[]>> {
    try {
      console.log("[adminUserService] Buscando todos os roles...");

      const response = await api.get("/rest/v1/user_roles?select=*");

      console.log("[adminUserService] Total de roles:", response.data.length);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao buscar roles:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao buscar roles";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Adiciona um role a um usuário
   */
  async addUserRole(
    userId: string,
    role: "admin" | "gestor" | "medico" | "secretaria" | "user"
  ): Promise<ApiResponse<UserRole>> {
    try {
      console.log("[adminUserService] Adicionando role:", { userId, role });

      const response = await api.post(
        "/rest/v1/user_roles",
        {
          user_id: userId,
          role: role,
        },
        {
          headers: {
            Prefer: "return=representation",
          },
        }
      );

      console.log("[adminUserService] Role adicionado:", response.data);

      return {
        success: true,
        data: response.data[0],
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao adicionar role:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao adicionar role";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Remove um role de um usuário
   */
  async removeUserRole(roleId: string): Promise<ApiResponse<void>> {
    try {
      console.log("[adminUserService] Removendo role:", roleId);

      await api.delete(`/rest/v1/user_roles?id=eq.${roleId}`);

      console.log("[adminUserService] Role removido com sucesso");

      return {
        success: true,
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao remover role:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao remover role";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Lista todos os usuários (requer permissão de admin)
   */
  async listAllUsers(): Promise<ApiResponse<FullUserInfo[]>> {
    try {
      console.log("[adminUserService] Listando todos os usuários...");

      // Buscar da tabela profiles
      const profilesResponse = await api.get("/rest/v1/profiles?select=*");

      // Buscar todos os roles
      const rolesResult = await this.getAllUserRoles();
      const allRoles =
        rolesResult.success && rolesResult.data ? rolesResult.data : [];

      console.log(
        "[adminUserService] Total de usuários:",
        profilesResponse.data.length
      );
      console.log("[adminUserService] Total de roles:", allRoles.length);

      // Criar mapa de roles por usuário
      const rolesMap = new Map<string, string[]>();
      allRoles.forEach((userRole: UserRole) => {
        if (!rolesMap.has(userRole.user_id)) {
          rolesMap.set(userRole.user_id, []);
        }
        rolesMap.get(userRole.user_id)?.push(userRole.role);
      });

      // Transformar para formato FullUserInfo
      const users: FullUserInfo[] = profilesResponse.data.map(
        (profile: UserProfile) => {
          const roles = rolesMap.get(profile.id) || [];
          const permissions: UserPermissions = {
            isAdmin: roles.includes("admin"),
            isManager: roles.includes("gestor"),
            isDoctor: roles.includes("medico"),
            isSecretary: roles.includes("secretaria"),
            isAdminOrManager:
              roles.includes("admin") || roles.includes("gestor"),
          };

          return {
            user: {
              id: profile.id,
              email: profile.email || "",
              created_at: profile.created_at || "",
            },
            profile: profile,
            roles: roles,
            permissions: permissions,
          };
        }
      );

      return {
        success: true,
        data: users,
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao listar usuários:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao listar usuários";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Atualiza dados de um usuário na tabela profiles
   */
  async updateUser(
    userId: string,
    data: UpdateUserData
  ): Promise<ApiResponse<UserProfile>> {
    try {
      console.log("[adminUserService] Atualizando usuário:", userId, data);

      const updateData: Partial<UserProfile> = {};

      if (data.full_name !== undefined) updateData.full_name = data.full_name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.disabled !== undefined) updateData.disabled = data.disabled;

      const response = await api.patch(
        `/rest/v1/profiles?id=eq.${userId}`,
        updateData,
        {
          headers: {
            Prefer: "return=representation",
          },
        }
      );

      console.log("[adminUserService] Usuário atualizado:", response.data);

      return {
        success: true,
        data: response.data[0],
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao atualizar usuário:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao atualizar usuário";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Desabilita um usuário (soft delete)
   */
  async disableUser(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.updateUser(userId, { disabled: true });
  }

  /**
   * Habilita um usuário
   */
  async enableUser(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.updateUser(userId, { disabled: false });
  }

  /**
   * Deleta um usuário permanentemente
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      console.log("[adminUserService] Deletando usuário:", userId);

      await api.delete(`/rest/v1/profiles?id=eq.${userId}`);

      console.log("[adminUserService] Usuário deletado com sucesso");

      return {
        success: true,
      };
    } catch (error: unknown) {
      console.error("[adminUserService] Erro ao deletar usuário:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao deletar usuário";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const adminUserService = new AdminUserService();
export default adminUserService;
