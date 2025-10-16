import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import AccessibilityMenu from "./components/AccessibilityMenu";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";
import LoginPaciente from "./pages/LoginPaciente";
import LoginSecretaria from "./pages/LoginSecretaria";
import LoginMedico from "./pages/LoginMedico";
import AgendamentoPaciente from "./pages/AgendamentoPaciente";
import AcompanhamentoPaciente from "./pages/AcompanhamentoPaciente";
import CadastroSecretaria from "./pages/CadastroSecretaria";
import CadastroMedico from "./pages/CadastroMedico";
import CadastroPaciente from "./pages/CadastroPaciente";
import PainelMedico from "./pages/PainelMedico";
import PainelSecretaria from "./pages/PainelSecretaria";
import ProntuarioPaciente from "./pages/ProntuarioPaciente";
import TokenInspector from "./pages/TokenInspector";
import AdminDiagnostico from "./pages/AdminDiagnostico";
import TesteCadastroSquad18 from "./pages/TesteCadastroSquad18";
import PainelAdmin from "./pages/PainelAdmin";
import CentralAjudaRouter from "./pages/CentralAjudaRouter";

function App() {
  return (
    <Router>
      <div className="app-root min-h-screen bg-gray-50 dark:bg-slate-900 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <a
          href="#main-content"
          className="fixed -top-20 left-4 z-50 px-3 py-2 bg-blue-600 text-white rounded shadow transition-all focus:top-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paciente" element={<LoginPaciente />} />
            <Route path="/login-secretaria" element={<LoginSecretaria />} />
            <Route path="/login-medico" element={<LoginMedico />} />
            <Route path="/cadastro-medico" element={<CadastroMedico />} />
            <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
            <Route path="/dev/token" element={<TokenInspector />} />
            <Route path="/admin/diagnostico" element={<AdminDiagnostico />} />
            <Route path="/teste-squad18" element={<TesteCadastroSquad18 />} />
            <Route path="/cadastro" element={<CadastroSecretaria />} />
            <Route path="/ajuda" element={<CentralAjudaRouter />} />
            <Route element={<ProtectedRoute roles={["admin", "gestor"]} />}>
              <Route path="/admin" element={<PainelAdmin />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  roles={["medico", "gestor", "secretaria", "admin"]}
                />
              }
            >
              <Route path="/painel-medico" element={<PainelMedico />} />
            </Route>
            <Route
              element={
                <ProtectedRoute roles={["secretaria", "gestor", "admin"]} />
              }
            >
              <Route path="/painel-secretaria" element={<PainelSecretaria />} />
              <Route path="/pacientes/:id" element={<ProntuarioPaciente />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  roles={["paciente", "user", "admin", "gestor"]}
                />
              }
            >
              <Route
                path="/acompanhamento"
                element={<AcompanhamentoPaciente />}
              />
              <Route path="/agendamento" element={<AgendamentoPaciente />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
        <AccessibilityMenu />
      </div>
    </Router>
  );
}

export default App;
