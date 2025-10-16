// UI/UX refresh: melhorias visuais e de acessibilidade sem alterar a lógica
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { appointmentService } from "../../services";
import pacienteService from "../../services/pacienteService";
import type { Appointment } from "../../services/appointmentService";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  doctorId: string;
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DoctorCalendar: React.FC<Props> = ({ doctorId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [patientsById, setPatientsById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (doctorId) {
      loadAppointments();
      loadPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, currentDate]);

  async function loadAppointments() {
    setLoading(true);
    try {
      const response = await appointmentService.listAppointments();
      if (response.success && response.data) {
        // Filtrar apenas do médico selecionado
        const filtered = response.data.filter(
          (apt) => apt.doctor_id === doctorId
        );
        setAppointments(filtered);
      } else {
        toast.error(response.error || "Erro ao carregar agendamentos");
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    // Carrega pacientes para mapear nome pelo id (render amigável)
    try {
      const res = await pacienteService.listPatients();
      if (res && Array.isArray(res.data)) {
        const map: Record<string, string> = {};
        for (const p of res.data) {
          if (p?.id) map[p.id] = p.nome || p.email || p.cpf || p.id;
        }
        setPatientsById(map);
      } else if (
        res &&
        typeof (res as unknown) === "object" &&
        (
          res as {
            data?: {
              data?: Array<{
                id?: string;
                nome?: string;
                email?: string;
                cpf?: string;
              }>;
            };
          }
        ).data?.data
      ) {
        const list =
          (
            res as {
              data?: {
                data?: Array<{
                  id?: string;
                  nome?: string;
                  email?: string;
                  cpf?: string;
                }>;
              };
            }
          ).data?.data || [];
        const map: Record<string, string> = {};
        for (const p of list) {
          if (p?.id) map[p.id] = p.nome || p.email || p.cpf || p.id;
        }
        setPatientsById(map);
      }
    } catch {
      // silencioso; não bloqueia calendário
    } finally {
      /* no-op */
    }
  }

  function getPatientName(id?: string) {
    if (!id) return "";
    return patientsById[id] || id;
  }

  function getCalendarDays(): CalendarDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);

    // Dia da semana do primeiro dia (0 = domingo)
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Adicionar dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      const dateStr = formatDateISO(date);
      days.push({
        date,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        appointments: getAppointmentsForDate(dateStr),
      });
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateISO(date);
      const isToday = date.getTime() === today.getTime();
      days.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isToday,
        appointments: getAppointmentsForDate(dateStr),
      });
    }

    // Adicionar dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length; // 6 semanas x 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = formatDateISO(date);
      days.push({
        date,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        appointments: getAppointmentsForDate(dateStr),
      });
    }

    return days;
  }

  function formatDateISO(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  function getAppointmentsForDate(dateStr: string): Appointment[] {
    return appointments.filter((apt) => {
      if (!apt.scheduled_at) return false;
      const aptDate = apt.scheduled_at.split("T")[0];
      return aptDate === dateStr;
    });
  }

  function previousMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getStatusColor(status?: string): string {
    switch (status) {
      case "confirmed":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "no_show":
        return "bg-gray-500";
      case "checked_in":
        return "bg-purple-500";
      case "in_progress":
        return "bg-yellow-500";
      default:
        return "bg-orange-500"; // requested
    }
  }

  function getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      requested: "Solicitado",
      confirmed: "Confirmado",
      checked_in: "Check-in",
      in_progress: "Em andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
      no_show: "Faltou",
    };
    return labels[status || "requested"] || status || "Solicitado";
  }

  const calendarDays = getCalendarDays();

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      {/* Cabeçalho modernizado: melhor contraste, foco e navegação */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Calendário de Consultas
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Hoje
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Cabeçalhos dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid do calendário com células interativas acessíveis */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                // UI: estados visuais modernizados, mantendo a interação por clique
                className={`group min-h-[110px] border rounded-lg p-2 transition-colors ${
                  day.isCurrentMonth
                    ? "bg-white border-gray-200"
                    : "bg-gray-50 border-gray-100"
                } ${day.isToday ? "ring-2 ring-blue-500" : ""} ${
                  day.appointments.length > 0
                    ? "cursor-pointer hover:bg-blue-50"
                    : ""
                }`}
                onClick={() =>
                  day.appointments.length > 0 && setSelectedDay(day)
                }
              >
                {/* Número do dia com destaque para hoje */}
                <div
                  className={`text-sm font-medium mb-2 ${
                    day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  } ${day.isToday ? "text-blue-600 font-bold" : ""}`}
                >
                  {day.date.getDate()}
                </div>
                {/* Chips de horários com cores por status */}
                <div className="space-y-1">
                  {day.appointments.slice(0, 3).map((apt, idx) => (
                    <div
                      key={apt.id || idx}
                      className={`text-xs px-1 py-0.5 rounded text-white ${getStatusColor(
                        apt.status
                      )} truncate`}
                      title={`${apt.scheduled_at?.slice(
                        11,
                        16
                      )} - ${getStatusLabel(apt.status)}`}
                    >
                      {apt.scheduled_at?.slice(11, 16)}
                    </div>
                  ))}
                  {day.appointments.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{day.appointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de detalhes do dia - melhorado com acessibilidade e botão de fechar */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => setSelectedDay(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Consultas do dia selecionado"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Consultas de{" "}
                {selectedDay.date.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                aria-label="Fechar"
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {selectedDay.appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma consulta agendada para este dia.
                </p>
              ) : (
                selectedDay.appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {apt.scheduled_at?.slice(11, 16)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {getStatusLabel(apt.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Paciente:</span>{" "}
                            {getPatientName(apt.patient_id)}
                          </div>
                          {apt.appointment_type && (
                            <div>
                              <span className="font-medium">Tipo:</span>{" "}
                              {apt.appointment_type === "presencial"
                                ? "Presencial"
                                : "Telemedicina"}
                            </div>
                          )}
                          {apt.chief_complaint && (
                            <div>
                              <span className="font-medium">Queixa:</span>{" "}
                              {apt.chief_complaint}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorCalendar;
