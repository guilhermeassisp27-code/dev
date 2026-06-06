// Grava automaticamente um vídeo da ferramenta CorretorPRO demonstrando as
// funcionalidades de busca no histórico e duplicar proposta.
//
// Fluxo: login com conta demo -> cria uma proposta de exemplo -> abre
// "Minhas Propostas" -> demonstra a busca -> demonstra o duplicar.
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
const TOOL = process.env.TOOL_URL || 'https://guilhermeassisp27-code.github.io/dev/tool.html'
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

  // 2) Aguarda redirecionar para a ferramenta
  console.log('Aguardando a ferramenta carregar...')
  await page.waitForURL(/tool\.html/, { timeout: 40000 })
  await page.waitForLoadState('networkidle')
  await beat(2500)

  // 3) Cria uma proposta de exemplo (para o histórico ter dado)
  console.log('Criando proposta de exemplo...')
  await page.click('#btn-exemplo')                 // preenche o formulário
  await beat(1500)
  await page.click('#gen-btn')                      // gera a proposta
  await beat(3200)                                  // a geração tem delay ~1.7s
  await page.click('[onclick="salvarProposta()"]')  // salva no histórico
  await beat(1800)

  // 4) Abre "Minhas Propostas"
  console.log('Abrindo Minhas Propostas...')
  await page.click('[onclick="showView(\'history\')"]')
  await beat(2200)

  // 5) Demonstra a BUSCA
  console.log('Demonstrando a busca...')
  const busca = page.locator('#hist-search')
  await busca.click()
  await beat(500)
  for (const ch of 'João') {                        // digita devagar (efeito visual)
    await busca.type(ch, { delay: 180 })
  }
  await beat(2200)
  await busca.fill('')                              // limpa
  await beat(1200)

  // 6) Demonstra o DUPLICAR
  console.log('Demonstrando o duplicar...')
  const dup = page.locator('[onclick^="duplicarProposta"]').first()
  await dup.click()
  await beat(3000)                                  // abre o form preenchido

  console.log('Demo concluída.')
} catch (err) {
  console.error('Falha durante a gravação:', err)
  process.exitCode = 1
} finally {
  await context.close()                             // necessário para salvar o vídeo
  await browser.close()
}
