import { listPatients, type Paciente } from "./pacienteService";

export async function listarPacientes(): Promise<Paciente[]> {
  const resp = await listPatients({ per_page: 100 });
  if ("data" in resp) return resp.data;
  return [];
}
