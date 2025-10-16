import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  Activity,
  Calendar,
  FileText,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import PatientListTable, {
  type PatientListItem,
} from "../components/pacientes/PatientListTable";
import PacienteForm from "../components/pacientes/PacienteForm";
import {
  appointmentService,
  type Appointment,
} from "../services/appointmentService";

import medicoService, {
  type Medico,
  type MedicoCreate,
  type MedicoUpdate,
} from "../services/medicoService";
import {
  buscarEnderecoViaCEP,
  createPatient,
  deletePatient,
  getPatientById,
  listPatients,
  updatePatient,
  type EnderecoPaciente,
  type Paciente as PacienteServiceModel,
} from "../services/pacienteService";
import relatorioService, { type Relatorio } from "../services/relatorioService";
import reportService from "../services/reportService";
import AvailabilityManager from "../components/agenda/AvailabilityManager";
import ExceptionsManager from "../components/agenda/ExceptionsManager";
import DoctorCalendar from "../components/agenda/DoctorCalendar";
import ScheduleAppointmentModal from "../components/agenda/ScheduleAppointmentModal";

// Tipos e constantes reinseridos após refatoração
type TabId =
  | "dashboard"
  | "pacientes"
  | "medicos"
  | "consultas"
  | "agenda"
  | "relatorios";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const COUNTRY_OPTIONS = [
  { value: "55", label: "+55 🇧🇷 Brasil" },
  { value: "1", label: "+1 🇺🇸 EUA/Canadá" },
  { value: "93", label: "+93 🇦🇫 Afeganistão" },
  { value: "355", label: "+355 🇦🇱 Albânia" },
  { value: "49", label: "+49 🇩🇪 Alemanha" },
  { value: "376", label: "+376 🇦🇩 Andorra" },
  { value: "244", label: "+244 🇦🇴 Angola" },
  { value: "54", label: "+54 🇦🇷 Argentina" },
  { value: "374", label: "+374 🇦🇲 Armênia" },
  { value: "61", label: "+61 🇦🇺 Austrália" },
  { value: "43", label: "+43 🇦🇹 Áustria" },
  { value: "994", label: "+994 🇦🇿 Azerbaijão" },
  { value: "973", label: "+973 🇧🇭 Bahrein" },
  { value: "880", label: "+880 🇧🇩 Bangladesh" },
  { value: "375", label: "+375 🇧🇾 Bielorrússia" },
  { value: "32", label: "+32 🇧🇪 Bélgica" },
  { value: "501", label: "+501 🇧🇿 Belize" },
  { value: "591", label: "+591 🇧🇴 Bolívia" },
  { value: "387", label: "+387 🇧🇦 Bósnia" },
  { value: "267", label: "+267 🇧🇼 Botsuana" },
  { value: "359", label: "+359 🇧🇬 Bulgária" },
  { value: "226", label: "+226 🇧🇫 Burkina Faso" },
  { value: "257", label: "+257 🇧🇮 Burundi" },
  { value: "238", label: "+238 🇨🇻 Cabo Verde" },
  { value: "855", label: "+855 🇰🇭 Camboja" },
  { value: "237", label: "+237 🇨🇲 Camarões" },
  { value: "56", label: "+56 🇨🇱 Chile" },
  { value: "86", label: "+86 🇨🇳 China" },
  { value: "57", label: "+57 🇨🇴 Colômbia" },
  { value: "242", label: "+242 🇨🇬 Congo" },
  { value: "82", label: "+82 🇰🇷 Coreia do Sul" },
  { value: "850", label: "+850 🇰🇵 Coreia do Norte" },
  { value: "506", label: "+506 🇨🇷 Costa Rica" },
  { value: "225", label: "+225 🇨🇮 Costa do Marfim" },
  { value: "385", label: "+385 🇭🇷 Croácia" },
  { value: "53", label: "+53 🇨🇺 Cuba" },
  { value: "45", label: "+45 🇩🇰 Dinamarca" },
  { value: "593", label: "+593 🇪🇨 Equador" },
  { value: "20", label: "+20 🇪🇬 Egito" },
  { value: "503", label: "+503 🇸🇻 El Salvador" },
  { value: "971", label: "+971 🇦🇪 Emirados Árabes" },
  { value: "593", label: "+593 🇪🇨 Equador" },
  { value: "291", label: "+291 🇪🇷 Eritreia" },
  { value: "421", label: "+421 🇸🇰 Eslováquia" },
  { value: "386", label: "+386 🇸🇮 Eslovênia" },
  { value: "34", label: "+34 🇪🇸 Espanha" },
  { value: "251", label: "+251 🇪🇹 Etiópia" },
  { value: "679", label: "+679 🇫🇯 Fiji" },
  { value: "63", label: "+63 🇵🇭 Filipinas" },
  { value: "358", label: "+358 🇫🇮 Finlândia" },
  { value: "33", label: "+33 🇫🇷 França" },
  { value: "241", label: "+241 🇬🇦 Gabão" },
  { value: "220", label: "+220 🇬🇲 Gâmbia" },
  { value: "233", label: "+233 🇬🇭 Gana" },
  { value: "995", label: "+995 🇬🇪 Geórgia" },
  { value: "350", label: "+350 🇬🇮 Gibraltar" },
  { value: "30", label: "+30 🇬🇷 Grécia" },
  { value: "502", label: "+502 🇬🇹 Guatemala" },
  { value: "224", label: "+224 🇬🇳 Guiné" },
  { value: "245", label: "+245 🇬🇼 Guiné-Bissau" },
  { value: "509", label: "+509 🇭🇹 Haiti" },
  { value: "504", label: "+504 🇭🇳 Honduras" },
  { value: "852", label: "+852 🇭🇰 Hong Kong" },
  { value: "36", label: "+36 🇭🇺 Hungria" },
  { value: "967", label: "+967 🇾🇪 Iêmen" },
  { value: "91", label: "+91 🇮🇳 Índia" },
  { value: "62", label: "+62 🇮🇩 Indonésia" },
  { value: "98", label: "+98 🇮🇷 Irã" },
  { value: "964", label: "+964 🇮🇶 Iraque" },
  { value: "353", label: "+353 🇮🇪 Irlanda" },
  { value: "354", label: "+354 🇮🇸 Islândia" },
  { value: "972", label: "+972 🇮🇱 Israel" },
  { value: "39", label: "+39 🇮🇹 Itália" },
  { value: "81", label: "+81 🇯🇵 Japão" },
  { value: "962", label: "+962 🇯🇴 Jordânia" },
  { value: "254", label: "+254 🇰🇪 Quênia" },
  { value: "996", label: "+996 🇰🇬 Quirguistão" },
  { value: "383", label: "+383 🇽🇰 Kosovo" },
  { value: "965", label: "+965 🇰🇼 Kuwait" },
  { value: "856", label: "+856 🇱🇦 Laos" },
  { value: "371", label: "+371 🇱🇻 Letônia" },
  { value: "961", label: "+961 🇱🇧 Líbano" },
  { value: "266", label: "+266 🇱🇸 Lesoto" },
  { value: "231", label: "+231 🇱🇷 Libéria" },
  { value: "218", label: "+218 🇱🇾 Líbia" },
  { value: "423", label: "+423 🇱🇮 Liechtenstein" },
  { value: "370", label: "+370 🇱🇹 Lituânia" },
  { value: "352", label: "+352 🇱🇺 Luxemburgo" },
  { value: "853", label: "+853 🇲🇴 Macau" },
  { value: "389", label: "+389 🇲🇰 Macedônia" },
  { value: "261", label: "+261 🇲🇬 Madagascar" },
  { value: "60", label: "+60 🇲🇾 Malásia" },
  { value: "265", label: "+265 🇲🇼 Malawi" },
  { value: "960", label: "+960 🇲🇻 Maldivas" },
  { value: "223", label: "+223 🇲🇱 Mali" },
  { value: "356", label: "+356 🇲🇹 Malta" },
  { value: "212", label: "+212 🇲🇦 Marrocos" },
  { value: "230", label: "+230 🇲🇺 Maurício" },
  { value: "222", label: "+222 🇲🇷 Mauritânia" },
  { value: "52", label: "+52 🇲🇽 México" },
  { value: "95", label: "+95 🇲🇲 Mianmar" },
  { value: "258", label: "+258 🇲🇿 Moçambique" },
  { value: "373", label: "+373 🇲🇩 Moldávia" },
  { value: "377", label: "+377 🇲🇨 Mônaco" },
  { value: "976", label: "+976 🇲🇳 Mongólia" },
  { value: "382", label: "+382 🇲🇪 Montenegro" },
  { value: "264", label: "+264 🇳🇦 Namíbia" },
  { value: "977", label: "+977 🇳🇵 Nepal" },
  { value: "505", label: "+505 🇳🇮 Nicarágua" },
  { value: "227", label: "+227 🇳🇪 Níger" },
  { value: "234", label: "+234 🇳🇬 Nigéria" },
  { value: "47", label: "+47 🇳🇴 Noruega" },
  { value: "64", label: "+64 🇳🇿 Nova Zelândia" },
  { value: "968", label: "+968 🇴🇲 Omã" },
  { value: "31", label: "+31 🇳🇱 Países Baixos" },
  { value: "92", label: "+92 🇵🇰 Paquistão" },
  { value: "507", label: "+507 🇵🇦 Panamá" },
  { value: "675", label: "+675 🇵🇬 Papua Nova Guiné" },
  { value: "595", label: "+595 🇵🇾 Paraguai" },
  { value: "51", label: "+51 🇵🇪 Peru" },
  { value: "48", label: "+48 🇵🇱 Polônia" },
  { value: "351", label: "+351 🇵🇹 Portugal" },
  { value: "974", label: "+974 🇶🇦 Qatar" },
  { value: "44", label: "+44 🇬🇧 Reino Unido" },
  { value: "236", label: "+236 🇨🇫 Rep. Centro-Africana" },
  { value: "243", label: "+243 🇨🇩 Rep. Dem. do Congo" },
  { value: "420", label: "+420 🇨🇿 República Tcheca" },
  { value: "40", label: "+40 🇷🇴 Romênia" },
  { value: "250", label: "+250 🇷🇼 Ruanda" },
  { value: "7", label: "+7 🇷🇺 Rússia" },
  { value: "966", label: "+966 🇸🇦 Arábia Saudita" },
  { value: "221", label: "+221 🇸🇳 Senegal" },
  { value: "381", label: "+381 🇷🇸 Sérvia" },
  { value: "65", label: "+65 🇸🇬 Singapura" },
  { value: "963", label: "+963 🇸🇾 Síria" },
  { value: "252", label: "+252 🇸🇴 Somália" },
  { value: "94", label: "+94 🇱🇰 Sri Lanka" },
  { value: "268", label: "+268 🇸🇿 Suazilândia" },
  { value: "249", label: "+249 🇸🇩 Sudão" },
  { value: "211", label: "+211 🇸🇸 Sudão do Sul" },
  { value: "46", label: "+46 🇸🇪 Suécia" },
  { value: "41", label: "+41 🇨🇭 Suíça" },
  { value: "597", label: "+597 🇸🇷 Suriname" },
  { value: "66", label: "+66 🇹🇭 Tailândia" },
  { value: "886", label: "+886 🇹🇼 Taiwan" },
  { value: "992", label: "+992 🇹🇯 Tajiquistão" },
  { value: "255", label: "+255 🇹🇿 Tanzânia" },
  { value: "670", label: "+670 🇹🇱 Timor-Leste" },
  { value: "228", label: "+228 🇹🇬 Togo" },
  { value: "676", label: "+676 🇹🇴 Tonga" },
  { value: "216", label: "+216 🇹🇳 Tunísia" },
  { value: "993", label: "+993 🇹🇲 Turcomenistão" },
  { value: "90", label: "+90 🇹🇷 Turquia" },
  { value: "380", label: "+380 🇺🇦 Ucrânia" },
  { value: "256", label: "+256 🇺🇬 Uganda" },
  { value: "598", label: "+598 🇺🇾 Uruguai" },
  { value: "998", label: "+998 🇺🇿 Uzbequistão" },
  { value: "678", label: "+678 🇻🇺 Vanuatu" },
  { value: "58", label: "+58 🇻🇪 Venezuela" },
  { value: "84", label: "+84 🇻🇳 Vietnã" },
  { value: "260", label: "+260 🇿🇲 Zâmbia" },
  { value: "263", label: "+263 🇿🇼 Zimbábue" },
];

