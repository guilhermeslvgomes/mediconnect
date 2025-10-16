// Service de pacientes alinhado gradualmente com a especificação Supabase
// Ajuste: remover extensão .ts no import para evitar problemas em bundlers
import ENDPOINTS from "./endpoints";
import { http, ApiResponse } from "./http";
import type { components } from "../types/api";

// Tipos base alinhados com a UI atual
export interface EnderecoPaciente {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface Paciente {
  id: string; // id (uuid)
  nome: string; // full_name
  socialName?: string; // social_name
  email?: string; // email
  telefone?: string; // phone_mobile
  dataNascimento?: string; // birth_date (YYYY-MM-DD)
  sexo?: string; // sex (F/M/Outro)
  tipoSanguineo?: string; // blood_type
  pesoKg?: number; // weight_kg
  alturaM?: number; // height_m
  imc?: number; // bmi
  endereco?: EnderecoPaciente;
  cpf?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  // Campos legados mantidos para compatibilidade de UI antiga (TODO: remover quando migrar)
  convenio?: string;
  numeroCarteirinha?: string;
  observacoes?: string | null;
  vip?: boolean; // derivado de flags/tags legado
  avatar_url?: string;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_records: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CPFValidationResult {
  valido: boolean;
  existe: boolean;
  paciente_id: string | null;
}

export interface Anexo {
  id: string;
  nome: string;
  tipo?: string;
  tamanho?: number;
  categoria?: string;
  url?: string;
  uploaded_at?: string;
  uploaded_by?: string;
}

// Tipos gerados pelo OpenAPI
type PatientSchema = components["schemas"]["Patient"];
type PatientInputSchema = components["schemas"]["PatientInput"];

// Extensão local para tolerar variantes legadas ainda presentes em alguns retornos
interface PacienteApi extends Partial<PatientSchema> {
  nome?: string;
  phone?: string;
  data_nascimento?: string;
  altura?: number;
  peso?: number;
  observacoes?: string | null;
  convenio?: string;
  numeroCarteirinha?: string;
  numero_carteirinha?: string;
  tags?: Array<string | { name?: string }>;
  categoria?: string;
  category?: string;
  vip?: boolean | string | number;
  is_vip?: boolean | string | number;
  vip_status?: boolean | string | number;
  avatar_url?: string;
}

const TRUTHY_STRINGS = new Set(["true", "1", "yes", "sim", "vip", "ativo"]);

const isTruthyValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return TRUTHY_STRINGS.has(normalized);
  }
  return false;
};

const extractVipFlag = (paciente: PacienteApi): boolean => {
  if (isTruthyValue(paciente.vip)) return true;
  if (isTruthyValue((paciente as { is_vip?: unknown }).is_vip)) return true;
  if (isTruthyValue((paciente as { vip_status?: unknown }).vip_status))
    return true;
  if (isTruthyValue((paciente as { categoria?: unknown }).categoria))
    return true;
  if (isTruthyValue((paciente as { category?: unknown }).category)) return true;
  const tags = (paciente as { tags?: unknown }).tags;
  if (Array.isArray(tags)) {
    return tags.some((tag) => {
      if (typeof tag === "string") {
        return isTruthyValue(tag);
      }
      if (tag && typeof tag === "object" && "name" in tag) {
        return isTruthyValue((tag as { name?: unknown }).name);
      }
      return false;
    });
  }
  return false;
};

