/**
 * Service para gerenciar disponibilidades dos médicos
 * Configuração de horários de trabalho por dia da semana
 */
import { http, ApiResponse } from "./http";
import ENDPOINTS from "./endpoints";
import authService from "./authService";

export type Weekday =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo";

// Tipo que o banco de dados realmente aceita (provavelmente em inglês ou números)
export type WeekdayDB =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type AppointmentType = "presencial" | "telemedicina";

export interface DoctorAvailability {
  id?: string;
  doctor_id?: string;
  weekday?: Weekday;
  start_time?: string; // "09:00:00"
  end_time?: string; // "17:00:00"
  slot_minutes?: number; // padrão: 30
  appointment_type?: AppointmentType;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string | null;
}

export interface CreateAvailabilityInput {
  doctor_id: string;
  weekday: Weekday;
  start_time: string;
  end_time: string;
  slot_minutes?: number;
  appointment_type?: AppointmentType;
  active?: boolean;
}

export interface UpdateAvailabilityInput {
  weekday?: Weekday;
  start_time?: string;
  end_time?: string;
  slot_minutes?: number;
  appointment_type?: AppointmentType;
  active?: boolean;
}

export interface ListAvailabilityParams {
  select?: string;
  doctor_id?: string;
  active?: boolean;
}

export const WEEKDAY_MAP = {
  0: "domingo",
  1: "segunda",
  2: "terca",
  3: "quarta",
  4: "quinta",
  5: "sexta",
  6: "sabado",
} as const;

export const WEEKDAY_LABELS = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
} as const;

// Mapeamento PT-BR → EN (para o banco de dados)
export const WEEKDAY_PT_TO_EN: Record<Weekday, WeekdayDB> = {
  segunda: "monday",
  terca: "tuesday",
  quarta: "wednesday",
  quinta: "thursday",
  sexta: "friday",
  sabado: "saturday",
  domingo: "sunday",
};

// Mapeamento EN → PT-BR (do banco de dados)
export const WEEKDAY_EN_TO_PT: Record<WeekdayDB, Weekday> = {
  monday: "segunda",
  tuesday: "terca",
  wednesday: "quarta",
  thursday: "quinta",
  friday: "sexta",
  saturday: "sabado",
  sunday: "domingo",
};

// Converter para formato do banco
export function convertWeekdayToDB(weekday: Weekday): WeekdayDB {
  return WEEKDAY_PT_TO_EN[weekday];
}

// Converter do formato do banco
export function convertWeekdayFromDB(weekday: WeekdayDB): Weekday {
  return WEEKDAY_EN_TO_PT[weekday];
}

export function getWeekdayName(dayNumber: number): Weekday {
  return WEEKDAY_MAP[dayNumber as keyof typeof WEEKDAY_MAP];
}

export function getWeekdayFromDate(date: Date): Weekday {
  return getWeekdayName(date.getDay());
}

