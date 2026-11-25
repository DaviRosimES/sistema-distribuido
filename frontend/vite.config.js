import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    // Os testes com userEvent digitam campo a campo; com todos os arquivos rodando em
    // paralelo (e no CI) os 5s padrão às vezes não bastam
    testTimeout: 15000,
    // Só unit e integration: os testes E2E são do Playwright e não podem rodar no Vitest
    include: [
      "tests/unit/**/*.test.{js,jsx}",
      "tests/integration/**/*.test.{js,jsx}",
    ],
  },
});
