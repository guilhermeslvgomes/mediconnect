import React, { useState } from "react";
import { format, addDays } from "date-fns";
import toast from "react-hot-toast";
import { consultasLocalService } from "../services/consultasLocalService";

interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  valorConsulta?: number;
}

interface AgendamentoConsultaSimplesProps {
  medico: Medico | null;
}

export default function AgendamentoConsultaSimples({ medico }: AgendamentoConsultaSimplesProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirmAppointment = async () => {
    try {
      if (!medico || !selectedDate) {
        toast.error("Selecione um médico e uma data válida.");
        return;
      }
      const pacienteId = "default";
      const dataHoraFormatted =
        format(selectedDate, "yyyy-MM-dd") + "T" + selectedTime + ":00";
      consultasLocalService.saveConsulta({
        medicoId: medico.id,
        medicoNome: medico.nome,
        especialidade: medico.especialidade,
        dataHora: dataHoraFormatted,
        tipo: "presencial",
        motivo: motivo.trim(),
        status: "agendada",
        valorConsulta: medico.valorConsulta || 0,
        pacienteId
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Consulta agendada com sucesso!");
      setSelectedDate(null);
      setSelectedTime("");
      setMotivo("");
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast.error("Erro ao agendar consulta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Agendar Consulta</h2>
      {medico ? (
        <>
          <div className="mb-4">
            <label>Data:</label>
            <select value={selectedDate?.toISOString() || ""} onChange={e => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}>
              <option value="">Selecione uma data</option>
              {Array.from({ length: 30 }, (_, i) => {
                const date = addDays(new Date(), i + 1);
                if (date.getDay() === 0) return null;
                return (
                  <option key={date.toISOString()} value={date.toISOString()}>{date.toLocaleDateString()}</option>
                );
              })}
            </select>
          </div>
          <div className="mb-4">
            <label>Horário:</label>
            <input value={selectedTime} onChange={e => setSelectedTime(e.target.value)} placeholder="Ex: 09:00" />
          </div>
          <div className="mb-4">
            <label>Motivo:</label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo da consulta" />
          </div>
          <button onClick={handleConfirmAppointment} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
            Agendar
          </button>
        </>
      ) : (
        <div className="text-red-600">Médico não encontrado.</div>
      )}
    </div>
  );
}
