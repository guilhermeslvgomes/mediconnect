import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Save, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import availabilityService from "../services/availabilityService";
import exceptionService, {
  DoctorException,
} from "../services/exceptionService";
import { useAuth } from "../hooks/useAuth";

interface TimeSlot {
  id: string;
  dbId?: string; // ID do banco de dados (se já existir)
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface DaySchedule {
  day: string;
  dayOfWeek: number;
  enabled: boolean;
  slots: TimeSlot[];
}

const daysOfWeek = [
  { key: 0, label: "Domingo", dbKey: "domingo" },
  { key: 1, label: "Segunda-feira", dbKey: "segunda" },
  { key: 2, label: "Terça-feira", dbKey: "terca" },
  { key: 3, label: "Quarta-feira", dbKey: "quarta" },
  { key: 4, label: "Quinta-feira", dbKey: "quinta" },
  { key: 5, label: "Sexta-feira", dbKey: "sexta" },
  { key: 6, label: "Sábado", dbKey: "sabado" },
];

const DisponibilidadeMedico: React.FC = () => {
  const { user } = useAuth();
  const medicoId = user?.id || "";

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"weekly" | "blocked" | "settings">(
    "weekly"
  );

  // States for adding slots
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newSlot, setNewSlot] = useState({ inicio: "09:00", fim: "10:00" });

  // States for blocked dates
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [exceptions, setExceptions] = useState<DoctorException[]>([]);

  // Settings
  const [consultationDuration, setConsultationDuration] = useState("60");
  const [breakTime, setBreakTime] = useState("0");

