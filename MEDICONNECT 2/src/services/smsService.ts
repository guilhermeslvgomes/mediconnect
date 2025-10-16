import api from "./api";
import ENDPOINTS from "./endpoints";
import { ApiResponse } from "./http";

export interface SMSRequest {
  telefone: string;
  mensagem: string;
  tipo?: "lembrete" | "confirmacao" | "cancelamento";
}

export interface SMSResponse {
  id: string;
  telefone: string;
  mensagem: string;
  status: "enviado" | "pendente" | "falhou";
  enviado_em: string;
}

class SMSService {
  async enviarSMS(smsData: SMSRequest): Promise<ApiResponse<SMSResponse>> {
    try {
      const response = await api.post(ENDPOINTS.SMS, smsData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("Erro ao enviar SMS:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Erro ao enviar SMS"
          : "Erro ao enviar SMS";
      return { success: false, error: errorMessage };
    }
  }

  async enviarLembreteConsulta(
    telefone: string,
    pacienteNome: string,
    medicoNome: string,
    dataHora: string
  ): Promise<ApiResponse<SMSResponse>> {
    const mensagem = `Lembrete: Você tem uma consulta agendada com Dr(a). ${medicoNome} em ${dataHora}. Paciente: ${pacienteNome}. Para reagendar, entre em contato.`;

    return this.enviarSMS({
      telefone,
      mensagem,
      tipo: "lembrete",
    });
  }

  async enviarConfirmacaoConsulta(
    telefone: string,
    pacienteNome: string,
    medicoNome: string,
    dataHora: string
  ): Promise<ApiResponse<SMSResponse>> {
    const mensagem = `Consulta confirmada! Dr(a). ${medicoNome} - ${dataHora}. Paciente: ${pacienteNome}. Chegue 15min antes.`;

    return this.enviarSMS({
      telefone,
      mensagem,
      tipo: "confirmacao",
    });
  }

  async enviarCancelamentoConsulta(
    telefone: string,
    pacienteNome: string,
    medicoNome: string,
    dataHora: string,
    motivo?: string
  ): Promise<ApiResponse<SMSResponse>> {
    const motivoTexto = motivo ? ` Motivo: ${motivo}` : "";
    const mensagem = `Consulta cancelada: Dr(a). ${medicoNome} - ${dataHora}. Paciente: ${pacienteNome}.${motivoTexto} Entre em contato para reagendar.`;

    return this.enviarSMS({
      telefone,
      mensagem,
      tipo: "cancelamento",
    });
  }
}

export const smsService = new SMSService();
export default smsService;
