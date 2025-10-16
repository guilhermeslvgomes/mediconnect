import React from "react";
import { LucideIcon, AlertCircle } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  description: string;
  loading?: boolean;
  error?: boolean;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  ariaLabel?: string;
}

const MetricCardSkeleton: React.FC = () => (
  <div
    className="bg-white rounded-lg shadow-md p-6 animate-pulse"
    role="status"
    aria-label="Carregando métrica"
  >
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gray-200 rounded-full" />
      <div className="ml-4 flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

const MetricCardError: React.FC<{ title: string; onRetry?: () => void }> = ({
  title,
  onRetry,
}) => (
  <div
    className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200"
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-center">
      <div className="p-3 bg-red-100 rounded-full">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-sm text-red-600 mt-1">Erro ao carregar</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Tentar carregar novamente"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  </div>
);

const MetricCardEmpty: React.FC<{
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  emptyAction: { label: string; onClick: () => void };
}> = ({ title, icon: Icon, iconColor, iconBgColor, emptyAction }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-100">
    <div className="flex items-center">
      <div className={`p-3 ${iconBgColor} rounded-full`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">0</p>
        <button
          onClick={emptyAction.onClick}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors"
          aria-label={emptyAction.label}
        >
          {emptyAction.label}
        </button>
      </div>
    </div>
  </div>
);

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  description,
  loading = false,
  error = false,
  emptyAction,
  ariaLabel,
}) => {
  if (loading) {
    return <MetricCardSkeleton />;
  }

  if (error) {
    return <MetricCardError title={title} />;
  }

  const numericValue =
    typeof value === "number" ? value : parseInt(String(value), 10) || 0;

  if (numericValue === 0 && emptyAction) {
    return (
      <MetricCardEmpty
        title={title}
        icon={Icon}
        iconColor={iconColor}
        iconBgColor={iconBgColor}
        emptyAction={emptyAction}
      />
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
      role="region"
      aria-label={ariaLabel || title}
    >
      <div className="flex items-center relative">
        <div
          className={`p-3 ${iconBgColor} rounded-full group-hover:scale-110 transition-transform`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {/* Tooltip */}
            <div className="relative group/tooltip">
              <button
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                aria-label={`Informações sobre ${title}`}
                type="button"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <div
                className="absolute z-10 invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg py-2 px-3 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 pointer-events-none"
                role="tooltip"
              >
                {description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            </div>
          </div>
          <p
            className="text-2xl font-bold text-gray-900 tabular-nums"
            aria-live="polite"
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
