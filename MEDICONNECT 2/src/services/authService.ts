import api from "./api";
import { ApiResponse } from "./http";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig";
import tokenStore from "./tokenStore";
import { logger } from "./logger";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: AuthUser;
}

// Novo payload user-info completo
export interface UserInfoUser {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
}
export interface UserInfoProfile {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  disabled?: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface UserInfoPermissions {
  isAdmin?: boolean;
  isManager?: boolean;
  isDoctor?: boolean;
  isSecretary?: boolean;
  isAdminOrManager?: boolean;
}
export interface UserInfoFullResponse {
  user?: UserInfoUser;
  profile?: UserInfoProfile | null;
  roles?: string[];
  permissions?: UserInfoPermissions;
}

// Usa ApiResponse unificado de http.ts

class AuthService {
  // Chaves legacy usadas apenas para migração/limpeza; armazenamento corrente em tokenStore
  private tokenKey = "authToken";
  private userKey = "authUser";
  private refreshTokenKey = "refreshToken";

  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      logger.debug("login attempt", { email: credentials.email });
      logger.debug("login endpoint", {
        url: "/auth/v1/token?grant_type=password",
      });

      const response = await api.post("/auth/v1/token", credentials, {
        params: { grant_type: "password" },
      });

      logger.info("login success", { status: response.status });
      const loginData: LoginResponse = response.data;

      // Persistir em tokenStore (access em memória, refresh em sessionStorage)
      tokenStore.setTokens(loginData.access_token, loginData.refresh_token);
      tokenStore.setUser(loginData.user);
      logger.debug("tokens stored");
      return { success: true, data: loginData };
    } catch (error: unknown) {
      logger.error("login error", { error: (error as Error)?.message });

      // Extrair mensagem de erro detalhada
      let errorMessage = "Erro ao fazer login";

      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { error_code?: string; msg?: string; message?: string };
          };
        };
        const errorData = axiosError.response?.data;

        // Verificar se é erro de email não confirmado
        if (errorData?.error_code === "email_not_confirmed") {
          errorMessage =
            "Email não confirmado. Verifique sua caixa de entrada ou configure o Supabase para não exigir confirmação.";
        } else if (errorData?.msg) {
          errorMessage = errorData.msg;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getUserInfo(): Promise<ApiResponse<UserInfoFullResponse>> {
    try {
      // Buscar dados básicos do usuário
      const userResponse = await api.get("/auth/v1/user");
      const userData = userResponse.data;

      // Buscar informações adicionais (profile, roles, permissions)
      // Se você tiver esses endpoints específicos, adicione aqui
      // Por enquanto, vamos tentar buscar do endpoint customizado
      let fullData: UserInfoFullResponse = {
        user: {
          id: userData.id,
          email: userData.email,
          email_confirmed_at: userData.email_confirmed_at,
          created_at: userData.created_at,
          last_sign_in_at: userData.last_sign_in_at,
        },
        roles: [],
        permissions: {},
      };

      // Tentar buscar dados completos do endpoint customizado
      try {
        const fullResponse = await api.get("/functions/v1/user-info");
        if (fullResponse.data) {
          fullData = fullResponse.data as UserInfoFullResponse;
        }
      } catch {
        logger.warn(
          "user-info edge function indisponível, usando dados básicos"
        );
      }

      return { success: true, data: fullData };
    } catch (error: unknown) {
      logger.error("erro ao obter user-info", {
        error: (error as Error)?.message,
      });
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao obter user-info"
          : "Erro ao obter user-info";
      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      const resp = await api.post("/auth/v1/logout");
      // Especificação indica 204 No Content; não depende do corpo
      if (resp.status !== 204 && resp.status !== 200) {
        // Ainda assim vamos limpar local, mas registrar
        console.warn("Status inesperado no logout:", resp.status);
      }
    } catch (error: unknown) {
      // 401 => token já inválido / expirado: tratamos como sucesso resiliente
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 401) {
        logger.info("logout 401 token inválido/expirado (tratado)");
      } else {
        logger.warn("erro logout servidor", {
          error: (error as Error)?.message,
        });
      }
    } finally {
      this.clearLocalAuth();
      // snapshot opcional para debug
      try {
        logger.debug("snapshot pós-logout");
      } catch {
        /* ignore */
      }
    }
    return { success: true };
  }

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      const response = await api.get("/auth/v1/user");
      return { success: true, data: response.data };
    } catch (error: unknown) {
      logger.error("erro ao obter usuário atual", {
        error: (error as Error)?.message,
      });
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao obter dados do usuário"
          : "Erro ao obter dados do usuário";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Alias mais semântico solicitado (todo 39) para consultar /auth/v1/user
  async getCurrentAuthUser(): Promise<ApiResponse<AuthUser>> {
    return this.getCurrentUser();
  }

  getStoredToken(): string | null {
    return tokenStore.getAccessToken();
  }

  getStoredUser(): AuthUser | null {
    return tokenStore.getUser<AuthUser>();
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  clearLocalAuth(): void {
    tokenStore.clear();
    // Limpeza defensiva de resíduos legacy
    try {
      localStorage.removeItem(this.tokenKey);
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(this.userKey);
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(this.refreshTokenKey);
    } catch {
      /* ignore */
    }
  }

  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    try {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken)
        return { success: false, error: "Refresh token não encontrado" };

      // Usar fetch direto para garantir apikey + query param explicitamente
      const url = `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        const txt = await res.text();
        logger.warn("refresh token falhou", { status: res.status, body: txt });
        this.clearLocalAuth();
        return { success: false, error: "Erro ao renovar token" };
      }
      const data = (await res.json()) as LoginResponse;
      tokenStore.setTokens(data.access_token, data.refresh_token);
      tokenStore.setUser(data.user);
      return { success: true, data };
    } catch (error: unknown) {
      logger.error("erro ao renovar token", {
        error: (error as Error)?.message,
      });
      this.clearLocalAuth();
      return { success: false, error: "Erro ao renovar token" };
    }
  }

  // Verificar se o usuário logado é médico (tem registro na tabela doctors)
  async checkIsDoctor(
    userId: string
  ): Promise<
    ApiResponse<{ isDoctor: boolean; doctorId?: string; doctorData?: unknown }>
  > {
    try {
      logger.debug("verificando se usuário é médico", { userId });

      const response = await api.get(`/rest/v1/doctors`, {
        params: {
          user_id: `eq.${userId}`,
          select: "*",
        },
      });

      const doctors = response.data;
      const isDoctor = Array.isArray(doctors) && doctors.length > 0;

      if (isDoctor) {
        logger.debug("usuario é médico", { doctorId: doctors[0].id });
        return {
          success: true,
          data: {
            isDoctor: true,
            doctorId: doctors[0].id,
            doctorData: doctors[0],
          },
        };
      }

      logger.debug("usuario não é médico");
      return {
        success: true,
        data: { isDoctor: false },
      };
    } catch (error: unknown) {
      logger.error("erro ao verificar médico", {
        error: (error as Error)?.message,
      });
      return {
        success: false,
        error: "Erro ao verificar credenciais de médico",
      };
    }
  }
}

export const authService = new AuthService();
export default authService;
