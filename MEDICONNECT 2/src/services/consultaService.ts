/**
 * DEPRECATED: Utilize `consultasService` (arquivo `consultasService.ts`) que possui
 * mapeamento mais robusto e convenções camelCase. Este arquivo será removido.
 */
import api from "./api";
import { ApiResponse } from "./http";
import { smsService } from "./smsService";

export interface Consulta {
  id: string;
  paciente_id: string;
  medico_id: string;
  data_hora: string;
  status: "agendada" | "confirmada" | "realizada" | "cancelada" | "faltou";
  tipo_consulta: "primeira_vez" | "retorno" | "emergencia" | "rotina";
  motivo_consulta?: string;
  observacoes?: string;
  valor_consulta?: number;
  forma_pagamento?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultaCreate {
  paciente_id: string;
  medico_id: string;
  data_hora: string;
  tipo_consulta: "primeira_vez" | "retorno" | "emergencia" | "rotina";
  motivo_consulta?: string;
  valor_consulta?: number;
  forma_pagamento?: string;
}

export interface ConsultaUpdate {
  data_hora?: string;
  status?: "agendada" | "confirmada" | "realizada" | "cancelada" | "faltou";
  tipo_consulta?: "primeira_vez" | "retorno" | "emergencia" | "rotina";
  motivo_consulta?: string;
  observacoes?: string;
  valor_consulta?: number;
  forma_pagamento?: string;
}

export interface ConsultaListResponse {
  data: Consulta[];
  total: number;
  page: number;
  per_page: number;
}

class ConsultaService {
  async listarConsultas(params?: {
    page?: number;
    per_page?: number;
    medico_id?: string;
    paciente_id?: string;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<ApiResponse<ConsultaListResponse>> {
    try {
      const response = await api.get("/rest/v1/consultations", { params });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("Erro ao listar consultas:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao listar consultas"
          : "Erro ao listar consultas";
      return { success: false, error: errorMessage };
    }
  }

  async criarConsulta(
    consulta: ConsultaCreate
  ): Promise<ApiResponse<Consulta>> {
    try {
      const response = await api.post("/rest/v1/consultations", {
        ...consulta,
        status: "agendada",
      });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("Erro ao criar consulta:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao criar consulta"
          : "Erro ao criar consulta";
      return { success: false, error: errorMessage };
    }
  }

  async buscarConsultaPorId(id: string): Promise<ApiResponse<Consulta>> {
    try {
      const response = await api.get(`/rest/v1/consultations/${id}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("Erro ao buscar consulta:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao buscar consulta"
          : "Erro ao buscar consulta";
      return { success: false, error: errorMessage };
    }
  }

  async atualizarConsulta(
    id: string,
    updates: ConsultaUpdate
  ): Promise<ApiResponse<Consulta>> {
    try {
      const response = await api.patch(`/rest/v1/consultations/${id}`, updates);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("Erro ao atualizar consulta:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao atualizar consulta"
          : "Erro ao atualizar consulta";
      return { success: false, error: errorMessage };
    }
  }

  async deletarConsulta(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/rest/v1/consultations/${id}`);
      return { success: true };
    } catch (error: unknown) {
      console.error("Erro ao deletar consulta:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao deletar consulta"
          : "Erro ao deletar consulta";
      return { success: false, error: errorMessage };
    }
  }

  // Métodos específicos para gerenciamento de consultas
  async confirmarConsulta(
    id: string,
    pacienteTelefone?: string,
    pacienteNome?: string,
    medicoNome?: string,
    dataHora?: string
  ): Promise<ApiResponse<Consulta>> {
    const result = await this.atualizarConsulta(id, { status: "confirmada" });

    // Enviar SMS de confirmação se dados estiverem disponíveis
    if (
      result.success &&
      pacienteTelefone &&
      pacienteNome &&
      medicoNome &&
      dataHora
    ) {
      await smsService.enviarConfirmacaoConsulta(
        pacienteTelefone,
        pacienteNome,
        medicoNome,
        dataHora
      );
    }

    return result;
  }

  async cancelarConsulta(
    id: string,
    motivo?: string,
    pacienteTelefone?: string,
    pacienteNome?: string,
    medicoNome?: string,
    dataHora?: string
  ): Promise<ApiResponse<Consulta>> {
    const result = await this.atualizarConsulta(id, { status: "cancelada" });

    // Enviar SMS de cancelamento se dados estiverem disponíveis
    if (
      result.success &&
      pacienteTelefone &&
      pacienteNome &&
      medicoNome &&
      dataHora
    ) {
      await smsService.enviarCancelamentoConsulta(
        pacienteTelefone,
        pacienteNome,
        medicoNome,
        dataHora,
        motivo
      );
    }

    return result;
  }

  async enviarLembreteConsulta(
    _id: string,
    pacienteTelefone: string,
    pacienteNome: string,
    medicoNome: string,
    dataHora: string
  ): Promise<ApiResponse<void>> {
    try {
      const smsResult = await smsService.enviarLembreteConsulta(
        pacienteTelefone,
        pacienteNome,
        medicoNome,
        dataHora
      );

      if (!smsResult.success) {
        return { success: false, error: smsResult.error };
      }

      return { success: true };
    } catch (error: unknown) {
      console.error("Erro ao enviar lembrete:", error);
      return { success: false, error: "Erro ao enviar lembrete" };
    }
  }

  async marcarComoRealizada(
    id: string,
    observacoes?: string
  ): Promise<ApiResponse<Consulta>> {
    return this.atualizarConsulta(id, {
      status: "realizada",
      observacoes: observacoes,
    });
  }

  async marcarComoFaltou(id: string): Promise<ApiResponse<Consulta>> {
    return this.atualizarConsulta(id, { status: "faltou" });
  }
}

export const consultaService = new ConsultaService();
export default consultaService;
