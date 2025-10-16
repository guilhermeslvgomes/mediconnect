import { z } from "zod";
import type { components } from "../types/api";

// Aliases gerados
type PatientInput = components["schemas"]["PatientInput"];
type DoctorCreate = components["schemas"]["DoctorCreate"];
type DoctorUpdate = components["schemas"]["DoctorUpdate"];
type ReportInput = components["schemas"]["ReportInput"];

// Login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type LoginSchema = z.infer<typeof loginSchema>;

// Paciente (entrada do formulário -> PatientInput mapeado)
export const patientInputSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().regex(/^[0-9]{11}$/, "CPF deve conter 11 dígitos"),
  email: z.string().email("Email inválido"),
  telefone: z
    .string()
    .min(8, "Telefone inválido")
    .regex(/^[0-9+()\-\s]+$/, "Telefone inválido"),
  dataNascimento: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "Formato YYYY-MM-DD",
    }),
  socialName: z.string().optional(),
  sexo: z.enum(["M", "F", "Outro"]).optional(),
  tipoSanguineo: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  pesoKg: z.number().nonnegative().max(500).optional(),
  alturaM: z.number().positive().max(3).optional(),
  endereco: z
    .object({
      rua: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      cep: z
        .string()
        .optional()
        .refine((v) => !v || /^[0-9]{8}$/.test(v), {
          message: "CEP deve conter 8 dígitos",
        }),
    })
    .optional(),
});
export type PatientFormInput = z.infer<typeof patientInputSchema>;

export function mapPatientFormToApi(
  input: PatientFormInput
): Partial<PatientInput> {
  return {
    full_name: input.nome,
    cpf: input.cpf,
    email: input.email,
    phone_mobile: input.telefone,
    birth_date: input.dataNascimento,
    social_name: input.socialName,
    sex: input.sexo,
    blood_type: input.tipoSanguineo,
    weight_kg: input.pesoKg,
    height_m: input.alturaM,
    street: input.endereco?.rua,
    number: input.endereco?.numero,
    complement: input.endereco?.complemento,
    neighborhood: input.endereco?.bairro,
    city: input.endereco?.cidade,
    state: input.endereco?.estado,
    cep: input.endereco?.cep,
  };
}

// Doctor create/update
const doctorShared = {
  crm: z.string().min(1, "CRM obrigatório"),
  crm_uf: z.string().length(2, "UF inválida").toUpperCase(),
  full_name: z.string().min(3),
  cpf: z.string().regex(/^[0-9]{11}$/, "CPF deve conter 11 dígitos"),
  email: z.string().email(),
  specialty: z.string().optional(),
  phone_mobile: z.string().optional(),
  phone2: z.string().optional(),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  birth_date: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "Formato YYYY-MM-DD",
    }),
  rg: z.string().optional(),
  active: z.boolean().optional(),
};

export const doctorCreateSchema = z.object(doctorShared);
export type DoctorCreateInput = z.infer<typeof doctorCreateSchema> &
  Partial<DoctorCreate>;

export const doctorUpdateSchema = doctorCreateSchema.partial();
export type DoctorUpdateInput = z.infer<typeof doctorUpdateSchema> &
  Partial<DoctorUpdate>;

// Report input
export const reportInputSchema = z.object({
  patientId: z.string().uuid("patientId inválido"),
  orderNumber: z.string().min(1, "orderNumber obrigatório"),
  exam: z.string().optional(),
  diagnosis: z.string().optional(),
  conclusion: z.string().optional(),
  cidCode: z.string().optional(),
  contentHtml: z.string().optional(),
  contentJson: z.any().optional(),
  status: z.enum(["draft", "pending", "completed", "cancelled"]).optional(),
  requestedBy: z.string().optional(),
  dueAt: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}/.test(v), {
      message: "Formato esperado YYYY-MM-DD...",
    }),
  hideDate: z.boolean().optional(),
  hideSignature: z.boolean().optional(),
});
export type ReportFormInput = z.infer<typeof reportInputSchema>;

export function mapReportFormToApi(
  input: ReportFormInput
): Partial<ReportInput> {
  return {
    patient_id: input.patientId,
    order_number: input.orderNumber,
    exam: input.exam,
    diagnosis: input.diagnosis,
    conclusion: input.conclusion,
    cid_code: input.cidCode,
    content_html: input.contentHtml,
    content_json: input.contentJson,
    status: input.status,
    requested_by: input.requestedBy,
    due_at: input.dueAt,
    hide_date: input.hideDate,
    hide_signature: input.hideSignature,
  };
}

// Export agrupado
export const Schemas = {
  login: loginSchema,
  patient: patientInputSchema,
  doctorCreate: doctorCreateSchema,
  doctorUpdate: doctorUpdateSchema,
  report: reportInputSchema,
};