const CONVENIOS = [
  "Particular",
  "Unimed",
  "SulAmérica",
  "Bradesco Saúde",
  "Amil",
  "NotreDame",
];

const generateFallbackId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

interface Consulta {
  id: string;
  pacienteId: string;
  medicoId: string;
  pacienteNome: string;
  medicoNome: string;
  dataHora: string; // ISO
  tipo: string;
  status:
    | "agendada"
    | "confirmada"
    | "cancelada"
    | "realizada"
    | "faltou"
    | string;
}

interface PacienteUI {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  codigoPais: string;
  ddd: string;
  numeroTelefone: string;
  cpf?: string;
  sexo?: string;
  dataNascimento?: string;
  tipo_sanguineo?: string;
  altura?: number | null;
  peso?: number | null;
  convenio?: string | null;
  numeroCarteirinha?: string | null;
  observacoes?: string | null;
  vip: boolean;
  endereco: EnderecoPaciente;
}

interface PacienteForm {
  id?: string;
  nome: string;
  social_name: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  email: string;
  codigoPais: string;
  ddd: string;
  numeroTelefone: string;
  telefone?: string;
  tipo_sanguineo: string;
  altura: string;
  peso: string;
  convenio: string;
  numeroCarteirinha: string;
  observacoes: string;
  endereco: EnderecoPaciente;
  rg?: string;
  estado_civil?: string;
  profissao?: string;
  telefoneSecundario?: string;
  telefoneReferencia?: string;
  codigo_legado?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  documentos?: { tipo: string; numero: string }[];
}

interface MedicoForm {
  id?: string;
  nome: string;
  email: string;
  crm: string;
  crmUf: string;
  cpf: string;
  telefone: string;
  telefone2: string;
  especialidade: string;
  dataNascimento: string;
  rg: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  senha: string;
}

const buildEmptyPacienteForm = (): PacienteForm => ({
  nome: "",
  social_name: "",
  cpf: "",
  sexo: "",
  dataNascimento: "",
  email: "",
  codigoPais: "55",
  ddd: "",
  numeroTelefone: "",
  telefone: undefined,
  tipo_sanguineo: "",
  altura: "",
  peso: "",
  convenio: "",
  numeroCarteirinha: "",
  observacoes: "",
  endereco: {
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  },
  rg: "",
  estado_civil: "",
  profissao: "",
  telefoneSecundario: "",
  telefoneReferencia: "",
  codigo_legado: "",
  responsavel_nome: "",
  responsavel_cpf: "",
  documentos: [],
});

const buildEmptyMedicoForm = (): MedicoForm => ({
  nome: "",
  email: "",
  crm: "",
  crmUf: "SP",
  cpf: "",
  telefone: "",
  telefone2: "",
  especialidade: "",
  dataNascimento: "",
  rg: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  senha: "",
});

const maskCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let formatted = digits;
  if (digits.length > 3) {
    formatted = formatted.replace(/(\d{3})(\d)/, "$1.$2");
  }
  if (digits.length > 6) {
    formatted = formatted.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  }
  if (digits.length > 9) {
    formatted = formatted.replace(
      /(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
      "$1.$2.$3-$4"
    );
  }
  return { formatted, digits };
};

const maskCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) {
    return digits.replace(/(\d{5})(\d{1,3})/, "$1-$2");
  }
  return digits;
};

const splitTelefone = (telefone?: string) => {
  if (!telefone) {
    return { codigoPais: "55", ddd: "", numeroTelefone: "" };
  }
  const digits = telefone.replace(/\D/g, "");
  if (digits.length <= 9) {
    return { codigoPais: "55", ddd: "", numeroTelefone: digits };
  }
  const numeroTelefone = digits.slice(-9);
  const ddd = digits.length >= 11 ? digits.slice(-11, -9) : "";
  const codigoPais = digits.slice(0, digits.length - 9 - (ddd ? 2 : 0)) || "55";
  return { codigoPais, ddd, numeroTelefone };
};

const composeTelefone = (codigoPais: string, ddd: string, numero: string) => {
  const sanitizedCodigo = codigoPais.replace(/\D/g, "");
  const sanitizedDDD = ddd.replace(/\D/g, "");
  const sanitizedNumero = numero.replace(/\D/g, "");
  if (!sanitizedCodigo && !sanitizedDDD && !sanitizedNumero) {
    return undefined;
  }
  let formatted = sanitizedNumero;
  if (sanitizedNumero.length > 5) {
    formatted = sanitizedNumero.replace(/(\d{5})(\d{1,4})?/, "$1-$2");
  }
  if (sanitizedDDD) {
    formatted = `(${sanitizedDDD}) ${formatted}`;
  }
  if (sanitizedCodigo) {
    formatted = `+${sanitizedCodigo} ${formatted}`;
  }
  return formatted;
};

const normalizePaciente = (data: PacienteServiceModel): PacienteUI => {
  const id = (data as { id?: string }).id || generateFallbackId();
  const telefoneInfo = splitTelefone(data.telefone);
  return {
    id,
    nome: data.nome ?? "",
    email: data.email ?? "",
    telefone: data.telefone ?? undefined,
    codigoPais: telefoneInfo.codigoPais || "55",
    ddd: telefoneInfo.ddd,
    numeroTelefone: telefoneInfo.numeroTelefone,
    cpf: data.cpf ?? "",
    sexo: data.sexo ?? "",
    dataNascimento: data.dataNascimento ?? "",
    tipo_sanguineo:
      (data as { tipo_sanguineo?: string }).tipo_sanguineo ||
      (data as { tipoSanguineo?: string }).tipoSanguineo ||
      "",
    altura:
      (data as { altura?: number }).altura ??
      (data as { alturaM?: number }).alturaM ??
      null,
    peso:
      (data as { peso?: number }).peso ??
      (data as { pesoKg?: number }).pesoKg ??
      null,
    convenio: data.convenio ?? null,
    numeroCarteirinha: data.numeroCarteirinha ?? null,
    observacoes: data.observacoes ?? null,
    vip: Boolean((data as { vip?: boolean }).vip),
    endereco: {
      rua: data.endereco?.rua ?? "",
      numero: data.endereco?.numero ?? "",
      complemento: data.endereco?.complemento ?? "",
      bairro: data.endereco?.bairro ?? "",
      cidade: data.endereco?.cidade ?? "",
      estado: data.endereco?.estado ?? "",
      cep: data.endereco?.cep ?? "",
    },
  };
};

