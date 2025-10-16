import { http, type ApiResponse as HttpApiResponse } from "./http";
import ENDPOINTS from "./endpoints";
import type { components } from "../types/api";

// Tipos derivados da especificação OpenAPI
type ReportSchema = components["schemas"]["Report"];
type ReportInputSchema = components["schemas"]["ReportInput"];

export interface Report {
  id: string;
  patientId?: string;
  orderNumber?: string;
  exam?: string | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  cidCode?: string | null;
  contentHtml?: string | null;
  contentJson?: unknown | null;
  status?: ReportSchema["status"];
  requestedBy?: string | null;
  dueAt?: string | null;
  hideDate?: boolean | null;
  hideSignature?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function mapReport(r: ReportSchema): Report {
  return {
    id: r.id || "",
    patientId: r.patient_id,
    orderNumber: r.order_number,
    exam: r.exam ?? null,
    diagnosis: r.diagnosis ?? null,
    conclusion: r.conclusion ?? null,
    cidCode: r.cid_code ?? null,
    contentHtml: r.content_html ?? null,
    contentJson: r.content_json ?? null,
    status: r.status,
    requestedBy: r.requested_by ?? null,
    dueAt: r.due_at ?? null,
    hideDate: r.hide_date ?? null,
    hideSignature: r.hide_signature ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
  };
}

export interface ListReportsParams {
  patientId?: string;
  status?: "draft" | "pending" | "completed" | "cancelled";
}

export async function listReports(
  params?: ListReportsParams
): Promise<ApiResponse<Report[]>> {
  const query: Record<string, string> = { select: "*" };
  if (params?.patientId) query["patient_id"] = `eq.${params.patientId}`;
  if (params?.status) query["status"] = `eq.${params.status}`;
  const resp: HttpApiResponse<unknown> = await http.get(ENDPOINTS.REPORTS, {
    params: query,
  });
  if (!resp.success) return { success: false, error: resp.error };
  const rawArray = Array.isArray(resp.data)
    ? resp.data
    : (resp.data as { data?: unknown })?.data;
  const raw: ReportSchema[] = Array.isArray(rawArray)
    ? (rawArray as ReportSchema[])
    : [];
  return { success: true, data: raw.map(mapReport) };
}

// Payload criação de relatório
export interface CreateReportInput {
  patientId: string; // patient_id
  orderNumber: string; // order_number
  exam?: string | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  cidCode?: string | null;
  contentHtml?: string | null;
  contentJson?: unknown | null;
  status?: ReportInputSchema["status"];
  requestedBy?: string | null;
  dueAt?: string | null; // ISO
  hideDate?: boolean | null;
  hideSignature?: boolean | null;
}

export async function createReport(
  payload: CreateReportInput
): Promise<ApiResponse<Report>> {
  if (!payload.patientId?.trim())
    return { success: false, error: "patientId é obrigatório" };
  if (!payload.orderNumber?.trim())
    return { success: false, error: "orderNumber é obrigatório" };
  const body: Record<string, unknown> = {
    patient_id: payload.patientId,
    order_number: payload.orderNumber,
    exam: payload.exam,
    diagnosis: payload.diagnosis,
    conclusion: payload.conclusion,
    cid_code: payload.cidCode,
    content_html: payload.contentHtml,
    content_json: payload.contentJson,
    status: payload.status,
    requested_by: payload.requestedBy,
    due_at: payload.dueAt,
    hide_date: payload.hideDate,
    hide_signature: payload.hideSignature,
  };
  Object.keys(body).forEach((k) => {
    if (body[k] === undefined || body[k] === "") delete body[k];
  });
  const resp = await http.post<unknown>(ENDPOINTS.REPORTS, body, {
    headers: { Prefer: "return=representation" },
  });
  if (!resp.success) return { success: false, error: resp.error };
  const data = resp.data as unknown;
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return { success: false, error: "Resposta inesperada da API" };
  return { success: true, data: mapReport(raw as ReportSchema) };
}

export async function getReportById(id: string): Promise<ApiResponse<Report>> {
  if (!id) return { success: false, error: "ID é obrigatório" };
  // Primeiro tentativa por path param
  const first = await http.get<unknown>(
    `${ENDPOINTS.REPORTS}/${encodeURIComponent(id)}`
  );
  let data: unknown;
  if (first.success && first.data) {
    data = first.data;
  } else {
    // Fallback por query eq.id
    const byQuery = await http.get<unknown>(ENDPOINTS.REPORTS, {
      params: { id: `eq.${id}`, select: "*" },
    });
    if (byQuery.success) {
      const maybe = byQuery.data as unknown;
      const arr = Array.isArray(maybe)
        ? maybe
        : maybe && typeof maybe === "object"
        ? (maybe as Record<string, unknown>)["data"]
        : undefined;
      data = Array.isArray(arr) ? (arr as unknown[])[0] : undefined;
    } else {
      return {
        success: false,
        error: first.error || byQuery.error || "Erro ao buscar relatório",
      };
    }
  }
  if (!data || typeof data !== "object")
    return { success: false, error: "Relatório não encontrado" };
  return { success: true, data: mapReport(data as ReportSchema) };
}
// Update possui os mesmos campos opcionais que Create (frontend viewpoint)
export type UpdateReportInput = CreateReportInput;

export async function updateReport(
  id: string,
  updates: UpdateReportInput
): Promise<ApiResponse<Report>> {
  if (!id) return { success: false, error: "ID é obrigatório" };
  if (!updates.patientId?.trim())
    return { success: false, error: "patientId é obrigatório" };
  if (!updates.orderNumber?.trim())
    return { success: false, error: "orderNumber é obrigatório" };
  const body: Record<string, unknown> = {
    patient_id: updates.patientId,
    order_number: updates.orderNumber,
    exam: updates.exam,
    diagnosis: updates.diagnosis,
    conclusion: updates.conclusion,
    cid_code: updates.cidCode,
    content_html: updates.contentHtml,
    content_json: updates.contentJson,
    status: updates.status,
    requested_by: updates.requestedBy,
    due_at: updates.dueAt,
    hide_date: updates.hideDate,
    hide_signature: updates.hideSignature,
  };
  Object.keys(body).forEach((k) => {
    if (body[k] === undefined || body[k] === "") delete body[k];
  });
  // Supabase PostgREST: updates por query (id=eq.<id>)
  const resp = await http.patch<unknown>(
    `${ENDPOINTS.REPORTS}?id=eq.${encodeURIComponent(id)}`,
    body,
    { headers: { Prefer: "return=representation" } }
  );
  if (!resp.success) return { success: false, error: resp.error };
  const data = resp.data as unknown;
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return { success: false, error: "Relatório não retornado" };
  return { success: true, data: mapReport(raw as ReportSchema) };
}

export default { listReports, createReport, getReportById, updateReport };
