import {
  http,
  type ApiResponse as HttpApiResponse,
  type ApiResponse,
} from "./http";
import ENDPOINTS from "./endpoints";
import type { components } from "../types/api";

type PatientAssignmentSchema = components["schemas"]["PatientAssignment"];

export interface PatientAssignment {
  id: string;
  patientId?: string;
  userId?: string;
  role?: PatientAssignmentSchema["role"] | string;
  createdAt?: string;
  createdBy?: string;
}

// Usa ApiResponse unificado do http wrapper

function mapAssignment(a: PatientAssignmentSchema): PatientAssignment {
  return {
    id: a.id || "",
    patientId: a.patient_id,
    userId: a.user_id,
    role: a.role,
    createdAt: a.created_at,
    createdBy: a.created_by,
  };
}

export interface ListAssignmentsParams {
  patientId?: string;
  userId?: string;
  role?: string; // medico | enfermeiro (possível expansão)
}

export async function listAssignments(
  params?: ListAssignmentsParams
): Promise<ApiResponse<PatientAssignment[]>> {
  const query: Record<string, string> = { select: "*" };
  if (params?.patientId) query["patient_id"] = `eq.${params.patientId}`;
  if (params?.userId) query["user_id"] = `eq.${params.userId}`;
  if (params?.role) query["role"] = `eq.${params.role}`;
  const resp: HttpApiResponse<unknown> = await http.get(
    ENDPOINTS.PATIENT_ASSIGNMENTS,
    { params: query }
  );
  if (!resp.success) return { success: false, error: resp.error };
  const arr = Array.isArray(resp.data)
    ? resp.data
    : (resp.data as { data?: unknown })?.data;
  const raw: PatientAssignmentSchema[] = Array.isArray(arr)
    ? (arr as PatientAssignmentSchema[])
    : [];
  return { success: true, data: raw.map(mapAssignment) };
}

export interface CreateAssignmentInput {
  patientId: string;
  userId: string;
  role: "medico" | "enfermeiro" | string;
}

export async function createAssignment(
  input: CreateAssignmentInput
): Promise<ApiResponse<PatientAssignment>> {
  if (!input.patientId)
    return { success: false, error: "patientId é obrigatório" };
  if (!input.userId) return { success: false, error: "userId é obrigatório" };
  if (!input.role) return { success: false, error: "role é obrigatório" };

  const payload = {
    patient_id: input.patientId,
    user_id: input.userId,
    role: input.role,
  };
  const resp = await http.post<unknown>(
    ENDPOINTS.PATIENT_ASSIGNMENTS,
    payload,
    { headers: { Prefer: "return=representation" } }
  );
  if (!resp.success) return { success: false, error: resp.error };
  const data = resp.data as unknown;
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw || typeof raw !== "object")
    return { success: false, error: "Resposta inesperada" };
  return {
    success: true,
    data: mapAssignment(raw as PatientAssignmentSchema),
    message: "Atribuição criada",
  };
}

export default { listAssignments, createAssignment };
