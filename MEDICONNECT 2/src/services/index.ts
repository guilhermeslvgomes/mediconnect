// Barrel file: export only canonical (non-deprecated) services.
export { default as api } from "./api";
export { default as authService } from "./authService";
export { default as consultasService } from "./consultasService";
export { default as medicoService } from "./medicoService";
export { default as pacienteService } from "./pacienteService";
export { default as profileService } from "./profileService";
export { default as reportService } from "./reportService";
export { default as userRoleService } from "./userRoleService";
export { default as userAdminService } from "./userAdminService";
export { default as patientAssignmentService } from "./patientAssignmentService";
export { default as smsService } from "./smsService";
export { default as appointmentService } from "./appointmentService";
export { default as availabilityService } from "./availabilityService";
export { default as exceptionService } from "./exceptionService";

// Intencionalmente NÃO reexporta arquivos deprecated: consultaService, relatorioService, listarPacientes, pacientes.js, api.js
