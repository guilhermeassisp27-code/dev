// Grava os segmentos do vídeo de anúncio Meta Ads (Variação B) do CorretorPRO.
//
// Pré-requisitos: npm i -D playwright-core @sparticuz/chromium ; ffmpeg instalado.
// 1. Gere uma cópia demo de tool.html com o auth gate stubbado em /tmp/vid/site/
//    (substituir a IIFE authGate por initApp() direto) + os cards de marketing/video/.
// 2. Sirva: cd /tmp/vid/site && python3 -m http.server 8088
// 3. node scripts/gravar-video-ad.mjs   → segmentos .webm em /tmp/vid/raw
// 4. Monte com ffmpeg (scale=1080:1920, fps=30, concat) → MP4 final.
//
// Os cards (1080x1920 nativos) e o resultado final estão em marketing/video/.

import { chromium } from 'playwright-core'
import spxMod from '@sparticuz/chromium'
const spx = spxMod.default || spxMod

const BASE = 'http://localhost:8088'
const RAW = '/tmp/vid/raw'

const PERFIL = {
  nome: 'Carlos Mendes', creci: '145.632-F', tel: '(11) 98765-4321',
  email: 'carlos@mendesimoveis.com.br', cor: '#4D7EFF', logo: null
}
const HIST = [
  { id: 1, data: '08/06/2026', cliente: 'João Pereira',  tipoImovel: 'Apartamento', tipoNeg: 'Compra',  end: 'Av. Paulista, 1000 — Bela Vista, SP', area: '78',  dorms: '3', vagas: '2', valor: '450.000', prazo: 300, taxa: 10.5, garantia: '', complem: '', cond: '', tituloGerado: 'Proposta de Compra — Apartamento', status: 'negociando' },
  { id: 2, data: '07/06/2026', cliente: 'Maria Santos',  tipoImovel: 'Casa',        tipoNeg: 'Compra',  end: 'R. das Acácias, 250 — Alphaville, SP',  area: '210', dorms: '4', vagas: '3', valor: '1.250.000', prazo: 360, taxa: 10.5, garantia: '', complem: '', cond: '', tituloGerado: 'Proposta de Compra — Casa', status: 'fechada' },
  { id: 3, data: '06/06/2026', cliente: 'Pedro Lima',    tipoImovel: 'Apartamento', tipoNeg: 'Aluguel', end: 'R. Augusta, 890 — Consolação, SP',      area: '54',  dorms: '2', vagas: '1', valor: '3.800',   prazo: 300, taxa: 10.5, garantia: 'Fiador', complem: '', cond: '', tituloGerado: 'Proposta de Aluguel — Apartamento', status: 'enviada' },
  { id: 4, data: '05/06/2026', cliente: 'Ana Oliveira',  tipoImovel: 'Apartamento', tipoNeg: 'Compra',  end: 'Al. Santos, 455 — Jardins, SP',          area: '95',  dorms: '3', vagas: '2', valor: '720.000', prazo: 300, taxa: 10.5, garantia: '', complem: '', cond: '', tituloGerado: 'Proposta de Compra — Apartamento', status: 'fechada' },
  { id: 5, data: '04/06/2026', cliente: 'Roberto Costa', tipoImovel: 'Casa',        tipoNeg: 'Compra',  end: 'R. dos Pinheiros, 120 — Pinheiros, SP',  area: '160', dorms: '3', vagas: '2', valor: '980.000', prazo: 360, taxa: 10.5, garantia: '', complem: '', cond: '', tituloGerado: 'Proposta de Compra — Casa', status: 'negociando' },
  { id: 6, data: '03/06/2026', cliente: 'Fernanda Dias', tipoImovel: 'Apartamento', tipoNeg: 'Compra',  end: 'R. Oscar Freire, 300 — Jardins, SP',     area: '88',  dorms: '2', vagas: '2', valor: '690.000', prazo: 300, taxa: 10.5, garantia: '', complem: '', cond: '', tituloGerado: 'Proposta de Compra — Apartamento', status: 'enviada' },
  { id: 7, data: '02/06/2026', cliente: 'Lucas Rocha',   tipoImovel: 'Terreno',     tipoNeg: 'Compra',  end: 'Estr. do Campo, km 4 — Cotia, SP',       area: '500', dorms: '',  vagas: '',  valor: '380.000', prazo: 300, taxa: 10.5, garantia: '', complem: '', cond: '', tituloGerado: 'Proposta de Compra — Terreno', status: 'nova' },
]

const CAPTION_CSS = `
  #adcap { position:fixed; left:0; right:0; bottom:34px; z-index:99999;
    display:flex; justify-content:center; pointer-events:none }
  #adcap span { background:#0A1628F0; color:#fff; font-weight:800;
    font-family:Inter,'Segoe UI',Arial,sans-serif; font-size:21px; line-height:1.35;
    padding:13px 22px; border-radius:14px; max-width:86%; text-align:center;
    box-shadow:0 10px 30px rgba(0,0,0,.35); border:2px solid #4D7EFF }
  #adcap span b { color:#7BA3FF }`

async function caption(page, html) {
  await page.evaluate(({ html, css }) => {
    if (!document.getElementById('adcap-css')) {
      const st = document.createElement('style'); st.id = 'adcap-css'
      st.textContent = css; document.head.appendChild(st)
    }
    let c = document.getElementById('adcap')
    if (!c) { c = document.createElement('div'); c.id = 'adcap'; document.body.appendChild(c) }
    c.innerHTML = html ? '<span>' + html + '</span>' : ''
  }, { html, css: CAPTION_CSS })
}

