// Teste automático (QA) do fluxo crítico do CorretorPRO:
//   salvar proposta -> sair -> entrar de novo -> a proposta ainda está lá.
//
// É a "regra de ouro" do tool.html, automatizada. Não usa IA (sem custo de
// API) — só um robô de navegador. Sai com código 1 se a persistência falhar,
// o que deixa o workflow VERMELHO e avisa que algo quebrou.
//
// Secrets necessários: DEMO_EMAIL, DEMO_PASSWORD (conta demo ativa).

import { chromium } from 'playwright'

const APP = process.env.APP_URL || 'https://usecorretorpro.vercel.app'
const EMAIL = process.env.DEMO_EMAIL
const PASS = process.env.DEMO_PASSWORD

if (!EMAIL || !PASS) {
  console.error('ERRO: defina os secrets DEMO_EMAIL e DEMO_PASSWORD.')
  process.exit(1)
}

const MARCADOR = `QA ${Date.now()}`          // cliente único para esta execução
const beat = (ms) => new Promise((r) => setTimeout(r, ms))

async function login(context) {
  const page = await context.newPage()
  await page.goto(`${APP}/acesso`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL(/tool\.html/, { timeout: 40000 })
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('#f-cliente', { state: 'visible', timeout: 30000 })
  await beat(1500)
  return page
}

async function abrirHistorico(page) {
  const hamburger = page.locator('[onclick="openSidebar()"]')
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click()
    await beat(600)
  }
  await page.click('[onclick="showView(\'history\')"]')
  await beat(1500)
}

const browser = await chromium.launch()
let ok = false

try {
  // 1) SESSÃO 1: cria e salva uma proposta com o marcador único
  console.log(`[QA] Sessão 1 — salvando proposta "${MARCADOR}"...`)
  const ctx1 = await browser.newContext({ viewport: { width: 1024, height: 800 } })
  const page1 = await login(ctx1)

  await page1.fill('#f-cliente', MARCADOR)
  await page1.selectOption('#f-tipo-imovel', { label: 'Apartamento' })
  await page1.selectOption('#f-tipo-neg', { label: 'Compra' })
  await page1.fill('#f-end', 'Rua de Teste QA, 100')
  await page1.fill('#f-valor', '100.000')
  await page1.click('#gen-btn')
  await beat(3500)
  await page1.click('[onclick="salvarProposta()"]')
  await beat(2500)                            // dá tempo do salvarRemoto() concluir
  await ctx1.close()                          // "sai" da ferramenta

  // 2) SESSÃO 2: login do zero (sem localStorage) -> força carregar do Supabase
  console.log('[QA] Sessão 2 — entrando de novo e verificando persistência...')
  const ctx2 = await browser.newContext({ viewport: { width: 1024, height: 800 } })
  const page2 = await login(ctx2)
  await abrirHistorico(page2)

  const card = page2.locator('.hist-card', { hasText: MARCADOR })
  await card.waitFor({ state: 'visible', timeout: 15000 })
  ok = true
  console.log('[QA] ✅ A proposta persistiu após sair e entrar. Fluxo crítico OK.')

  // 3) Limpeza: remove a proposta de teste (não falha o QA se a limpeza falhar)
  try {
    await card.locator('[aria-label="Excluir"]').click()
    await beat(2000)
    console.log('[QA] Proposta de teste removida.')
  } catch (e) {
    console.log('[QA] (aviso) não consegui remover a proposta de teste:', e.message)
  }

  await ctx2.close()
} catch (err) {
  console.error('[QA] ❌ FALHA no fluxo crítico:', err.message)
  ok = false
} finally {
  await browser.close()
}

if (!ok) {
  console.error('[QA] Resultado: FALHOU — a persistência de propostas pode estar quebrada.')
  process.exit(1)
}
console.log('[QA] Resultado: PASSOU.')