// Helpers de mapeamento entre a API e o app
function mapPacienteFromApi(p: PacienteApi): Paciente {
  return {
    id: p.id || "",
    nome: p.full_name || p.nome || "",
    socialName: p.social_name ?? undefined,
    email: p.email,
    telefone: p.phone_mobile || p.phone,
    dataNascimento: p.birth_date || p.data_nascimento,
    sexo: p.sex ?? undefined,
    tipoSanguineo: p.blood_type ?? undefined,
    pesoKg: p.weight_kg ?? p.peso ?? undefined,
    alturaM: p.height_m ?? p.altura ?? undefined,
    imc: p.bmi ?? undefined,
    endereco: {
      rua: p.street ?? undefined,
      numero: p.number ?? undefined,
      complemento: p.complement ?? undefined,
      bairro: p.neighborhood ?? undefined,
      cidade: p.city ?? undefined,
      estado: p.state ?? undefined,
      cep: p.cep ?? undefined,
    },
    cpf: p.cpf,
    created_at: p.created_at,
    updated_at: p.updated_at,
    created_by: p.created_by,
    convenio: p.convenio,
    numeroCarteirinha: p.numeroCarteirinha || p.numero_carteirinha,
    observacoes: p.observacoes || null,
    vip: extractVipFlag(p),
    avatar_url: p.avatar_url,
  };
}

// Removido fallback local: somente dados reais da API serão usados.

// Lista pacientes (paginado)
export interface PacienteListResponse {
  data: Paciente[];
  total: number;
  page: number;
  per_page: number;
  fromCache?: boolean;
}

export async function listPatients(params?: {
  page?: number;
  per_page?: number;
  search?: string; // TODO: implementar filtro server-side (ilike)
  userId?: string; // Filtrar por médico/profissional atribuído
}): Promise<PacienteListResponse> {
  const page = params?.page ?? 1;
  // Pagination server-side ainda não implementada na API; retornamos tudo.
  try {
    const endpointTried: string[] = [];
    let raw: PacienteApi[] = [];

    // Se userId fornecido, buscar via patient_assignments
    if (params?.userId) {
      try {
        // 1. Buscar atribuições do médico
        const { listAssignments } = await import("./patientAssignmentService");
        const assignmentsResult = await listAssignments({
          userId: params.userId,
          role: "medico",
        });

        if (assignmentsResult.success && assignmentsResult.data) {
          const patientIds = assignmentsResult.data
            .map((a) => a.patientId)
            .filter((id): id is string => !!id);

          console.log(
            `[PacienteService] Encontradas ${patientIds.length} atribuições para médico ${params.userId}`
          );

          if (patientIds.length > 0) {
            // 2. Buscar detalhes dos pacientes atribuídos
            const patientsPromises = patientIds.map(async (patientId) => {
              try {
                const response = await http.get<PacienteApi>(
                  `${ENDPOINTS.PATIENTS}?id=eq.${patientId}`,
                  { params: { select: "*" } }
                );
                if (response.success && response.data) {
                  const data = response.data as
                    | PacienteApi[]
                    | { data?: PacienteApi[] };
                  const patients = Array.isArray(data)
                    ? data
                    : (data as { data?: PacienteApi[] }).data || [];
                  return patients[0];
                }
              } catch (e) {
                console.error(`Erro ao buscar paciente ${patientId}:`, e);
              }
              return null;
            });

            const patientsResults = await Promise.all(patientsPromises);
            raw = patientsResults.filter((p): p is PacienteApi => p !== null);

            console.log(
              `[PacienteService] ${raw.length} pacientes carregados com sucesso`
            );
          } else {
            console.warn(
              `[PacienteService] Médico ${params.userId} não tem pacientes atribuídos`
            );
            return { data: [], total: 0, page: 1, per_page: 0 };
          }
        }
      } catch (e) {
        console.error("Erro ao buscar pacientes por atribuição:", e);
        // Fallback: buscar todos os pacientes
      }
    }

    // Se não tem userId ou falhou, buscar todos os pacientes (comportamento original)
    if (raw.length === 0) {
      const candidates = [ENDPOINTS.PATIENTS];
      for (const ep of candidates) {
        try {
          const response = await http.get<
            PacienteApi[] | { data?: PacienteApi[] }
          >(ep, { params: { select: "*" } });
          endpointTried.push(ep);
          if (response.success && response.data) {
            const data = response.data as
              | PacienteApi[]
              | { data?: PacienteApi[] };
            raw = Array.isArray(data)
              ? data
              : (data as { data?: PacienteApi[] }).data || [];
            if (raw.length) break;
          }
        } catch (e1) {
          const err1 = e1 as { response?: { status?: number } };
          endpointTried.push(
            `${ep} (erro${
              err1?.response?.status ? ` status=${err1.response.status}` : ""
            })`
          );
        }
      }
    }

    let mapped = raw.map(mapPacienteFromApi);
    if (params?.search) {
      const q = params.search.toLowerCase();
      mapped = mapped.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.cpf?.includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    const total = mapped.length;
    if (!total && !params?.userId) {
      console.warn(
        `[PacienteService] Nenhum paciente retornado. Tentados: ${endpointTried.join(
          " -> "
        )}`
      );
    }
    return { data: mapped, total, page, per_page: total };
  } catch (e) {
    console.error("Falha ao obter pacientes remotamente.", e);
    return { data: [], total: 0, page: 1, per_page: 0 };
  }
}

// Buscar paciente por ID
export async function getPatientById(
  id: string
): Promise<ApiResponse<Paciente>> {
  if (!id) return { success: false, error: "ID é obrigatório" };
  try {
    let data: PacienteApi | undefined;
    try {
      const respPath = await http.get<PacienteApi | PacienteApi[]>(
        `${ENDPOINTS.PATIENTS}/${encodeURIComponent(id)}`
      );
      if (respPath.success && respPath.data) {
        const raw = Array.isArray(respPath.data)
          ? respPath.data[0]
          : respPath.data;
        data = raw;
      }
    } catch {
      // ignora
    }
    if (!data) {
      const respQuery = await http.get<PacienteApi[] | PacienteApi>(
        ENDPOINTS.PATIENTS,
        { params: { id: `eq.${id}`, select: "*" } }
      );
      if (respQuery.success && respQuery.data) {
        if (Array.isArray(respQuery.data)) data = respQuery.data[0];
        else data = respQuery.data;
      }
    }
    if (!data) return { success: false, error: "Paciente não encontrado" };
    return { success: true, data: mapPacienteFromApi(data) };
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: { message?: string } };
    };
    let msg = "Erro ao buscar paciente";
    if (err.response?.status === 404) msg = "Paciente não encontrado";
    else if (err.response?.status === 401) msg = "Não autorizado";
    else if (err.response?.data?.message) msg = err.response.data.message;
    console.error(msg, error);
    return { success: false, error: msg };
  }
}

