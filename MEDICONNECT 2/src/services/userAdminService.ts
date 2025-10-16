import api from "./api";

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: "admin" | "gestor" | "medico" | "secretaria" | "user";
}

export interface CreatedUser {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string | null;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function validateEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function createUser(
  input: CreateUserInput
): Promise<ApiResponse<CreatedUser>> {
  if (!input.email?.trim())
    return { success: false, error: "Email é obrigatório" };
  if (!validateEmail(input.email))
    return { success: false, error: "Email inválido" };
  if (!input.password || input.password.length < 6)
    return { success: false, error: "Senha deve ter pelo menos 6 caracteres" };
  if (!input.full_name?.trim())
    return { success: false, error: "Nome completo é obrigatório" };
  if (!input.role) return { success: false, error: "Role é obrigatória" };

  const body: Record<string, unknown> = {
    email: input.email.trim(),
    password: input.password,
    full_name: input.full_name.trim(),
    phone: input.phone ?? null,
    role: input.role,
  };

  try {
    const resp = await api.post("/functions/v1/create-user", body);
    const data = resp.data?.user || resp.data?.data || resp.data;
    if (!data || !data.id)
      return { success: false, error: "Resposta inesperada da API" };
    return {
      success: true,
      data: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
      },
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: { message?: string } };
    };
    let msg = "Erro ao criar usuário";
    if (err.response?.status === 400)
      msg = err.response.data?.message || "Dados inválidos";
    else if (err.response?.status === 401) msg = "Não autorizado";
    else if (err.response?.status === 403) msg = "Acesso negado";
    else if (err.response?.data?.message) msg = err.response.data.message;
    console.error(msg, error);
    return { success: false, error: msg };
  }
}

export default { createUser };