class AvailabilityService {
  async listAvailability(
    params?: ListAvailabilityParams
  ): Promise<ApiResponse<DoctorAvailability[]>> {
    try {
      const q: Record<string, string> = {};
      if (params?.select) q.select = params.select;
      if (params?.doctor_id) q["doctor_id"] = `eq.${params.doctor_id}`;
      if (params?.active !== undefined) q["active"] = `eq.${params.active}`;
      if (!q.select) q.select = "*";
      const res = await http.get<DoctorAvailability[]>(
        ENDPOINTS.DOCTOR_AVAILABILITY,
        { params: q }
      );
      if (res.success && res.data) {
        const dataArray = Array.isArray(res.data) ? res.data : [res.data];
        // Converter weekdays do banco (inglês) para PT-BR
        const converted = dataArray.map((item) => {
          if (item.weekday) {
            return {
              ...item,
              weekday: convertWeekdayFromDB(
                item.weekday as WeekdayDB
              ) as Weekday,
            };
          }
          return item;
        });
        return {
          success: true,
          data: converted,
        };
      }
      return {
        success: false,
        error: res.error || "Erro ao listar disponibilidades",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  async createAvailability(
    data: CreateAvailabilityInput
  ): Promise<ApiResponse<DoctorAvailability>> {
    try {
      console.log(
        "[AvailabilityService] Criando disponibilidade (PT-BR):",
        data
      );

      // Pegar ID do usuário autenticado
      const user = authService.getStoredUser();
      if (!user?.id) {
        return {
          success: false,
          error: "Usuário não autenticado",
        };
      }

      // Converter weekday para inglês (formato do banco) e adicionar created_by
      const payload = {
        ...data,
        weekday: convertWeekdayToDB(data.weekday),
        created_by: user.id,
      };

      console.log("[AvailabilityService] Payload convertido (EN):", payload);
      console.log(
        "[AvailabilityService] Endpoint:",
        ENDPOINTS.DOCTOR_AVAILABILITY
      );

      const res = await http.post<DoctorAvailability>(
        ENDPOINTS.DOCTOR_AVAILABILITY,
        payload,
        { headers: { Prefer: "return=representation" } }
      );

      console.log("[AvailabilityService] Resposta:", res);

      if (res.success && res.data) {
        const item = Array.isArray(res.data) ? res.data[0] : res.data;
        // Converter weekday de volta para PT-BR antes de retornar
        if (item.weekday) {
          item.weekday = convertWeekdayFromDB(
            item.weekday as WeekdayDB
          ) as Weekday;
        }
        return {
          success: true,
          data: item,
          message: "Disponibilidade criada com sucesso",
        };
      }
      return {
        success: false,
        error: res.error || "Erro ao criar disponibilidade",
      };
    } catch (e) {
      console.error("[AvailabilityService] Exceção:", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  async updateAvailability(
    id: string,
    updates: UpdateAvailabilityInput
  ): Promise<ApiResponse<DoctorAvailability>> {
    try {
      // Converter weekday se presente
      const payload = updates.weekday
        ? { ...updates, weekday: convertWeekdayToDB(updates.weekday) }
        : updates;

      const res = await http.patch<DoctorAvailability>(
        `${ENDPOINTS.DOCTOR_AVAILABILITY}?id=eq.${id}`,
        payload,
        { headers: { Prefer: "return=representation" } }
      );
      if (res.success && res.data) {
        const item = Array.isArray(res.data) ? res.data[0] : res.data;
        // Converter weekday de volta para PT-BR
        if (item.weekday) {
          item.weekday = convertWeekdayFromDB(
            item.weekday as WeekdayDB
          ) as Weekday;
        }
        return {
          success: true,
          data: item,
          message: "Disponibilidade atualizada com sucesso",
        };
      }
      return {
        success: false,
        error: res.error || "Erro ao atualizar disponibilidade",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  async deleteAvailability(id: string): Promise<ApiResponse<void>> {
    try {
      const res = await http.delete<void>(
        `${ENDPOINTS.DOCTOR_AVAILABILITY}?id=eq.${id}`
      );
      if (res.success)
        return {
          success: true,
          data: undefined,
          message: "Disponibilidade deletada com sucesso",
        };
      return {
        success: false,
        error: res.error || "Erro ao deletar disponibilidade",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  }

  async listDoctorActiveAvailability(doctorId: string) {
    return this.listAvailability({ doctor_id: doctorId, active: true });
  }
  activateAvailability(id: string) {
    return this.updateAvailability(id, { active: true });
  }
  deactivateAvailability(id: string) {
    return this.updateAvailability(id, { active: false });
  }

  async createWeekSchedule(
    doctorId: string,
    weekdays: Weekday[],
    startTime: string,
    endTime: string,
    slotMinutes = 30,
    appointmentType: AppointmentType = "presencial"
  ) {
    const results: DoctorAvailability[] = [];
    const errors: string[] = [];
    for (const weekday of weekdays) {
      const res = await this.createAvailability({
        doctor_id: doctorId,
        weekday,
        start_time: startTime,
        end_time: endTime,
        slot_minutes: slotMinutes,
        appointment_type: appointmentType,
        active: true,
      });
      if (res.success && res.data) results.push(res.data);
      else errors.push(`${weekday}: ${res.error}`);
    }
    if (errors.length)
      return {
        success: false,
        error: `Erros: ${errors.join(", ")}`,
      } as ApiResponse<DoctorAvailability[]>;
    return {
      success: true,
      data: results,
      message: "Horários da semana criados com sucesso",
    } as ApiResponse<DoctorAvailability[]>;
  }

  async getDoctorAvailabilityForDay(doctorId: string, weekday: Weekday) {
    const res = await this.listAvailability({
      doctor_id: doctorId,
      active: true,
    });
    if (!res.success || !res.data)
      return res as ApiResponse<DoctorAvailability[]>;
    return {
      success: true,
      data: res.data.filter((a) => a.weekday === weekday),
    } as ApiResponse<DoctorAvailability[]>;
  }

  async isDoctorAvailableOnDay(doctorId: string, weekday: Weekday) {
    const res = await this.getDoctorAvailabilityForDay(doctorId, weekday);
    return !!(res.success && res.data && res.data.length > 0);
  }

  async getDoctorScheduleSummary(
    doctorId: string
  ): Promise<
    ApiResponse<
      Record<
        Weekday,
        Array<{ start: string; end: string; type: AppointmentType }>
      >
    >
  > {
    const res = await this.listDoctorActiveAvailability(doctorId);
    if (!res.success || !res.data)
      return { success: false, error: "Erro ao buscar horários" };
    const summary: Record<
      Weekday,
      Array<{ start: string; end: string; type: AppointmentType }>
    > = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: [],
    };
    res.data.forEach((a) => {
      if (a.weekday && a.start_time && a.end_time)
        summary[a.weekday].push({
          start: a.start_time,
          end: a.end_time,
          type: a.appointment_type || "presencial",
        });
    });
    return { success: true, data: summary };
  }

  // Compatibilidade: método utilitário para retornar a disponibilidade semanal
  // no formato ApiResponse esperado pelos componentes existentes.
  async getAvailability(
    doctorId: string
  ): Promise<
    ApiResponse<any>
  > {
    try {
      // Alguns componentes esperam a disponibilidade semanal (com chaves
      // domingo/segunda/..). Tentar obter via listAvailability (tabelas
      // granular por weekday) e transformar se necessário.
      const res = await this.listAvailability({ doctor_id: doctorId });
      if (!res.success || !res.data) {
        return { success: false, error: res.error || "Nenhuma disponibilidade" };
      }

      // Se o backend já retornar o objeto semanal (com campos domingo..sabado),
      // apenas repassar. Caso contrário, agrupar os registros por weekday
      // para manter compatibilidade com componentes que esperam esse formato.
      const first = res.data[0];
      const looksLikeWeekly = first && (first as any).domingo !== undefined;
      if (looksLikeWeekly) {
        return { success: true, data: res.data };
      }

      // Agrupar registros por weekday (convertido para PT-BR em listAvailability)
      const weekly: Record<string, any> = {
        domingo: { ativo: false, horarios: [] },
        segunda: { ativo: false, horarios: [] },
        terca: { ativo: false, horarios: [] },
        quarta: { ativo: false, horarios: [] },
        quinta: { ativo: false, horarios: [] },
        sexta: { ativo: false, horarios: [] },
        sabado: { ativo: false, horarios: [] },
      };

      res.data.forEach((item: any) => {
        const wd = item.weekday as any; // segunda/terca/...
        if (!wd) return;
        // Converter cada registro para formato { ativo, horarios: [{inicio,fim,ativo}] }
        const entry = {
          ativo: item.active ?? item.ativo ?? true,
          horarios: [
            {
              inicio: item.start_time || item.inicio || "",
              fim: item.end_time || item.fim || "",
              ativo: item.active ?? item.ativo ?? true,
            },
          ],
        };
        weekly[wd] = entry;
      });

      return { success: true, data: [weekly] };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro desconhecido" };
    }
  }
}

export const availabilityService = new AvailabilityService();
export default availabilityService;