// Criar novo paciente

export async function createPatient(payload: {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento?: string;
  socialName?: string;
  sexo?: string;
  tipoSanguineo?: string;
  pesoKg?: number;
  alturaM?: number;
  endereco?: EnderecoPaciente;
}): Promise<ApiResponse<Paciente>> {
  // Sanitização forte
  const rawCpf = (payload.cpf || "").replace(/\D/g, "").slice(0, 11);
  let phone = (payload.telefone || "").replace(/\D/g, "");
  if (phone.length > 15) phone = phone.slice(0, 15);
  const cleanEndereco: EnderecoPaciente | undefined = payload.endereco
    ? { ...payload.endereco, cep: payload.endereco.cep?.replace(/\D/g, "") }
    : undefined;
  const peso =
    typeof payload.pesoKg === "number" &&
    payload.pesoKg > 0 &&
    payload.pesoKg < 500
      ? payload.pesoKg
      : undefined;
  const altura =
    typeof payload.alturaM === "number" &&
    payload.alturaM > 0 &&
    payload.alturaM < 3
      ? payload.alturaM
      : undefined;

  if (!payload.nome?.trim())
    return { success: false, error: "Nome é obrigatório" };
  if (!rawCpf) return { success: false, error: "CPF é obrigatório" };
  if (!payload.email?.trim())
    return { success: false, error: "Email é obrigatório" };
  if (!phone) return { success: false, error: "Telefone é obrigatório" };

  const buildBody = (cpfValue: string): Partial<PatientInputSchema> => ({
    full_name: payload.nome,
    cpf: cpfValue,
    email: payload.email,
    phone_mobile: phone,
    birth_date: payload.dataNascimento,
    social_name: payload.socialName,
    sex: payload.sexo,
    blood_type: payload.tipoSanguineo,
    weight_kg: peso,
    height_m: altura,
    street: cleanEndereco?.rua,
    number: cleanEndereco?.numero,
    complement: cleanEndereco?.complemento,
    neighborhood: cleanEndereco?.bairro,
    city: cleanEndereco?.cidade,
    state: cleanEndereco?.estado,
    cep: cleanEndereco?.cep,
  });

  let body: Partial<PatientInputSchema> = buildBody(rawCpf);
  const prune = () => {
    Object.keys(body).forEach((k) => {
      const v = (body as Record<string, unknown>)[k];
      if (v === undefined || v === "")
        delete (body as Record<string, unknown>)[k];
    });
  };
  prune();

  const attempt = async (): Promise<ApiResponse<Paciente>> => {
    const response = await http.post<PacienteApi | PacienteApi[]>(
      ENDPOINTS.PATIENTS,
      body,
      { headers: { Prefer: "return=representation" } }
    );
    if (response.success && response.data) {
      const raw = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      return { success: true, data: mapPacienteFromApi(raw) };
    }
    return {
      success: false,
      error: response.error || "Erro ao criar paciente",
    };
  };

  const handleOverflowFallbacks = async (
    baseError: string
  ): Promise<ApiResponse<Paciente>> => {
    // 1) tentar com CPF formatado
    if (/numeric field overflow/i.test(baseError) && rawCpf.length === 11) {
      body = buildBody(
        rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      );
      prune();
      let r = await attempt();
      if (r.success) return r;
      // 2) remover campos opcionais progressivamente
      const optional: Array<keyof PatientInputSchema> = [
        "weight_kg",
        "height_m",
        "blood_type",
        "cep",
        "number",
      ];
      for (const key of optional) {
        if (key in body) {
          delete (body as Record<string, unknown>)[key];
          r = await attempt();
          if (r.success) return r;
        }
      }
      return r; // retorna último erro
    }
    return { success: false, error: baseError };
  };

  try {
    let first = await attempt();
    if (!first.success && /numeric field overflow/i.test(first.error || "")) {
      first = await handleOverflowFallbacks(
        first.error || "numeric field overflow"
      );
    }
    return first;
  } catch (err: unknown) {
    const e = err as {
      response?: { status?: number; data?: { message?: string } };
    };
    let msg = "Erro ao criar paciente";
    if (e.response?.status === 401) msg = "Não autorizado";
    else if (e.response?.status === 400)
      msg = e.response.data?.message || "Dados inválidos";
    else if (e.response?.data?.message) msg = e.response.data.message;
    if (/numeric field overflow/i.test(msg)) {
      const overflowAttempt = await handleOverflowFallbacks(msg);
      return overflowAttempt;
    }
    return { success: false, error: msg };
  }
}

