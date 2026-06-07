// Gera um PRINT real da ferramenta CorretorPRO para usar no landing.
//
// Fluxo: login com a conta demo -> define um perfil de exemplo (para a
// proposta sair com marca) -> preenche e gera uma proposta de COMPRA
// (que inclui o bloco de Simulação SAC × Price) -> tira screenshot da
// proposta gerada e salva em public/print-ferramenta.png.
//
// O workflow print-ferramenta.yml roda este script e commita o PNG no repo.
//
// Variáveis de ambiente (secrets no GitHub):
//   DEMO_EMAIL, DEMO_PASSWORD  -> conta de demonstração (assinatura ativa)
// Opcionais:
//   APP_URL  (default: https://usecorretorpro.vercel.app)
//   OUT      (default: public/print-ferramenta.png)

import { chromium } from 'playwright'

const APP = process.env.APP_URL || 'https://usecorretorpro.vercel.app'
const EMAIL = process.env.DEMO_EMAIL
const PASS = process.env.DEMO_PASSWORD
const OUT = process.env.OUT || 'public/print-ferramenta.png'

if (!EMAIL || !PASS) {
  console.error('ERRO: defina os secrets DEMO_EMAIL e DEMO_PASSWORD.')
  process.exit(1)
}

const beat = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1200, height: 1700 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

try {
  // 1) LOGIN
  console.log('Acessando login...')
  await page.goto(`${APP}/acesso`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await beat(500)
  await page.click('button[type="submit"]')

  // 2) Aguarda a ferramenta carregar
  console.log('Aguardando a ferramenta carregar...')
  await page.waitForURL(/tool\.html/, { timeout: 40000 })
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('#f-cliente', { state: 'visible', timeout: 30000 })
  await beat(1500)

  // 3) Define um perfil de exemplo para a proposta sair com marca
  //    (resiliente: se algo falhar, segue para o print mesmo assim)
  try {
    console.log('Definindo perfil de exemplo...')
    await page.evaluate(() => window.showView && window.showView('config'))
    await page.waitForSelector('#c-nome', { state: 'visible', timeout: 10000 })
    await page.fill('#c-nome', 'Marcos Almeida')
    await page.fill('#c-creci', '98.432-SP')
    await page.fill('#c-tel', '(11) 98888-7766')
    await page.fill('#c-email', 'marcos@imobiliariaalmeida.com.br')
    await beat(400)
    await page.click('#form-config button[type="submit"]')
    await beat(1500)
  } catch (e) {
    console.warn('Não consegui definir o perfil (segue sem):', e.message)
  }

  // 4) Volta para o formulário de proposta
  await page.evaluate(() => window.showView && window.showView('form'))
  await page.waitForSelector('#f-cliente', { state: 'visible', timeout: 10000 })
  await beat(600)

  // 5) Preenche uma proposta de COMPRA (inclui simulação SAC × Price)
  console.log('Preenchendo a proposta...')
  await page.fill('#f-cliente', 'João Silva')
  await page.selectOption('#f-tipo-imovel', { label: 'Apartamento' })
  await page.selectOption('#f-tipo-neg', { label: 'Compra' })
  await beat(300)
  await page.fill('#f-end', 'Av. Paulista, 1000 — Bela Vista, São Paulo, SP')
  await page.fill('#f-area', '78')
  await page.selectOption('#f-dorms', { label: '3' })
  await page.selectOption('#f-vagas', { label: '2' })
  await page.fill('#f-valor', '450.000')
  await page.fill('#f-cond', 'Cliente tem FGTS disponível e busca financiamento de longo prazo')
  await beat(800)

  // 6) Gera a proposta
  console.log('Gerando a proposta...')
  await page.click('#gen-btn')
  await page.waitForSelector('#proposta.show', { timeout: 15000 }).catch(() => {})
  await beat(2500)

  // 7) Screenshot da proposta gerada (captura o elemento inteiro)
  console.log('Capturando o print...')
  const prop = page.locator('#proposta')
  await prop.scrollIntoViewIfNeeded()
  await beat(400)
  await prop.screenshot({ path: OUT })
  console.log('Print salvo em', OUT)
} catch (err) {
  console.error('Falha ao gerar o print:', err)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
}
