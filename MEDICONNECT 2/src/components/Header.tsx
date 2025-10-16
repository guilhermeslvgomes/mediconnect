import React from "react";
import { Link } from "react-router-dom";
import { Heart, LogOut, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ProfileSelector } from "./ProfileSelector";
import { i18n } from "../i18n";
import Logo from "./images/logo.PNG";

const Header: React.FC = () => {
  const { user, logout, role, isAuthenticated } = useAuth();

  const roleLabel: Record<string, string> = {
    secretaria: "Secretaria",
    medico: "Médico",
    paciente: "Paciente",
    admin: "Administrador",
    gestor: "Gestor",
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:outline-none"
      >
        {i18n.t("common.skipToContent")}
      </a>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <img
              src={Logo}
              alt={i18n.t("header.logo")}
              className="h-14 w-14 rounded-lg object-contain shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {i18n.t("header.logo")}
              </h1>
              <p className="text-xs text-gray-500">
                {i18n.t("header.subtitle")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-2"
            aria-label="Navegação principal"
          >
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span>{i18n.t("header.home")}</span>
            </Link>

            {/* Profile Selector */}
            <ProfileSelector />

            {/* Admin Link */}
            {isAuthenticated && (role === "admin" || role === "gestor") && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <span>Painel Admin</span>
              </Link>
            )}
          </nav>

          {/* User Session / Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <div className="text-right leading-tight min-w-0 flex-shrink">
                  <p
                    className="text-sm font-medium text-gray-700 truncate max-w-[120px]"
                    title={user.nome}
                  >
                    {user.nome.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {role ? roleLabel[role] || role : ""}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 hover:scale-105 active:scale-95 text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
                  aria-label={i18n.t("header.logout")}
                >
                  <LogOut className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span className="hidden lg:inline">
                    {i18n.t("header.logout")}
                  </span>
                  <span className="lg:hidden">Sair</span>
                </button>
              </>
            ) : (
              <Link
                to="/paciente"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-blue-700 to-blue-400 hover:from-blue-800 hover:to-blue-500 hover:scale-105 active:scale-95 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
                aria-label={i18n.t("header.login")}
              >
                <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                {i18n.t("header.login")}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2"
              aria-label="Menu de navegação"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-3">
          <div className="flex flex-col space-y-2">
            <Link
              to="/"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span>{i18n.t("header.home")}</span>
            </Link>

            <div className="px-3 py-2">
              <ProfileSelector />
            </div>

            {/* Sessão mobile */}
            <div className="mt-4 flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
              {isAuthenticated && user ? (
                <>
                  <div className="flex-1 mr-3 min-w-0">
                    <p
                      className="text-sm font-medium text-gray-700 truncate"
                      title={user.nome}
                    >
                      {user.nome.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {role ? roleLabel[role] || role : ""}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    aria-label={i18n.t("header.logout")}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/paciente"
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded bg-gradient-to-r from-blue-700 to-blue-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                  {i18n.t("header.login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