// Atualizar paciente
export async function updatePatient(
  id: string,
  updates: {
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
    dataNascimento?: string;
    socialName?: string;
    sexo?: string;
    tipoSanguineo?: string;
    pesoKg?: number;
    alturaM?: number;
    endereco?: EnderecoPaciente;
  }
): Promise<ApiResponse<Paciente>> {
  if (!id) return { success: false, error: "ID é obrigatório" };
  const cleanCpf = (updates.cpf || "").replace(/\D/g, "");
  const cleanPhone = (updates.telefone || "").replace(/\D/g, "");
  const cleanEndereco: EnderecoPaciente | undefined = updates.endereco
    ? { ...updates.endereco, cep: updates.endereco.cep?.replace(/\D/g, "") }
    : undefined;
  // Remover validações rígidas que podem bloquear atualizações parciais
  // A API fará as validações necessárias
  const body: Partial<PatientInputSchema> = {
    full_name: updates.nome,
    cpf: cleanCpf,
    email: updates.email,
    phone_mobile: cleanPhone,
    birth_date: updates.dataNascimento,
    social_name: updates.socialName,
    sex: updates.sexo,
    blood_type: updates.tipoSanguineo,
    weight_kg: updates.pesoKg,
    height_m: updates.alturaM,
    street: cleanEndereco?.rua,
    number: cleanEndereco?.numero,
    complement: cleanEndereco?.complemento,
    neighborhood: cleanEndereco?.bairro,
    city: cleanEndereco?.cidade,
    state: cleanEndereco?.estado,
    cep: cleanEndereco?.cep,
  };
  Object.keys(body).forEach((k) => {
    const v = (body as Record<string, unknown>)[k];
    if (v === undefined || v === "")
      delete (body as Record<string, unknown>)[k];
  });
  try {
    const resp = await http.patch<PacienteApi | PacienteApi[]>(
      `${ENDPOINTS.PATIENTS}?id=eq.${id}`,
      body,
      {
        headers: { Prefer: "return=representation" },
      }
    );
    if (!resp.success || !resp.data)
      return { success: false, error: resp.error || "Paciente não retornado" };
    const raw = Array.isArray(resp.data) ? resp.data[0] : resp.data;
    if (!raw) return { success: false, error: "Paciente não retornado" };
    return { success: true, data: mapPacienteFromApi(raw) };
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: { message?: string } };
    };
    let msg = "Erro ao atualizar paciente";
    if (err.response?.status === 404) msg = "Paciente não encontrado";
    else if (err.response?.status === 401) msg = "Não autorizado";
    else if (err.response?.data?.message) msg = err.response.data.message;
    console.error(msg, error);
    return { success: false, error: msg };
  }
}