const buildPacienteFormFromPaciente = (paciente: PacienteUI): PacienteForm => {
  const { formatted } = maskCpf(paciente.cpf ?? "");
  return {
    id: paciente.id,
    nome: paciente.nome,
    social_name: "",
    cpf: formatted,
    sexo: paciente.sexo ?? "",
    dataNascimento: paciente.dataNascimento ?? "",
    email: paciente.email ?? "",
    codigoPais: paciente.codigoPais || "55",
    ddd: paciente.ddd,
    numeroTelefone: paciente.numeroTelefone,
    telefone: paciente.telefone,
    tipo_sanguineo: paciente.tipo_sanguineo ?? "",
    altura:
      paciente.altura !== null && paciente.altura !== undefined
        ? String(paciente.altura)
        : "",
    peso:
      paciente.peso !== null && paciente.peso !== undefined
        ? String(paciente.peso)
        : "",
    convenio: paciente.convenio ?? "",
    numeroCarteirinha: paciente.numeroCarteirinha ?? "",
    observacoes: paciente.observacoes ?? "",
    endereco: {
      rua: paciente.endereco.rua ?? "",
      numero: paciente.endereco.numero ?? "",
      complemento: paciente.endereco.complemento ?? "",
      bairro: paciente.endereco.bairro ?? "",
      cidade: paciente.endereco.cidade ?? "",
      estado: paciente.endereco.estado ?? "",
      cep: paciente.endereco.cep ?? "",
    },
  };
};

const formatTelefone = (paciente: PacienteUI) => {
  const composed = composeTelefone(
    paciente.codigoPais,
    paciente.ddd,
    paciente.numeroTelefone
  );
  return composed ?? paciente.telefone ?? "Telefone não informado";
};

const formatEmail = (email?: string) =>
  email ? email.trim().toLowerCase() : "Não informado";

// formatarData e getStatusColor removidos após adoção de ConsultationList

// Formata ISO "YYYY-MM-DDTHH:mm:ss" sem alterar fuso/offset
const formatDateTimeLocal = (iso?: string) => {
  if (!iso) return "";
  const [date, timeRaw] = iso.split("T");
  if (!date) return iso;
  const [y, m, d] = date.split("-");
  const time = (timeRaw || "").slice(0, 8); // HH:mm:ss
  if (y && m && d && time) return `${d}/${m}/${y}, ${time}`;
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
};

const buildMedicoTelefone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 10) {
    return digits.replace(
      /(\d{2})(\d{4})(\d{0,4})?/,
      (_, d1: string, d2: string, d3?: string) => {
        if (d3) {
          return `(${d1}) ${d2}-${d3}`;
        }
        return `(${d1}) ${d2}`;
      }
    );
  }
  return digits.replace(
    /(\d{2})(\d{2})(\d{5})(\d{0,4})?/,
    (_: string, pais: string, ddd: string, n1: string, n2?: string) => {
      const base = `+${pais} (${ddd}) ${n1}`;
      return n2 ? `${base}-${n2}` : base;
    }
  );
};

// Mapear status da API para status da UI
const mapAppointmentStatus = (status: string): Consulta["status"] => {
  const statusMap: Record<string, Consulta["status"]> = {
    requested: "agendada",
    confirmed: "confirmada",
    cancelled: "cancelada",
    completed: "realizada",
    no_show: "faltou",
    checked_in: "confirmada",
    in_progress: "confirmada",
  };
  return statusMap[status] || "agendada";
};

// Converter Appointment da API para Consulta da UI
const appointmentToConsulta = (
  apt: Appointment,
  pacientes: PacienteUI[],
  medicos: Medico[]
): Consulta => {
  const paciente = pacientes.find((p) => p.id === apt.patient_id);
  const medico = medicos.find((m) => m.id === apt.doctor_id);

  return {
    id: apt.id || "",
    pacienteId: apt.patient_id || "",
    medicoId: apt.doctor_id || "",
    pacienteNome: paciente?.nome || "Paciente não encontrado",
    medicoNome: medico?.nome || "Médico não encontrado",
    dataHora: apt.scheduled_at || "",
    tipo: apt.appointment_type || "consulta",
    status: mapAppointmentStatus(apt.status || "requested"),
  };
};

