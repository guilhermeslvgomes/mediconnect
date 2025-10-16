import { StrictMode } from "react";
import "./bootstrap/initServiceToken"; // inicializa token técnico (service account)
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

// Apply accessibility preferences before React mounts to avoid FOUC and ensure persistence across reloads.
// This also helps E2E test detect classes after reload.
(() => {
  try {
    const raw = localStorage.getItem("accessibility-prefs");
    if (!raw) return;
    const prefs = JSON.parse(raw) as Partial<{
      fontSize: number;
      highContrast: boolean;
      darkMode: boolean;
      dyslexicFont: boolean;
      lineSpacing: boolean;
      reducedMotion: boolean;
      lowBlueLight: boolean;
      focusMode: boolean;
    }>;
    const root = document.documentElement;
    if (typeof prefs.fontSize === "number") {
      root.style.fontSize = `${prefs.fontSize}%`;
    }
    const toggle = (flag: boolean | undefined, cls: string) => {
      if (flag) root.classList.add(cls);
      else root.classList.remove(cls);
    };
    toggle(prefs.highContrast, "high-contrast");
    toggle(prefs.darkMode, "dark");
    toggle(prefs.dyslexicFont, "dyslexic-font");
    toggle(prefs.lineSpacing, "line-spacing");
    toggle(prefs.reducedMotion, "reduced-motion");
    toggle(prefs.lowBlueLight, "low-blue-light");
    toggle(prefs.focusMode, "focus-mode");
  } catch {
    /* ignore */
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
  </StrictMode>
);