// Excluir paciente
export async function deletePatient(id: string): Promise<ApiResponse<void>> {
  if (!id) return { success: false, error: "ID é obrigatório" };
  try {
    console.log("[deletePatient] Tentando deletar paciente:", id);
    console.log(
      "[deletePatient] Endpoint:",
      `${ENDPOINTS.PATIENTS}?id=eq.${encodeURIComponent(id)}`
    );

    // Supabase REST API DELETE usa query params com filtro
    // Formato: /rest/v1/patients?id=eq.<uuid>
    // É necessário adicionar header Prefer: return=representation ou return=minimal
    const resp = await http.delete<unknown>(
      `${ENDPOINTS.PATIENTS}?id=eq.${encodeURIComponent(id)}`,
      {
        headers: {
          Prefer: "return=minimal",
        },
      }
    );

    console.log("[deletePatient] Resposta:", resp);

    if (!resp.success) {
      console.error("[deletePatient] Falha ao deletar:", resp.error);
      return {
        success: false,
        error: resp.error || "Falha ao deletar paciente",
      };
    }
    console.log("[deletePatient] Paciente deletado com sucesso");
    return { success: true };
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status?: number;
        data?: {
          message?: string;
          hint?: string;
          details?: string;
          error?: string;
        };
      };
    };
    let msg = "Erro ao deletar paciente";
    const status = err.response?.status;
    const errorData = err.response?.data;

    console.error("[deletePatient] Erro capturado:", {
      status,
      message: errorData?.message,
      hint: errorData?.hint,
      details: errorData?.details,
      error: errorData?.error,
      fullError: error,
    });

    if (status === 404) msg = "Paciente não encontrado";
    else if (status === 401) msg = "Não autorizado - faça login novamente";
    else if (status === 403)
      msg = "Acesso negado - você não tem permissão para excluir pacientes";
    else if (status === 406) msg = "Formato de requisição inválido";
    else if (errorData?.error) msg = errorData.error;
    else if (errorData?.message) msg = errorData.message;
    else if (errorData?.hint) msg = `${msg}: ${errorData.hint}`;

    console.error("[deletePatient]", msg, error);
    return { success: false, error: msg };
  }
}

