// Serviço para buscar pacientes da API
export async function listarPacientes() {
  const response = await fetch(
    "https://do5wegrct3.apidog.io/auth/v1/pacientes"
  );
  if (!response.ok) throw new Error("Erro ao buscar pacientes");
  const data = await response.json();
  // Adapta para array se necessário
  return Array.isArray(data.data) ? data.data : [];
}
