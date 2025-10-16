import api from "./api";
import ENDPOINTS from "./endpoints";
import { ApiResponse } from "./http";

export interface Consulta {
  id: string;
  pacienteId: string;
  medicoId: string;
  dataHora: string; // ISO
  status: string; // agendada | confirmada | cancelada | realizada | faltou
  tipo?: string;
  motivo?: string;
  observacoes?: string;
  valorPago?: number;
  formaPagamento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultaCreate {
  pacienteId: string;
  medicoId: string;
  dataHora: string;
  tipo?: string;
  motivo?: string;
  observacoes?: string;
}

export interface ConsultaUpdate {
  dataHora?: string;
  status?: string;
  tipo?: string;
  motivo?: string;
  observacoes?: string;
  valorPago?: number;
  formaPagamento?: string;
}

interface RawConsulta {
  id?: string;
  _id?: string;
  Id?: string;
  consultaId?: string;
  pacienteId?: string;
  patient_id?: string;
  paciente?: string;
  medicoId?: string;
  doctor_id?: string;
  medico?: string;
  dataHora?: string;
  data_hora?: string;
  date?: string;
  status?: string;
  tipo?: string;
  tipoConsulta?: string;
  type?: string;
  motivo?: string;
  motivoConsulta?: string;
  observacoes?: string;
  notes?: string;
  valorPago?: number;
  valor_pago?: number;
  formaPagamento?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
}

class ConsultasService {
  async listarTodas(): Promise<ApiResponse<Consulta[]>> {
    try {
      const response = await api.get(ENDPOINTS.CONSULTATIONS, {
        params: { select: "*" },
      });
      const data: RawConsulta[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      return { success: true, data: data.map(this.mapConsulta) };
    } catch (error) {
      console.error("Erro ao listar todas as consultas:", error);
      return { success: false, error: "Erro ao listar todas as consultas" };
    }
  }
  async listarPorPaciente(
    pacienteId: string,
    params?: { futureOnly?: boolean; limit?: number; sort?: "asc" | "desc" }
  ): Promise<ApiResponse<Consulta[]>> {
    try {
      // Supabase PostgREST usa filtros específicos: patient_id=eq.valor
      const queryParams: Record<string, string> = {
        patient_id: `eq.${pacienteId}`,
      };

      if (params?.limit) {
        queryParams.limit = String(params.limit);
      }

      if (params?.sort) {
        queryParams.order = `dataHora.${params.sort}`;
      }

      const response = await api.get(ENDPOINTS.CONSULTATIONS, {
        params: queryParams,
      });
      const data: RawConsulta[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      return {
        success: true,
        data: data.map(this.mapConsulta),
      };
    } catch (error) {
      console.error("Erro ao listar consultas por paciente:", error);
      return { success: false, error: "Erro ao listar consultas" };
    }
  }

  async listarPorMedico(
    medicoId: string,
    params?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      limit?: number;
    }
  ): Promise<ApiResponse<Consulta[]>> {
    try {
      const queryParams: Record<string, string> = {
        doctor_id: `eq.${medicoId}`,
      };

      if (params?.status) {
        queryParams.status = `eq.${params.status}`;
      }

      if (params?.dateFrom) {
        queryParams.dataHora = `gte.${params.dateFrom}`;
      }

      if (params?.dateTo) {
        queryParams.dataHora = `lte.${params.dateTo}`;
      }

      if (params?.limit) {
        queryParams.limit = String(params.limit);
      }

      const response = await api.get(ENDPOINTS.CONSULTATIONS, {
        params: queryParams,
      });
      const data: RawConsulta[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      return { success: true, data: data.map(this.mapConsulta) };
    } catch (error) {
      console.error("Erro ao listar consultas por médico:", error);
      return { success: false, error: "Erro ao listar consultas" };
    }
  }

  async criar(payload: ConsultaCreate): Promise<ApiResponse<Consulta>> {
    try {
      const response = await api.post(ENDPOINTS.CONSULTATIONS, payload);
      return { success: true, data: this.mapConsulta(response.data) };
    } catch (error) {
      console.error("Erro ao criar consulta:", error);
      return { success: false, error: "Erro ao criar consulta" };
    }
  }

  async atualizar(
    id: string,
    updates: ConsultaUpdate
  ): Promise<ApiResponse<Consulta>> {
    try {
      const response = await api.patch(
        `${ENDPOINTS.CONSULTATIONS}/${id}`,
        updates
      );
      return { success: true, data: this.mapConsulta(response.data) };
    } catch (error) {
      console.error("Erro ao atualizar consulta:", error);
      return { success: false, error: "Erro ao atualizar consulta" };
    }
  }

  async deletar(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`${ENDPOINTS.CONSULTATIONS}/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Erro ao deletar consulta:", error);
      return { success: false, error: "Erro ao deletar consulta" };
    }
  }

  async obterUltimaPorPaciente(
    pacienteId: string
  ): Promise<ApiResponse<Consulta | null>> {
    try {
      const list = await this.listarPorPaciente(pacienteId, { limit: 10 });
      if (!list.success || !list.data) return { success: true, data: null };
      const sorted = [...list.data].sort((a, b) =>
        b.dataHora.localeCompare(a.dataHora)
      );
      return { success: true, data: sorted[0] || null };
    } catch {
      return { success: false, error: "Erro ao obter última consulta" };
    }
  }

  async obterProximaPorPaciente(
    pacienteId: string
  ): Promise<ApiResponse<Consulta | null>> {
    try {
      const agora = new Date().toISOString();
      const list = await this.listarPorPaciente(pacienteId, { limit: 50 });
      if (!list.success || !list.data) return { success: true, data: null };
      const futuras = list.data.filter((c) => c.dataHora >= agora);
      futuras.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
      return { success: true, data: futuras[0] || null };
    } catch {
      return { success: false, error: "Erro ao obter próxima consulta" };
    }
  }

  private mapConsulta(raw: RawConsulta): Consulta {
    return {
      id:
        raw.id ||
        raw._id ||
        raw.Id ||
        raw.consultaId ||
        Math.random().toString(36).slice(2, 11),
      pacienteId: raw.pacienteId || raw.patient_id || raw.paciente || "",
      medicoId: raw.medicoId || raw.doctor_id || raw.medico || "",
      dataHora:
        raw.dataHora || raw.data_hora || raw.date || new Date().toISOString(),
      status: raw.status || "agendada",
      tipo: raw.tipo || raw.tipoConsulta || raw.type || undefined,
      motivo: raw.motivo || raw.motivoConsulta || undefined,
      observacoes: raw.observacoes || raw.notes || undefined,
      valorPago: raw.valorPago ?? raw.valor_pago ?? undefined,
      formaPagamento: raw.formaPagamento || raw.payment_method || undefined,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  }
}

export const consultasService = new ConsultasService();
export default consultasService;
