export interface Medico {
  id: string;
  nome: string;
  email: string;
  crm: string;
  especialidade: string;
  telefone: string;
  status: "ativo" | "inativo";
  created_at?: string;
  updated_at?: string;
}
// Modelo detalhado estendido com campos adicionais da API
export interface MedicoDetalhado extends Medico {
  crmUf?: string;
  cpf?: string;
  telefone2?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  dataNascimento?: string;
  rg?: string;
  active?: boolean;
  createdBy?: string;
  updatedBy?: string | null;
}
import ENDPOINTS from "./endpoints";
import { http, ApiResponse } from "./http";

// Tipo para resposta bruta da API Apidog
export interface MedicoApi {
  id: string;
  user_id?: string;
  crm?: string;
  crm_uf?: string;
  specialty?: string;
  full_name?: string;
  cpf?: string;
  email?: string;
  phone_mobile?: string;
  phone2?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  birth_date?: string;
  rg?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string | null;
  nome?: string;
  especialidade?: string;
  telefone?: string;
  status?: "ativo" | "inativo";
}

// Campos de criação alinhados com especificação ampliada da API (tabela doctors)
// Observação: password NÃO deve ser enviada para a tabela doctors diretamente em produção;
// a criação de credenciais pertence ao fluxo de auth (/auth/v1/signup ou equivalente).
export interface MedicoCreate {
  nome: string; // full_name
  email: string; // email
  crm: string; // crm
  crmUf: string; // crm_uf (REQUIRED)
  cpf: string; // cpf (REQUIRED)
  especialidade: string; // specialty
  telefone: string; // phone_mobile
  telefone2?: string; // phone2
  cep: string; // cep (REQUIRED)
  rua: string; // street (REQUIRED)
  numero: string; // number (REQUIRED)
  complemento?: string; // complement
  bairro: string; // neighborhood (REQUIRED)
  cidade: string; // city (REQUIRED)
  estado: string; // state (REQUIRED)
  dataNascimento: string; // birth_date (YYYY-MM-DD) (REQUIRED)
  rg?: string; // rg
  status?: "ativo" | "inativo"; // mapeado para active
}

export interface MedicoUpdate {
  nome?: string;
  email?: string;
  crm?: string;
  crmUf?: string;
  cpf?: string;
  especialidade?: string;
  telefone?: string;
  telefone2?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  dataNascimento?: string;
  rg?: string;
  status?: "ativo" | "inativo";
}

export interface MedicoListResponse {
  data: Medico[];
  total: number;
  page: number;
  per_page: number;
}

// Removido fallback local (localStorage) — somente dados reais da API agora.

function mapApiMedico(m: MedicoApi): MedicoDetalhado {
  return {
    id: m.id,
    nome: m.full_name || m.nome || "",
    especialidade: m.specialty || m.especialidade || "",
    crm: m.crm || "",
    telefone: m.phone_mobile || m.telefone || "",
    email: m.email || "",
    status: m.active ? "ativo" : "inativo",
    created_at: m.created_at,
    updated_at: m.updated_at,
    // extended
    crmUf: m.crm_uf,
    cpf: m.cpf,
    telefone2: m.phone2,
    cep: m.cep,
    rua: m.street,
    numero: m.number,
    complemento: m.complement,
    bairro: m.neighborhood,
    cidade: m.city,
    estado: m.state,
    dataNascimento: m.birth_date,
    rg: m.rg,
    active: m.active,
    createdBy: m.created_by,
    updatedBy: m.updated_by ?? null,
  };
}

