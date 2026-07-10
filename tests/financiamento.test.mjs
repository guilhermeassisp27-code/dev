// Testes da matemática financeira (C12/M1 da auditoria).
//
// O cálculo de parcela Price e SAC existe em DOIS lugares que não podem
// divergir: tool.html (calcParcela/calcSAC, roda no navegador do corretor)
// e lib/taxas.ts (parcelaPrice/sac, roda no servidor da proposta pública).
// Este teste extrai as duas implementações DOS ARQUIVOS REAIS — não de uma
// cópia — e:
//   1. valida cada uma contra valores de referência calculados à mão;
//   2. compara as duas numa grade de casos: qualquer divergência silenciosa
//      passa a quebrar o CI em vez de gerar proposta com número errado.
//
// Rodar: npm test  (node --test tests/)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── Extrai as funções do tool.html ──
function extrairDoTool() {
  const src = readFileSync(join(raiz, 'tool.html'), 'utf-8')
  const parcela = src.match(/function calcParcela\([\s\S]*?\n}/)
  const sac = src.match(/function calcSAC\([\s\S]*?\n}/)
  assert.ok(parcela, 'calcParcela não encontrada no tool.html')
  assert.ok(sac, 'calcSAC não encontrada no tool.html')
  return new Function(`${parcela[0]}\n${sac[0]}\nreturn { calcParcela, calcSAC }`)()
}

// ── Extrai as funções do lib/taxas.ts (tira as anotações de tipo) ──
function extrairDoLib() {
  const src = readFileSync(join(raiz, 'lib', 'taxas.ts'), 'utf-8')
  const parcela = src.match(/export function parcelaPrice\([\s\S]*?\n}/)
  const sac = src.match(/export function sac\([\s\S]*?\n}/)
  assert.ok(parcela, 'parcelaPrice não encontrada em lib/taxas.ts')
  assert.ok(sac, 'sac não encontrada em lib/taxas.ts')
  const js = (parcela[0] + '\n' + sac[0])
    .replace(/export /g, '')
    .replace(/: number(\[\])?/g, '')
  return new Function(`${js}\nreturn { parcelaPrice, sac }`)()
}

const tool = extrairDoTool()
const lib = extrairDoLib()

// ── 1. Valores de referência (independentes das implementações) ──
// R$ 400.000 financiados a 11% a.a. em 360 meses.
// i mensal = 1.11^(1/12) - 1 = 0.0087345458...
test('Price bate com o valor de referência', () => {
  const p = tool.calcParcela(400000, 11, 360)
  // referência calculada à mão: pv*i*(1+i)^n / ((1+i)^n - 1)
  const i = Math.pow(1.11, 1 / 12) - 1
  const ref = (400000 * (i * Math.pow(1 + i, 360))) / (Math.pow(1 + i, 360) - 1)
  assert.ok(Math.abs(p - ref) < 0.01, `parcela ${p} != referência ${ref}`)
  // sanidade absoluta: parcela de 400k/11%/360m fica entre 3.5k e 3.8k
  assert.ok(p > 3500 && p < 3800, `parcela fora da faixa esperada: ${p}`)
})

test('SAC bate com o valor de referência', () => {
  const s = tool.calcSAC(400000, 11, 360)
  const i = Math.pow(1.11, 1 / 12) - 1
  const amort = 400000 / 360
  assert.ok(Math.abs(s.primeira - (amort + 400000 * i)) < 0.01)
  assert.ok(Math.abs(s.ultima - (amort + amort * i)) < 0.01)
  assert.ok(s.primeira > s.ultima, 'no SAC a 1ª parcela é sempre maior que a última')
})

test('taxa zero não divide por zero (Price vira pv/meses)', () => {
  assert.equal(tool.calcParcela(120000, 0, 120), 1000)
  assert.equal(lib.parcelaPrice(120000, 0, 120), 1000)
})

// ── 2. As duas implementações são idênticas numa grade de casos ──
test('tool.html e lib/taxas.ts produzem números idênticos (M1)', () => {
  const valores = [50000, 250000, 400000, 1200000, 3000000]
  const taxas = [0, 6.5, 8.99, 10.5, 11.29, 14]
  const prazos = [60, 120, 240, 300, 360, 420]
  for (const pv of valores)
    for (const tx of taxas)
      for (const n of prazos) {
        const caso = `pv=${pv} taxa=${tx} n=${n}`
        assert.equal(tool.calcParcela(pv, tx, n), lib.parcelaPrice(pv, tx, n), `Price divergiu: ${caso}`)
        const a = tool.calcSAC(pv, tx, n)
        const b = lib.sac(pv, tx, n)
        assert.equal(a.primeira, b.primeira, `SAC 1ª divergiu: ${caso}`)
        assert.equal(a.ultima, b.ultima, `SAC última divergiu: ${caso}`)
      }
})
