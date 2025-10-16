import ENDPOINTS from "./endpoints";
import { http, type ApiResponse } from "./http";

export interface UserRoleApi {
  id?: string;
  user_id?: string;
  role?:
    | "admin"
    | "gestor"
    | "medico"
    | "secretaria"
    | "paciente"
    | "user"
    | string;
  created_at?: string;
}

export interface UserRole {
  id: string;
  userId?: string;
  role?:
    | "admin"
    | "gestor"
    | "medico"
    | "secretaria"
    | "paciente"
    | "user"
    | string;
  createdAt?: string;
}

function mapUserRole(r: UserRoleApi): UserRole {
  return {
    id: r.id || "",
    userId: r.user_id,
    role: r.role,
    createdAt: r.created_at,
  };
}

export async function listUserRoles(
  userId?: string
): Promise<ApiResponse<UserRole[]>> {
  const params: Record<string, string> = { select: "*" };
  if (userId) params["user_id"] = `eq.${userId}`;
  const resp = await http.get<UserRoleApi[] | { data?: UserRoleApi[] }>(
    ENDPOINTS.USER_ROLES,
    { params }
  );
  if (!resp.success || !resp.data)
    return { success: false, error: resp.error || "Falha ao obter roles" };
  const raw = Array.isArray(resp.data) ? resp.data : resp.data.data || [];
  return { success: true, data: raw.map(mapUserRole) };
}

// Cria uma role para um usuário (insert simples). Se a combinação user_id+role tiver unique, erros serão retornados.
export async function assignUserRole(
  userId: string,
  role: "admin" | "gestor" | "medico" | "secretaria" | "paciente" | "user"
): Promise<ApiResponse<UserRole>> {
  if (!userId) return { success: false, error: "userId é obrigatório" };
  if (!role) return { success: false, error: "role é obrigatória" };
  const payload = { user_id: userId, role };
  const resp = await http.post<UserRoleApi | UserRoleApi[]>(
    ENDPOINTS.USER_ROLES,
    payload,
    { headers: { Prefer: "return=representation" } }
  );
  if (!resp.success || !resp.data)
    return { success: false, error: resp.error || "Falha ao atribuir role" };
  const raw = Array.isArray(resp.data) ? resp.data[0] : resp.data;
  return { success: true, data: mapUserRole(raw) };
}

// Remove uma role específica pelo id (conveniência). Poderíamos também suportar remoção por (userId, role) se necessário.
export async function deleteUserRole(
  roleId: string
): Promise<ApiResponse<void>> {
  if (!roleId) return { success: false, error: "id é obrigatório" };
  const resp = await http.delete<unknown>(
    `${ENDPOINTS.USER_ROLES}/${encodeURIComponent(roleId)}`
  );
  if (!resp.success)
    return { success: false, error: resp.error || "Falha ao remover role" };
  return { success: true };
}

export default { listUserRoles, assignUserRole, deleteUserRole };
