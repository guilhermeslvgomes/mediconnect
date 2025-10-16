import { ptBR, TranslationKeys } from "./pt-BR";
import { enUS } from "./en-US";

type Locale = "pt-BR" | "en-US";

const translations: Record<Locale, TranslationKeys> = {
  "pt-BR": ptBR,
  "en-US": enUS as TranslationKeys,
};

class I18n {
  private currentLocale: Locale = "pt-BR";

  constructor() {
    // Detectar idioma do navegador
    const browserLang = navigator.language;
    if (browserLang.startsWith("en")) {
      this.currentLocale = "en-US";
    }

    // Carregar preferência salva
    const savedLocale = localStorage.getItem("mediconnect_locale") as Locale;
    if (savedLocale && translations[savedLocale]) {
      this.currentLocale = savedLocale;
    }
  }

  public t(key: string): string {
    const keys = key.split(".");
    let value: Record<string, unknown> | string =
      translations[this.currentLocale];

    for (const k of keys) {
      if (typeof value === "object" && value && k in value) {
        value = value[k] as Record<string, unknown> | string;
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  }

  public setLocale(locale: Locale): void {
    if (translations[locale]) {
      this.currentLocale = locale;
      localStorage.setItem("mediconnect_locale", locale);
      // Atualizar lang do HTML
      document.documentElement.lang = locale;
    }
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  public formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }

  public formatTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLocale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }

  public formatDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
}

export const i18n = new I18n();
export type { Locale };
