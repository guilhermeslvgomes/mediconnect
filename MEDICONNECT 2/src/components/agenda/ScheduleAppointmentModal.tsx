// UI/UX: adiciona refs e ícones para melhorar acessibilidade e feedback visual
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Stethoscope,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { appointmentService } from "../../services";
import medicoService, { type Medico } from "../../services/medicoService";
import pacienteService from "../../services/pacienteService";
import type { Paciente as PacienteModel } from "../../services/pacienteService";
import AvailableSlotsPicker from "./AvailableSlotsPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string; // opcional: quando não informado, seleciona paciente no modal
  patientName?: string; // opcional
  onSuccess?: () => void;
}

const ScheduleAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}) => {
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [patients, setPatients] = useState<PacienteModel[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<
    "presencial" | "telemedicina"
  >("presencial");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");

  // A11y & UX: refs para foco inicial e fechamento via overlay/ESC
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // A11y: IDs para aria-labelledby/aria-describedby
  const titleId = useMemo(
    () => `schedule-modal-title-${patientId ?? "novo"}`,
    [patientId]
  );
  const descId = useMemo(
    () => `schedule-modal-desc-${patientId ?? "novo"}`,
    [patientId]
  );

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      if (!patientId) {
        loadPatients();
      } else {
        // Garantir estados internos alinhados com props
        setSelectedPatientId(patientId);
        setSelectedPatientName(patientName || "");
      }
      // UX: foco no primeiro campo quando abrir
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function loadDoctors() {
    setLoadingDoctors(true);
    const res = await medicoService.listarMedicos();
    setLoadingDoctors(false);
    if (res.success && res.data) {
      setDoctors(res.data.data); // res.data é MedicoListResponse, res.data.data é Medico[]
    } else {
      toast.error("Erro ao carregar médicos");
    }
  }

  async function loadPatients() {
    setLoadingPatients(true);
    try {
      const res = await pacienteService.listPatients();
      setLoadingPatients(false);
      if (res && Array.isArray(res.data)) {
        setPatients(res.data);
      } else if (
        res &&
        typeof (res as unknown) === "object" &&
        (res as { data?: { data?: PacienteModel[] } }).data?.data
      ) {
        // fallback caso formato mude (evita any explícito)
        setPatients(
          (res as { data?: { data?: PacienteModel[] } }).data?.data || []
        );
      } else {
        toast.error("Erro ao carregar pacientes");
      }
    } catch {
      setLoadingPatients(false);
      toast.error("Erro ao carregar pacientes");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalPatientId = patientId || selectedPatientId;
    if (
      !selectedDoctorId ||
      !selectedDate ||
      !selectedTime ||
      !finalPatientId
    ) {
      toast.error("Preencha médico, data e horário");
      return;
    }

    setLoading(true);

    const datetime = `${selectedDate}T${selectedTime}:00`;

    const res = await appointmentService.createAppointment({
      patient_id: finalPatientId,
      doctor_id: selectedDoctorId,
      scheduled_at: datetime,
      appointment_type: appointmentType,
      chief_complaint: reason || undefined,
    });

    setLoading(false);

    if (res.success) {
      toast.success("Agendamento criado com sucesso!");
      onSuccess?.();
      handleClose();
    } else {
      toast.error(res.error || "Erro ao criar agendamento");
    }
  }

  function handleClose() {
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setAppointmentType("presencial");
    setReason("");
    setSelectedPatientId("");
    setSelectedPatientName("");
    onClose();
  }

  if (!isOpen) return null;

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const patientPreselected = !!patientId;
  const effectivePatientName = patientPreselected
    ? patientName
    : selectedPatientName ||
      (patients.find((p) => p.id === selectedPatientId)?.nome ?? "");

  // UX: handlers para ESC e clique fora
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleClose();
    }
  }
  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) handleClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onOverlayClick}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black/5 animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2
              id={titleId}
              className="text-lg md:text-xl font-semibold text-gray-900"
            >
              Agendar consulta •{" "}
              <span className="font-normal text-gray-700">
                {effectivePatientName}
              </span>
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            aria-label="Fechar modal de agendamento"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p id={descId} className="sr-only">
          Selecione o médico, a data, o tipo de consulta e um horário disponível
          para criar um novo agendamento.
        </p>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
          aria-busy={loading}
        >
          {/* Paciente (apenas quando não veio por props) */}
          {!patientPreselected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente *
              </label>
              {loadingPatients ? (
                // Skeleton para carregamento de pacientes
                <div
                  className="h-10 w-full rounded-lg bg-gray-100 animate-pulse"
                  aria-live="polite"
                  aria-label="Carregando pacientes"
                />
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    const p = patients.find((px) => px.id === e.target.value);
                    setSelectedPatientName(p?.nome || "");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
                  required
                >
                  <option value="">-- Selecione um paciente --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.cpf ? `- ${p.cpf}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          {/* Médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Médico{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            {loadingDoctors ? (
              <div
                className="h-10 w-full rounded-lg bg-gray-100 animate-pulse"
                aria-live="polite"
                aria-label="Carregando médicos"
              />
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                ref={firstFieldRef}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
                required
              >
                <option value="">-- Selecione um médico --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.nome} - {doc.especialidade}
                  </option>
                ))}
              </select>
            )}
            {selectedDoctor && (
              <div className="mt-2 text-sm text-gray-600">
                CRM: {selectedDoctor.crm}
              </div>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(""); // Limpa o horário ao mudar a data
              }}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> Selecione uma data para
              ver os horários disponíveis.
            </p>
          </div>

          {/* Tipo de Consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Consulta{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <select
              value={appointmentType}
              onChange={(e) =>
                setAppointmentType(
                  e.target.value as "presencial" | "telemedicina"
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
              required
            >
              <option value="presencial">Presencial</option>
              <option value="telemedicina">Telemedicina</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> O tipo de consulta pode alterar
              a disponibilidade de horários.
            </p>
          </div>

          {/* Horários Disponíveis */}
          {selectedDoctorId && selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horários Disponíveis *
              </label>
              <AvailableSlotsPicker
                doctorId={selectedDoctorId}
                date={selectedDate}
                appointment_type={appointmentType}
                onSelect={(time) => setSelectedTime(time)}
              />
              {selectedTime && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5 text-sm text-green-700 ring-1 ring-green-600/20">
                  <span aria-hidden>✓</span> Horário selecionado:{" "}
                  <span className="font-semibold">{selectedTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Consulta (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
              placeholder="Ex: Consulta de rotina, dor de cabeça..."
            />
          </div>

          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              disabled={
                loading ||
                !selectedDoctorId ||
                !selectedDate ||
                !selectedTime ||
                (!patientPreselected && !selectedPatientId)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />{" "}
                  Agendando...
                </>
              ) : (
                "Confirmar Agendamento"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleAppointmentModal;
