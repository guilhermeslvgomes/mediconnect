import api from "./api";
import { ApiResponse } from "./http";

export type UserRole = "admin" | "gestor" | "medico" | "secretaria" | "user";

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
}

export interface CreateUserResponse {
  success: boolean;
  user?: User;
}

class UserService {
  /**
   * Cria um novo usuário no sistema
   * Requer autenticação com papel de admin, gestor ou secretaria
   */
  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      console.log("[userService] Criando usuário:", {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      });

      const response = await api.post<CreateUserResponse>(
        "/functions/v1/create-user",
        data
      );

      console.log("[userService] Resposta:", response.data);

      if (response.data.success && response.data.user) {
        return {
          success: true,
          data: response.data.user,
        };
      }

      return {
        success: false,
        error: "Falha ao criar usuário",
      };
    } catch (error: unknown) {
      console.error("[userService] Erro ao criar usuário:", error);

      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao criar usuário";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Cria usuário médico com validações específicas
   */
  async createMedico(data: {
    email: string;
    password: string;
    nome: string;
    telefone?: string;
  }): Promise<ApiResponse<User>> {
    return this.createUser({
      email: data.email,
      password: data.password,
      full_name: data.nome,
      phone: data.telefone || null,
      role: "medico",
    });
  }

  /**
   * Cria usuário secretaria com validações específicas
   */
  async createSecretaria(data: {
    email: string;
    password: string;
    nome: string;
    telefone?: string;
  }): Promise<ApiResponse<User>> {
    return this.createUser({
      email: data.email,
      password: data.password,
      full_name: data.nome,
      phone: data.telefone || null,
      role: "secretaria",
    });
  }

  /**
   * Cria usuário paciente (requer autenticação de admin/secretária)
   */
  async createPaciente(data: {
    email: string;
    password: string;
    nome: string;
    telefone?: string;
  }): Promise<ApiResponse<User>> {
    return this.createUser({
      email: data.email,
      password: data.password,
      full_name: data.nome,
      phone: data.telefone || null,
      role: "user", // Pacientes tem role "user"
    });
  }

  /**
   * Cadastro público de paciente usando endpoint nativo do Supabase
   * Não requer autenticação prévia
   */
  async signupPaciente(data: {
    email: string;
    password: string;
    nome: string;
    telefone?: string;
    cpf?: string;
    dataNascimento?: string;
    endereco?: {
      cep?: string;
      rua?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
    };
  }): Promise<ApiResponse<{ id: string; email: string }>> {
    try {
      console.log("[userService] Cadastro público de paciente:", {
        email: data.email,
        nome: data.nome,
      });

      // Usar endpoint público de signup do Supabase
      const response = await api.post("/auth/v1/signup", {
        email: data.email,
        password: data.password,
        data: {
          full_name: data.nome,
          phone: data.telefone,
          cpf: data.cpf,
          data_nascimento: data.dataNascimento,
          endereco: data.endereco,
          role: "paciente", // Define role como paciente
        },
      });

      console.log(
        "[userService] Paciente cadastrado via signup:",
        response.data
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("[userService] Erro no signup de paciente:", error);

      const err = error as {
        response?: {
          data?: {
            error?: string;
            error_description?: string;
            message?: string;
          };
        };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error_description ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao cadastrar paciente";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const userService = new UserService();
export default userService;
