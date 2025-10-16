import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Keep test transform simple; plugin-react SWC already handled in Vite dev build, not needed here
  resolve: {
    // Ensure a single React instance to avoid invalid hook calls
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        __dirname,
        "node_modules/react/jsx-runtime.js"
      ),
      "react/jsx-dev-runtime": path.resolve(
        __dirname,
        "node_modules/react/jsx-dev-runtime.js"
      ),
      "react-dom/client": path.resolve(
        __dirname,
        "node_modules/react-dom/client"
      ),
      // Avoid cosmiconfig trying to parse package.json via custom loaders during tests (affects puppeteer)
      cosmiconfig: path.resolve(__dirname, "src/tests/shims/cosmiconfig.ts"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  // No Vite plugins required for Vitest; avoids type/version mismatches
  test: {
    // Temporário: usar happy-dom para contornar falha de render no jsdom enquanto ambiente React é estabilizado
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      // Temporarily exclude axe test due to jsdom/lru-cache compatibility issue
      "**/__tests__/accessibilityMenu.axe.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html"],
    },
  },
});
