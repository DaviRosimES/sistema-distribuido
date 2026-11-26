import { defineConfig, devices } from "@playwright/test";

// O E2E roda contra a stack inteira no Docker (frontend + API + banco), então o
// Playwright não sobe servidor nenhum: ele só abre o navegador no endereço do frontend.
// O make e2e sobe uma stack separada e aponta o E2E_BASE_URL pra ela.
export default defineConfig({
  testDir: "./tests/e2e",
  // Na CI um test.only esquecido faz o workflow falhar em vez de pular o resto dos testes
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
