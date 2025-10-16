import { useCallback, useEffect, useRef, useState } from "react";

export interface AccessibilityPrefs {
  fontSize: number; // percent (80-160)
  highContrast: boolean;
  darkMode: boolean;
  textToSpeech: boolean;
  dyslexicFont: boolean;
  lineSpacing: boolean; // increased line height
  reducedMotion: boolean;
  lowBlueLight: boolean; // yellowish filter
  focusMode: boolean; // dim unfocused
}

export const STORAGE_KEY = "accessibility-prefs";
export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
  fontSize: 100,
  highContrast: false,
  darkMode: false,
  textToSpeech: false,
  dyslexicFont: false,
  lineSpacing: false,
  reducedMotion: false,
  lowBlueLight: false,
  focusMode: false,
};

export function loadAccessibilityPrefsForTest(): AccessibilityPrefs {
  // export apenas para testes
  return loadPrefs();
}

function loadPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ACCESSIBILITY_PREFS;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>;
    return { ...DEFAULT_ACCESSIBILITY_PREFS, ...parsed };
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFS;
  }
}

export function applyAccessibilityPrefsForTest(
  prefs: AccessibilityPrefs,
  root: HTMLElement = document.documentElement
) {
  // Replica lógica de efeitos para testes unitários sem React
  root.style.fontSize = `${prefs.fontSize}%`;
  const toggle = (flag: boolean, className: string) => {
    if (flag) root.classList.add(className);
    else root.classList.remove(className);
  };
  toggle(prefs.highContrast, "high-contrast");
  toggle(prefs.darkMode, "dark");
  toggle(prefs.dyslexicFont, "dyslexic-font");
  toggle(prefs.lineSpacing, "line-spacing");
  toggle(prefs.reducedMotion, "reduced-motion");
  toggle(prefs.lowBlueLight, "low-blue-light");
  toggle(prefs.focusMode, "focus-mode");
}

export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => loadPrefs());
  const initialized = useRef(false);

  // Persist whenever prefs change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  // Apply side-effects (classes & font-size)
  useEffect(() => {
    const root = document.documentElement;
    // Font size
    root.style.fontSize = `${prefs.fontSize}%`;

    const toggle = (flag: boolean, className: string) => {
      if (flag) root.classList.add(className);
      else root.classList.remove(className);
    };
    toggle(prefs.highContrast, "high-contrast");
    toggle(prefs.darkMode, "dark");
    toggle(prefs.dyslexicFont, "dyslexic-font");
    toggle(prefs.lineSpacing, "line-spacing");
    toggle(prefs.reducedMotion, "reduced-motion");
    toggle(prefs.lowBlueLight, "low-blue-light");
    toggle(prefs.focusMode, "focus-mode");
  }, [prefs]);

  const update = useCallback((patch: Partial<AccessibilityPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setPrefs(DEFAULT_ACCESSIBILITY_PREFS), []);

  return { prefs, update, reset };
}
