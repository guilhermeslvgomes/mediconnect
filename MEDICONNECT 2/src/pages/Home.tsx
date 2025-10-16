import React, { useState, useEffect } from "react";
import { Calendar, Users, UserCheck, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listPatients } from "../services/pacienteService";
import medicoService from "../services/medicoService";
import consultaService from "../services/consultaService";
import { MetricCard } from "../components/MetricCard";
import { i18n } from "../i18n";
import { telemetry } from "../services/telemetry";

const Home: React.FC = () => {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalMedicos: 0,
    consultasHoje: 0,
    consultasPendentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(false);

      const [pacientesResult, medicosResult, consultasResult] =
        await Promise.all([
          listPatients().catch(() => ({ data: [] })),
          medicoService.listarMedicos().catch(() => ({ data: { data: [] } })),
          consultaService
            .listarConsultas()
            .catch(() => ({ data: { data: [] } })),
        ]);

      const hoje = new Date().toISOString().split("T")[0];
      const consultas = consultasResult.data?.data || [];
      const consultasHoje =
        consultas.filter((consulta) => consulta.data_hora?.startsWith(hoje))
          .length || 0;

      const consultasPendentes =
        consultas.filter(
          (consulta) =>
            consulta.status === "agendada" || consulta.status === "confirmada"
        ).length || 0;

      const medicos = medicosResult.data?.data || [];

      setStats({
        totalPacientes: pacientesResult.data?.length || 0,
        totalMedicos: medicos.length || 0,
        consultasHoje,
        consultasPendentes,
      });
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      setError(true);
      telemetry.trackError("stats_load_error", String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCTA = (action: string, destination: string) => {
    telemetry.trackCTA(action, destination);
    navigate(destination);
  };

  return (
    <div className="space-y-8" id="main-content">
      {/* Hero Section */}
      <div className="relative text-center py-8 md:py-12 lg:py-16 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 text-white rounded-xl shadow-lg overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            {i18n.t("home.hero.title")}
          </h1>
          <p className="text-base md:text-lg lg:text-xl opacity-95 mb-6 md:mb-8 max-w-2xl mx-auto">
            {i18n.t("home.hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
            <button
              onClick={() => handleCTA("Agendar consulta", "/paciente")}
              className="group w-full sm:w-auto inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-blue-600"
              aria-label={i18n.t(
                "home.actionCards.scheduleAppointment.ctaAriaLabel"
              )}
            >
              <Calendar
                className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                aria-hidden="true"
              />
              {i18n.t("home.hero.ctaPrimary")}
              <ArrowRight
                className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </button>

            <button
              onClick={() => handleCTA("Ver próximas consultas", "/consultas")}
              className="group w-full sm:w-auto inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-blue-600"
              aria-label="Ver lista de próximas consultas"
            >
              <Clock className="w-5 h-5 mr-2" aria-hidden="true" />
              {i18n.t("home.hero.ctaSecondary")}
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        role="region"
        aria-label="Estatísticas do sistema"
      >
        <MetricCard
          title={i18n.t("home.metrics.totalPatients")}
          value={stats.totalPacientes}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          description={i18n.t("home.metrics.totalPatientsDescription")}
          loading={loading}
          error={error}
          ariaLabel={`${i18n.t("home.metrics.totalPatients")}: ${
            stats.totalPacientes
          }`}
        />

        <MetricCard
          title={i18n.t("home.metrics.activeDoctors")}
          value={stats.totalMedicos}
          icon={UserCheck}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
          description={i18n.t("home.metrics.activeDoctorsDescription")}
          loading={loading}
          error={error}
          ariaLabel={`${i18n.t("home.metrics.activeDoctors")}: ${
            stats.totalMedicos
          }`}
        />

        <MetricCard
          title={i18n.t("home.metrics.todayAppointments")}
          value={stats.consultasHoje}
          icon={Calendar}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-50"
          description={i18n.t("home.metrics.todayAppointmentsDescription")}
          loading={loading}
          error={error}
          ariaLabel={`${i18n.t("home.metrics.todayAppointments")}: ${
            stats.consultasHoje
          }`}
        />

        <MetricCard
          title={i18n.t("home.metrics.pendingAppointments")}
          value={stats.consultasPendentes}
          icon={Clock}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-50"
          description={i18n.t("home.metrics.pendingAppointmentsDescription")}
          loading={loading}
          error={error}
          ariaLabel={`${i18n.t("home.metrics.pendingAppointments")}: ${
            stats.consultasPendentes
          }`}
        />
      </div>

      {/* Cards de Ação */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        role="region"
        aria-label="Ações rápidas"
      >
        <ActionCard
          icon={Calendar}
          iconColor="text-blue-600"
          iconBgColor="bg-gradient-to-br from-blue-700 to-blue-400"
          title={i18n.t("home.actionCards.scheduleAppointment.title")}
          description={i18n.t(
            "home.actionCards.scheduleAppointment.description"
          )}
          ctaLabel={i18n.t("home.actionCards.scheduleAppointment.cta")}
          ctaAriaLabel={i18n.t(
            "home.actionCards.scheduleAppointment.ctaAriaLabel"
          )}
          onAction={() => handleCTA("Card Agendar", "/paciente")}
        />

        <ActionCard
          icon={UserCheck}
          iconColor="text-indigo-600"
          iconBgColor="bg-gradient-to-br from-indigo-600 to-indigo-400"
          title={i18n.t("home.actionCards.doctorPanel.title")}
          description={i18n.t("home.actionCards.doctorPanel.description")}
          ctaLabel={i18n.t("home.actionCards.doctorPanel.cta")}
          ctaAriaLabel={i18n.t("home.actionCards.doctorPanel.ctaAriaLabel")}
          onAction={() => handleCTA("Card Médico", "/login-medico")}
        />

        <ActionCard
          icon={Users}
          iconColor="text-green-600"
          iconBgColor="bg-gradient-to-br from-green-600 to-green-400"
          title={i18n.t("home.actionCards.patientManagement.title")}
          description={i18n.t("home.actionCards.patientManagement.description")}
          ctaLabel={i18n.t("home.actionCards.patientManagement.cta")}
          ctaAriaLabel={i18n.t(
            "home.actionCards.patientManagement.ctaAriaLabel"
          )}
          onAction={() => handleCTA("Card Secretaria", "/login-secretaria")}
        />
      </div>
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaAriaLabel: string;
  onAction: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  iconBgColor,
  title,
  description,
  ctaLabel,
  ctaAriaLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 md:p-6 hover:shadow-xl transition-all duration-200 group border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:ring-offset-2">
      <div
        className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-6 h-6 text-white`} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        {description}
      </p>
      <button
        onClick={onAction}
        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-700 to-blue-400 hover:from-blue-800 hover:to-blue-500 hover:scale-105 active:scale-95 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 group-hover:shadow-lg"
        aria-label={ctaAriaLabel}
      >
        {ctaLabel}
        <ArrowRight
          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

export default Home;
