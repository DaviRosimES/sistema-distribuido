import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("carrega a interface sem tarefas", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Tarefas" }),
  ).toBeVisible();
  await expect(page.getByLabel("Título")).toBeVisible();
  await expect(page.getByLabel("Descrição")).toBeVisible();
  await expect(page.getByText("Nenhuma tarefa cadastrada.")).toBeVisible();
});

test("cadastra uma tarefa e mostra ela na listagem", async ({ page }) => {
  await page.getByLabel("Título").fill("Estudar");
  await page.getByLabel("Descrição").fill("Prática 6");
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("listitem")).toContainText("Estudar");
  await expect(page.getByRole("listitem")).toContainText("Prática 6");
  await expect(page.getByText("Nenhuma tarefa cadastrada.")).toBeHidden();
  await expect(page.getByLabel("Título")).toHaveValue("");
});

test("mostra erro e não cadastra com título vazio", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText("O título é obrigatório.");
  await expect(page.getByRole("listitem")).toHaveCount(0);
});

test("perde as tarefas ao recarregar, porque elas ficam só em memória", async ({
  page,
}) => {
  await page.getByLabel("Título").fill("Estudar");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);

  await page.reload();

  await expect(page.getByText("Nenhuma tarefa cadastrada.")).toBeVisible();
});

test("cabe numa tela de celular sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page
    .getByLabel("Título")
    .fill("Estudar para a prova de Sistemas Distribuídos");
  await page.getByRole("button", { name: "Adicionar" }).click();

  const temRolagemHorizontal = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(temRolagemHorizontal).toBe(false);
  await expect(page.getByRole("button", { name: "Adicionar" })).toBeVisible();
});
