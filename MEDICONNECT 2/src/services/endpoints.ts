// Centralização de endpoints REST (Supabase PostgREST)
// Ajuste AQUI se mudar o nome de tabelas / views no banco.
// Descoberta atual (scripts/verificar-todas-tabelas.js): existem doctors, patients, profiles, appointments.
// Tabelas em pt-BR (medicos, pacientes) não existem nesse projeto/instância.
// IMPORTANTE: manter sempre o prefixo "/rest/v1".

export const ENDPOINTS = {
  DOCTORS: "/rest/v1/doctors", // ou "/rest/v1/medicos"
  PATIENTS: "/rest/v1/patients", // ou "/rest/v1/pacientes"
  PROFILES: "/rest/v1/profiles",
  REPORTS: "/rest/v1/reports",
  // Consultas/Agendamentos
  APPOINTMENTS: "/rest/v1/appointments", // CRUD de agendamentos
  CONSULTATIONS: "/rest/v1/appointments", // alias para compatibilidade
  AVAILABLE_SLOTS: "/functions/v1/get-available-slots", // horários disponíveis
  // Disponibilidade e Exceções do médico
  DOCTOR_AVAILABILITY: "/rest/v1/doctor_availability",
  DOCTOR_EXCEPTIONS: "/rest/v1/doctor_exceptions",
  PATIENT_ASSIGNMENTS: "/rest/v1/patient_assignments",
  USER_ROLES: "/rest/v1/user_roles",
  SMS: "/rest/v1/sms",
};

export type EndpointKey = keyof typeof ENDPOINTS;

export function setEndpoint(key: EndpointKey, value: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – sobrescrever valor dinamicamente é seguro em runtime controlado
  ENDPOINTS[key] = value;
}

export default ENDPOINTS;