class MedicoService {
  async listarMedicos(params?: {
    page?: number;
    per_page?: number;
    status?: "ativo" | "inativo";
    especialidade?: string;
  }): Promise<ApiResponse<MedicoListResponse>> {
    try {
      let remote: MedicoDetalhado[] = [];
      const endpointTried: string[] = [];
      let lastError: unknown = null;
      const candidates = [ENDPOINTS.DOCTORS];
      for (const ep of candidates) {
        try {
          // Construir params manualmente para evitar valores booleanos diretos
          const queryParams: Record<string, string> = {
            select: "*",
          };

          // Supabase PostgREST usa formato: active=eq.true ou active=is.true
          if (params?.status) {
            queryParams.active =
              params.status === "ativo" ? "eq.true" : "eq.false";
          }

          if (params?.especialidade) {
            queryParams.specialty = `ilike.%${params.especialidade}%`;
          }

          const response = await http.get<MedicoApi[] | MedicoApi>(ep, {
            params: queryParams,
          });
          endpointTried.push(ep);
          if (response.success && response.data) {
            const raw = Array.isArray(response.data)
              ? response.data
              : [response.data];
            if (raw.length) {
              remote = raw.map(mapApiMedico);
              break;
            }
          } else if (response.error) {
            lastError = response.error;
          }
        } catch (inner) {
          lastError = inner;
          const err = inner as { response?: { status?: number } };
          endpointTried.push(
            `${ep} (erro${
              err?.response?.status ? ` status=${err.response.status}` : ""
            })`
          );
        }
      }

      // Filtros locais apenas sobre o resultado remoto
      const filtered = remote.filter((m) => {
        if (params?.status && m.status !== params.status) return false;
        if (
          params?.especialidade &&
          !m.especialidade
            .toLowerCase()
            .includes(params.especialidade.toLowerCase())
        )
          return false;
        return true;
      });
      const total = filtered.length;
      if (!remote.length) {
        console.warn(
          `[MedicoService] Nenhum médico retornado. Tentados: ${endpointTried.join(
            " -> "
          )}`
        );
        if (lastError) console.debug("[MedicoService] Último erro:", lastError);
      }
      return {
        success: true,
        data: { data: filtered, total, page: 1, per_page: total },
        message: endpointTried.length
          ? `Endpoints: ${endpointTried.join(" | ")}`
          : undefined,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (err?.response?.status === 404) {
        console.warn("Endpoint /rest/v1/doctors não encontrado.");
        return {
          success: true,
          data: { data: [], total: 0, page: 1, per_page: 0 },
        };
      } else if (err?.response?.status === 401) {
        console.warn("Não autorizado. Verifique o token JWT.");
        return {
          success: false,
          error: "Não autorizado. Verifique o token JWT.",
        };
      } else {
        console.error("Erro ao listar médicos:", error);
        const errorMessage =
          err?.response?.data?.message || "Erro ao listar médicos";
        return { success: false, error: errorMessage };
      }
    }
  }

  async criarMedico(
    medico: Partial<MedicoCreate> & {
      nome: string;
      email: string;
      crm: string;
      crmUf: string;
      especialidade: string;
      telefone: string;
      status?: "ativo" | "inativo";
    }
  ): Promise<ApiResponse<MedicoDetalhado>> {
    // Montar payload alinhado ao schema da tabela doctors
    const apiPayload: Record<string, unknown> = {
      full_name: medico.nome,
      email: medico.email,
      crm: medico.crm,
      crm_uf: medico.crmUf,
      specialty: medico.especialidade,
      phone_mobile: medico.telefone,
      phone2: medico.telefone2,
      cpf: medico.cpf,
      cep: medico.cep,
      street: medico.rua,
      number: medico.numero,
      complement: medico.complemento,
      neighborhood: medico.bairro,
      city: medico.cidade,
      state: medico.estado,
      birth_date: medico.dataNascimento,
      rg: medico.rg,
      active: (medico.status || "ativo") === "ativo",
    };
    // Remover campos undefined para evitar sobrescrever com null
    Object.keys(apiPayload).forEach((k) => {
      if (apiPayload[k] === undefined || apiPayload[k] === "")
        delete apiPayload[k];
    });
    try {
      const response = await http.post<MedicoApi | MedicoApi[]>(
        ENDPOINTS.DOCTORS,
        apiPayload,
        {
          headers: { Prefer: "return=representation" },
        }
      );
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Erro ao criar médico",
        };
      }
      const rawData = response.data;
      const raw: MedicoApi = Array.isArray(rawData) ? rawData[0] : rawData;
      const mapped = mapApiMedico(raw);
      if (!mapped.status) mapped.status = medico.status || "ativo";
      return { success: true, data: mapped };
    } catch (error: unknown) {
      console.error("Falha ao criar médico na API remota.", error);
      return { success: false, error: "Erro ao criar médico" };
    }
  }

  async buscarMedicoPorId(id: string): Promise<ApiResponse<MedicoDetalhado>> {
    try {
      // Tentativa 1: path param (se habilitado via Edge Function/Rewrite)
      try {
        const byPath = await http.get<MedicoApi | MedicoApi[]>(
          `${ENDPOINTS.DOCTORS}/${id}`
        );
        if (byPath.success && byPath.data) {
          const raw: MedicoApi = Array.isArray(byPath.data)
            ? byPath.data[0]
            : byPath.data;
          if (raw && (raw as MedicoApi).id)
            return { success: true, data: mapApiMedico(raw) };
        }
      } catch {
        // ignora
      }
      const response = await http.get<MedicoApi[] | MedicoApi>(
        ENDPOINTS.DOCTORS,
        {
          params: { id: `eq.${id}`, select: "*" },
        }
      );
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Médico não encontrado",
        };
      }
      const list: MedicoApi[] = Array.isArray(response.data)
        ? response.data
        : [response.data];
      if (!Array.isArray(list) || !list.length) {
        return { success: false, error: "Médico não encontrado" };
      }
      return { success: true, data: mapApiMedico(list[0]) };
    } catch (error: unknown) {
      console.error("Erro ao buscar médico:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao buscar médico"
          : "Erro ao buscar médico";
      return { success: false, error: errorMessage };
    }
  }

  async atualizarMedico(
    id: string,
    updates: MedicoUpdate
  ): Promise<ApiResponse<MedicoDetalhado>> {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.nome !== undefined) payload.full_name = updates.nome;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.crm !== undefined) payload.crm = updates.crm;
      if (updates.crmUf !== undefined) payload.crm_uf = updates.crmUf;
      if (updates.cpf !== undefined) payload.cpf = updates.cpf;
      if (updates.especialidade !== undefined)
        payload.specialty = updates.especialidade;
      if (updates.telefone !== undefined)
        payload.phone_mobile = updates.telefone;
      if (updates.telefone2 !== undefined) payload.phone2 = updates.telefone2;
      if (updates.cep !== undefined) payload.cep = updates.cep;
      if (updates.rua !== undefined) payload.street = updates.rua;
      if (updates.numero !== undefined) payload.number = updates.numero;
      if (updates.complemento !== undefined)
        payload.complement = updates.complemento;
      if (updates.bairro !== undefined) payload.neighborhood = updates.bairro;
      if (updates.cidade !== undefined) payload.city = updates.cidade;
      if (updates.estado !== undefined) payload.state = updates.estado;
      if (updates.dataNascimento !== undefined)
        payload.birth_date = updates.dataNascimento;
      if (updates.rg !== undefined) payload.rg = updates.rg;
      if (updates.status !== undefined)
        payload.active = updates.status === "ativo";

      // Remover undefined para atualizar parcialmente sem sobrescrever
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      // Usar query string conforme padrão Supabase PostgREST
      const response = await http.patch<MedicoApi | MedicoApi[]>(
        `${ENDPOINTS.DOCTORS}?id=eq.${id}`,
        payload,
        {
          headers: { Prefer: "return=representation" },
        }
      );

      let dataRemota: MedicoApi | undefined;
      if (response.success && response.data) {
        const list = Array.isArray(response.data)
          ? response.data
          : [response.data];
        dataRemota = list[0];
      }

      if (!dataRemota) {
        return { success: false, error: "Falha ao atualizar médico" };
      }
      return { success: true, data: mapApiMedico(dataRemota) };
    } catch (error: unknown) {
      console.error("Erro ao atualizar médico:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao atualizar médico"
          : "Erro ao atualizar médico";
      return { success: false, error: errorMessage };
    }
  }

  async deletarMedico(id: string): Promise<ApiResponse<void>> {
    try {
      let ok = false;
      try {
        const respPath = await http.delete<unknown>(
          `${ENDPOINTS.DOCTORS}/${id}`
        );
        ok = respPath.success;
      } catch {
        // ignora
      }
      if (!ok) {
        const respQuery = await http.delete<unknown>(ENDPOINTS.DOCTORS, {
          params: { id: `eq.${id}` },
        });
        ok = respQuery.success;
      }
      if (!ok) {
        return { success: false, error: "Falha ao deletar médico" };
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      let msg = "Erro ao deletar médico";
      const status = err.response?.status;
      if (status === 401) msg = "Não autorizado (token inválido ou expirado)";
      else if (status === 403) msg = "Acesso negado (sem permissão)";
      else if (status === 404) msg = "Médico não encontrado";
      else if (err.response?.data?.message) msg = err.response.data.message;
      console.error("Erro ao deletar médico:", error);
      return { success: false, error: msg };
    }
  }

  // Método para login de médico usando email/senha
  async loginMedico(
    email: string,
    _senha: string
  ): Promise<ApiResponse<MedicoDetalhado>> {
    try {
      void _senha;
      // Buscar médico pelo email
      const medicosResponse = await this.listarMedicos();
      if (!medicosResponse.success || !medicosResponse.data) {
        return { success: false, error: "Erro ao verificar dados do médico" };
      }

      const medico = medicosResponse.data.data.find((m) => m.email === email);
      if (!medico) {
        return { success: false, error: "Email não encontrado" };
      }

      if (medico.status !== "ativo") {
        return { success: false, error: "Médico inativo" };
      }

      // Em um cenário real, a senha seria verificada no backend
      // Por enquanto, vamos assumar que a autenticação é válida se o médico existe e está ativo
      // TODO: Integrar com authService.login() quando a API de auth estiver totalmente implementada
      return { success: true, data: medico };
    } catch (error: unknown) {
      console.error("Erro no login do médico:", error);
      return { success: false, error: "Erro ao fazer login" };
    }
  }
}

export const medicoService = new MedicoService();
export default medicoService;