// Upload de foto do paciente
interface UploadFotoResponse {
  foto_url?: string;
  thumbnail_url?: string;
  data?: { foto_url?: string; thumbnail_url?: string };
}
export async function uploadPatientPhoto(
  id: string,
  file: File | Blob
): Promise<{ foto_url?: string; thumbnail_url?: string }> {
  const form = new FormData();
  form.append("foto", file);
  const response = await http.post<
    UploadFotoResponse | { data?: UploadFotoResponse }
  >(`/auth/v1/pacientes/${encodeURIComponent(id)}/foto`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (response.success && response.data) {
    const payload = response.data as
      | UploadFotoResponse
      | { data?: UploadFotoResponse };
    const embedded = (payload as { data?: UploadFotoResponse }).data;
    const d: UploadFotoResponse = embedded
      ? embedded
      : (payload as UploadFotoResponse);
    return { foto_url: d.foto_url, thumbnail_url: d.thumbnail_url };
  }
  throw new Error(response.error || "Falha no upload de foto");
}

// Remover foto do paciente
export async function removePatientPhoto(id: string): Promise<void> {
  const resp = await http.delete(
    `/auth/v1/pacientes/${encodeURIComponent(id)}/foto`
  );
  if (!resp.success) throw new Error(resp.error || "Falha ao remover foto");
}

// Listar anexos do paciente
type AnexoListResponse = { data?: Anexo[]; list?: Anexo[] } | Anexo[];
export async function listPatientAttachments(id: string): Promise<Anexo[]> {
  const response = await http.get<AnexoListResponse>(
    `/auth/v1/pacientes/${encodeURIComponent(id)}/anexos`
  );
  if (!response.success) return [];
  const d = Array.isArray(response.data)
    ? response.data
    : response.data?.data || response.data?.list || [];
  const data = d;
  return Array.isArray(data) ? data : [];
}

// Adicionar anexo ao paciente
interface AddAnexoResponse {
  data?: Anexo;
  id?: string;
  nome?: string;
  url?: string;
}
export async function addPatientAttachment(
  id: string,
  file: File | Blob
): Promise<Anexo> {
  const form = new FormData();
  form.append("arquivo", file);
  const response = await http.post<AddAnexoResponse | { data?: Anexo }>(
    `/auth/v1/pacientes/${encodeURIComponent(id)}/anexos`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  if (!response.success)
    throw new Error(response.error || "Falha ao adicionar anexo");
  if (!response.data) throw new Error("Resposta inválida do servidor");
  const base = (response.data as AddAnexoResponse).data || response.data;
  return base as Anexo;
}

// Remover anexo do paciente
export async function removePatientAttachment(
  id: string,
  anexoId: string
): Promise<void> {
  const resp = await http.delete(
    `/pacientes/${encodeURIComponent(id)}/anexos/${encodeURIComponent(anexoId)}`
  );
  if (!resp.success) throw new Error(resp.error || "Falha ao remover anexo");
}

// Validar CPF
interface ValidarCpfPayload {
  data?: { valido?: boolean; existe?: boolean; paciente_id?: string | null };
  valido?: boolean;
  existe?: boolean;
  paciente_id?: string | null;
}
export async function validateCPF(cpf: string): Promise<CPFValidationResult> {
  const response = await http.post<ValidarCpfPayload>(
    "/pacientes/validar-cpf",
    { cpf }
  );
  if (!response.success || !response.data) {
    return { valido: false, existe: false, paciente_id: null };
  }
  const payload = response.data.data || response.data;
  return {
    valido: !!payload.valido,
    existe: !!payload.existe,
    paciente_id: payload.paciente_id ?? null,
  };
}

// CEP: manter via ViaCEP (não usar o mock)
export async function buscarEnderecoViaCEP(
  cep: string
): Promise<EnderecoPaciente | null> {
  const clean = (cep || "").replace(/\D/g, "");
  if (clean.length !== 8) return null;
  const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!resp.ok) return null;
  const d = await resp.json();
  if (d.erro) return null;
  return {
    cep: d.cep,
    rua: d.logradouro,
    bairro: d.bairro,
    cidade: d.localidade,
    estado: d.uf,
  };
}

export default {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  uploadPatientPhoto,
  removePatientPhoto,
  listPatientAttachments,
  addPatientAttachment,
  removePatientAttachment,
  validateCPF,
  buscarEnderecoViaCEP,
};
