/**
 * Traduções em Português do Brasil
 */
export const ptBR = {
  common: {
    skipToContent: "Pular para o conteúdo",
    loading: "Carregando...",
    error: "Erro",
    retry: "Tentar novamente",
    cancel: "Cancelar",
    confirm: "Confirmar",
    close: "Fechar",
    save: "Salvar",
    edit: "Editar",
    delete: "Excluir",
    search: "Pesquisar",
    filter: "Filtrar",
    viewAll: "Ver todas",
    noData: "Nenhum dado disponível",
  },
  header: {
    logo: "MediConnect",
    subtitle: "Sistema de Agendamento",
    home: "Início",
    login: "Entrar",
    logout: "Sair",
    notAuthenticated: "Não autenticado",
    profile: "Perfil",
    selectProfile: "Selecione seu perfil",
  },
  profiles: {
    patient: "Paciente",
    doctor: "Médico",
    secretary: "Secretária",
    patientDescription: "Agendar e acompanhar consultas",
    doctorDescription: "Gerenciar consultas e pacientes",
    secretaryDescription: "Cadastros e agendamentos",
  },
  home: {
    hero: {
      title: "Sistema de Agendamento Médico",
      subtitle:
        "Conectando pacientes e profissionais de saúde com eficiência e segurança",
      ctaPrimary: "Agendar consulta",
      ctaSecondary: "Ver próximas consultas",
    },
    metrics: {
      totalPatients: "Total de Pacientes",
      totalPatientsDescription:
        "Número total de pacientes cadastrados no sistema",
      activeDoctors: "Médicos Ativos",
      activeDoctorsDescription: "Profissionais disponíveis para atendimento",
      todayAppointments: "Consultas Hoje",
      todayAppointmentsDescription: "Consultas agendadas para hoje",
      pendingAppointments: "Pendentes",
      pendingAppointmentsDescription:
        "Consultas agendadas ou confirmadas aguardando realização",
    },
    emptyStates: {
      noPatients: "Nenhum paciente cadastrado",
      noDoctors: "Nenhum médico cadastrado",
      noAppointments: "Nenhuma consulta agendada",
      registerPatient: "Cadastrar paciente",
      inviteDoctor: "Convidar médico",
      scheduleAppointment: "Agendar consulta",
    },
    actionCards: {
      scheduleAppointment: {
        title: "Agendar Consulta",
        description: "Agende consultas médicas de forma rápida e prática",
        cta: "Acessar Agendamento",
        ctaAriaLabel: "Ir para página de agendamento de consultas",
      },
      doctorPanel: {
        title: "Painel do Médico",
        description: "Gerencie consultas, horários e prontuários",
        cta: "Acessar Painel",
        ctaAriaLabel: "Ir para painel do médico",
      },
      patientManagement: {
        title: "Gestão de Pacientes",
        description: "Cadastre e gerencie informações de pacientes",
        cta: "Acessar Cadastro",
        ctaAriaLabel: "Ir para área de cadastro de pacientes",
      },
    },
    upcomingConsultations: {
      title: "Próximas Consultas",
      empty: "Nenhuma consulta agendada",
      viewAll: "Ver todas as consultas",
      date: "Data",
      time: "Horário",
      patient: "Paciente",
      doctor: "Médico",
      status: "Status",
      statusScheduled: "Agendada",
      statusConfirmed: "Confirmada",
      statusCompleted: "Realizada",
      statusCanceled: "Cancelada",
      statusMissed: "Faltou",
    },
    errorLoadingStats: "Erro ao carregar estatísticas",
  },
  accessibility: {
    reducedMotion: "Preferência por movimento reduzido detectada",
    highContrast: "Alto contraste",
    largeText: "Texto aumentado",
    darkMode: "Modo escuro",
  },
};

export type TranslationKeys = typeof ptBR;
