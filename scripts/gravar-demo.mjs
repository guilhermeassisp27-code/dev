// Grava automaticamente um vídeo da ferramenta CorretorPRO demonstrando as
// funcionalidades de busca no histórico e duplicar proposta.
//
// Fluxo: login com conta demo -> preenche e gera uma proposta -> salva ->
// abre "Minhas Propostas" -> demonstra a busca -> demonstra o duplicar.
//
// O vídeo (webm) é salvo em ./video e depois convertido para mp4 pelo workflow.
//
// Variáveis de ambiente necessárias (secrets no GitHub):
//   DEMO_EMAIL, DEMO_PASSWORD  -> conta de demonstração (assinatura ativa)
// Opcionais:
//   APP_URL  (default: https://usecorretorpro.vercel.app)
//   TOOL_URL (default: https://guilhermeassisp27-code.github.io/dev/tool.html)

import { chromium } from 'playwright'

const APP = process.env.APP_URL || 'https://usecorretorpro.vercel.app'
const EMAIL = process.env.DEMO_EMAIL
const PASS = process.env.DEMO_PASSWORD

if (!EMAIL || !PASS) {
  console.error('ERRO: defina os secrets DEMO_EMAIL e DEMO_PASSWORD.')
  process.exit(1)
}

// Pausa "humana" entre as ações para o vídeo ficar legível
const beat = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 412, height: 824 },          // vertical, estilo celular
  recordVideo: { dir: 'video', size: { width: 412, height: 824 } },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

try {
  // 1) LOGIN
  console.log('Acessando login...')
  await page.goto(`${APP}/acesso`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await beat(600)
  await page.click('button[type="submit"]')

  // 2) Aguarda redirecionar para a ferramenta e o formulário ficar pronto
  console.log('Aguardando a ferramenta carregar...')
  await page.waitForURL(/tool\.html/, { timeout: 40000 })
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('#f-cliente', { state: 'visible', timeout: 30000 })
  await beat(2000)

  // 3) Preenche os campos do formulário diretamente (robusto em qualquer tela)
  console.log('Preenchendo a proposta...')
  await page.fill('#f-cliente', 'João Silva')
  await page.selectOption('#f-tipo-imovel', { label: 'Apartamento' })
  await page.selectOption('#f-tipo-neg', { label: 'Compra' })
  await beat(400)
  await page.fill('#f-end', 'Av. Paulista, 1000 — Bela Vista, São Paulo, SP')
  await page.fill('#f-area', '78')
  await page.selectOption('#f-dorms', { label: '3' })   // f-dorms é <select>
  await page.selectOption('#f-vagas', { label: '2' })   // f-vagas é <select>
  await page.fill('#f-valor', '450.000')
  await page.fill('#f-cond', 'Cliente tem FGTS disponível e busca financiamento de longo prazo')
  await beat(1200)

  // 4) Gera a proposta (botão principal, submit do form)
  console.log('Gerando a proposta...')
  await page.click('#gen-btn')
  await beat(3500)                                  // geração tem delay ~1.7s + animação

  // 5) Salva no histórico
  console.log('Salvando no histórico...')
  await page.click('[onclick="salvarProposta()"]')
  await beat(1800)

  // 6) Abre o menu e vai para "Minhas Propostas"
  console.log('Abrindo Minhas Propostas...')
  const hamburger = page.locator('[onclick="openSidebar()"]')
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click()
    await beat(800)
  }
  await page.click('[onclick="showView(\'history\')"]')
  await beat(2200)

  // 7) Demonstra a BUSCA (digita devagar para efeito visual)
  console.log('Demonstrando a busca...')
  const busca = page.locator('#hist-search')
  await busca.click()
  await beat(500)
  for (const ch of 'João') {
    await busca.type(ch, { delay: 200 })
  }
  await beat(2200)
  await busca.fill('')                              // limpa o filtro
  await beat(1200)

  // 8) Demonstra o DUPLICAR
  console.log('Demonstrando o duplicar...')
  const dup = page.locator('[onclick^="duplicarProposta"]').first()
  await dup.click()
  await beat(3000)                                  // abre o formulário pré-preenchido

  console.log('Demo concluída com sucesso.')
} catch (err) {
  console.error('Falha durante a gravação:', err)
  process.exitCode = 1
} finally {
  await context.close()                             // necessário para salvar o vídeo
  await browser.close()
}
