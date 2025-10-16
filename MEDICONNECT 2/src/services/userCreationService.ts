import { http, type ApiResponse } from "./http";
import authService, { type LoginResponse } from "./authService";
import ENDPOINTS from "./endpoints";
import medicoService, {
  type MedicoCreate,
  type MedicoDetalhado,
} from "./medicoService";
import { createPatient } from "./pacienteService";
import { assignUserRole } from "./userRoleService";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig";

/**
 * Serviço de criação de usuários de domínio (médico, secretaria, paciente, admin/gestor) encapsulando:
 * 1. Signup (Supabase Auth) -> user.id
 * 2. Profile (opcional) -> /rest/v1/profiles
 * 3. Role principal -> /rest/v1/user_roles
 * 4. Registro em tabela de domínio (ex: doctors, patients) quando aplicável
 */

export interface CreateBaseUserInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface CreateDoctorInput
  extends CreateBaseUserInput,
    Omit<MedicoCreate, "email" | "password" | "nome" | "telefone"> {
  nome: string; // alias para full_name e doctor.nome
  telefone: string; // phone_mobile
  especialidade: string;
  crm: string;
  crmUf: string;
}

export interface CreateSecretaryInput extends CreateBaseUserInput {
  nome: string; // full_name / profile.full_name
  telefone?: string;
}

export interface CreatePatientUserInput extends CreateBaseUserInput {
  nome: string;
  telefone: string;
  cpf: string;
  dataNascimento?: string;
}

export interface CreateResult<T = unknown> {
  userId: string;
  email: string;
  role: string;
  profileId?: string;
  domainRecord?: T;
}

interface ProfileApi {
  id?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

async function insertProfile(
  userId: string,
  profile: { full_name?: string; phone?: string; avatar_url?: string }
): Promise<string | undefined> {
  const body: Record<string, unknown> = { id: userId, ...profile };
  Object.keys(body).forEach((k) => {
    if (body[k] === undefined || body[k] === "") delete body[k];
  });
  const resp = await http.post<ProfileApi | ProfileApi[]>(
    ENDPOINTS.PROFILES,
    body,
    { headers: { Prefer: "return=representation" } }
  );
  if (!resp.success || !resp.data) return undefined;
  const raw = Array.isArray(resp.data) ? resp.data[0] : resp.data;
  return raw?.id || userId;
}

async function signup(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  // Reutiliza authService.login se signup não estiver exposto; se /auth/v1/signup existir, trocar por chamada direta.
  try {
    // Supabase: POST /auth/v1/signup { email, password }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: txt || "Falha no signup" };
    }
    await res.json(); // descartado; faremos login na sequência
    // A resposta de signup pode não incluir refresh_token; para garantir sessão usamos login.
    const login = await authService.login({ email, password });
    if (!login.success || !login.data) return login;
    return login;
  } catch {
    return { success: false, error: "Erro inesperado no signup" };
  }
}

// Tenta usar a edge function centralizada /functions/v1/create-user.
// Se falhar (404 ou erro), volta para fluxo manual (signup + profile + role).
interface EdgeCreateUserBody {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: "admin" | "gestor" | "medico" | "secretaria" | "user";
}
interface EdgeCreateUserResponse {
  success?: boolean;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    phone?: string | null;
    role?: string;
  };
  error?: string;
}

