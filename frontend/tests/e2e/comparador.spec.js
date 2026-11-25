import { expect, test } from "@playwright/test";

// Sem mocks: tudo passa de verdade pela API e fica no PostgreSQL.
// Os nomes levam um número único pra um teste não depender do que já está no banco.
function unico(base) {
  return `${base} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function abrir(page, aba) {
  await page.goto("/");
  // Espera a primeira resposta da API antes de interagir
  await expect(page.getByText("Carregando dados...")).toBeHidden();
  await page.getByRole("tab", { name: aba }).click();
}

async function recarregar(page, aba) {
  await page.reload();
  await expect(page.getByText("Carregando dados...")).toBeHidden();
  await page.getByRole("tab", { name: aba }).click();
}

// Taxas que dão conta redonda: R$ 1000 a R$ 500.000/BTC custam R$ 115 (11,5%)
async function cadastrarCorretora(page, nome) {
  const form = page.getByRole("form", { name: "Nova corretora" });
  await form.getByLabel("Nome").fill(nome);
  await form.getByLabel("Taxa de negociação (%)").fill("0,5");
  await form.getByLabel("Spread (%)").fill("1");
  await form.getByLabel("Taxa de saque on-chain (sats)").fill("20000");
  await form.getByRole("button", { name: "Cadastrar corretora" }).click();
  await expect(page.getByRole("listitem", { name: nome })).toBeVisible();
}

test("carrega a interface com as duas abas", async ({ page }) => {
  await abrir(page, "Simular");

  await expect(
    page.getByRole("heading", { name: "Comparador de Autocustódia" }),
  ).toBeVisible();
  await expect(page.getByLabel("Valor por compra (R$)")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("cadastra uma corretora e ela continua lá depois do F5", async ({
  page,
}) => {
  const nome = unico("Persistente");
  await abrir(page, "Corretoras");

  await cadastrarCorretora(page, nome);
  await recarregar(page, "Corretoras");

  // Veio do PostgreSQL, porque o front não guarda nada em memória
  const item = page.getByRole("listitem", { name: nome });
  await expect(item).toContainText("0,5%");
  await expect(item).toContainText("20.000 sats");
});

test("mostra o erro da API ao repetir o nome", async ({ page }) => {
  const nome = unico("Repetida");
  await abrir(page, "Corretoras");
  await cadastrarCorretora(page, nome);

  const form = page.getByRole("form", { name: "Nova corretora" });
  await form.getByLabel("Nome").fill(nome.toUpperCase());
  await form.getByLabel("Taxa de negociação (%)").fill("0");
  await form.getByLabel("Spread (%)").fill("0");
  await form.getByLabel("Taxa de saque on-chain (sats)").fill("0");
  await form.getByRole("button", { name: "Cadastrar corretora" }).click();

  await expect(form.getByRole("alert")).toHaveText(
    "Já existe uma corretora com esse nome",
  );
  await expect(form.getByLabel("Nome")).toHaveValue(nome.toUpperCase());
});

test("edita, desativa e remove uma corretora, e tudo continua depois do F5", async ({
  page,
}) => {
  const nome = unico("Editar");
  const novoNome = unico("Editada");
  await abrir(page, "Corretoras");
  await cadastrarCorretora(page, nome);

  await page
    .getByRole("listitem", { name: nome })
    .getByRole("button", { name: "Editar" })
    .click();
  const edicao = page.getByRole("form", { name: `Editar ${nome}` });
  await edicao.getByLabel("Nome").fill(novoNome);
  await edicao.getByLabel("Saca pela Lightning").check();
  await edicao.getByLabel("Taxa de saque Lightning (sats)").fill("50");
  await edicao.getByRole("button", { name: "Salvar" }).click();
  const item = page.getByRole("listitem", { name: novoNome });
  await item.getByRole("button", { name: "Desativar" }).click();
  await expect(item).toContainText("Inativa");

  await recarregar(page, "Corretoras");
  await expect(item).toContainText("⚡ Lightning");
  await expect(item).toContainText("50 sats");
  await expect(item).toContainText("Inativa");
  await expect(page.getByRole("listitem", { name: nome })).toHaveCount(0);

  await item.getByRole("button", { name: "Remover" }).click();
  await expect(item).toHaveCount(0);
  await recarregar(page, "Corretoras");
  await expect(page.getByRole("listitem", { name: novoNome })).toHaveCount(0);
});

test("simula, salva no histórico e edita e remove a simulação", async ({
  page,
}) => {
  const corretora = unico("Simulada");
  const descricao = unico("Compra");
  await abrir(page, "Corretoras");
  await cadastrarCorretora(page, corretora);
  await page.getByRole("tab", { name: "Simular" }).click();

  await page.getByLabel("Valor por compra (R$)").fill("1.000,00");
  await page.getByLabel("Preço do BTC (R$)").fill("500.000");
  await page.getByLabel("Descrição (opcional)").fill(descricao);
  await page.getByRole("button", { name: "Comparar corretoras" }).click();

  // O ranking calculado pela API aparece aberto na simulação nova
  const simulacao = page.getByRole("listitem", { name: descricao });
  const linha = simulacao.getByRole("row").filter({ hasText: corretora });
  await expect(linha).toContainText("177.000 sats");
  await expect(linha).toContainText("R$ 115,00");
  await expect(linha).toContainText("11,5%");

  // Depois do F5 a simulação vem do banco, com o ranking salvo
  await recarregar(page, "Simular");
  await simulacao.getByRole("button", { name: "Ver ranking" }).click();
  await expect(linha).toContainText("R$ 115,00");

  const novaDescricao = unico("Renomeada");
  await simulacao.getByRole("button", { name: "Editar descrição" }).click();
  await simulacao.getByLabel("Descrição").fill(novaDescricao);
  await simulacao.getByRole("button", { name: "Salvar" }).click();
  const renomeada = page.getByRole("listitem", { name: novaDescricao });
  await expect(renomeada).toBeVisible();
  await recarregar(page, "Simular");
  await expect(renomeada).toBeVisible();

  await renomeada.getByRole("button", { name: "Remover" }).click();
  await expect(renomeada).toHaveCount(0);
  await recarregar(page, "Simular");
  await expect(page.getByRole("listitem", { name: novaDescricao })).toHaveCount(
    0,
  );
});

test("cabe numa tela de celular sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await abrir(page, "Corretoras");
  await cadastrarCorretora(page, unico("Corretora com um nome bem comprido"));
  await page.getByRole("tab", { name: "Simular" }).click();

  const temRolagemHorizontal = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(temRolagemHorizontal).toBe(false);
});
