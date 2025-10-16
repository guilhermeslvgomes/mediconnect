import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Phone,
  Mail,
  Search,
  ChevronDown,
  BookOpen,
  Video,
  FileText,
  Shield,
  AlertCircle,
  Headphones,
  ArrowLeft,
} from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqsMedico: FAQ[] = [
  {
    category: "Agenda",
    question: "Como gerenciar minha disponibilidade?",
    answer:
      "Acesse 'Disponibilidade' no menu lateral para configurar seus horários de atendimento. Você pode definir horários recorrentes e adicionar exceções para datas específicas.",
  },
  {
    category: "Agenda",
    question: "Posso bloquear horários específicos?",
    answer:
      "Sim, na seção 'Disponibilidade', você pode adicionar exceções para bloquear horários em datas específicas, como férias ou compromissos pessoais.",
  },
  {
    category: "Agenda",
    question: "Como visualizar minhas próximas consultas?",
    answer:
      "No Dashboard, você verá um resumo das próximas consultas. Para ver detalhes completos, acesse a seção 'Consultas' no menu lateral.",
  },
  {
    category: "Consultas",
    question: "Como realizar uma teleconsulta?",
    answer:
      "No horário da consulta, acesse 'Consultas', localize o agendamento e clique em 'Iniciar Consulta Online'. Certifique-se de ter uma boa conexão de internet.",
  },
  {
    category: "Consultas",
    question: "Posso cancelar ou remarcar uma consulta?",
    answer:
      "Sim, acesse 'Consultas', selecione o agendamento desejado e escolha a opção de cancelar ou remarcar. O paciente será notificado automaticamente.",
  },
  {
    category: "Consultas",
    question: "Como registro o prontuário após a consulta?",
    answer:
      "Após finalizar a consulta, clique em 'Adicionar Relatório' para registrar anamnese, diagnóstico, prescrição e orientações.",
  },
  {
    category: "Relatórios",
    question: "Como criar relatórios médicos?",
    answer:
      "Na seção 'Relatórios', você pode criar novos documentos médicos incluindo anamnese, exame físico, diagnóstico e prescrição. Os relatórios ficam vinculados ao histórico do paciente.",
  },
  {
    category: "Relatórios",
    question: "Os pacientes têm acesso aos relatórios?",
    answer:
      "Sim, após você criar e salvar um relatório, o paciente pode acessá-lo em seu painel pessoal.",
  },
  {
    category: "Relatórios",
    question: "Posso editar um relatório após criado?",
    answer:
      "Sim, você pode editar relatórios acessando a seção 'Relatórios' e selecionando o documento desejado.",
  },
  {
    category: "Pacientes",
    question: "Como acesso o histórico completo de um paciente?",
    answer:
      "Durante ou após uma consulta, clique no nome do paciente para ver seu histórico completo de consultas, exames e relatórios anteriores.",
  },
  {
    category: "Pacientes",
    question: "Como adicionar anotações privadas sobre um paciente?",
    answer:
      "No prontuário do paciente, você pode adicionar observações que ficam visíveis apenas para você e outros médicos autorizados.",
  },
  {
    category: "Pagamento",
    question: "Como recebo pelos atendimentos?",
    answer:
      "Os pagamentos são processados automaticamente pela plataforma. Você receberá seus honorários na conta bancária cadastrada de acordo com o cronograma estabelecido.",
  },
  {
    category: "Pagamento",
    question: "Posso definir valores diferentes por tipo de consulta?",
    answer:
      "Sim, você pode configurar valores específicos para consultas presenciais e teleconsultas em 'Configurações'.",
  },
  {
    category: "Sistema",
    question: "Como atualizar meus dados cadastrais?",
    answer:
      "Acesse 'Configurações' no menu lateral para atualizar suas informações pessoais, dados bancários, especialidades e outras configurações.",
  },
  {
    category: "Sistema",
    question: "Como funciona a notificação de novos agendamentos?",
    answer:
      "Você receberá notificações por e-mail e SMS sempre que um novo agendamento for realizado. Você pode configurar suas preferências em 'Configurações'.",
  },
  {
    category: "Sistema",
    question: "Meus dados estão seguros?",
    answer:
      "Sim, utilizamos criptografia de ponta a ponta e seguimos rigorosamente os protocolos da LGPD para proteger todos os dados médicos e pessoais.",
  },
  {
    category: "Suporte",
    question: "Como reportar problemas técnicos?",
    answer:
      "Entre em contato através do chat online, telefone (0800-123-4567) ou e-mail (secretaria.mediconnect@gmail.com). Nossa equipe técnica está disponível de segunda a sexta, das 8h às 18h.",
  },
  {
    category: "Suporte",
    question: "Existe treinamento para usar a plataforma?",
    answer:
      "Sim, oferecemos vídeos tutoriais e documentação completa. Você também pode agendar uma sessão de treinamento personalizada com nossa equipe.",
  },
];

const CentralAjudaMedico: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const categories = [
    "Todas",
    ...Array.from(new Set(faqsMedico.map((faq) => faq.category))),
  ];

  const filteredFaqs = faqsMedico.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-indigo-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <button
              onClick={() => navigate("/painel-medico")}
              className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar ao Painel</span>
            </button>
            <div className="text-center">
              <Headphones className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">
                Central de Ajuda - Médicos
              </h1>
              <p className="text-indigo-100 text-lg">
                Suporte especializado para profissionais de saúde
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-16 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chat Prioritário
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Suporte especializado para médicos
              </p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors">
                Iniciar Chat
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <Phone className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Linha Direta
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                0800-123-4567 (Opção 2)
              </p>
              <button className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors">
                Ligar Agora
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <Mail className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                E-mail Suporte
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                secretaria.mediconnect@gmail.com
              </p>
              <button className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors">
                Enviar E-mail
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Perguntas Frequentes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Dúvidas comuns de médicos e profissionais de saúde
          </p>

          {/* Search Box */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar em perguntas frequentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded">
                      {faq.category}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                      expandedIndex === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-16">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Nenhuma pergunta encontrada para "{searchTerm}"
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Tente outro termo de busca ou entre em contato conosco
              </p>
            </div>
          )}
        </div>

        {/* Additional Resources */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recursos para Médicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Manual do Médico
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Guia completo da plataforma
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                <Video className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Treinamentos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vídeos e webinars
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Modelos de Relatórios
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Templates prontos
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Conformidade LGPD
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Segurança e privacidade
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-indigo-500 rounded-xl shadow-md p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Precisa de ajuda específica?
          </h2>
          <p className="text-indigo-100 mb-6">
            Nossa equipe de suporte médico está à disposição
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium transition-colors">
              Falar com Especialista
            </button>
            <button className="border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-colors">
              Solicitar Treinamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CentralAjudaMedico;
