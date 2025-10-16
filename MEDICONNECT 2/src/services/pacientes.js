import api from "./api";

export async function listarPacientes(page = 1, limit = 10) {
  const response = await api.get("/auth/v1/pacientes", {
    params: { page, limit },
  });
  return response.data.data;
}
