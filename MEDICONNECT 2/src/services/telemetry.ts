/**
 * Sistema de telemetria para tracking de eventos
 * Expõe eventos via dataLayer (Google Tag Manager) e console
 */

export interface TelemetryEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: string;
}

declare global {
  interface Window {
    dataLayer?: TelemetryEvent[];
  }
}

class TelemetryService {
  private enabled: boolean;

  constructor() {
    this.enabled = true;
    this.initDataLayer();
  }

  private initDataLayer(): void {
    if (typeof window !== "undefined" && !window.dataLayer) {
      window.dataLayer = [];
    }
  }

  public trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    if (!this.enabled) return;

    const event: TelemetryEvent = {
      event: "custom_event",
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
    };

    // Push para dataLayer (GTM)
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push(event);
    }

    // Log no console (desenvolvimento)
    if (import.meta.env.DEV) {
      console.log("[Telemetry]", event);
    }
  }

  public trackCTA(ctaName: string, destination: string): void {
    this.trackEvent("CTA", "click", `${ctaName} -> ${destination}`);
  }

  public trackProfileChange(
    fromProfile: string | null,
    toProfile: string
  ): void {
    this.trackEvent(
      "Profile",
      "change",
      `${fromProfile || "none"} -> ${toProfile}`
    );
  }

  public trackNavigation(from: string, to: string): void {
    this.trackEvent("Navigation", "page_view", `${from} -> ${to}`);
  }

  public trackError(errorType: string, errorMessage: string): void {
    this.trackEvent("Error", errorType, errorMessage);
  }

  public disable(): void {
    this.enabled = false;
  }

  public enable(): void {
    this.enabled = true;
  }
}

export const telemetry = new TelemetryService();
