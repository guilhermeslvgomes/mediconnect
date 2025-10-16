/**
 * Service para gerenciar agendamentos (appointments)
 * API completa com horários disponíveis, CRUD de agendamentos
 */
import { http, ApiResponse } from "./http";
import ENDPOINTS from "./endpoints";
import authService from "./authService";

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentType = "presencial" | "telemedicina";

export interface Appointment {
  id?: string;
  order_number?: string;
  patient_id?: string;
  doctor_id?: string;
  scheduled_at?: string; // ISO 8601
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  chief_complaint?: string | null;
  patient_notes?: string | null;
  notes?: string | null;
  insurance_provider?: string | null;
  checked_in_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string | null;
}

export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string; // ISO 8601
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  chief_complaint?: string;
  patient_notes?: string;
  insurance_provider?: string;
}

export interface UpdateAppointmentInput {
  scheduled_at?: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  chief_complaint?: string;
  notes?: string;
  patient_notes?: string;
  insurance_provider?: string;
  checked_in_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface AvailableSlotRequest {
  doctor_id: string;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  appointment_type?: AppointmentType;
}

export interface AvailableSlot {
  datetime: string; // ISO 8601
  available: boolean;
}

export interface AvailableSlotsResponse {
  slots: AvailableSlot[];
}

export interface ListAppointmentsParams {
  select?: string;
  doctor_id?: string;
  patient_id?: string;
  status?: AppointmentStatus;
  scheduled_at?: string; // Usar operadores como gte.2025-10-10
  order?: string;
  limit?: number;
  offset?: number;
}

class AppointmentService {
  async getAvailableSlots(
    params: AvailableSlotRequest
  ): Promise<ApiResponse<AvailableSlotsResponse>> {
    try {
      const response = await http.post<AvailableSlotsResponse>(
        ENDPOINTS.AVAILABLE_SLOTS,
        params
      );
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return {
        success: false,
        error: response.error || "Erro ao buscar horários disponíveis",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async listAppointments(
    params?: ListAppointmentsParams
  ): Promise<ApiResponse<Appointment[]>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.select) queryParams.select = params.select;
      if (params?.doctor_id)
        queryParams["doctor_id"] = `eq.${params.doctor_id}`;
      if (params?.patient_id)
        queryParams["patient_id"] = `eq.${params.patient_id}`;
      if (params?.status) queryParams["status"] = `eq.${params.status}`;
      if (params?.scheduled_at)
        queryParams["scheduled_at"] = params.scheduled_at;
      if (params?.order) queryParams.order = params.order;
      if (params?.limit) queryParams.limit = String(params.limit);
      if (params?.offset) queryParams.offset = String(params.offset);
      if (!queryParams.select) queryParams.select = "*";
      if (!queryParams.order) queryParams.order = "scheduled_at.desc";
      if (!queryParams.limit) queryParams.limit = "100";
      const response = await http.get<Appointment[]>(ENDPOINTS.APPOINTMENTS, {
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
        error: response.error || "Erro ao listar agendamentos",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async createAppointment(
    data: CreateAppointmentInput
  ): Promise<ApiResponse<Appointment>> {
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

      const response = await http.post<Appointment>(
        ENDPOINTS.APPOINTMENTS,
        payload,
        {
          headers: { Prefer: "return=representation" },
        }
      );
      if (response.success && response.data) {
        const appointment = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        return {
          success: true,
          data: appointment,
          message: "Agendamento criado com sucesso",
        };
      }
      return {
        success: false,
        error: response.error || "Erro ao criar agendamento",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    try {
      const response = await http.get<Appointment[]>(
        `${ENDPOINTS.APPOINTMENTS}?id=eq.${id}&select=*`
      );
      if (response.success && response.data) {
        const list = Array.isArray(response.data)
          ? response.data
          : [response.data];
        if (list.length > 0) return { success: true, data: list[0] };
      }
      return { success: false, error: "Agendamento não encontrado" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async updateAppointment(
    id: string,
    updates: UpdateAppointmentInput
  ): Promise<ApiResponse<Appointment>> {
    try {
      const response = await http.patch<Appointment>(
        `${ENDPOINTS.APPOINTMENTS}?id=eq.${id}`,
        updates,
        {
          headers: { Prefer: "return=representation" },
        }
      );
      if (response.success && response.data) {
        const appointment = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        return {
          success: true,
          data: appointment,
          message: "Agendamento atualizado com sucesso",
        };
      }
      return {
        success: false,
        error: response.error || "Erro ao atualizar agendamento",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async deleteAppointment(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete<void>(
        `${ENDPOINTS.APPOINTMENTS}?id=eq.${id}`
      );
      if (response.success)
        return {
          success: true,
          data: undefined,
          message: "Agendamento deletado com sucesso",
        };
      return {
        success: false,
        error: response.error || "Erro ao deletar agendamento",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // Conveniências
  confirmAppointment(id: string) {
    return this.updateAppointment(id, { status: "confirmed" });
  }
  checkInAppointment(id: string) {
    return this.updateAppointment(id, {
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
    });
  }
  startAppointment(id: string) {
    return this.updateAppointment(id, { status: "in_progress" });
  }
  completeAppointment(id: string, notes?: string) {
    return this.updateAppointment(id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      notes,
    });
  }
  cancelAppointment(id: string, reason?: string) {
    return this.updateAppointment(id, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    });
  }
  markAsNoShow(id: string) {
    return this.updateAppointment(id, { status: "no_show" });
  }
  listDoctorAppointments(
    doctorId: string,
    params?: Omit<ListAppointmentsParams, "doctor_id">
  ) {
    return this.listAppointments({ ...params, doctor_id: doctorId });
  }
  listPatientAppointments(
    patientId: string,
    params?: Omit<ListAppointmentsParams, "patient_id">
  ) {
    return this.listAppointments({ ...params, patient_id: patientId });
  }
  listTodayAppointments(doctorId: string) {
    const today = new Date().toISOString().split("T")[0];
    return this.listAppointments({
      doctor_id: doctorId,
      scheduled_at: `gte.${today}T00:00:00`,
      order: "scheduled_at.asc",
    });
  }
  listUpcomingPatientAppointments(patientId: string) {
    const now = new Date().toISOString();
    return this.listAppointments({
      patient_id: patientId,
      scheduled_at: `gte.${now}`,
      order: "scheduled_at.asc",
      limit: 10,
    });
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
