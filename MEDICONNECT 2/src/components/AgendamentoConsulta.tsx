import { useState, useEffect, useCallback } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MapPin,
  Video,
  Clock,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { availabilityService } from "../services/availabilityService";
import { exceptionService } from "../services/exceptionService";
import { consultaService } from "../services/consultaService";
import { medicoService } from "../services/medicoService";

interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  foto?: string;
  email?: string;
  telefone?: string;
  valorConsulta?: number;
}

interface TimeSlot {
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface DaySchedule {
  ativo: boolean;
  horarios: TimeSlot[];
}

interface Availability {
  domingo: DaySchedule;
  segunda: DaySchedule;
  terca: DaySchedule;
  quarta: DaySchedule;
  quinta: DaySchedule;
  sexta: DaySchedule;
  sabado: DaySchedule;
}

interface Exception {
  id: string;
  data: string;
  motivo?: string;
}

const dayOfWeekMap: { [key: number]: keyof Availability } = {
  0: "domingo",
  1: "segunda",
  2: "terca",
  3: "quarta",
  4: "quinta",
  5: "sexta",
  6: "sabado",
};

export default function AgendamentoConsulta() {
  // ...

  // ... outras declarações de hooks e funções ...

  useEffect(() => {
    if (selectedMedico) {
      loadDoctorAvailability();
      loadDoctorExceptions();
    }
  }, [selectedMedico, loadDoctorAvailability, loadDoctorExceptions]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [filteredMedicos, setFilteredMedicos] = useState<Medico[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [loading, setLoading] = useState(true);

  // Calendar and scheduling states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<
    "presencial" | "online"
  >("presencial");
  const [motivo, setMotivo] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Load doctors on mount
  const loadMedicos = async () => {
    try {
      setLoading(true);
      const data = await medicoService.listarMedicos();
      // Supondo que data seja ApiResponse<MedicoListResponse>
      if (data && Array.isArray(data.data)) {
        setMedicos(data.data);
        setFilteredMedicos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar médicos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicos();
  }, []);

  // Filter doctors based on search and specialty
  useEffect(() => {
    let filtered = medicos;

    if (searchTerm) {
      filtered = filtered.filter(
        (medico) =>
          medico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medico.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSpecialty !== "all") {
      filtered = filtered.filter(
        (medico) => medico.especialidade === selectedSpecialty
      );
    }

    setFilteredMedicos(filtered);
  }, [searchTerm, selectedSpecialty, medicos]);

  // Get unique specialties
  const specialties = Array.from(new Set(medicos.map((m) => m.especialidade)));

  // ... outras declarações de hooks ...

  // ... outras funções e hooks ...

  const loadDoctorAvailability = useCallback(async () => {
    if (!selectedMedico) return;
    try {
      const response = await availabilityService.getAvailability(
        selectedMedico.id
      );
      if (
        response &&
        response.success &&
        response.data &&
        response.data.length > 0
      ) {
        const avail = response.data[0];
        setAvailability({
          domingo: avail.domingo || { ativo: false, horarios: [] },
          segunda: avail.segunda || { ativo: false, horarios: [] },
          terca: avail.terca || { ativo: false, horarios: [] },
          quarta: avail.quarta || { ativo: false, horarios: [] },
          quinta: avail.quinta || { ativo: false, horarios: [] },
          sexta: avail.sexta || { ativo: false, horarios: [] },
          sabado: avail.sabado || { ativo: false, horarios: [] },
        });
      } else {
        setAvailability(null);
      }
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error);
      setAvailability(null);
    }
  }, [selectedMedico]);

  const loadDoctorExceptions = useCallback(async () => {
    if (!selectedMedico) return;
    try {
      const response = await exceptionService.listExceptions({
        doctor_id: selectedMedico.id,
      });
      if (response && response.success && response.data) {
        setExceptions(response.data as Exception[]);
      } else {
        setExceptions([]);
      }
    } catch (error) {
      console.error("Erro ao carregar exceções:", error);
      setExceptions([]);
    }
  }, [selectedMedico]);

  // Calculate available slots when date is selected
  const calculateAvailableSlots = useCallback(() => {
    if (!selectedDate || !availability) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const isBlocked = exceptions.some((exc) => exc.data === dateStr);
    if (isBlocked) {
      setAvailableSlots([]);
      return;
    }
    const dayOfWeek = selectedDate.getDay();
    const dayKey = dayOfWeekMap[dayOfWeek];
    const daySchedule = availability[dayKey];
    if (!daySchedule || !daySchedule.ativo) {
      setAvailableSlots([]);
      return;
    }
    const slots = daySchedule.horarios
      .filter((slot) => slot.ativo)
      .map((slot) => slot.inicio);
    setAvailableSlots(slots);
  }, [selectedDate, availability, exceptions]);

  useEffect(() => {
    if (selectedDate && availability && selectedMedico) {
      calculateAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [
    selectedDate,
    availability,
    exceptions,
    calculateAvailableSlots,
    selectedMedico,
  ]);

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return exceptions.some((exc) => exc.data === dateStr);
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!availability) return false;

    // Check if in the past
    if (isBefore(date, startOfDay(new Date()))) return false;

    // Check if blocked
    if (isDateBlocked(date)) return false;

    // Check if day has available schedule
    const dayOfWeek = date.getDay();
    const dayKey = dayOfWeekMap[dayOfWeek];
    const daySchedule = availability[dayKey];

    return (
      daySchedule?.ativo && daySchedule.horarios.some((slot) => slot.ativo)
    );
  };

  // Calendar generation
  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding days from previous month
    const startDay = start.getDay();
    const prevMonthDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(start);
      day.setDate(day.getDate() - (i + 1));
      prevMonthDays.push(day);
    }

    return [...prevMonthDays, ...days];
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSelectDoctor = (medico: Medico) => {
    setSelectedMedico(medico);
    setSelectedDate(undefined);
    setSelectedTime("");
    setMotivo("");
    setBookingSuccess(false);
    setBookingError("");
  };

  const handleBookAppointment = () => {
    if (selectedMedico && selectedDate && selectedTime && motivo) {
      setShowConfirmDialog(true);
    }
  };

  const confirmAppointment = async () => {
    if (!selectedMedico || !selectedDate || !selectedTime) return;

    try {
      setBookingError("");

      // Get current user from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setBookingError("Usuário não autenticado");
        return;
      }

      const user = JSON.parse(userStr);

      // Removido: dataHora não é usada

      // Book appointment via API
      await consultaService.criarConsulta({
        paciente_id: user.id,
        medico_id: selectedMedico.id,
        data_hora: format(selectedDate, "yyyy-MM-dd") + "T" + selectedTime,
        tipo_consulta: "primeira_vez", // ou "retorno", "emergencia", "rotina" conforme lógica do sistema
        motivo_consulta: motivo,
      });

      setBookingSuccess(true);
      setShowConfirmDialog(false);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSelectedMedico(null);
        setSelectedDate(undefined);
        setSelectedTime("");
        setMotivo("");
        setBookingSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      setBookingError(
        error instanceof Error
          ? error.message
          : "Erro ao agendar consulta. Tente novamente."
      );
      setShowConfirmDialog(false);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6 p-6">
      {/* Success Message */}
      {bookingSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Consulta agendada com sucesso!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Você receberá uma confirmação por e-mail em breve.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {bookingError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-900 dark:text-red-100">{bookingError}</p>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Agendar Consulta
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha um médico e horário disponível
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Buscar Médicos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Buscar por nome ou especialidade
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: Cardiologia, Dr. Silva..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Especialidade
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas as especialidades</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Carregando médicos...
          </p>
        </div>
      ) : filteredMedicos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum médico encontrado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMedicos.map((medico) => (
            <div
              key={medico.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all ${
                selectedMedico?.id === medico.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xl font-bold">
                  {medico.nome
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {medico.nome}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {medico.especialidade}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      CRM: {medico.crm}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {medico.valorConsulta
                        ? `R$ ${medico.valorConsulta.toFixed(2)}`
                        : "Consultar valor"}
                    </span>
                    <button
                      onClick={() => handleSelectDoctor(medico)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedMedico?.id === medico.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {selectedMedico?.id === medico.id
                        ? "Selecionado"
                        : "Selecionar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Details */}
      {selectedMedico && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Detalhes do Agendamento
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Consulta com {selectedMedico.nome} -{" "}
              {selectedMedico.especialidade}
            </p>
          </div>

          {/* Appointment Type */}
          <div className="flex gap-2">
            <button
              onClick={() => setAppointmentType("presencial")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                appointmentType === "presencial"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Presencial</span>
            </button>
            <button
              onClick={() => setAppointmentType("online")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                appointmentType === "online"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
              }`}
            >
              <Video className="h-5 w-5" />
              <span className="font-medium">Online</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selecione a Data
                </label>
                <div className="mt-2">
                  {/* Month/Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400"
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7">
                      {calendarDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected =
                          selectedDate && isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        const isAvailable =
                          isCurrentMonth && isDateAvailable(day);
                        const isBlocked = isCurrentMonth && isDateBlocked(day);
                        const isPast = isBefore(day, startOfDay(new Date()));

                        return (
                          <button
                            key={index}
                            onClick={() => isAvailable && setSelectedDate(day)}
                            disabled={!isAvailable}
                            className={`
                              aspect-square p-2 text-sm border-r border-b border-gray-200 dark:border-gray-700
                              ${
                                !isCurrentMonth
                                  ? "text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800"
                                  : ""
                              }
                              ${
                                isSelected
                                  ? "bg-blue-600 text-white font-bold"
                                  : ""
                              }
                              ${
                                isTodayDate && !isSelected
                                  ? "font-bold text-blue-600 dark:text-blue-400"
                                  : ""
                              }
                              ${
                                isAvailable && !isSelected
                                  ? "hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                  : ""
                              }
                              ${
                                isBlocked
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-400 line-through"
                                  : ""
                              }
                              ${
                                isPast && !isBlocked
                                  ? "text-gray-400 dark:text-gray-600"
                                  : ""
                              }
                              ${
                                !isAvailable &&
                                !isBlocked &&
                                isCurrentMonth &&
                                !isPast
                                  ? "text-gray-300 dark:text-gray-600"
                                  : ""
                              }
                            `}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>🟢 Datas disponíveis</p>
                    <p>🔴 Datas bloqueadas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slots and Details */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horários Disponíveis
                </label>
                {selectedDate ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Selecione uma data
                  </p>
                )}
              </div>

              {selectedDate && availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`flex items-center justify-center gap-1 py-2 rounded-lg border-2 transition-colors ${
                        selectedTime === slot
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {slot}
                    </button>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum horário disponível para esta data
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Selecione uma data para ver os horários
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motivo da Consulta *
                </label>
                <textarea
                  placeholder="Descreva brevemente o motivo da consulta..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Summary */}
              {selectedDate && selectedTime && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Resumo
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>📅 Data: {format(selectedDate, "dd/MM/yyyy")}</p>
                    <p>⏰ Horário: {selectedTime}</p>
                    <p>
                      📍 Tipo:{" "}
                      {appointmentType === "online" ? "Online" : "Presencial"}
                    </p>
                    {selectedMedico.valorConsulta && (
                      <p>
                        💰 Valor: R$ {selectedMedico.valorConsulta.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleBookAppointment}
                disabled={!selectedTime || !motivo.trim()}
                className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Confirmar Agendamento
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Revise os detalhes da sua consulta antes de confirmar
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                  {selectedMedico?.nome
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedMedico?.nome}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedMedico?.especialidade}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  📅 Data: {selectedDate && format(selectedDate, "dd/MM/yyyy")}
                </p>
                <p>⏰ Horário: {selectedTime}</p>
                <p>
                  📍 Tipo:{" "}
                  {appointmentType === "online"
                    ? "Consulta Online"
                    : "Consulta Presencial"}
                </p>
                {selectedMedico?.valorConsulta && (
                  <p>💰 Valor: R$ {selectedMedico.valorConsulta.toFixed(2)}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Motivo:
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{motivo}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAppointment}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
