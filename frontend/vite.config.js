import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    // Só unit e integration: os testes E2E são do Playwright e não podem rodar no Vitest
    include: [
      "tests/unit/**/*.test.{js,jsx}",
      "tests/integration/**/*.test.{js,jsx}",
    ],
  },
});
