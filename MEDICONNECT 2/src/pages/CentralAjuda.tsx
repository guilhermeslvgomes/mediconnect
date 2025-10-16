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

const faqs: FAQ[] = [
  {
    category: "Agendamento",
    question: "Como agendar uma consulta?",
    answer:
      "Para agendar uma consulta, vá até a seção 'Agendar Consulta' no menu lateral, selecione o médico desejado, escolha uma data e horário disponível, e confirme o agendamento. Você receberá uma confirmação por e-mail.",
  },
  {
    category: "Agendamento",
    question: "Posso cancelar ou remarcar uma consulta?",
    answer:
      "Sim, você pode cancelar ou remarcar suas consultas em 'Minhas Consultas'. Recomendamos fazer isso com pelo menos 24 horas de antecedência para evitar taxas de cancelamento.",
  },
  {
    category: "Agendamento",
    question: "Posso agendar consulta para outra pessoa?",
    answer:
      "Sim, você pode agendar consultas para dependentes cadastrados em seu perfil. Basta selecioná-los no momento do agendamento.",
  },
  {
    category: "Consultas",
    question: "Como funciona a teleconsulta?",
    answer:
      "A teleconsulta é realizada por videochamada. No horário da consulta, acesse 'Minhas Consultas' e clique em 'Iniciar Consulta Online'. Certifique-se de ter uma conexão estável de internet e permita o acesso à câmera e microfone.",
  },
  {
    category: "Consultas",
    question: "Quanto tempo antes devo chegar para a consulta presencial?",
    answer:
      "Recomendamos chegar com 15 minutos de antecedência para realizar o check-in e atualizar suas informações cadastrais se necessário.",
  },
  {
    category: "Consultas",
    question: "Como acesso o histórico das minhas consultas?",
    answer:
      "Seu histórico completo de consultas está disponível em 'Minhas Consultas'. Lá você pode ver consultas realizadas, relatórios médicos e prescrições anteriores.",
  },
  {
    category: "Pagamento",
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "Aceitamos cartão de crédito, débito, PIX e boleto bancário. Os pagamentos são processados de forma segura através da nossa plataforma.",
  },
  {
    category: "Pagamento",
    question: "Posso parcelar o pagamento?",
    answer:
      "Sim, oferecemos parcelamento em até 3x sem juros no cartão de crédito para consultas acima de R$ 150,00.",
  },
  {
    category: "Pagamento",
    question: "Como funciona o reembolso em caso de cancelamento?",
    answer:
      "Cancelamentos feitos com mais de 24 horas de antecedência têm reembolso integral. Cancelamentos com menos de 24 horas podem ter retenção de 30% como taxa administrativa.",
  },
  {
    category: "Informações Médicas",
    question: "Como acesso meu histórico médico?",
    answer:
      "Seu histórico médico, incluindo consultas anteriores, exames e receitas, pode ser acessado na seção 'Meu Perfil'. Você pode fazer download de documentos quando necessário.",
  },
  {
    category: "Informações Médicas",
    question: "Os médicos têm acesso ao meu histórico completo?",
    answer:
      "Sim, os médicos da plataforma têm acesso ao seu histórico de consultas e exames realizados dentro do sistema para oferecer melhor atendimento.",
  },
  {
    category: "Informações Médicas",
    question: "Posso adicionar exames feitos fora da plataforma?",
    answer:
      "Sim, você pode fazer upload de exames e documentos médicos externos na seção 'Meu Perfil' > 'Documentos Médicos'.",
  },
  {
    category: "Segurança",
    question: "Meus dados estão seguros?",
    answer:
      "Sim, utilizamos criptografia de ponta a ponta e seguimos todos os protocolos da LGPD para proteger seus dados pessoais e médicos.",
  },
  {
    category: "Segurança",
    question: "Quem tem acesso às minhas informações?",
    answer:
      "Apenas você, os médicos que te atendem e profissionais autorizados da clínica têm acesso às suas informações. Nunca compartilhamos seus dados com terceiros sem autorização.",
  },
  {
    category: "Suporte",
    question: "Como entro em contato com o suporte?",
    answer:
      "Você pode entrar em contato através do chat online, telefone (0800-123-4567) ou e-mail (secretaria.mediconnect@gmail.com). Horário de atendimento: Segunda a Sexta, das 8h às 18h.",
  },
  {
    category: "Suporte",
    question: "O que fazer em caso de emergência?",
    answer:
      "Em casos de emergência, procure imediatamente o pronto-socorro mais próximo ou ligue para 192 (SAMU). Nossa plataforma é destinada a consultas agendadas e não substitui o atendimento de emergência.",
  },
  {
    category: "Médicos",
    question: "Posso escolher qualquer médico?",
    answer:
      "Sim, você pode escolher qualquer médico disponível na plataforma. Recomendamos verificar a especialidade, avaliações de outros pacientes e disponibilidade antes de agendar.",
  },
  {
    category: "Médicos",
    question: "Como avaliar um médico após a consulta?",
    answer:
      "Após cada consulta, você receberá um convite por e-mail para avaliar o atendimento. Você também pode avaliar acessando 'Minhas Consultas' e selecionando a consulta realizada.",
  },
];

const CentralAjuda: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const categories = [
    "Todas",
    ...Array.from(new Set(faqs.map((faq) => faq.category))),
  ];

  const filteredFaqs = faqs.filter((faq) => {
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
      <div className="bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <button
              onClick={() => navigate("/acompanhamento")}
              className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar ao Painel</span>
            </button>
            <div className="text-center">
              <Headphones className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">Central de Ajuda</h1>
              <p className="text-blue-100 text-lg">
                Encontre respostas para suas dúvidas rapidamente
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
              <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chat Online
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Fale conosco em tempo real
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
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
                Telefone
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                0800-123-4567
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
                E-mail
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
            Busque por palavras-chave ou navegue pelas categorias
          </p>

          {/* Search Box */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar em perguntas frequentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    ? "bg-blue-600 text-white"
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
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recursos Adicionais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Guia do Usuário
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manual completo da plataforma
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                <Video className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Vídeos Tutoriais
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aprenda assistindo
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Termos de Uso
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Leia nossos termos
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Política de Privacidade
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Como protegemos seus dados
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-500 rounded-xl shadow-md p-8 mt-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ainda tem dúvidas?</h2>
          <p className="text-blue-100 mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors">
              Falar com Suporte
            </button>
            <button className="border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-colors">
              Agendar Retorno de Ligação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CentralAjuda;