  const loadAvailability = React.useCallback(async () => {
    try {
      setLoading(true);
      // Usar listAvailability ao invés de getAvailability para ter os IDs individuais
      const response = await availabilityService.listAvailability({
        doctor_id: medicoId,
      });

      if (
        response &&
        response.success &&
        response.data &&
        response.data.length > 0
      ) {
        const newSchedule: Record<number, DaySchedule> = {};

        // Inicializar todos os dias
        daysOfWeek.forEach(({ key, label }) => {
          newSchedule[key] = {
            day: label,
            dayOfWeek: key,
            enabled: false,
            slots: [],
          };
        });

        // Agrupar disponibilidades por dia da semana
        response.data.forEach((avail) => {
          const weekdayKey = daysOfWeek.find((d) => d.dbKey === avail.weekday);
          if (!weekdayKey) return;

          const dayKey = weekdayKey.key;
          if (!newSchedule[dayKey].enabled) {
            newSchedule[dayKey].enabled = true;
          }

          newSchedule[dayKey].slots.push({
            id: `${dayKey}-${avail.id || Math.random().toString(36).slice(2)}`,
            dbId: avail.id, // Armazenar ID do banco
            inicio: avail.start_time?.slice(0, 5) || "09:00",
            fim: avail.end_time?.slice(0, 5) || "17:00",
            ativo: avail.active ?? true,
          });
        });

        setSchedule(newSchedule);
      } else {
        // Initialize empty schedule
        const newSchedule: Record<number, DaySchedule> = {};
        daysOfWeek.forEach(({ key, label }) => {
          newSchedule[key] = {
            day: label,
            dayOfWeek: key,
            enabled: false,
            slots: [],
          };
        });
        setSchedule(newSchedule);
      }
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error);
      toast.error("Erro ao carregar disponibilidade");
    } finally {
      setLoading(false);
    }
  }, [medicoId]);

  const loadExceptions = React.useCallback(async () => {
    try {
      const response = await exceptionService.listExceptions({
        doctor_id: medicoId,
      });
      if (response.success && response.data) {
        setExceptions(response.data);
        const blocked = response.data
          .filter((exc) => exc.kind === "bloqueio" && exc.date)
          .map((exc) => new Date(exc.date!));
        setBlockedDates(blocked);
      }
    } catch (error) {
      console.error("Erro ao carregar exceções:", error);
    }
  }, [medicoId]);

  useEffect(() => {
    if (medicoId) {
      loadAvailability();
      loadExceptions();
    }
  }, [medicoId, loadAvailability, loadExceptions]);

  const toggleDay = (dayKey: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
      },
    }));
  };

  const addTimeSlot = () => {
    if (selectedDay !== null) {
      const newSlotId = `${selectedDay}-${Date.now()}`;
      setSchedule((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          slots: [
            ...prev[selectedDay].slots,
            {
              id: newSlotId,
              inicio: newSlot.inicio,
              fim: newSlot.fim,
              ativo: true,
            },
          ],
        },
      }));
      setShowAddSlotDialog(false);
      setNewSlot({ inicio: "09:00", fim: "10:00" });
      setSelectedDay(null);
    }
  };

  const removeTimeSlot = async (dayKey: number, slotId: string) => {
    const slot = schedule[dayKey]?.slots.find((s) => s.id === slotId);

    // Se o slot tem um ID do banco, deletar imediatamente
    if (slot?.dbId) {
      try {
        const response = await availabilityService.deleteAvailability(
          slot.dbId
        );
        if (response.success) {
          toast.success("Horário removido com sucesso");
        } else {
          toast.error(response.error || "Erro ao remover horário");
          return;
        }
      } catch (error) {
        console.error("Erro ao remover horário:", error);
        toast.error("Erro ao remover horário");
        return;
      }
    }

    // Atualizar o estado local
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.filter((slot) => slot.id !== slotId),
      },
    }));
  };

  const toggleSlotAvailability = (dayKey: number, slotId: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.map((slot) =>
          slot.id === slotId ? { ...slot, ativo: !slot.ativo } : slot
        ),
      },
    }));
  };

  const copySchedule = (fromDay: number) => {
    const sourceSchedule = schedule[fromDay];
    if (!sourceSchedule.enabled || sourceSchedule.slots.length === 0) {
      toast.error("Dia não tem horários configurados");
      return;
    }

    const updatedSchedule = { ...schedule };
    Object.keys(updatedSchedule).forEach((key) => {
      const dayKey = Number(key);
      if (dayKey !== fromDay && updatedSchedule[dayKey].enabled) {
        updatedSchedule[dayKey].slots = sourceSchedule.slots.map((slot) => ({
          ...slot,
          id: `${dayKey}-${slot.id}`,
        }));
      }
    });
    setSchedule(updatedSchedule);
    toast.success("Horários copiados com sucesso!");
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);

      if (!medicoId) {
        toast.error("Médico não autenticado");
        return;
      }

      const requests: Array<Promise<unknown>> = [];

      const timeToMinutes = (t: string) => {
        const [hStr, mStr] = t.split(":");
        const h = Number(hStr || "0");
        const m = Number(mStr || "0");
        return h * 60 + m;
      };

      // Para cada dia, processar slots
      daysOfWeek.forEach(({ key, dbKey }) => {
        const daySchedule = schedule[key];

        if (!daySchedule || !daySchedule.enabled) {
          // Se o dia foi desabilitado, deletar todos os slots existentes
          daySchedule?.slots.forEach((slot) => {
            if (slot.dbId) {
              requests.push(availabilityService.deleteAvailability(slot.dbId));
            }
          });
          return;
        }

        // Processar cada slot do dia
        daySchedule.slots.forEach((slot) => {
          const inicio = slot.inicio
            ? slot.inicio.length === 5
              ? `${slot.inicio}:00`
              : slot.inicio
            : "00:00:00";
          const fim = slot.fim
            ? slot.fim.length === 5
              ? `${slot.fim}:00`
              : slot.fim
            : "00:00:00";
          const minutes = Math.max(
            1,
            timeToMinutes(fim.slice(0, 5)) - timeToMinutes(inicio.slice(0, 5))
          );

          const payload = {
            weekday: dbKey as
              | "segunda"
              | "terca"
              | "quarta"
              | "quinta"
              | "sexta"
              | "sabado"
              | "domingo",
            start_time: inicio,
            end_time: fim,
            slot_minutes: minutes,
            appointment_type: "presencial" as const,
            active: !!slot.ativo,
          };

          if (slot.dbId) {
            // Atualizar slot existente
            requests.push(
              availabilityService.updateAvailability(slot.dbId, payload)
            );
          } else {
            // Criar novo slot
            requests.push(
              availabilityService.createAvailability({
                doctor_id: medicoId,
                ...payload,
              })
            );
          }
        });
      });

      if (requests.length === 0) {
        toast.error("Nenhuma alteração para salvar");
        return;
      }

      const results = await Promise.allSettled(requests);
      const errors: string[] = [];
      let successCount = 0;
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const val = r.value as {
            success?: boolean;
            error?: string;
            message?: string;
          };
          if (val && val.success) successCount++;
          else
            errors.push(`Item ${idx}: ${val?.error || val?.message || "Erro"}`);
        } else {
          errors.push(`Item ${idx}: ${r.reason?.message || String(r.reason)}`);
        }
      });

      if (errors.length > 0) {
        console.error("Erros ao salvar disponibilidades:", errors);
        toast.error(
          `Algumas disponibilidades não foram salvas (${errors.length})`
        );
      }
      if (successCount > 0) {
        toast.success(`${successCount} alteração(ões) salvas com sucesso!`);
        await loadAvailability();
      }
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao salvar disponibilidade";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlockedDate = async () => {
    if (!selectedDate) return;

    const dateString = format(selectedDate, "yyyy-MM-dd");
    const dateExists = blockedDates.some(
      (d) => format(d, "yyyy-MM-dd") === dateString
    );

    try {
      if (dateExists) {
        // Remove block
        const exception = exceptions.find(
          (exc) =>
            exc.date && format(new Date(exc.date), "yyyy-MM-dd") === dateString
        );
        if (exception && exception.id) {
          await exceptionService.deleteException(exception.id);
          setBlockedDates(
            blockedDates.filter((d) => format(d, "yyyy-MM-dd") !== dateString)
          );
          toast.success("Data desbloqueada");
        }
      } else {
        // Add block
        const response = await exceptionService.createException({
          doctor_id: medicoId,
          date: dateString,
          kind: "bloqueio",
          reason: "Data bloqueada pelo médico",
        });
        if (response.success) {
          setBlockedDates([...blockedDates, selectedDate]);
          toast.success("Data bloqueada");
        }
      }
      loadExceptions();
    } catch (error) {
      console.error("Erro ao alternar bloqueio de data:", error);
      toast.error("Erro ao bloquear/desbloquear data");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Disponibilidade
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure seus horários de atendimento
          </p>
        </div>
        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "weekly"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Horário Semanal
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "blocked"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Datas Bloqueadas ({blockedDates.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "settings"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Configurações
          </button>
        </nav>
      </div>

      {/* Tab Content - Weekly Schedule */}
      {activeTab === "weekly" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Horários por Dia da Semana
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Defina seus horários de atendimento para cada dia da semana
              </p>
            </div>

            {daysOfWeek.map(({ key, label }) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={schedule[key]?.enabled || false}
                        onChange={() => toggleDay(key)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {label}
                    </span>
                    {schedule[key]?.enabled && (
                      <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs rounded">
                        {schedule[key]?.slots.length || 0} horário(s)
                      </span>
                    )}
                  </div>
                  {schedule[key]?.enabled && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => copySchedule(key)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDay(key);
                          setShowAddSlotDialog(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Horário
                      </button>
                    </div>
                  )}
                </div>

                {schedule[key]?.enabled && (
                  <div className="ml-14 space-y-2">
                    {schedule[key]?.slots.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhum horário configurado
                      </p>
                    ) : (
                      schedule[key]?.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={slot.ativo}
                                onChange={() =>
                                  toggleSlotAvailability(key, slot.id)
                                }
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">
                              {slot.inicio} - {slot.fim}
                            </span>
                            {!slot.ativo && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded">
                                Bloqueado
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeTimeSlot(key, slot.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content - Blocked Dates */}
      {activeTab === "blocked" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Selecionar Datas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Clique em uma data no calendário e depois no botão para
              bloquear/desbloquear
            </p>
            <div className="space-y-4">
              <input
                type="date"
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={toggleBlockedDate}
                disabled={!selectedDate}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {selectedDate &&
                blockedDates.some(
                  (d) =>
                    format(d, "yyyy-MM-dd") ===
                    format(selectedDate, "yyyy-MM-dd")
                )
                  ? "Desbloquear Data"
                  : "Bloquear Data"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Datas Bloqueadas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {blockedDates.length} data(s) bloqueada(s)
            </p>
            {blockedDates.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhuma data bloqueada
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blockedDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedDate(date);
                        toggleBlockedDate();
                      }}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content - Settings */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Configurações de Consulta
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Defina as configurações padrão para suas consultas
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Duração Padrão da Consulta
                </label>
                <select
                  value={consultationDuration}
                  onChange={(e) => setConsultationDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora e 30 minutos</option>
                  <option value="120">2 horas</option>
                </select>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Esta duração será usada para calcular os horários disponíveis
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Intervalo entre Consultas
                </label>
                <select
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="0">Sem intervalo</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                </select>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Tempo de descanso entre consultas
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Aceitar consultas online
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Permitir agendamento de teleconsultas
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Confirmação automática
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Aprovar agendamentos automaticamente
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Time Slot Dialog */}
      {showAddSlotDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Adicionar Horário
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Defina o período de atendimento para{" "}
              {selectedDay !== null ? schedule[selectedDay]?.day : ""}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Horário de Início
                </label>
                <input
                  type="time"
                  value={newSlot.inicio}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, inicio: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Horário de Término
                </label>
                <input
                  type="time"
                  value={newSlot.fim}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, fim: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddSlotDialog(false);
                  setSelectedDay(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addTimeSlot}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisponibilidadeMedico;
