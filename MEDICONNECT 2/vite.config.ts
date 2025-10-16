import react from "@vitejs/plugin-react";
import { defineConfig, UserConfig } from "vite";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let build: UserConfig["build"],
    esbuild: UserConfig["esbuild"],
    define: UserConfig["define"];

  if (mode === "development") {
    build = {
      minify: false,
    };

    esbuild = {
      jsxDev: true,
    };

    define = {
      "process.env.NODE_ENV": '"development"',
      __DEV__: "true",
    };
  } else {
    // Modo produção - copiar arquivos de dados
    build = {
      ...build,
      // Hook após o build para copiar arquivos
      rollupOptions: {
        output: {
          // Melhorar code-splitting em produção
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("react-router-dom") ||
                id.includes("react-router")
              )
                return "react-router";
              if (id.match(/node_modules\\(?:react|react-dom)(?:\\|\/)/))
                return "react";
              if (id.includes("axios")) return "axios";
              if (id.includes("date-fns")) return "date-fns";
              if (id.includes("lucide-react")) return "icons";
              if (
                id.includes("react-toastify") ||
                id.includes("react-hot-toast")
              )
                return "toasts";
              if (id.includes("zod")) return "zod";
              return "vendor";
            }
            return undefined;
          },
          assetFileNames: (assetInfo) => {
            // Manter nomes originais para assets
            if (assetInfo.name?.endsWith(".json")) {
              return "data/[name][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
    };
  }

  return {
    plugins: [
      react(),
      // Plugin customizado para copiar arquivos de dados
      {
        name: "copy-data-files",
        closeBundle() {
          if (mode === "production") {
            const dataDir = join(__dirname, "dist", "src", "data");
            if (!existsSync(dataDir)) {
              mkdirSync(dataDir, { recursive: true });
            }

            const sourceFile = join(
              __dirname,
              "src",
              "data",
              "consultas-demo.json"
            );
            const destFile = join(dataDir, "consultas-demo.json");

            if (existsSync(sourceFile)) {
              copyFileSync(sourceFile, destFile);
              console.log(
                "✅ Arquivo consultas-demo.json copiado para dist/src/data/"
              );
            }
          }
        },
      },
    ],
    build,
    esbuild,
    define,
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    // Incluir arquivos JSON e PNG (case insensitive) como assets
    assetsInclude: ["**/*.json", "**/*.png", "**/*.PNG"],
  };
});
