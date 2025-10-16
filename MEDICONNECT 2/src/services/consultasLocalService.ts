// Local storage service for managing patient appointments
export interface ConsultaLocal {
  id: string;
  medicoId: string;
  medicoNome: string;
  especialidade: string;
  dataHora: string; // ISO string
  tipo: "presencial" | "online";
  motivo: string;
  status: "agendada" | "confirmada" | "realizada" | "cancelada";
  valorConsulta: number;
  pacienteId: string;
}

const STORAGE_KEY = "consultasLocais";

class ConsultasLocalService {
  // Get all appointments for a specific patient
  getConsultas(pacienteId: string): ConsultaLocal[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const allConsultas: ConsultaLocal[] = JSON.parse(stored);
      return allConsultas.filter(c => c.pacienteId === pacienteId);
    } catch (error) {
      console.error("Erro ao carregar consultas locais:", error);
      return [];
    }
  }

  // Save a new appointment
  saveConsulta(consulta: Omit<ConsultaLocal, "id">): ConsultaLocal {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allConsultas: ConsultaLocal[] = stored ? JSON.parse(stored) : [];
      
      const newConsulta: ConsultaLocal = {
        ...consulta,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      allConsultas.push(newConsulta);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allConsultas));
      
      return newConsulta;
    } catch (error) {
      console.error("Erro ao salvar consulta local:", error);
      throw new Error("Erro ao salvar consulta");
    }
  }

  // Update appointment status
  updateStatus(consultaId: string, novoStatus: ConsultaLocal["status"]): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      
      const allConsultas: ConsultaLocal[] = JSON.parse(stored);
      const index = allConsultas.findIndex(c => c.id === consultaId);
      
      if (index === -1) return false;
      
      allConsultas[index].status = novoStatus;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allConsultas));
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status da consulta:", error);
      return false;
    }
  }

  // Delete appointment
  deleteConsulta(consultaId: string): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      
      const allConsultas: ConsultaLocal[] = JSON.parse(stored);
      const filtered = allConsultas.filter(c => c.id !== consultaId);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Erro ao deletar consulta:", error);
      return false;
    }
  }

  // Get appointment by ID
  getConsulta(consultaId: string): ConsultaLocal | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const allConsultas: ConsultaLocal[] = JSON.parse(stored);
      return allConsultas.find(c => c.id === consultaId) || null;
    } catch (error) {
      console.error("Erro ao buscar consulta:", error);
      return null;
    }
  }

  // Clear all appointments for a patient (for testing/cleanup)
  clearConsultas(pacienteId: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const allConsultas: ConsultaLocal[] = JSON.parse(stored);
      const filtered = allConsultas.filter(c => c.pacienteId !== pacienteId);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Erro ao limpar consultas:", error);
    }
  }
}

export const consultasLocalService = new ConsultasLocalService();