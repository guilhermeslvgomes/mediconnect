import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  MessageCircle,
  HelpCircle,
  LogOut,
  Home,
  Stethoscope,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import consultaService from "../services/consultaService";
import medicoService from "../services/medicoService";
import AgendamentoConsultaSimples from "../components/AgendamentoConsultaSimples";
import { consultasLocalService } from "../services/consultasLocalService";

interface Consulta {
  _id: string;
  pacienteId: string;
  medicoId: string;
  dataHora: string;
  status: "agendada" | "confirmada" | "realizada" | "cancelada" | "faltou";
  tipoConsulta: string;
  motivoConsulta: string;
  observacoes?: string;
  resultados?: string;
  prescricoes?: string;
  proximaConsulta?: string;
  medicoNome?: string;
  especialidade?: string;
  valorConsulta?: number;
}

interface Medico {
  _id?: string;
  id?: string;
  nome: string;
  especialidade: string;
  valorConsulta?: number;
  valor_consulta?: number;
  crm?: string;
}

const AcompanhamentoPaciente: React.FC = () => {
  const { user, roles = [], logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState<string>("");

  const pacienteId = user?.id || "";
  const pacienteNome = user?.nome || "Paciente";

  useEffect(() => {
    // Permite acesso se for paciente OU se roles inclui 'paciente'
    const isPaciente = user?.role === "paciente" || roles.includes("paciente");
    if (!user || !isPaciente) navigate("/paciente");
  }, [user, roles, navigate]);

  const fetchConsultas = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    setLoadingMedicos(true);
    try {
      // Buscar consultas da API
      const consultasResp = await consultaService.listarConsultas({
        paciente_id: pacienteId,
      });

      // Buscar médicos
      const medicosResp = await medicoService.listarMedicos({});
      if (medicosResp.success && medicosResp.data) {
        setMedicos(medicosResp.data.data as Medico[]);
      }
      setLoadingMedicos(false);

      let consultasAPI: Consulta[] = [];
      if (consultasResp.success && consultasResp.data) {
        const consultasData = Array.isArray(consultasResp.data)
          ? consultasResp.data
          : consultasResp.data.data || [];

        consultasAPI = consultasData.map((c) => ({
          _id: c._id || c.id,
          pacienteId: c.pacienteId,
          medicoId: c.medicoId,
          dataHora: c.dataHora,
          status: c.status || "agendada",
          tipoConsulta: c.tipoConsulta || c.tipo || "presencial",
          motivoConsulta:
            c.motivoConsulta || c.observacoes || "Consulta médica",
          observacoes: c.observacoes,
          resultados: c.resultados,
          prescricoes: c.prescricoes,
          proximaConsulta: c.proximaConsulta,
        }));
      }

      // Buscar consultas locais
      const consultasLocais = consultasLocalService.getConsultas(pacienteId);
      const consultasLocaisFormatted: Consulta[] = consultasLocais.map((c) => ({
        _id: c.id,
        pacienteId: c.pacienteId,
        medicoId: c.medicoId,
        dataHora: c.dataHora,
        status: c.status,
        tipoConsulta: c.tipo,
        motivoConsulta: c.motivo,
        observacoes: c.motivo,
        medicoNome: c.medicoNome,
        especialidade: c.especialidade,
        valorConsulta: c.valorConsulta,
      }));

      // Combinar consultas da API e locais
      const todasConsultas = [...consultasAPI, ...consultasLocaisFormatted];
      setConsultas(todasConsultas);
    } catch (error) {
      setLoadingMedicos(false);
      console.error("Erro ao carregar consultas:", error);
      toast.error("Erro ao carregar consultas");

      // Em caso de erro da API, ainda mostrar consultas locais
      try {
        const consultasLocais = consultasLocalService.getConsultas(pacienteId);
        const consultasLocaisFormatted: Consulta[] = consultasLocais.map(
          (c) => ({
            _id: c.id,
            pacienteId: c.pacienteId,
            medicoId: c.medicoId,
            dataHora: c.dataHora,
            status: c.status,
            tipoConsulta: c.tipo,
            motivoConsulta: c.motivo,
            observacoes: c.motivo,
            medicoNome: c.medicoNome,
            especialidade: c.especialidade,
            valorConsulta: c.valorConsulta,
          })
        );
        setConsultas(consultasLocaisFormatted);
      } catch (localError) {
        console.error("Erro ao carregar consultas locais:", localError);
        setConsultas([]);
      }
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  // Recarregar consultas quando mudar para a aba de consultas
  useEffect(() => {
    if (activeTab === "appointments") {
      fetchConsultas();
    }
  }, [activeTab, fetchConsultas]);

  const getMedicoNome = (medicoId: string) => {
    const medico = medicos.find((m) => m._id === medicoId || m.id === medicoId);
    return medico?.nome || "Médico";
  };

  const getMedicoEspecialidade = (medicoId: string) => {
    const medico = medicos.find((m) => m._id === medicoId || m.id === medicoId);
    return medico?.especialidade || "Especialidade";
  };

  const handleRemarcar = () => {
    setActiveTab("book");
    toast.success("Selecione um novo horário para remarcar sua consulta");
  };

  const handleCancelar = async (consultaId: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta consulta?")) {
      return;
    }

    try {
      await consultaService.atualizarConsulta(consultaId, {
        status: "cancelada",
      });
      toast.success("Consulta cancelada com sucesso");
      fetchConsultas();
    } catch (error) {
      console.error("Erro ao cancelar consulta:", error);
      toast.error("Erro ao cancelar consulta. Tente novamente.");
    }
  };

  const consultasProximas = consultas
    .filter((c) => c.status === "agendada" || c.status === "confirmada")
    .sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    )
    .slice(0, 3);

  const consultasPassadas = consultas
    .filter((c) => c.status === "realizada")
    .sort(
      (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    )
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "agendada":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "realizada":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800";
      case "cancelada":
      case "faltou":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmada":
        return "Confirmada";
      case "agendada":
        return "Agendada";
      case "realizada":
        return "Concluída";
      case "cancelada":
        return "Cancelada";
      case "faltou":
        return "Não Compareceu";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmada":
        return <CheckCircle className="h-4 w-4" />;
      case "agendada":
        return <Clock className="h-4 w-4" />;
      case "cancelada":
      case "faltou":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Menu items
  const menuItems = [
    { id: "dashboard", label: "Início", icon: Home },
    { id: "appointments", label: "Minhas Consultas", icon: Calendar },
    { id: "book", label: "Agendar Consulta", icon: Stethoscope },
    { id: "messages", label: "Mensagens", icon: MessageCircle },
    { id: "help", label: "Ajuda", icon: HelpCircle },
    { id: "profile", label: "Meu Perfil", icon: User },
  ];

  // Sidebar
  const renderSidebar = () => (
    <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Patient Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-700 to-blue-400 flex items-center justify-center text-white font-semibold text-lg">
            {pacienteNome
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {pacienteNome}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Paciente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "help") {
                    navigate("/ajuda");
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => {
            logout();
            navigate("/paciente");
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );

  // Stat Card
  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ElementType,
    description?: string
  ) => {
    const Icon = icon;
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    );
  };

  // Appointment Card
  const renderAppointmentCard = (
    consulta: Consulta,
    isPast: boolean = false
  ) => {
    // Usar dados da consulta local se disponível, senão buscar pelo ID do médico
    const medicoNome = consulta.medicoNome || getMedicoNome(consulta.medicoId);
    const especialidade =
      consulta.especialidade || getMedicoEspecialidade(consulta.medicoId);

    return (
      <div
        key={consulta._id}
        className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
          {medicoNome
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {medicoNome}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {especialidade}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                consulta.status
              )}`}
            >
              {getStatusIcon(consulta.status)}
              {getStatusLabel(consulta.status)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(consulta.dataHora), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(consulta.dataHora), "HH:mm", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {consulta.tipoConsulta === "online" ||
              consulta.tipoConsulta === "telemedicina" ? (
                <>
                  <Video className="h-4 w-4" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>Presencial</span>
                </>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Motivo: {consulta.motivoConsulta}
          </p>

          {!isPast && consulta.status !== "cancelada" && (
            <div className="flex gap-2">
              {consulta.status === "confirmada" &&
                (consulta.tipoConsulta === "online" ||
                  consulta.tipoConsulta === "telemedicina") && (
                  <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <Video className="h-4 w-4" />
                    Entrar na Consulta
                  </button>
                )}
              <button
                onClick={handleRemarcar}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Remarcar
              </button>
              <button
                onClick={() => handleCancelar(consulta._id)}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dashboard Content
  const renderDashboard = () => {
    const proximaConsulta = consultasProximas[0];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bem-vindo, {pacienteNome.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas consultas e cuide da sua saúde
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderStatCard(
            "Próxima Consulta",
            proximaConsulta
              ? format(new Date(proximaConsulta.dataHora), "dd MMM", {
                  locale: ptBR,
                })
              : "Nenhuma",
            Calendar,
            proximaConsulta
              ? `${getMedicoEspecialidade(proximaConsulta.medicoId)} - ${format(
                  new Date(proximaConsulta.dataHora),
                  "HH:mm"
                )}`
              : "Agende uma consulta"
          )}
          {renderStatCard(
            "Consultas Agendadas",
            consultasProximas.length,
            Clock,
            "Este mês"
          )}
          {renderStatCard(
            "Médicos Favoritos",
            new Set(consultas.map((c) => c.medicoId)).size,
            Stethoscope,
            "Salvos"
          )}
        </div>

        {/* Próximas Consultas e Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Próximas Consultas
                </h2>
                <button
                  onClick={() => setActiveTab("appointments")}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
                >
                  Ver todas
                </button>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
              ) : consultasProximas.length === 0 ? (
                <p className="text-center py-8 text-gray-600 dark:text-gray-400">
                  Nenhuma consulta agendada
                </p>
              ) : (
                <div className="space-y-4">
                  {consultasProximas.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getMedicoNome(c.medicoId)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getMedicoEspecialidade(c.medicoId)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(c.dataHora), "dd/MM/yyyy - HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ações Rápidas
              </h2>
            </div>
            <div className="p-6 space-y-2">
              <button
                onClick={() => setActiveTab("book")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Agendar Nova Consulta</span>
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Mensagens</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Editar Perfil</span>
              </button>
              <button
                onClick={() => navigate("/ajuda")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Central de Ajuda</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dicas de Saúde */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dicas de Saúde
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  💧 Hidratação
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Beba pelo menos 2 litros de água por dia para manter seu corpo
                  hidratado
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  🏃 Exercícios
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  30 minutos de atividade física diária ajudam a prevenir
                  doenças
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Appointments Content
  const renderAppointments = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Minhas Consultas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize e gerencie todas as suas consultas
        </p>
      </div>

      {/* Próximas */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Próximas Consultas
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          ) : consultasProximas.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Nenhuma consulta agendada
            </p>
          ) : (
            <div className="space-y-4">
              {consultasProximas.map((c) => renderAppointmentCard(c))}
            </div>
          )}
        </div>
      </div>

      {/* Passadas */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Histórico
          </h2>
        </div>
        <div className="p-6">
          {consultasPassadas.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Nenhuma consulta realizada
            </p>
          ) : (
            <div className="space-y-4">
              {consultasPassadas.map((c) => renderAppointmentCard(c, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Book Appointment Content
  const renderBookAppointment = () => (
  <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Agendar Nova Consulta
      </h1>
      <div className="flex items-center justify-center mb-6">
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold">
              1
            </span>
            <span className="text-xs mt-2">Escolha o médico</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 font-bold">
              2
            </span>
            <span className="text-xs mt-2">Horário</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 font-bold">
              3
            </span>
            <span className="text-xs mt-2">Confirmação</span>
          </div>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Escolha um Médico
      </h2>
      {/* Filtro de especialidade */}
      <div className="mb-4">
        <label className="mr-2 font-medium">Escolha a especialidade:</label>
        <select
          className="border rounded px-2 py-1"
          value={especialidadeFiltro}
          onChange={e => setEspecialidadeFiltro(e.target.value)}
        >
          <option value="">Selecione...</option>
          <option value="__all__">Todas</option>
          {Array.from(new Set(medicos.map(m => m.especialidade).filter(Boolean))).sort().map(espec => (
            <option key={espec} value={espec}>{espec}</option>
          ))}
        </select>
      </div>
      {loadingMedicos ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {(
            (especialidadeFiltro === "__all__")
              ? medicos
              : especialidadeFiltro
                ? medicos.filter(m => m.especialidade === especialidadeFiltro)
                : []
          ).length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Nenhum médico disponível
            </p>
          ) : (
            (especialidadeFiltro === "__all__"
              ? medicos
              : especialidadeFiltro
                ? medicos.filter(m => m.especialidade === especialidadeFiltro)
                : []
            ).map((medico) => (
              <div
                key={medico.id || medico._id}
                className="flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {medico.nome}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {medico.especialidade}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      CRM/SP {medico.crm}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-green-600 font-bold text-lg">
                    R$ {medico.valorConsulta}
                  </div>
                  <button
                    className={`px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      selectedMedicoId === (medico.id || medico._id)
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedMedicoId(medico.id || medico._id || "")
                    }
                  >
                    Selecionar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Só renderiza o componente de agendamento se um médico for selecionado */}
      {selectedMedicoId && (() => {
        const raw = medicos.find(m => m.id === selectedMedicoId || m._id === selectedMedicoId);
        const medico = raw
          ? {
              id: raw.id || raw._id || "",
              nome: raw.nome,
              especialidade: raw.especialidade,
              crm: raw.crm || "",
              valorConsulta: raw.valorConsulta || raw.valor_consulta || 0,
            }
          : null;
        return <AgendamentoConsultaSimples medico={medico} />;
      })()}
    </div>
  );

  // Messages Content
  const renderMessages = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mensagens
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Converse com seus médicos
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <p className="text-center py-16 text-gray-600 dark:text-gray-400">
          Sistema de mensagens em desenvolvimento
        </p>
      </div>
    </div>
  );

  // Help Content
  const renderHelp = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Central de Ajuda
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Como podemos ajudar você?
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <p className="text-center py-16 text-gray-600 dark:text-gray-400">
          Central de ajuda em desenvolvimento
        </p>
      </div>
    </div>
  );

  // Profile Content
  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <p className="text-center py-16 text-gray-600 dark:text-gray-400">
          Edição de perfil em desenvolvimento
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "appointments":
        return renderAppointments();
      case "book":
        return renderBookAppointment();
      case "messages":
        return renderMessages();
      case "help":
        return renderHelp();
      case "profile":
        return renderProfile();
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você precisa estar logado para acessar esta página.
          </p>
          <button
            onClick={() => navigate("/paciente")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AcompanhamentoPaciente;
