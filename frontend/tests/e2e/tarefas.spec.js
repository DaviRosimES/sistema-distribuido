import { expect, test } from "@playwright/test";

// Sem mocks: as tarefas passam de verdade pela API e ficam no PostgreSQL.
// Os títulos levam um número único pra um teste não depender do que já está no banco.
function tituloUnico(base) {
  return `${base} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function linhaDa(page, titulo) {
  return page.getByRole("listitem").filter({ hasText: titulo });
}

async function cadastrar(page, titulo, descricao = "") {
  await page.getByLabel("Título", { exact: true }).first().fill(titulo);
  await page.getByLabel("Descrição", { exact: true }).first().fill(descricao);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(linhaDa(page, titulo)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Espera a primeira resposta da API antes de interagir
  await expect(page.getByText("Carregando tarefas...")).toBeHidden();
});

test("carrega a interface e a lista vinda da API", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Tarefas" }),
  ).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("cadastra uma tarefa e ela continua lá depois do F5", async ({ page }) => {
  const titulo = tituloUnico("Estudar");

  await cadastrar(page, titulo, "Prática 7");
  await page.reload();

  // Veio do PostgreSQL, porque o front não guarda mais nada em memória
  await expect(linhaDa(page, titulo)).toBeVisible();
  await expect(linhaDa(page, titulo)).toContainText("Prática 7");
});

test("mostra o erro da API ao repetir um título", async ({ page }) => {
  const titulo = tituloUnico("Repetida");
  await cadastrar(page, titulo);

  await page.getByLabel("Título", { exact: true }).fill(titulo);
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Já existe uma tarefa com esse título",
  );
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(titulo);
  await expect(linhaDa(page, titulo)).toHaveCount(1);
});

test("marca como concluída e o status continua depois do F5", async ({
  page,
}) => {
  const titulo = tituloUnico("Concluir");
  await cadastrar(page, titulo);

  // click em vez de check: a caixa só fica marcada quando a API confirma o PATCH
  await linhaDa(page, titulo).getByRole("checkbox").click();
  await expect(linhaDa(page, titulo).getByRole("checkbox")).toBeChecked();
  await page.reload();

  await expect(linhaDa(page, titulo).getByRole("checkbox")).toBeChecked();
});

test("edita uma tarefa e a edição continua depois do F5", async ({ page }) => {
  const titulo = tituloUnico("Editar");
  const novoTitulo = tituloUnico("Editada");
  await cadastrar(page, titulo);

  await linhaDa(page, titulo).getByRole("button", { name: "Editar" }).click();
  // Na edição o título vira o valor do campo (não é mais texto da linha), então
  // a linha é achada pelo botão Salvar
  const edicao = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Salvar" }) });
  await edicao.getByLabel("Título", { exact: true }).fill(novoTitulo);
  await edicao.getByRole("button", { name: "Salvar" }).click();
  await expect(linhaDa(page, novoTitulo)).toBeVisible();
  await page.reload();

  await expect(linhaDa(page, novoTitulo)).toBeVisible();
  await expect(linhaDa(page, titulo)).toHaveCount(0);
});

test("remove uma tarefa e ela não volta depois do F5", async ({ page }) => {
  const titulo = tituloUnico("Remover");
  await cadastrar(page, titulo);

  await linhaDa(page, titulo).getByRole("button", { name: "Remover" }).click();
  await expect(linhaDa(page, titulo)).toHaveCount(0);
  await page.reload();

  await expect(linhaDa(page, titulo)).toHaveCount(0);
});

test("cabe numa tela de celular sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await cadastrar(page, tituloUnico("Tarefa com um título bem comprido"));

  const temRolagemHorizontal = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(temRolagemHorizontal).toBe(false);
});
