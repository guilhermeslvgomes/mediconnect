// Service para gerenciar médicos
import { http, ApiResponse } from "./http";
import ENDPOINTS from "./endpoints";
import type { components } from "../types/api";

// Tipos gerados via OpenAPI (docs/api/openapi.partial.json)
// Mantemos aliases locais para clareza no restante do arquivo.
export type Doctor = components["schemas"]["Doctor"];
export type CreateDoctorInput = components["schemas"]["DoctorCreate"];
// Para update usamos DoctorUpdate (todos os campos opcionais segundo spec)
export type UpdateDoctorInput = components["schemas"]["DoctorUpdate"];

// Listar médicos
export async function listDoctors(params?: {
  active?: boolean;
  specialty?: string;
}): Promise<ApiResponse<Doctor[]>> {
  try {
    const queryParams: Record<string, string> = { select: "*" };

    if (params?.active !== undefined) {
      queryParams["active"] = `eq.${params.active}`;
    }

    if (params?.specialty) {
      queryParams["specialty"] = `ilike.%${params.specialty}%`;
    }

    const response = await http.get<Doctor[]>(ENDPOINTS.DOCTORS, {
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
      error: response.error || "Erro ao listar médicos",
    };
  } catch (error) {
    console.error("Erro ao listar médicos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// Buscar médico por ID
export async function getDoctorById(id: string): Promise<ApiResponse<Doctor>> {
  try {
    const response = await http.get<Doctor[]>(
      `${ENDPOINTS.DOCTORS}?id=eq.${id}`,
      {
        params: { select: "*" },
      }
    );

    if (response.success && response.data) {
      const doctors = Array.isArray(response.data)
        ? response.data
        : [response.data];
      if (doctors.length > 0) {
        return { success: true, data: doctors[0] };
      }
    }

    return { success: false, error: "Médico não encontrado" };
  } catch (error) {
    console.error("Erro ao buscar médico:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// Criar médico
export async function createDoctor(
  data: CreateDoctorInput
): Promise<ApiResponse<Doctor>> {
  try {
    const response = await http.post<Doctor>(ENDPOINTS.DOCTORS, data, {
      headers: { Prefer: "return=representation" },
    });

    if (response.success && response.data) {
      const doctor = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      return {
        success: true,
        data: doctor,
        message: "Médico criado com sucesso",
      };
    }

    return {
      success: false,
      error: response.error || "Erro ao criar médico",
    };
  } catch (error) {
    console.error("Erro ao criar médico:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar médico",
    };
  }
}

// Atualizar médico
export async function updateDoctor(
  id: string,
  data: UpdateDoctorInput
): Promise<ApiResponse<Doctor>> {
  try {
    const response = await http.patch<Doctor>(
      `${ENDPOINTS.DOCTORS}?id=eq.${id}`,
      data,
      {
        headers: { Prefer: "return=representation" },
      }
    );

    if (response.success && response.data) {
      const doctor = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      return {
        success: true,
        data: doctor,
        message: "Médico atualizado com sucesso",
      };
    }

    return {
      success: false,
      error: response.error || "Erro ao atualizar médico",
    };
  } catch (error) {
    console.error("Erro ao atualizar médico:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar médico",
    };
  }
}

// Deletar médico
export async function deleteDoctor(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await http.delete(`${ENDPOINTS.DOCTORS}?id=eq.${id}`);

    if (response.success) {
      return {
        success: true,
        message: "Médico deletado com sucesso",
      };
    }

    return {
      success: false,
      error: response.error || "Erro ao deletar médico",
    };
  } catch (error) {
    console.error("Erro ao deletar médico:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao deletar médico",
    };
  }
}

export default {
  listDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
