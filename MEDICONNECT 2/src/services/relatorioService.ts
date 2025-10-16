/**
 * Service para gerenciar relatórios médicos
 * Endpoint: /rest/v1/reports
 */
import { http, ApiResponse } from "./http";
import ENDPOINTS from "./endpoints";

export interface Relatorio {
  id?: string;
  patient_id?: string;
  order_number?: string;
  exam?: string;
  diagnosis?: string;
  conclusion?: string;
  cid_code?: string;
  content_html?: string;
  content_json?: Record<string, unknown>;
  status?: "draft" | "pending" | "completed" | "cancelled";
  requested_by?: string;
  due_at?: string;
  hide_date?: boolean;
  hide_signature?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface RelatorioCreate {
  patient_id: string;
  order_number: string;
  exam?: string;
  diagnosis?: string;
  conclusion?: string;
  cid_code?: string;
  content_html?: string;
  content_json?: Record<string, unknown>;
  status?: "draft" | "pending" | "completed" | "cancelled";
  requested_by?: string;
  due_at?: string;
  hide_date?: boolean;
  hide_signature?: boolean;
}

export interface RelatorioUpdate {
  patient_id?: string;
  order_number?: string;
  exam?: string;
  diagnosis?: string;
  conclusion?: string;
  cid_code?: string;
  content_html?: string;
  content_json?: Record<string, unknown>;
  status?: "draft" | "pending" | "completed" | "cancelled";
  requested_by?: string;
  due_at?: string;
  hide_date?: boolean;
  hide_signature?: boolean;
}

class RelatorioService {
  // Listar relatórios com filtros opcionais
  async listarRelatorios(params?: {
    patient_id?: string;
    status?: "draft" | "pending" | "completed" | "cancelled";
  }): Promise<ApiResponse<Relatorio[]>> {
    try {
      const queryParams: Record<string, string> = { select: "*" };

      if (params?.patient_id) {
        queryParams["patient_id"] = `eq.${params.patient_id}`;
      }

      if (params?.status) {
        queryParams["status"] = `eq.${params.status}`;
      }

      const response = await http.get<Relatorio[]>(ENDPOINTS.REPORTS, {
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
        error: response.error || "Erro ao listar relatórios",
      };
    } catch (error) {
      console.error("Erro ao listar relatórios:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // Criar novo relatório
  async criarRelatorio(
    relatorio: RelatorioCreate
  ): Promise<ApiResponse<Relatorio>> {
    try {
      const response = await http.post<Relatorio>(
        ENDPOINTS.REPORTS,
        relatorio,
        {
          headers: { Prefer: "return=representation" },
        }
      );

      if (response.success && response.data) {
        const report = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        return {
          success: true,
          data: report,
          message: "Relatório criado com sucesso",
        };
      }

      return {
        success: false,
        error: response.error || "Erro ao criar relatório",
      };
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // Buscar relatório por ID
  async buscarRelatorioPorId(id: string): Promise<ApiResponse<Relatorio>> {
    try {
      const response = await http.get<Relatorio[]>(
        `${ENDPOINTS.REPORTS}?id=eq.${id}`,
        {
          params: { select: "*" },
        }
      );

      if (response.success && response.data) {
        const reports = Array.isArray(response.data)
          ? response.data
          : [response.data];
        if (reports.length > 0) {
          return { success: true, data: reports[0] };
        }
      }

      return { success: false, error: "Relatório não encontrado" };
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // Atualizar relatório existente
  async atualizarRelatorio(
    id: string,
    updates: RelatorioUpdate
  ): Promise<ApiResponse<Relatorio>> {
    try {
      const response = await http.patch<Relatorio>(
        `${ENDPOINTS.REPORTS}?id=eq.${id}`,
        updates,
        {
          headers: { Prefer: "return=representation" },
        }
      );

      if (response.success && response.data) {
        const report = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        return {
          success: true,
          data: report,
          message: "Relatório atualizado com sucesso",
        };
      }

      return {
        success: false,
        error: response.error || "Erro ao atualizar relatório",
      };
    } catch (error) {
      console.error("Erro ao atualizar relatório:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

export const relatorioService = new RelatorioService();
export default relatorioService;
