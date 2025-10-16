/**
 * Service para gerenciar exceções na agenda dos médicos
 * Bloqueios (férias, feriados) e liberações (horários extras)
 */
import { http, ApiResponse } from "./http";
import ENDPOINTS from "./endpoints";
import authService from "./authService";

export type ExceptionKind = "bloqueio" | "liberacao";

export interface DoctorException {
  id?: string;
  doctor_id?: string;
  date?: string; // YYYY-MM-DD
  start_time?: string | null; // HH:MM:SS
  end_time?: string | null; // HH:MM:SS
  kind?: ExceptionKind;
  reason?: string | null;
  created_at?: string;
  created_by?: string;
}

export interface CreateExceptionInput {
  doctor_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  kind: ExceptionKind;
  reason?: string;
}

export interface ListExceptionsParams {
  select?: string;
  doctor_id?: string;
  date?: string;
}

export function formatDateForApi(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTimeForApi(hours: number, minutes = 0): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:00`;
}

export function isFullDayException(exception: DoctorException): boolean {
  return !exception.start_time && !exception.end_time;
}

export function getExceptionKindLabel(kind: ExceptionKind): string {
  return kind === "bloqueio" ? "Bloqueio" : "Liberação";
}

class ExceptionService {
  async listExceptions(
    params?: ListExceptionsParams
  ): Promise<ApiResponse<DoctorException[]>> {
    try {
      const q: Record<string, string> = {};
      if (params?.select) q.select = params.select;
      if (params?.doctor_id) q["doctor_id"] = `eq.${params.doctor_id}`;
      if (params?.date) q["date"] = `eq.${params.date}`;
      if (!q.select) q.select = "*";
      const res = await http.get<DoctorException[]>(
        ENDPOINTS.DOCTOR_EXCEPTIONS,
        { params: q }
      );
      if (res.success && res.data) {
        return {
          success: true,
          data: Array.isArray(res.data) ? res.data : [res.data],
        };
      }
      return { success: false, error: res.error || "Erro ao listar exceções" };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  async createException(
    data: CreateExceptionInput
  ): Promise<ApiResponse<DoctorException>> {
    try {
      // Pegar ID do usuário autenticado
      const user = authService.getStoredUser();
      if (!user?.id) {
        return {
          success: false,
          error: "Usuário não autenticado",
        };
      }

      const payload = {
        ...data,
        created_by: user.id,
      };

      const res = await http.post<DoctorException>(
        ENDPOINTS.DOCTOR_EXCEPTIONS,
        payload,
        { headers: { Prefer: "return=representation" } }
      );
      if (res.success && res.data) {
        const item = Array.isArray(res.data) ? res.data[0] : res.data;
        return {
          success: true,
          data: item,
          message: "Exceção criada com sucesso",
        };
      }
      return { success: false, error: res.error || "Erro ao criar exceção" };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  async deleteException(id: string): Promise<ApiResponse<void>> {
    try {
      const res = await http.delete<void>(
        `${ENDPOINTS.DOCTOR_EXCEPTIONS}?id=eq.${id}`
      );
      if (res.success)
        return {
          success: true,
          data: undefined,
          message: "Exceção deletada com sucesso",
        };
      return { success: false, error: res.error || "Erro ao deletar exceção" };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  // Conveniências - bloqueios
  blockFullDay(doctorId: string, date: string, reason?: string) {
    return this.createException({
      doctor_id: doctorId,
      date,
      kind: "bloqueio",
      reason,
    });
  }
  blockTimeSlot(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ) {
    return this.createException({
      doctor_id: doctorId,
      date,
      start_time: startTime,
      end_time: endTime,
      kind: "bloqueio",
      reason,
    });
  }
  async blockVacation(
    doctorId: string,
    startDate: string,
    endDate: string,
    reason = "Férias"
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const results: DoctorException[] = [];
    const errors: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = formatDateForApi(d);
      const res = await this.blockFullDay(doctorId, ds, reason);
      if (res.success && res.data) results.push(res.data);
      else errors.push(`${ds}: ${res.error}`);
    }
    if (errors.length)
      return {
        success: false,
        error: `Erros ao bloquear férias: ${errors.join(", ")}`,
      } as ApiResponse<DoctorException[]>;
    return {
      success: true,
      data: results,
      message: `${results.length} dia(s) bloqueado(s)`,
    } as ApiResponse<DoctorException[]>;
  }

  // Conveniências - liberações
  releaseFullDay(doctorId: string, date: string, reason?: string) {
    return this.createException({
      doctor_id: doctorId,
      date,
      kind: "liberacao",
      reason,
    });
  }
  releaseTimeSlot(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ) {
    return this.createException({
      doctor_id: doctorId,
      date,
      start_time: startTime,
      end_time: endTime,
      kind: "liberacao",
      reason,
    });
  }

  // Consultas
  async listDoctorBlocks(doctorId: string) {
    const res = await this.listExceptions({ doctor_id: doctorId });
    if (!res.success || !res.data) return res as ApiResponse<DoctorException[]>;
    return {
      success: true,
      data: res.data.filter((e) => e.kind === "bloqueio"),
    } as ApiResponse<DoctorException[]>;
  }
  async listDoctorReleases(doctorId: string) {
    const res = await this.listExceptions({ doctor_id: doctorId });
    if (!res.success || !res.data) return res as ApiResponse<DoctorException[]>;
    return {
      success: true,
      data: res.data.filter((e) => e.kind === "liberacao"),
    } as ApiResponse<DoctorException[]>;
  }
  async isDayBlocked(doctorId: string, date: string) {
    const res = await this.listExceptions({ doctor_id: doctorId, date });
    if (!res.success || !res.data) return false;
    return res.data.some((e) => e.kind === "bloqueio");
  }
  async isTimeSlotBlocked(doctorId: string, date: string, time: string) {
    const res = await this.listExceptions({ doctor_id: doctorId, date });
    if (!res.success || !res.data) return false;
    for (const e of res.data) {
      if (e.kind !== "bloqueio") continue;
      if (!e.start_time && !e.end_time) return true;
      if (e.start_time && e.end_time) {
        if (time >= e.start_time && time <= e.end_time) return true;
      }
    }
    return false;
  }
  async getFutureExceptions(doctorId: string) {
    const res = await this.listExceptions({ doctor_id: doctorId });
    if (!res.success || !res.data) return res as ApiResponse<DoctorException[]>;
    const today = formatDateForApi(new Date());
    return {
      success: true,
      data: res.data.filter((e) => e.date && e.date >= today),
    } as ApiResponse<DoctorException[]>;
  }
  async getMonthExceptionsSummary(
    doctorId: string,
    year: number,
    month: number
  ): Promise<
    ApiResponse<{
      blocks: DoctorException[];
      releases: DoctorException[];
      totalBlocks: number;
      totalReleases: number;
    }>
  > {
    const res = await this.listExceptions({ doctor_id: doctorId });
    if (!res.success || !res.data)
      return { success: false, error: "Erro ao buscar exceções" };
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const list = res.data.filter((e) => e.date && e.date.startsWith(prefix));
    const blocks = list.filter((e) => e.kind === "bloqueio");
    const releases = list.filter((e) => e.kind === "liberacao");
    return {
      success: true,
      data: {
        blocks,
        releases,
        totalBlocks: blocks.length,
        totalReleases: releases.length,
      },
    };
  }
  async deleteExceptionsInRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ deletedCount: number }>> {
    const res = await this.listExceptions({ doctor_id: doctorId });
    if (!res.success || !res.data)
      return { success: false, error: "Erro ao buscar exceções" };
    const inRange = res.data.filter(
      (e) => e.date && e.date >= startDate && e.date <= endDate
    );
    let deleted = 0;
    const errors: string[] = [];
    for (const e of inRange) {
      if (!e.id) continue;
      const r = await this.deleteException(e.id);
      if (r.success) deleted++;
      else errors.push(`${e.date}: ${r.error}`);
    }
    if (errors.length)
      return {
        success: false,
        error: `Erros ao deletar: ${errors.join(", ")}`,
      };
    return {
      success: true,
      data: { deletedCount: deleted },
      message: `${deleted} exceção(ões) deletada(s)`,
    };
  }
}

export const exceptionService = new ExceptionService();
export default exceptionService;