const PainelSecretaria = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("pacientes");
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loadingRelatorios, setLoadingRelatorios] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportForm, setReportForm] = useState({
    patientId: "",
    orderNumber: "",
    exam: "",
    diagnosis: "",
    conclusion: "",
    dueAt: "", // YYYY-MM-DD
    status: "draft" as "draft" | "pending" | "completed" | "cancelled",
  });
  const [reportModalMode, setReportModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Gera número padrão no formato exato solicitado: REL-YYYY-MM-XXXXXX (6 caracteres alfanuméricos)
  const generateDefaultOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `REL-${year}-${month}-${suffix}`;
  };
  const ORDER_NUMBER_PATTERN = /^REL-\d{4}-\d{2}-[A-Z0-9]{6}$/;
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);
  const [reportDetailsLoading, setReportDetailsLoading] = useState(false);
  const [reportDetails, setReportDetails] = useState<Relatorio | null>(null);

  const openReportDetails = async (id?: string) => {
    if (!id) return;
    setReportDetailsLoading(true);
    setReportDetails(null);
    try {
      const res = await relatorioService.buscarRelatorioPorId(id);
      if (res.success && res.data) {
        setReportDetails(res.data);
        setReportDetailsOpen(true);
      } else {
        toast.error(res.error || "Erro ao carregar relatório");
      }
    } catch {
      toast.error("Erro ao carregar relatório");
    } finally {
      setReportDetailsLoading(false);
    }
  };
  const [selectedDoctorAgenda, setSelectedDoctorAgenda] = useState<string>("");
  const [agendaDoctors, setAgendaDoctors] = useState<Medico[]>([]);

  const [pacientes, setPacientes] = useState<PacienteUI[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [agendamentosLoading, setAgendamentosLoading] = useState(false);
  // Estados de filtros de agendamentos
  const [consultaFiltroMedico, setConsultaFiltroMedico] = useState<string>("");
  const [consultaFiltroPaciente, setConsultaFiltroPaciente] =
    useState<string>("");
  const [consultaFiltroStatus, setConsultaFiltroStatus] = useState<string>("");
  const [consultaFiltroDataDe, setConsultaFiltroDataDe] = useState<string>("");
  const [consultaFiltroDataAte, setConsultaFiltroDataAte] =
    useState<string>("");
  // Estado para lista de pacientes com dados de último/próximo atendimento
  const [pacientesEnriquecidos, setPacientesEnriquecidos] = useState<
    Record<string, { ultimo?: string | null; proximo?: string | null }>
  >({});

  const [searchTerm, setSearchTerm] = useState("");
  const [searchId, setSearchId] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState<string>("");
  const [filterBirthday, setFilterBirthday] = useState(false);
  const [filterVip, setFilterVip] = useState(false);

  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientModalMode, setPatientModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [formDataPaciente, setFormDataPaciente] = useState<PacienteForm>(
    buildEmptyPacienteForm()
  );
  // Removida validação de CPF (local + externa)

  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorModalMode, setDoctorModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [formDataMedico, setFormDataMedico] = useState<MedicoForm>(
    buildEmptyMedicoForm()
  );

  // Estado para modal de agendamento
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulePatientId, setSchedulePatientId] = useState("");
  const [schedulePatientName, setSchedulePatientName] = useState("");

  const carregarPacientes = useCallback(async () => {
    try {
      console.log("[PainelSecretaria] Carregando pacientes...");
      const resp = await listPatients();
      console.log("[PainelSecretaria] Resposta pacientes:", resp);
      const lista = resp.data || [];
      console.log("[PainelSecretaria] Pacientes recebidos:", lista.length);
      setPacientes(lista.map(normalizePaciente));
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast.error("Erro ao carregar pacientes");
    }
  }, []);

  const carregarMedicos = useCallback(async () => {
    try {
      console.log("[PainelSecretaria] Carregando médicos...");
      const resposta = await medicoService.listarMedicos();
      console.log("[PainelSecretaria] Resposta médicos:", resposta);
      if (resposta.success && resposta.data) {
        console.log(
          "[PainelSecretaria] Médicos recebidos:",
          resposta.data.data.length
        );
        setMedicos(resposta.data.data);
      } else if (resposta.error) {
        console.error("[PainelSecretaria] Erro na resposta:", resposta.error);
        toast.error(resposta.error);
      }
    } catch (error) {
      console.error("Erro ao carregar médicos:", error);
      toast.error("Erro ao carregar médicos");
    }
  }, []);

  const carregarRelatorios = useCallback(async () => {
    setLoadingRelatorios(true);
    try {
      const response = await relatorioService.listarRelatorios();
      if (response.success && response.data) {
        setRelatorios(response.data);
      } else {
        toast.error("Erro ao carregar relatórios");
      }
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoadingRelatorios(false);
    }
  }, []);

  const carregarAgendamentos = useCallback(async () => {
    setAgendamentosLoading(true);
    try {
      console.log("[PainelSecretaria] Carregando agendamentos...");
      const response = await appointmentService.listAppointments();
      console.log("[PainelSecretaria] Resposta agendamentos:", response);
      if (response.success && response.data) {
        console.log(
          "[PainelSecretaria] Agendamentos recebidos:",
          response.data.length
        );
        setAgendamentos(response.data);
      } else if (response.error) {
        console.error("[PainelSecretaria] Erro na resposta:", response.error);
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setAgendamentosLoading(false);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarPacientes(),
        carregarMedicos(),
        carregarRelatorios(),
        carregarAgendamentos(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    carregarPacientes,
    carregarMedicos,
    carregarRelatorios,
    carregarAgendamentos,
  ]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (activeTab === "relatorios") {
      void carregarRelatorios();
    }
  }, [activeTab, carregarRelatorios]);

  useEffect(() => {
    (async () => {
      const resp = await medicoService.listarMedicos({ status: "ativo" });
      if (resp.success && resp.data) {
        setAgendaDoctors(resp.data.data);
        if (!selectedDoctorAgenda && resp.data.data.length) {
          setSelectedDoctorAgenda(resp.data.data[0].id);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetPacienteForm = useCallback(() => {
    setFormDataPaciente(buildEmptyPacienteForm());
  }, []);

  const resetMedicoForm = useCallback(() => {
    setFormDataMedico(buildEmptyMedicoForm());
  }, []);

  const handleLogout = useCallback(() => {
    console.log("[PainelSecretaria] Fazendo logout...");
    logout();
    toast.success("Sessão encerrada");
    navigate("/login-secretaria");
  }, [logout, navigate]);

  const openCreatePacienteModal = useCallback(() => {
    resetPacienteForm();
    setPatientModalMode("create");
    setPatientModalOpen(true);
  }, [resetPacienteForm]);

  const openEditPacienteModal = useCallback((paciente: PacienteUI) => {
    setFormDataPaciente(buildPacienteFormFromPaciente(paciente));
    setPatientModalMode("edit");
    setPatientModalOpen(true);
  }, []);

  const closePacienteModal = useCallback(() => {
    setPatientModalOpen(false);
  }, []);

  const openCreateMedicoModal = useCallback(() => {
    resetMedicoForm();
    setDoctorModalMode("create");
    setDoctorModalOpen(true);
  }, [resetMedicoForm]);

  const openEditMedicoModal = useCallback((medico: Medico) => {
    const medicoDetalhado = medico as Medico & Partial<Record<string, string>>;
    setFormDataMedico({
      id: medico.id,
      nome: medico.nome || "",
      email: medico.email || "",
      crm: medico.crm || "",
      crmUf: medicoDetalhado.crmUf || "",
      cpf: medicoDetalhado.cpf || "",
      telefone: medico.telefone || "",
      telefone2: medicoDetalhado.telefone2 || "",
      especialidade: medico.especialidade || "",
      dataNascimento: medicoDetalhado.dataNascimento || "",
      rg: medicoDetalhado.rg || "",
      cep: medicoDetalhado.cep || "",
      rua: medicoDetalhado.rua || "",
      numero: medicoDetalhado.numero || "",
      complemento: medicoDetalhado.complemento || "",
      bairro: medicoDetalhado.bairro || "",
      cidade: medicoDetalhado.cidade || "",
      estado: medicoDetalhado.estado || "",
      senha: "",
    });
    setDoctorModalMode("edit");
    setDoctorModalOpen(true);
  }, []);

  const closeMedicoModal = useCallback(() => {
    setDoctorModalOpen(false);
  }, []);

  const handleBuscarPorId = useCallback(async () => {
    if (!searchId) {
      toast.error("Informe o ID do paciente");
      return;
    }
    setLoading(true);
    try {
      const resp = await getPatientById(searchId);
      if (resp.success && resp.data) {
        setPacientes([normalizePaciente(resp.data)]);
      } else {
        toast.error(resp.error || "Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar paciente:", error);
      toast.error("Paciente não encontrado");
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const handleDeletePaciente = useCallback(async (paciente: PacienteUI) => {
    if (!window.confirm(`Deseja remover o paciente ${paciente.nome}?`)) {
      return;
    }
    try {
      console.log("[PainelSecretaria] Deletando paciente:", {
        id: paciente.id,
        nome: paciente.nome,
      });

      const result = await deletePatient(paciente.id);

      console.log("[PainelSecretaria] Resultado da deleção:", result);

      if (result.success) {
        setPacientes((prev) => prev.filter((p) => p.id !== paciente.id));
        toast.success("Paciente removido com sucesso");
      } else {
        console.error("[PainelSecretaria] Falha ao deletar:", result.error);
        toast.error(result.error || "Erro ao remover paciente");
      }
    } catch (error) {
      console.error("[PainelSecretaria] Erro ao remover paciente:", error);
      toast.error("Erro ao remover paciente");
    }
  }, []);

  const handleDeleteMedico = useCallback(async (medico: Medico) => {
    if (!window.confirm(`Deseja remover o médico ${medico.nome}?`)) {
      return;
    }
    try {
      const resposta = await medicoService.deletarMedico(medico.id);
      if (resposta.success) {
        setMedicos((prev) => prev.filter((m) => m.id !== medico.id));
        toast.success("Médico removido");
      } else if (resposta.error) {
        toast.error(resposta.error);
      }
    } catch (error) {
      console.error("Erro ao remover médico:", error);
      toast.error("Erro ao remover médico");
    }
  }, []);

  const handleCpfChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { formatted } = maskCpf(event.target.value);
      setFormDataPaciente((prev) => ({ ...prev, cpf: formatted }));
    },
    []
  );

  const handleCepLookup = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const endereco = await buscarEnderecoViaCEP(digits);
      if (!endereco) {
        toast.error("CEP não encontrado");
        return;
      }
      setFormDataPaciente((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          rua: endereco.rua ?? prev.endereco.rua,
          bairro: endereco.bairro ?? prev.endereco.bairro,
          cidade: endereco.cidade ?? prev.endereco.cidade,
          estado: endereco.estado ?? prev.endereco.estado,
          cep: endereco.cep ?? rawCep,
        },
      }));
    } catch (error) {
      console.warn("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    }
  }, []);

  const handleCepLookupMedico = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const endereco = await buscarEnderecoViaCEP(digits);
      if (!endereco) {
        toast.error("CEP não encontrado");
        return;
      }
      setFormDataMedico((prev) => ({
        ...prev,
        rua: endereco.rua ?? prev.rua,
        bairro: endereco.bairro ?? prev.bairro,
        cidade: endereco.cidade ?? prev.cidade,
        estado: endereco.estado ?? prev.estado,
        cep: endereco.cep ?? rawCep,
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch (error) {
      console.warn("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    }
  }, []);

  const handleSubmitPaciente = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const { digits } = maskCpf(formDataPaciente.cpf);

      // Validação de CPF removida – apenas mascaramento e envio dos dígitos.

      setLoading(true);
      try {
        // Validação externa de CPF removida

        const telefone =
          composeTelefone(
            formDataPaciente.codigoPais,
            formDataPaciente.ddd,
            formDataPaciente.numeroTelefone
          ) ?? formDataPaciente.telefone;

        const payload: Partial<PacienteServiceModel> = {
          nome: formDataPaciente.nome,
          cpf: digits,
          email: formDataPaciente.email,
          telefone,
          sexo: formDataPaciente.sexo,
          dataNascimento: formDataPaciente.dataNascimento,
          tipoSanguineo: formDataPaciente.tipo_sanguineo,
          convenio: formDataPaciente.convenio,
          numeroCarteirinha: formDataPaciente.numeroCarteirinha,
          observacoes: formDataPaciente.observacoes,
          endereco: formDataPaciente.endereco,
        };

        // Campos estendidos ainda não suportados pelo backend oficial (armazenar localmente para futura sincronização)
        interface ExtendedPacienteMeta {
          rg?: string;
          estado_civil?: string;
          profissao?: string;
          telefoneSecundario?: string;
          telefoneReferencia?: string;
          codigo_legado?: string;
          responsavel_nome?: string;
          responsavel_cpf?: string;
          documentos?: { tipo: string; numero: string }[];
          updatedAt?: string;
        }
        const extended: ExtendedPacienteMeta = {
          rg: formDataPaciente.rg,
          estado_civil: formDataPaciente.estado_civil,
          profissao: formDataPaciente.profissao,
          telefoneSecundario: formDataPaciente.telefoneSecundario,
          telefoneReferencia: formDataPaciente.telefoneReferencia,
          codigo_legado: formDataPaciente.codigo_legado,
          responsavel_nome: formDataPaciente.responsavel_nome,
          responsavel_cpf: formDataPaciente.responsavel_cpf,
          documentos: formDataPaciente.documentos || [],
        };

        // Persistir metadados localmente (namespace pacientes_meta) para fins de prontuário até backend
        try {
          const metaRaw = localStorage.getItem("pacientes_meta") || "{}";
          const meta = JSON.parse(metaRaw) as Record<
            string,
            ExtendedPacienteMeta
          >;
          meta[formDataPaciente.id || digits] = {
            ...(meta[formDataPaciente.id || digits] || {}),
            ...extended,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem("pacientes_meta", JSON.stringify(meta));
        } catch {
          // falha silenciosa
        }

        if (formDataPaciente.altura.trim()) {
          payload.alturaM = Number(formDataPaciente.altura);
        }
        if (formDataPaciente.peso.trim()) {
          payload.pesoKg = Number(formDataPaciente.peso);
        }

        if (patientModalMode === "create") {
          const resp = await createPatient({
            nome: payload.nome || "",
            cpf: payload.cpf || "",
            email: payload.email || "",
            telefone: payload.telefone || "",
            dataNascimento: payload.dataNascimento,
            socialName: undefined,
            sexo: payload.sexo,
            tipoSanguineo: payload.tipoSanguineo,
            pesoKg: payload.pesoKg,
            alturaM: payload.alturaM,
            endereco: payload.endereco,
          });
          if (resp.success && resp.data) {
            setPacientes((prev) => [...prev, normalizePaciente(resp.data!)]);
            toast.success("Paciente cadastrado com sucesso!");
          } else {
            toast.error(resp.error || "Falha ao cadastrar paciente");
            return;
          }
        } else if (patientModalMode === "edit" && formDataPaciente.id) {
          const resp = await updatePatient(formDataPaciente.id, {
            nome: payload.nome || "",
            cpf: payload.cpf || "",
            email: payload.email || "",
            telefone: payload.telefone || "",
            dataNascimento: payload.dataNascimento,
            socialName: undefined,
            sexo: payload.sexo,
            tipoSanguineo: payload.tipoSanguineo,
            pesoKg: payload.pesoKg,
            alturaM: payload.alturaM,
            endereco: payload.endereco,
          });
          if (resp.success && resp.data) {
            const normalizado = normalizePaciente(resp.data!);
            setPacientes((prev) =>
              prev.map((p) => (p.id === formDataPaciente.id ? normalizado : p))
            );
            toast.success("Paciente atualizado com sucesso!");
          } else {
            toast.error(resp.error || "Falha ao atualizar paciente");
            return;
          }
        }

        resetPacienteForm();
        setPatientModalOpen(false);
      } catch (error) {
        console.error("Erro ao salvar paciente:", error);
        toast.error("Erro ao salvar paciente");
      } finally {
        setLoading(false);
      }
    },
    [formDataPaciente, patientModalMode, resetPacienteForm]
  );

  const handleSubmitMedico = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      try {
        if (doctorModalMode === "create") {
          const payload: MedicoCreate = {
            nome: formDataMedico.nome,
            email: formDataMedico.email,
            crm: formDataMedico.crm,
            crmUf: formDataMedico.crmUf,
            cpf: formDataMedico.cpf,
            telefone: formDataMedico.telefone,
            telefone2: formDataMedico.telefone2,
            especialidade: formDataMedico.especialidade,
            dataNascimento: formDataMedico.dataNascimento,
            rg: formDataMedico.rg,
            cep: formDataMedico.cep,
            rua: formDataMedico.rua,
            numero: formDataMedico.numero,
            complemento: formDataMedico.complemento,
            bairro: formDataMedico.bairro,
            cidade: formDataMedico.cidade,
            estado: formDataMedico.estado,
            status: "ativo",
          };
          const resposta = await medicoService.criarMedico(payload);
          if (resposta.success && resposta.data) {
            setMedicos((prev) => [...prev, resposta.data!]);
            toast.success("Médico cadastrado com sucesso!");
          } else if (resposta.error) {
            toast.error(resposta.error);
            return;
          }
        } else if (doctorModalMode === "edit" && formDataMedico.id) {
          const payload: MedicoUpdate = {
            nome: formDataMedico.nome,
            email: formDataMedico.email,
            crm: formDataMedico.crm,
            crmUf: formDataMedico.crmUf,
            cpf: formDataMedico.cpf,
            telefone: formDataMedico.telefone,
            telefone2: formDataMedico.telefone2,
            especialidade: formDataMedico.especialidade,
            dataNascimento: formDataMedico.dataNascimento,
            rg: formDataMedico.rg,
            cep: formDataMedico.cep,
            rua: formDataMedico.rua,
            numero: formDataMedico.numero,
            complemento: formDataMedico.complemento,
            bairro: formDataMedico.bairro,
            cidade: formDataMedico.cidade,
            estado: formDataMedico.estado,
          };
          const resposta = await medicoService.atualizarMedico(
            formDataMedico.id,
            payload
          );
          if (resposta.success && resposta.data) {
            setMedicos((prev) =>
              prev.map((m) => (m.id === formDataMedico.id ? resposta.data! : m))
            );
            toast.success("Médico atualizado com sucesso!");
          } else if (resposta.error) {
            toast.error(resposta.error);
            return;
          }
        }

        resetMedicoForm();
        setDoctorModalOpen(false);
      } catch (error) {
        console.error("Erro ao salvar médico:", error);
        toast.error("Erro ao salvar médico");
      } finally {
        setLoading(false);
      }
    },
    [doctorModalMode, formDataMedico, resetMedicoForm]
  );

  const conveniosDisponiveis = useMemo(() => {
    const values = new Set<string>();
    CONVENIOS.forEach((item) => values.add(item));
    pacientes.forEach((paciente) => {
      const convenio = paciente.convenio?.trim();
      if (convenio) {
        values.add(convenio);
      }
    });
    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [pacientes]);

  const pacientesFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    const convenioFiltro = selectedConvenio.trim().toLowerCase();
    const currentMonth = new Date().getMonth();

    return pacientes.filter((paciente) => {
      const nome = paciente.nome?.toLowerCase() ?? "";
      const email = (paciente.email ?? "").toLowerCase();
      const matchesSearch =
        !termo || nome.includes(termo) || email.includes(termo);
      if (!matchesSearch) return false;

      const matchesConvenio =
        !convenioFiltro ||
        (paciente.convenio ?? "").trim().toLowerCase() === convenioFiltro;
      if (!matchesConvenio) return false;

      if (filterVip && !paciente.vip) return false;

      if (filterBirthday) {
        if (!paciente.dataNascimento) return false;
        const data = new Date(paciente.dataNascimento);
        if (Number.isNaN(data.getTime())) return false;
        if (data.getMonth() !== currentMonth) return false;
      }

      return true;
    });
  }, [pacientes, searchTerm, selectedConvenio, filterVip, filterBirthday]);

  // Converter agendamentos da API para o formato de consultas da UI
  const consultas = useMemo(() => {
    return agendamentos.map((apt) =>
      appointmentToConsulta(apt, pacientes, medicos)
    );
  }, [agendamentos, pacientes, medicos]);

  // Enriquecer pacientes com info de consultas
  useEffect(() => {
    const baseIds = new Set(pacientesFiltrados.map((p) => p.id));
    const enriq: Record<
      string,
      { ultimo?: string | null; proximo?: string | null }
    > = {};

    baseIds.forEach((id) => {
      const consultasPaciente = consultas.filter((c) => c.pacienteId === id);
      if (consultasPaciente.length === 0) {
        enriq[id] = { ultimo: null, proximo: null };
        return;
      }

      const agora = new Date();
      const passadas = consultasPaciente
        .filter((c) => new Date(c.dataHora) < agora)
        .sort(
          (a, b) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
        );
      const futuras = consultasPaciente
        .filter((c) => new Date(c.dataHora) >= agora)
        .sort(
          (a, b) =>
            new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
        );

      enriq[id] = {
        ultimo: passadas[0]
          ? new Date(passadas[0].dataHora).toLocaleDateString("pt-BR", {
              dateStyle: "short",
            })
          : null,
        proximo: futuras[0]
          ? new Date(futuras[0].dataHora).toLocaleDateString("pt-BR", {
              dateStyle: "short",
            })
          : null,
      };
    });

    setPacientesEnriquecidos(enriq);
  }, [pacientesFiltrados, consultas]);

  const medicosFiltrados = useMemo(() => {
    const termo = searchTerm.toLowerCase();
    return medicos.filter(
      (medico) =>
        medico.nome.toLowerCase().includes(termo) ||
        (medico.especialidade ?? "").toLowerCase().includes(termo)
    );
  }, [medicos, searchTerm]);

  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();
        if (
          !(
            c.pacienteNome.toLowerCase().includes(termo) ||
            c.medicoNome.toLowerCase().includes(termo) ||
            c.tipo.toLowerCase().includes(termo)
          )
        ) {
          return false;
        }
      }
      if (
        consultaFiltroMedico &&
        c.medicoNome !== consultaFiltroMedico &&
        c.medicoNome !== consultaFiltroMedico
      ) {
        // ajuste: filtro usa id, adaptar quando mapeamento existir
      }
      if (consultaFiltroStatus && c.status !== consultaFiltroStatus)
        return false;
      if (consultaFiltroDataDe) {
        if (new Date(c.dataHora) < new Date(consultaFiltroDataDe)) return false;
      }
      if (consultaFiltroDataAte) {
        if (
          new Date(c.dataHora) > new Date(consultaFiltroDataAte + "T23:59:59")
        )
          return false;
      }
      if (
        consultaFiltroPaciente &&
        c.pacienteNome !== consultaFiltroPaciente &&
        c.pacienteNome !== consultaFiltroPaciente
      ) {
        // idem futuro mapeamento por id
      }
      return true;
    });
  }, [
    consultas,
    searchTerm,
    consultaFiltroMedico,
    consultaFiltroPaciente,
    consultaFiltroStatus,
    consultaFiltroDataDe,
    consultaFiltroDataAte,
  ]);

  // Funções para manipular agendamentos via API
  const alterarStatusConsulta = async (id: string, novoStatus: string) => {
    try {
      // Mapear status da UI para status da API
      const statusMap: Record<
        string,
        | "requested"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
        | "checked_in"
        | "in_progress"
      > = {
        agendada: "requested",
        confirmada: "confirmed",
        cancelada: "cancelled",
        realizada: "completed",
        faltou: "no_show",
      };
      const apiStatus = statusMap[novoStatus] || "requested";

      const resp = await appointmentService.updateAppointment(id, {
        status: apiStatus,
      });
      if (resp.success) {
        await carregarAgendamentos();
        toast.success("Status atualizado");
      } else {
        toast.error(resp.error || "Falha ao atualizar");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const deletarConsulta = async (id: string) => {
    const confirma = window.confirm("Confirma excluir este agendamento?");
    if (!confirma) return;
    try {
      const resp = await appointmentService.deleteAppointment(id);
      if (resp.success) {
        await carregarAgendamentos();
        toast.success("Agendamento excluído");
      } else {
        toast.error(resp.error || "Falha ao excluir");
      }
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  // Agendamentos são carregados via API no carregarDados()

  const isInitialLoading =
    loading &&
    !patientModalOpen &&
    !doctorModalOpen &&
    pacientes.length === 0 &&
    medicos.length === 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando painel da secretária...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 high-contrast:bg-black">
  <header className="bg-white/90 dark:bg-gray-800/90 high-contrast:bg-black shadow-sm border-b dark:border-gray-700 high-contrast:border-gray-700">
  <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between high-contrast:text-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white high-contrast:text-black high-contrast:font-extrabold">
              Painel da Secretária
            </h1>
            <p className="text-gray-600 dark:text-white high-contrast:text-black high-contrast:font-bold">
              Gerencie pacientes, médicos e consultas
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openCreatePacienteModal}
              className="bg-green-600 text-white high-contrast:bg-black high-contrast:text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Paciente
            </button>
            <button
              onClick={openCreateMedicoModal}
              className="bg-blue-600 text-white high-contrast:bg-black high-contrast:text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Novo Médico
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white high-contrast:bg-black high-contrast:text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

  <nav className="bg-white/90 dark:bg-gray-800/90 high-contrast:bg-black border-b dark:border-gray-700 high-contrast:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
            {[
              { id: "dashboard" as TabId, label: "Dashboard", icon: Activity },
              { id: "pacientes" as TabId, label: "Pacientes", icon: Users },
              { id: "medicos" as TabId, label: "Médicos", icon: Users },
              { id: "consultas" as TabId, label: "Consultas", icon: Calendar },
              { id: "agenda" as TabId, label: "Agenda", icon: Calendar },
              {
                id: "relatorios" as TabId,
                label: "Relatórios",
                icon: FileText,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 ${
                    selected
                      ? "border-green-500 text-green-600 high-contrast:text-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 high-contrast:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

  <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === "dashboard" && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600">
                Pacientes cadastrados
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {pacientes.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600">
                Médicos ativos
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {medicos.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600">
                Consultas programadas
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {consultas.length}
              </p>
            </div>
          </section>
        )}

        {activeTab === "pacientes" && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar pacientes por nome ou email..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Buscar paciente por ID"
                      value={searchId}
                      onChange={(event) => setSearchId(event.target.value)}
                      className="border px-3 py-2 rounded-lg w/full md:w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBuscarPorId}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                      >
                        Buscar
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSearchId("");
                          setSelectedConvenio("");
                          setFilterBirthday(false);
                          setFilterVip(false);
                          void carregarPacientes();
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterBirthday}
                        onChange={(event) =>
                          setFilterBirthday(event.target.checked)
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Aniversariantes do mês
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterVip}
                        onChange={(event) => setFilterVip(event.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Somente VIP
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="convenio-filter"
                    >
                      Convênio
                    </label>
                    <select
                      id="convenio-filter"
                      value={selectedConvenio}
                      onChange={(event) =>
                        setSelectedConvenio(event.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                    >
                      <option value="">Todos</option>
                      {conveniosDisponiveis.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <PatientListTable
                pacientes={pacientesFiltrados.map<PatientListItem>((p) => ({
                  id: p.id,
                  nome: p.nome,
                  cpf: p.cpf,
                  email: formatEmail(p.email),
                  telefoneFormatado: formatTelefone(p),
                  convenio: p.convenio,
                  vip: p.vip,
                  cidade: p.endereco?.cidade,
                  estado: p.endereco?.estado,
                  ultimoAtendimento:
                    pacientesEnriquecidos[p.id]?.ultimo ?? null,
                  proximoAtendimento:
                    pacientesEnriquecidos[p.id]?.proximo ?? null,
                }))}
                onEdit={(item) => {
                  const original = pacientesFiltrados.find(
                    (pf) => pf.id === item.id
                  );
                  if (original) openEditPacienteModal(original);
                }}
                onDelete={(item) => {
                  const original = pacientesFiltrados.find(
                    (pf) => pf.id === item.id
                  );
                  if (original) void handleDeletePaciente(original);
                }}
                onView={(item) => {
                  navigate(`/pacientes/${encodeURIComponent(item.id)}`);
                }}
                onSchedule={(item) => {
                  setSchedulePatientId(item.id);
                  setSchedulePatientName(item.nome);
                  setScheduleModalOpen(true);
                }}
              />
            </div>
          </section>
        )}

        {activeTab === "medicos" && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-gray-800 high-contrast:bg-black rounded-lg shadow border dark:border-gray-700 high-contrast:border-gray-700">
              <div className="p-6 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar médicos por nome ou especialidade..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 high-contrast:divide-gray-700">
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 high-contrast:bg-black">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Médico
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Especialidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 high-contrast:bg-black divide-y divide-gray-200 dark:divide-gray-700 high-contrast:divide-gray-700">
                    {medicosFiltrados.map((medico) => (
                      <tr
                        key={medico.id}
                        className="bg-white dark:bg-gray-800 high-contrast:bg-black hover:bg-gray-100 dark:hover:bg-gray-700 high-contrast:hover:bg-gray-900"
                      >
                        <td className="px-6 py-4 high-contrast:text-white">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 high-contrast:text-white">
                            Dr(a). {medico.nome || "Sem nome"}
                          </div>
                          <div className="text-sm text-gray-400 dark:text-gray-300 high-contrast:text-white">
                            CRM: {medico.crm || "Não informado"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-300 high-contrast:text-white">
                          {medico.especialidade || "Não informado"}
                        </td>
                        <td className="px-6 py-4 high-contrast:text-white">
                          <div className="text-sm text-gray-900 dark:text-gray-100 high-contrast:text-white">
                            {formatEmail(medico.email)}
                          </div>
                          <div className="text-sm text-gray-400 dark:text-gray-300 high-contrast:text-white">
                            {medico.telefone || "Telefone não informado"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                          <button
                            onClick={() => openEditMedicoModal(medico)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void handleDeleteMedico(medico)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                    {medicosFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          Nenhum médico encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "consultas" && (
          <section className="bg-white dark:bg-gray-800 high-contrast:bg-black rounded-lg shadow border border-gray-200 dark:border-gray-700 high-contrast:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Agendamentos
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => carregarAgendamentos()}
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                  >
                    Atualizar
                  </button>
                  <button
                    onClick={() => {
                      setSchedulePatientId("");
                      setSchedulePatientName("");
                      setScheduleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                    aria-label="Nova consulta"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Consulta
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Busca rápida (paciente, médico ou tipo)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Data de
                  </label>
                  <input
                    type="date"
                    value={consultaFiltroDataDe}
                    onChange={(e) => setConsultaFiltroDataDe(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Data até
                  </label>
                  <input
                    type="date"
                    value={consultaFiltroDataAte}
                    onChange={(e) => setConsultaFiltroDataAte(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    value={consultaFiltroStatus}
                    onChange={(e) => setConsultaFiltroStatus(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos</option>
                    <option value="agendada">Agendada</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="realizada">Realizada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Paciente (nome)
                  </label>
                  <input
                    value={consultaFiltroPaciente}
                    onChange={(e) => setConsultaFiltroPaciente(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Filtrar paciente"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Médico (nome)
                  </label>
                  <input
                    value={consultaFiltroMedico}
                    onChange={(e) => setConsultaFiltroMedico(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Filtrar médico"
                  />
                </div>
              </div>
            </div>
            <div className="p-6">
              {agendamentosLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : consultasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Nenhum agendamento encontrado. Use a aba "Agenda" para
                  gerenciar horários dos médicos.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 high-contrast:divide-gray-700">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 high-contrast:bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Médico
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 high-contrast:bg-black divide-y divide-gray-200 dark:divide-gray-700 high-contrast:divide-gray-700">
                      {consultasFiltradas.map((consulta) => (
                        <tr
                          key={consulta.id}
                          className="bg-white dark:bg-gray-800 high-contrast:bg-black hover:bg-gray-100 dark:hover:bg-gray-700 high-contrast:hover:bg-gray-900"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 high-contrast:text-white">
                            {formatDateTimeLocal(consulta.dataHora)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 high-contrast:text-white">
                            {consulta.pacienteNome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 high-contrast:text-white">
                            {consulta.medicoNome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 high-contrast:text-white">
                            {consulta.tipo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={consulta.status}
                              onChange={(e) =>
                                alterarStatusConsulta(
                                  consulta.id,
                                  e.target.value
                                )
                              }
                              className="text-sm border border-gray-300 dark:border-gray-700 high-contrast:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 high-contrast:bg-black text-gray-900 high-contrast:text-white"
                            >
                              <option value="agendada">Agendada</option>
                              <option value="confirmada">Confirmada</option>
                              <option value="cancelada">Cancelada</option>
                              <option value="realizada">Realizada</option>
                              <option value="faltou">Faltou</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deletarConsulta(consulta.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "agenda" && (
          <section className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gerenciar Agenda Médica
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Médico
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedDoctorAgenda}
                  onChange={(e) => setSelectedDoctorAgenda(e.target.value)}
                >
                  <option value="">-- Selecione um médico --</option>
                  {agendaDoctors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} — {m.especialidade}
                    </option>
                  ))}
                </select>
              </div>
              {!selectedDoctorAgenda && (
                <p className="text-sm text-gray-500 italic">
                  Selecione um médico acima para gerenciar sua disponibilidade e
                  exceções.
                </p>
              )}
            </div>
            {selectedDoctorAgenda && (
              <>
                <DoctorCalendar doctorId={selectedDoctorAgenda} />
                <AvailabilityManager doctorId={selectedDoctorAgenda} />
                <ExceptionsManager doctorId={selectedDoctorAgenda} />
              </>
            )}
          </section>
        )}

        {activeTab === "relatorios" && (
          <section className="bg-white dark:bg-gray-800 high-contrast:bg-black rounded-lg shadow border border-gray-200 dark:border-gray-700 high-contrast:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Relatórios
                </h2>
                <button
                  onClick={() => {
                    setReportModalMode("create");
                    setEditingReportId(null);
                    setReportForm({
                      patientId: "",
                      orderNumber: generateDefaultOrderNumber(),
                      exam: "",
                      diagnosis: "",
                      conclusion: "",
                      dueAt: "",
                      status: "draft",
                    });
                    setReportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                >
                  <Plus className="w-4 h-4" />
                  Novo Relatório
                </button>
              </div>

              {loadingRelatorios ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : relatorios.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Nenhum relatório encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 high-contrast:divide-gray-700">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 high-contrast:bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exame
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 high-contrast:bg-black divide-y divide-gray-200 dark:divide-gray-700 high-contrast:divide-gray-700">
                      {relatorios.map((relatorio) => (
                        <tr
                          key={relatorio.id}
                          className="bg-white dark:bg-gray-800 high-contrast:bg-black hover:bg-gray-100 dark:hover:bg-gray-700 high-contrast:hover:bg-gray-900"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 high-contrast:text-white">
                            {relatorio.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 high-contrast:text-white">
                            {relatorio.exam}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 high-contrast:text-white">
                            {pacientes.find(
                              (p) => p.id === relatorio.patient_id
                            )?.nome || relatorio.patient_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                relatorio.status === "draft"
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 high-contrast:bg-gray-900 high-contrast:text-white"
                                  : relatorio.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 high-contrast:bg-green-900 high-contrast:text-white"
                                  : relatorio.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 high-contrast:bg-yellow-900 high-contrast:text-white"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 high-contrast:bg-red-900 high-contrast:text-white"
                              }`}
                            >
                              {relatorio.status === "draft"
                                ? "Rascunho"
                                : relatorio.status === "completed"
                                ? "Concluído"
                                : relatorio.status === "pending"
                                ? "Pendente"
                                : "Cancelado"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {relatorio.created_at
                              ? new Date(
                                  relatorio.created_at
                                ).toLocaleDateString("pt-BR")
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                            <button
                              onClick={() => openReportDetails(relatorio.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                            >
                              Ver detalhes
                            </button>
                            <button
                              onClick={async () => {
                                if (!relatorio.id) return;
                                setReportModalMode("edit");
                                setEditingReportId(relatorio.id);
                                // Buscar dados mais recentes
                                const res =
                                  await relatorioService.buscarRelatorioPorId(
                                    relatorio.id
                                  );
                                if (res.success && res.data) {
                                  const r = res.data;
                                  setReportForm({
                                    patientId: r.patient_id || "",
                                    orderNumber: r.order_number || "",
                                    exam: r.exam || "",
                                    diagnosis: r.diagnosis || "",
                                    conclusion: r.conclusion || "",
                                    dueAt: r.due_at
                                      ? r.due_at.slice(0, 10)
                                      : "",
                                    status: (r.status &&
                                    [
                                      "draft",
                                      "pending",
                                      "completed",
                                      "cancelled",
                                    ].includes(r.status)
                                      ? r.status
                                      : "draft") as
                                      | "draft"
                                      | "pending"
                                      | "completed"
                                      | "cancelled",
                                  });
                                  setReportModalOpen(true);
                                } else {
                                  toast.error(
                                    res.error || "Erro ao carregar relatório"
                                  );
                                }
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {patientModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-modal-title"
        >
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 id="patient-modal-title" className="text-lg font-semibold">
                  {patientModalMode === "create"
                    ? "Cadastrar Novo Paciente"
                    : "Editar Paciente"}
                </h3>
                <button
                  onClick={closePacienteModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                  aria-label="Fechar modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Preencha todos os campos obrigatórios (*)
              </p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form
                onSubmit={handleSubmitPaciente}
                className="space-y-4 max-h-[70vh] overflow-y-auto px-1"
              >
                {/* Seção: Dados Pessoais */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide border-b pb-1">
                    Dados Pessoais
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.nome}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            nome: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        placeholder="Maria Santos Silva"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Social
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.social_name}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            social_name: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Maria Santos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF *
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.cpf}
                        onChange={handleCpfChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={formDataPaciente.dataNascimento}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            dataNascimento: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sexo *
                      </label>
                      <select
                        value={formDataPaciente.sexo}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            sexo: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção: Contato */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide border-b pb-1">
                    Contato
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formDataPaciente.email}
                      onChange={(event) =>
                        setFormDataPaciente((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      placeholder="maria@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone Celular *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formDataPaciente.codigoPais}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            codigoPais: event.target.value,
                          }))
                        }
                        className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        required
                      >
                        {COUNTRY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={formDataPaciente.ddd}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            ddd: event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 2),
                          }))
                        }
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-center"
                        placeholder="11"
                        required
                      />
                      <input
                        type="tel"
                        value={formDataPaciente.numeroTelefone}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            numeroTelefone: event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 9),
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="99999-9999"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Informações Clínicas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide border-b pb-1">
                    Informações Clínicas
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo Sanguíneo
                      </label>
                      <select
                        value={formDataPaciente.tipo_sanguineo}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            tipo_sanguineo: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Selecione</option>
                        {BLOOD_TYPES.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="0.1"
                        value={formDataPaciente.peso}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            peso: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="65.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Altura (m)
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        max="2.5"
                        step="0.01"
                        value={formDataPaciente.altura}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            altura: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1.65"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Convênio
                      </label>
                      <select
                        value={formDataPaciente.convenio}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            convenio: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Selecione</option>
                        {CONVENIOS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número da Carteirinha
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.numeroCarteirinha}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            numeroCarteirinha: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Número da carteirinha"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Endereço */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide border-b pb-1">
                    Endereço
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={maskCep(formDataPaciente.endereco.cep || "")}
                        onChange={(event) => {
                          const digits = event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 8);
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            endereco: {
                              ...prev.endereco,
                              cep: digits,
                            },
                          }));
                        }}
                        onBlur={(event) => {
                          const digits = event.target.value.replace(/\D/g, "");
                          if (digits.length === 8) {
                            void handleCepLookup(digits);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="01234-567"
                        maxLength={9}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCepLookup(formDataPaciente.endereco.cep || "")
                        }
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                        title="Buscar endereço pelo CEP"
                      >
                        <span className="text-lg">✓</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rua
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.endereco.rua}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            endereco: {
                              ...prev.endereco,
                              rua: event.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Rua das Flores"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.endereco.numero}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            endereco: {
                              ...prev.endereco,
                              numero: event.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.endereco.bairro}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            endereco: {
                              ...prev.endereco,
                              bairro: event.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Centro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.endereco.cidade}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            endereco: {
                              ...prev.endereco,
                              cidade: event.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formDataPaciente.endereco.estado}
                        onChange={(event) =>
                          setFormDataPaciente((prev) => ({
                            ...prev,
                            endereco: {
                              ...prev.endereco,
                              estado: event.target.value.toUpperCase(),
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formDataPaciente.endereco.complemento}
                      onChange={(event) =>
                        setFormDataPaciente((prev) => ({
                          ...prev,
                          endereco: {
                            ...prev.endereco,
                            complemento: event.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Apto 45, Bloco B..."
                    />
                  </div>
                </div>

                {/* Seção: Observações */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b pb-1">
                    Observações Adicionais
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={formDataPaciente.observacoes}
                      onChange={(event) =>
                        setFormDataPaciente((prev) => ({
                          ...prev,
                          observacoes: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Observações gerais sobre o paciente..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-6 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      resetPacienteForm();
                      closePacienteModal();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                  >
                    {loading
                      ? "Salvando..."
                      : patientModalMode === "create"
                      ? "Cadastrar Paciente"
                      : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Relatório */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 id="report-modal-title" className="text-lg font-semibold">
                {reportModalMode === "create"
                  ? "Novo Relatório"
                  : "Editar Relatório"}
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                aria-label="Fechar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reportForm.patientId) {
                  toast.error("Selecione o paciente");
                  return;
                }
                if (!reportForm.orderNumber.trim()) {
                  toast.error("Informe o número do pedido");
                  return;
                }
                if (!ORDER_NUMBER_PATTERN.test(reportForm.orderNumber.trim())) {
                  toast.error(
                    "Formato inválido. Use REL-YYYY-MM-XXXXXX (ex.: REL-2025-10-MUS3TN)"
                  );
                  return;
                }
                setReportSaving(true);
                const dueAtIso = reportForm.dueAt
                  ? `${reportForm.dueAt}T00:00:00`
                  : undefined;
                const resp =
                  reportModalMode === "create"
                    ? await reportService.createReport({
                        patientId: reportForm.patientId,
                        orderNumber: reportForm.orderNumber,
                        exam: reportForm.exam || undefined,
                        diagnosis: reportForm.diagnosis || undefined,
                        conclusion: reportForm.conclusion || undefined,
                        dueAt: dueAtIso,
                        status: reportForm.status,
                      })
                    : editingReportId
                    ? await reportService.updateReport(editingReportId, {
                        patientId: reportForm.patientId,
                        orderNumber: reportForm.orderNumber,
                        exam: reportForm.exam || undefined,
                        diagnosis: reportForm.diagnosis || undefined,
                        conclusion: reportForm.conclusion || undefined,
                        dueAt: dueAtIso,
                        status: reportForm.status,
                      })
                    : { success: false, error: "ID inválido" };
                setReportSaving(false);
                if (resp.success) {
                  toast.success(
                    reportModalMode === "create"
                      ? "Relatório criado"
                      : "Relatório atualizado"
                  );
                  setReportModalOpen(false);
                  setEditingReportId(null);
                  await carregarRelatorios();
                } else {
                  toast.error(resp.error || "Erro ao criar relatório");
                }
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    value={reportForm.patientId}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        patientId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Selecione --</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Pedido *
                  </label>
                  <input
                    type="text"
                    value={reportForm.orderNumber}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        orderNumber: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Ex: REL-2025-10-MUS3TN"
                    pattern="^REL-\d{4}-\d{2}-[A-Z0-9]{6}$"
                    title="Formato: REL-YYYY-MM-XXXXXX (ex.: REL-2025-10-MUS3TN)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exame
                  </label>
                  <input
                    type="text"
                    value={reportForm.exam}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        exam: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Hemograma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo (Data)
                  </label>
                  <input
                    type="date"
                    value={reportForm.dueAt}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        dueAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico
                </label>
                <textarea
                  value={reportForm.diagnosis}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      diagnosis: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conclusão
                </label>
                <textarea
                  value={reportForm.conclusion}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      conclusion: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                  disabled={reportSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                  disabled={reportSaving}
                >
                  {reportSaving
                    ? "Salvando..."
                    : reportModalMode === "create"
                    ? "Criar Relatório"
                    : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Relatório */}
      {reportDetailsOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-details-title"
        >
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 id="report-details-title" className="text-lg font-semibold">
                Detalhes do Relatório
              </h3>
              <button
                onClick={() => setReportDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                aria-label="Fechar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {reportDetailsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : !reportDetails ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  Relatório não encontrado.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Número</div>
                      <div className="text-sm font-medium">
                        {reportDetails.order_number || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Paciente</div>
                      <div className="text-sm font-medium">
                        {pacientes.find(
                          (p) => p.id === reportDetails.patient_id
                        )?.nome ||
                          reportDetails.patient_id ||
                          "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm font-medium capitalize">
                        {reportDetails.status || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Prazo</div>
                      <div className="text-sm font-medium">
                        {reportDetails.due_at
                          ? new Date(reportDetails.due_at).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Criado em</div>
                      <div className="text-sm font-medium">
                        {reportDetails.created_at
                          ? new Date(reportDetails.created_at).toLocaleString(
                              "pt-BR"
                            )
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Atualizado em</div>
                      <div className="text-sm font-medium">
                        {reportDetails.updated_at
                          ? new Date(reportDetails.updated_at).toLocaleString(
                              "pt-BR"
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Exame</div>
                      <div className="text-sm">{reportDetails.exam || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">CID</div>
                      <div className="text-sm">
                        {reportDetails.cid_code || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500">Diagnóstico</div>
                      <div className="text-sm whitespace-pre-wrap">
                        {reportDetails.diagnosis || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500">Conclusão</div>
                      <div className="text-sm whitespace-pre-wrap">
                        {reportDetails.conclusion || "-"}
                      </div>
                    </div>
                  </div>

                  {reportDetails.content_html && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">Conteúdo</div>
                      <div
                        className="prose max-w-none border rounded p-3 bg-gray-50"
                        dangerouslySetInnerHTML={{
                          __html: reportDetails.content_html,
                        }}
                      />
                    </div>
                  )}

                  {reportDetails.content_json && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        Conteúdo (JSON)
                      </div>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {JSON.stringify(reportDetails.content_json, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setReportDetailsOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {doctorModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-modal-title"
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 id="doctor-modal-title" className="text-lg font-semibold">
                  {doctorModalMode === "create"
                    ? "Cadastrar Novo Médico"
                    : "Editar Médico"}
                </h3>
                <button
                  onClick={closeMedicoModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                  aria-label="Fechar modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Preencha todos os campos obrigatórios (*)
              </p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form
                onSubmit={handleSubmitMedico}
                className="space-y-4 max-h-[70vh] overflow-y-auto px-1"
              >
                {/* Seção: Dados Pessoais */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide border-b pb-1">
                    Dados Pessoais
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formDataMedico.nome}
                      onChange={(event) =>
                        setFormDataMedico((prev) => ({
                          ...prev,
                          nome: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Dr. João da Silva"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF *
                      </label>
                      <input
                        type="text"
                        value={maskCpf(formDataMedico.cpf).formatted}
                        onChange={(event) => {
                          const { digits } = maskCpf(event.target.value);
                          setFormDataMedico((prev) => ({
                            ...prev,
                            cpf: digits,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RG
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.rg}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            rg: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00.000.000-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      value={formDataMedico.dataNascimento}
                      onChange={(event) =>
                        setFormDataMedico((prev) => ({
                          ...prev,
                          dataNascimento: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Seção: Dados Profissionais */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide border-b pb-1">
                    Dados Profissionais
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CRM *
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.crm}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            crm: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="123456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UF do CRM *
                      </label>
                      <select
                        value={formDataMedico.crmUf}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            crmUf: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione</option>
                        {[
                          "AC",
                          "AL",
                          "AP",
                          "AM",
                          "BA",
                          "CE",
                          "DF",
                          "ES",
                          "GO",
                          "MA",
                          "MT",
                          "MS",
                          "MG",
                          "PA",
                          "PB",
                          "PR",
                          "PE",
                          "PI",
                          "RJ",
                          "RN",
                          "RS",
                          "RO",
                          "RR",
                          "SC",
                          "SP",
                          "SE",
                          "TO",
                        ].map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidade *
                    </label>
                    <select
                      value={formDataMedico.especialidade}
                      onChange={(event) =>
                        setFormDataMedico((prev) => ({
                          ...prev,
                          especialidade: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione</option>
                      {[
                        "Cardiologia",
                        "Dermatologia",
                        "Endocrinologia",
                        "Gastroenterologia",
                        "Ginecologia",
                        "Neurologia",
                        "Ortopedia",
                        "Pediatria",
                        "Psiquiatria",
                        "Clínico Geral",
                      ].map((especialidade) => (
                        <option key={especialidade} value={especialidade}>
                          {especialidade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seção: Contato */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide border-b pb-1">
                    Contato
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formDataMedico.email}
                      onChange={(event) =>
                        setFormDataMedico((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="medico@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Principal *
                      </label>
                      <input
                        type="tel"
                        value={formDataMedico.telefone}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            telefone: buildMedicoTelefone(event.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Secundário
                      </label>
                      <input
                        type="tel"
                        value={formDataMedico.telefone2}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            telefone2: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(11) 3333-4444"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Endereço (obrigatório) */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide border-b pb-1">
                    Endereço
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={maskCep(formDataMedico.cep)}
                        onChange={(event) => {
                          const digits = event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 8);
                          setFormDataMedico((prev) => ({
                            ...prev,
                            cep: digits,
                          }));
                        }}
                        onBlur={(event) => {
                          const digits = event.target.value.replace(/\D/g, "");
                          if (digits.length === 8) {
                            void handleCepLookupMedico(digits);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00000-000"
                        required
                        maxLength={9}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCepLookupMedico(formDataMedico.cep)
                        }
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                        title="Buscar endereço pelo CEP"
                      >
                        <span className="text-lg">✓</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rua *
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.rua}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            rua: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome da rua"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.numero}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            numero: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.bairro}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            bairro: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bairro"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.cidade}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            cidade: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Cidade"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <input
                        type="text"
                        value={formDataMedico.estado}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            estado: event.target.value.toUpperCase(),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="UF"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formDataMedico.complemento}
                      onChange={(event) =>
                        setFormDataMedico((prev) => ({
                          ...prev,
                          complemento: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Apto, sala, bloco..."
                    />
                  </div>
                </div>

                {/* Seção: Senha (apenas criação) */}
                {doctorModalMode === "create" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide border-b pb-1">
                      Acesso ao Sistema
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senha Provisória *
                      </label>
                      <input
                        type="password"
                        value={formDataMedico.senha}
                        onChange={(event) =>
                          setFormDataMedico((prev) => ({
                            ...prev,
                            senha: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        O médico deverá alterar esta senha no primeiro acesso
                      </p>
                    </div>
                  </div>
                )}

                {doctorModalMode === "edit" && (
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                    A senha permanece inalterada neste fluxo. Se necessário,
                    solicite redefinição pelo suporte.
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t mt-6 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      resetMedicoForm();
                      closeMedicoModal();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  >
                    {loading
                      ? "Salvando..."
                      : doctorModalMode === "create"
                      ? "Cadastrar Médico"
                      : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      <ScheduleAppointmentModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        patientId={schedulePatientId}
        patientName={schedulePatientName}
        onSuccess={() => {
          carregarAgendamentos();
        }}
      />
    </div>
  );
};

export default PainelSecretaria;
