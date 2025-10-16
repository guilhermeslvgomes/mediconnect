import React, { useState, useEffect } from "react";
import { Calendar, User, FileText, CheckCircle, LogOut } from "lucide-react";
// import consultaService from "../services/consultaService"; // não utilizado após integração com appointmentService
import { appointmentService } from "../services";
import AvailableSlotsPicker from "../components/agenda/AvailableSlotsPicker";
import medicoService from "../services/medicoService";
import toast from "react-hot-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Medico {
  _id: string;
  nome: string;
  especialidade: string;
  valorConsulta: number;
  horarioAtendimento: Record<string, string[]>;
}

interface Paciente {
  _id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

const AgendamentoPaciente: React.FC = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacienteLogado, setPacienteLogado] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState(1);

  const [agendamento, setAgendamento] = useState({
    medicoId: "",
    data: "",
    horario: "",
    tipoConsulta: "primeira-vez",
    motivoConsulta: "",
    observacoes: "",
  });

  // Slots são carregados diretamente pelo AvailableSlotsPicker
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se paciente está logado
    const pacienteData = localStorage.getItem("pacienteLogado");
    if (!pacienteData) {
      console.log(
        "[AgendamentoPaciente] Paciente não logado, redirecionando..."
      );
      navigate("/paciente");
      return;
    }

    try {
      const paciente = JSON.parse(pacienteData);
      console.log("[AgendamentoPaciente] Paciente logado:", paciente);
      setPacienteLogado(paciente);
      void fetchMedicos();
    } catch (error) {
      console.error(
        "[AgendamentoPaciente] Erro ao carregar dados do paciente:",
        error
      );
      navigate("/paciente");
    }
  }, [navigate]);

  // As consultas locais agora aparecem na Dashboard (AcompanhamentoPaciente)

  const fetchMedicos = async () => {
    try {
      console.log("[AgendamentoPaciente] Iniciando busca de médicos...");

      // Verificar se há token disponível
      const tokenStore = (await import("../services/tokenStore")).default;
      const token = tokenStore.getAccessToken();
      console.log(
        "[AgendamentoPaciente] Token disponível:",
        token ? "SIM" : "NÃO"
      );
      if (!token) {
        console.warn(
          "[AgendamentoPaciente] Nenhum token encontrado - requisição pode falhar"
        );
      }

      const response = await medicoService.listarMedicos({ status: "ativo" });
      console.log("[AgendamentoPaciente] Resposta da API:", response);

      if (!response.success) {
        console.error(
          "[AgendamentoPaciente] Erro na resposta:",
          response.error
        );
        toast.error(response.error || "Erro ao carregar médicos");
        return;
      }

      const list = response.data?.data || [];
      console.log(
        "[AgendamentoPaciente] Médicos recebidos:",
        list.length,
        list
      );

      const mapped: Medico[] = list.map((m) => ({
        _id: m.id || Math.random().toString(36).slice(2, 9),
        nome: m.nome || "",
        especialidade: m.especialidade || "",
        valorConsulta: 0,
        horarioAtendimento: {},
      }));

      console.log("[AgendamentoPaciente] Médicos mapeados:", mapped);
      setMedicos(mapped);

      if (mapped.length === 0) {
        if (response.error && response.error.includes("404")) {
          toast.error(
            "⚠️ Tabela de médicos não existe no banco de dados. Configure o Supabase primeiro.",
            {
              duration: 6000,
            }
          );
        } else {
          toast.error(
            "Nenhum médico ativo encontrado. Por favor, cadastre médicos primeiro."
          );
        }
      }
    } catch (error) {
      console.error("[AgendamentoPaciente] Erro ao carregar médicos:", error);
      toast.error("Erro ao carregar lista de médicos");
    }
  };

  // Horários disponíveis agora são resolvidos no componente de slots

  const handleMedicoChange = (medicoId: string) => {
    setAgendamento((prev) => ({ ...prev, medicoId, data: "", horario: "" }));
  };

  const handleDataChange = (data: string) => {
    setAgendamento((prev) => ({ ...prev, data, horario: "" }));
  };

  const confirmarAgendamento = async () => {
    if (!pacienteLogado) return;

    try {
      setLoading(true);

      // NOTE: Removed remote CPF validation to avoid false negatives

      // NOTE: remote CEP validation removed to avoid false negatives

      const dataHora = new Date(
        `${agendamento.data}T${agendamento.horario}:00.000Z`
      );

      await appointmentService.createAppointment({
        patient_id: pacienteLogado._id,
        doctor_id: agendamento.medicoId,
        scheduled_at: dataHora.toISOString(),
        appointment_type: "presencial",
        chief_complaint: agendamento.motivoConsulta,
      });

      toast.success("Consulta agendada com sucesso!");
      setEtapa(4); // Etapa de confirmação
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast.error("Erro ao agendar consulta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetarAgendamento = () => {
    setAgendamento({
      medicoId: "",
      data: "",
      horario: "",
      tipoConsulta: "primeira-vez",
      motivoConsulta: "",
      observacoes: "",
    });
    setEtapa(1);
  };

  // Removido: criação/visualização local aqui. Use a Dashboard para ver.

  const logout = () => {
    localStorage.removeItem("pacienteLogado");
    navigate("/paciente");
  };

  const proximosSeteDias = () => {
    const dias = [];
    for (let i = 1; i <= 7; i++) {
      const data = addDays(new Date(), i);
      dias.push({
        valor: format(data, "yyyy-MM-dd"),
        label: format(data, "EEEE, dd/MM", { locale: ptBR }),
      });
    }
    return dias;
  };

  const medicoSelecionado = medicos.find((m) => m._id === agendamento.medicoId);

  if (!pacienteLogado) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (etapa === 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Consulta Agendada com Sucesso!
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold mb-3">Detalhes do Agendamento:</h3>
            <div className="space-y-2">
              <p>
                <strong>Paciente:</strong> {pacienteLogado.nome}
              </p>
              <p>
                <strong>Médico:</strong> {medicoSelecionado?.nome}
              </p>
              <p>
                <strong>Especialidade:</strong>{" "}
                {medicoSelecionado?.especialidade}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {format(new Date(agendamento.data), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
              <p>
                <strong>Horário:</strong> {agendamento.horario}
              </p>
              <p>
                <strong>Tipo:</strong> {agendamento.tipoConsulta}
              </p>
              {agendamento.motivoConsulta && (
                <p>
                  <strong>Motivo:</strong> {agendamento.motivoConsulta}
                </p>
              )}
            </div>
          </div>
          <button onClick={resetarAgendamento} className="btn-primary">
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header com informações do paciente */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 mb-8 text-white shadow">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Bem-vindo(a), {pacienteLogado.nome}!
            </h1>
            <p className="opacity-90">Agende sua consulta médica</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* As consultas locais serão exibidas na Dashboard do paciente */}

      {/* Indicador de Etapas */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((numero) => (
          <React.Fragment key={numero}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                etapa >= numero
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {numero}
            </div>
            {numero < 3 && (
              <div
                className={`w-16 h-1 ${
                  etapa > numero ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        {/* Etapa 1: Seleção de Médico */}
        {etapa === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center">
              <User className="w-5 h-5 mr-2" />
              Selecione o Médico
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médico/Especialidade
              </label>
              <select
                value={agendamento.medicoId}
                onChange={(e) => handleMedicoChange(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Selecione um médico</option>
                {medicos.map((medico) => (
                  <option key={medico._id} value={medico._id}>
                    {medico.nome} - {medico.especialidade} (R${" "}
                    {medico.valorConsulta})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEtapa(2)}
                disabled={!agendamento.medicoId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Seleção de Data e Horário */}
        {etapa === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Selecione Data e Horário
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Consulta
              </label>
              <select
                value={agendamento.data}
                onChange={(e) => handleDataChange(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Selecione uma data</option>
                {proximosSeteDias().map((dia) => (
                  <option key={dia.valor} value={dia.valor}>
                    {dia.label}
                  </option>
                ))}
              </select>
            </div>

            {agendamento.data && agendamento.medicoId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horários Disponíveis
                </label>
                <AvailableSlotsPicker
                  doctorId={agendamento.medicoId}
                  date={agendamento.data}
                  onSelect={(t) =>
                    setAgendamento((prev) => ({ ...prev, horario: t }))
                  }
                />
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setEtapa(1)}
                className="btn-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapa(3)}
                disabled={!agendamento.horario}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Informações Adicionais */}
        {etapa === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informações da Consulta
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta
              </label>
              <select
                value={agendamento.tipoConsulta}
                onChange={(e) =>
                  setAgendamento((prev) => ({
                    ...prev,
                    tipoConsulta: e.target.value,
                  }))
                }
                className="form-input"
              >
                <option value="primeira-vez">Primeira Consulta</option>
                <option value="retorno">Retorno</option>
                <option value="urgencia">Urgência</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Consulta
              </label>
              <textarea
                value={agendamento.motivoConsulta}
                onChange={(e) =>
                  setAgendamento((prev) => ({
                    ...prev,
                    motivoConsulta: e.target.value,
                  }))
                }
                className="form-input"
                rows={3}
                placeholder="Descreva brevemente o motivo da consulta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={agendamento.observacoes}
                onChange={(e) =>
                  setAgendamento((prev) => ({
                    ...prev,
                    observacoes: e.target.value,
                  }))
                }
                className="form-input"
                rows={2}
                placeholder="Informações adicionais relevantes"
              />
            </div>

            {/* Resumo do Agendamento */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold mb-3">Resumo do Agendamento:</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Paciente:</strong> {pacienteLogado.nome}
                </p>
                <p>
                  <strong>Médico:</strong> {medicoSelecionado?.nome}
                </p>
                <p>
                  <strong>Data:</strong>{" "}
                  {format(new Date(agendamento.data), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
                <p>
                  <strong>Horário:</strong> {agendamento.horario}
                </p>
                <p>
                  <strong>Valor:</strong> R$ {medicoSelecionado?.valorConsulta}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setEtapa(2)}
                className="btn-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={confirmarAgendamento}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                {loading ? "Agendando..." : "Confirmar Agendamento"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendamentoPaciente;