async function tryEdgeCreateUser(
  body: EdgeCreateUserBody
): Promise<EdgeCreateUserResponse | null> {
  const url = `${SUPABASE_URL}/functions/v1/create-user`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          ""
        }`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return null; // função não existente => fallback
    const json = (await res.json()) as EdgeCreateUserResponse;
    if (!res.ok) {
      // 400/401/403/500 => se explicitamente proibido, retornamos json com error para evitar fluxo manual silencioso
      if (res.status === 401 || res.status === 403) return json; // sem permissão -> não adianta fallback manual
      // outros erros: permitir fallback manual retornando null
      return null;
    }
    return json;
  } catch {
    return null;
  }
}

export async function createDoctorUser(
  input: CreateDoctorInput
): Promise<ApiResponse<CreateResult<MedicoDetalhado>>> {
  // 0. Tentar edge function unificada
  const edgeAttempt = await tryEdgeCreateUser({
    email: input.email,
    password: input.password,
    full_name: input.nome,
    phone: input.telefone,
    role: "medico",
  });
  if (edgeAttempt) {
    if (!edgeAttempt.success || !edgeAttempt.user) {
      if (edgeAttempt.error)
        return { success: false, error: edgeAttempt.error };
      return { success: false, error: "Falha create-user edge" };
    }
    // Edge cria usuário + role; precisamos ainda criar registro em doctors
    const medicoPayload = {
      nome: input.nome,
      email: input.email,
      crm: input.crm,
      crmUf: String(input.crmUf),
      especialidade: input.especialidade,
      telefone: input.telefone,
      status: "ativo",
    };
    const medicoResp = await medicoService.criarMedico({
      ...medicoPayload,
      status: "ativo",
    });
    if (!medicoResp.success || !medicoResp.data)
      return {
        success: false,
        error: medicoResp.error || "Falha ao criar médico",
      };
    return {
      success: true,
      data: {
        userId: edgeAttempt.user.id,
        email: input.email,
        role: "medico",
        domainRecord: medicoResp.data,
      },
    };
  }
  // 1. Signup manual
  const signupResp = await signup(input.email, input.password);
  if (!signupResp.success || !signupResp.data)
    return { success: false, error: signupResp.error || "Signup falhou" };
  const userId = signupResp.data.user.id;

  // 2. Profile
  const profileId = await insertProfile(userId, {
    full_name: input.nome,
    phone: input.telefone,
  });

  // 3. Role
  const roleResp = await assignUserRole(userId, "medico");
  if (!roleResp.success)
    return {
      success: false,
      error: roleResp.error || "Falha ao atribuir role medico",
    };

  // 4. Registro em doctors
  const medicoPayload = {
    nome: input.nome,
    email: input.email,
    crm: input.crm,
    crmUf: String(input.crmUf),
    especialidade: input.especialidade,
    telefone: input.telefone,
    status: "ativo",
  };
  const medicoResp = await medicoService.criarMedico({
    ...medicoPayload,
    status: "ativo",
  });
  if (!medicoResp.success || !medicoResp.data)
    return {
      success: false,
      error: medicoResp.error || "Falha ao criar médico",
    };

  return {
    success: true,
    data: {
      userId,
      email: input.email,
      role: "medico",
      profileId,
      domainRecord: medicoResp.data,
    },
  };
}

export async function createSecretaryUser(
  input: CreateSecretaryInput
): Promise<ApiResponse<CreateResult>> {
  const edgeAttempt = await tryEdgeCreateUser({
    email: input.email,
    password: input.password,
    full_name: input.nome,
    phone: input.telefone,
    role: "secretaria",
  });
  if (edgeAttempt) {
    if (!edgeAttempt.success || !edgeAttempt.user) {
      if (edgeAttempt.error)
        return { success: false, error: edgeAttempt.error };
      return { success: false, error: "Falha create-user edge" };
    }
    return {
      success: true,
      data: {
        userId: edgeAttempt.user.id,
        email: input.email,
        role: "secretaria",
      },
    };
  }
  const signupResp = await signup(input.email, input.password);
  if (!signupResp.success || !signupResp.data)
    return { success: false, error: signupResp.error || "Signup falhou" };
  const userId = signupResp.data.user.id;
  const profileId = await insertProfile(userId, {
    full_name: input.nome,
    phone: input.telefone,
  });
  const roleResp = await assignUserRole(userId, "secretaria");
  if (!roleResp.success)
    return {
      success: false,
      error: roleResp.error || "Falha ao atribuir role secretaria",
    };
  return {
    success: true,
    data: { userId, email: input.email, role: "secretaria", profileId },
  };
}

export async function createPatientUser(
  input: CreatePatientUserInput
): Promise<ApiResponse<CreateResult>> {
  // Edge function ainda não aceita 'paciente' como role (não listada), usar fluxo manual direto
  const signupResp = await signup(input.email, input.password);
  if (!signupResp.success || !signupResp.data)
    return { success: false, error: signupResp.error || "Signup falhou" };
  const userId = signupResp.data.user.id;
  await insertProfile(userId, { full_name: input.nome, phone: input.telefone });
  const roleResp = await assignUserRole(userId, "paciente");
  if (!roleResp.success)
    return {
      success: false,
      error: roleResp.error || "Falha ao atribuir role paciente",
    };
  const pacResp = await createPatient({
    nome: input.nome,
    cpf: input.cpf,
    email: input.email,
    telefone: input.telefone,
    dataNascimento: input.dataNascimento,
  });
  if (!pacResp.success || !pacResp.data)
    return {
      success: false,
      error: pacResp.error || "Falha ao criar paciente",
    };
  return {
    success: true,
    data: {
      userId,
      email: input.email,
      role: "paciente",
      domainRecord: pacResp.data,
    },
  };
}

// TODO futura: createAdminUser / createGestorUser (segue mesmo padrão)

export default {
  createDoctorUser,
  createSecretaryUser,
  createPatientUser,
};
