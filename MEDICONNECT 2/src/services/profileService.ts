import {
  http,
  type ApiResponse as HttpApiResponse,
  type ApiResponse,
} from "./http";
import ENDPOINTS from "./endpoints";

export interface Profile {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  disabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProfileApi {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  disabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ApiResponse genérico reutilizado (removida definição local)

function mapProfile(p: ProfileApi): Profile {
  return {
    id: p.id || "",
    fullName: p.full_name ?? null,
    email: p.email ?? null,
    phone: p.phone ?? null,
    avatarUrl: p.avatar_url ?? null,
    disabled: p.disabled,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export async function listProfiles(): Promise<ApiResponse<Profile[]>> {
  const resp: HttpApiResponse<unknown> = await http.get(ENDPOINTS.PROFILES, {
    params: { select: "*" },
  });
  if (!resp.success) return { success: false, error: resp.error };
  const rawArray = Array.isArray(resp.data)
    ? resp.data
    : (resp.data as { data?: unknown })?.data;
  const raw: ProfileApi[] = Array.isArray(rawArray)
    ? (rawArray as ProfileApi[])
    : [];
  return { success: true, data: raw.map(mapProfile) };
}

export async function updateProfile(updates: {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
}): Promise<ApiResponse<Profile>> {
  const body: Record<string, unknown> = {
    full_name: updates.fullName,
    avatar_url: updates.avatarUrl,
    phone: updates.phone,
  };
  Object.keys(body).forEach((k) => {
    if (body[k] === undefined || body[k] === "") delete body[k];
  });
  if (Object.keys(body).length === 0) {
    return { success: false, error: "Nenhum campo para atualizar" };
  }
  const resp = await http.patch<unknown>(ENDPOINTS.PROFILES, body, {
    headers: { Prefer: "return=representation" },
  });
  if (!resp.success) return { success: false, error: resp.error };
  const data = resp.data as unknown;
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return { success: false, error: "Perfil não retornado" };
  return { success: true, data: mapProfile(raw as ProfileApi) };
}

export default { listProfiles, updateProfile };