async function record(browser, name, { width, height, scale }, fn) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    recordVideo: { dir: RAW, size: { width, height } },  // Playwright não faz upscale: gravar no tamanho do viewport
    ignoreHTTPSErrors: true,
  })
  const page = await ctx.newPage()
  await page.addInitScript(({ p, h }) => {
    localStorage.setItem('cpr_perfil', JSON.stringify(p))
    localStorage.setItem('cpr_hist', JSON.stringify(h))
  }, { p: PERFIL, h: HIST })
  try {
    await fn(page)
  } finally {
    const video = page.video()
    await ctx.close()
    const path = await video.path()
    const fs = await import('fs')
    fs.renameSync(path, `${RAW}/${name}.webm`)
    console.log('saved', name)
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const CARD = { width: 1080, height: 1920, scale: 1 }
const TOOL = { width: 540, height: 960, scale: 2 }

const browser = await chromium.launch({
  executablePath: await spx.executablePath(),
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--enable-unsafe-swiftshader','--font-render-hinting=none'],
})

// ── seg1: hook card (4s)
await record(browser, 'seg1-hook', CARD, async page => {
  await page.goto(`${BASE}/card-hook.html`)
  await sleep(4200)
})

// ── seg2: whatsapp (7s)
await record(browser, 'seg2-whats', CARD, async page => {
  await page.goto(`${BASE}/whatsapp.html`)
  await sleep(7400)
})

// ── seg3: registro de visita (~14s)
await record(browser, 'seg3-visita', TOOL, async page => {
  await page.goto(`${BASE}/tool.html`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#view-form.active', { timeout: 15000 })
  await caption(page, 'Com o <b>CorretorPRO</b> isso não acontece')
  await sleep(900)
  await page.evaluate(() => showView('visita'))
  await caption(page, '<b>Registro de Visita</b> com força jurídica')
  await sleep(900)
  // preenche campos secundários de uma vez; digita o nome ao vivo
  await page.evaluate(() => {
    document.getElementById('v-cpf').value = '123.456.789-00'
    document.getElementById('v-rg').value = '22.333.444-5'
    document.getElementById('v-tel').value = '(11) 99888-7766'
    document.getElementById('v-end').value = 'Av. Paulista, 1000, ap 72 — Bela Vista, São Paulo, SP'
    document.getElementById('v-tipo').value = 'Apartamento'
    document.getElementById('v-matricula').value = '123.456 — 4º CRI de São Paulo'
    document.getElementById('v-data').value = '2026-06-09'
    document.getElementById('v-hora').value = '14:30'
    document.getElementById('v-cidade').value = 'São Paulo/SP'
  })
  await page.click('#v-cliente')
  await page.type('#v-cliente', 'João Pereira', { delay: 65 })
  await sleep(500)
  await caption(page, 'Documenta a visita <b>na hora</b>, com data e imóvel')
  await page.evaluate(() => document.querySelector('#form-visita button[type=submit]').click())
  await sleep(1400)
  await caption(page, 'Art. 727 do Código Civil — <b>180 dias de proteção</b>')
  // rola o termo devagar para mostrar o documento
  await page.evaluate(async () => {
    const t = document.getElementById('termo')
    const top = t.getBoundingClientRect().top + window.scrollY - 10
    window.scrollTo({ top, behavior: 'auto' })
    const alvo = top + 620
    await new Promise(res => {
      let y = top
      const iv = setInterval(() => {
        y += 5; window.scrollTo(0, y)
        if (y >= alvo) { clearInterval(iv); res() }
      }, 16)
    })
  })
  await caption(page, 'Se fechar sem você, o documento <b>prova que você originou</b>')
  await sleep(2600)
})

// ── seg4: proposta em 60s (~9s)
await record(browser, 'seg4-proposta', TOOL, async page => {
  await page.goto(`${BASE}/tool.html`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#view-form.active', { timeout: 15000 })
  await caption(page, 'E mais: <b>proposta profissional em 60 segundos</b>')
  await page.evaluate(() => carregarExemplo())
  await sleep(1200)
  await page.evaluate(() => document.getElementById('gen-btn').scrollIntoView({ block: 'center' }))
  await sleep(500)
  await page.click('#gen-btn')
  await sleep(2300)
  await caption(page, 'Com a <b>sua marca</b> e seu CRECI, direto do celular')
  await page.evaluate(async () => {
    const p = document.getElementById('proposta')
    const top = p.getBoundingClientRect().top + window.scrollY - 8
    window.scrollTo(0, top)
    const alvo = top + 540
    await new Promise(res => {
      let y = top
      const iv = setInterval(() => {
        y += 5; window.scrollTo(0, y)
        if (y >= alvo) { clearInterval(iv); res() }
      }, 16)
    })
  })
  await sleep(1800)
})

// ── seg5: CRM painel (~6s)
await record(browser, 'seg5-crm', TOOL, async page => {
  await page.goto(`${BASE}/tool.html`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#view-form.active', { timeout: 15000 })
  await page.evaluate(() => showView('history'))
  await caption(page, 'E o <b>painel de negociações</b>: nada se perde')
  await sleep(1800)
  await page.evaluate(() => filtrarPorStatus('negociando'))
  await sleep(1300)
  await page.evaluate(() => filtrarPorStatus('fechada'))
  await caption(page, 'Sabe onde tá <b>cada negócio</b>, sempre')
  await sleep(1700)
  await page.evaluate(() => filtrarPorStatus(null))
  await sleep(1200)
})

// ── seg6: CTA (8s)
await record(browser, 'seg6-cta', CARD, async page => {
  await page.goto(`${BASE}/card-cta.html`)
  await sleep(8200)
})

await browser.close()
console.log('ALL DONE')
