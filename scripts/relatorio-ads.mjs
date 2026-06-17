#!/usr/bin/env node
// Relatório diário de Meta Ads (READ-ONLY).
//
// Puxa métricas das contas de anúncio via Graph API e gera um relatório em
// Markdown com análise por heurística. NÃO altera campanhas, NÃO gasta dinheiro,
// NÃO publica nada — só lê e escreve um arquivo local de relatório.
//
// Variáveis de ambiente:
//   META_ACCESS_TOKEN   (obrigatório)  token da Graph API com escopo ads_read
//   META_AD_ACCOUNTS    (opcional)     IDs separados por vírgula. Default: descobre via /me/adaccounts
//   META_API_VERSION    (opcional)     default v21.0
//
// Uso: node scripts/relatorio-ads.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TOKEN = process.env.META_ACCESS_TOKEN;
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;

if (!TOKEN) {
  console.error("ERRO: defina META_ACCESS_TOKEN no ambiente.");
  process.exit(1);
}

const BRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n || 0)
  );
const num = (n) => new Intl.NumberFormat("pt-BR").format(Number(n || 0));
const pct = (n) => `${Number(n || 0).toFixed(2)}%`;

async function gget(path, params = {}) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    throw new Error(
      `Graph API erro em ${path}: ${json.error.message} (code ${json.error.code})`
    );
  }
  return json;
}

async function listAccounts() {
  if (process.env.META_AD_ACCOUNTS) {
    return process.env.META_AD_ACCOUNTS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((id) => ({ id: id.startsWith("act_") ? id : `act_${id}` }));
  }
  const r = await gget("me/adaccounts", {
    fields: "account_id,name,account_status,currency",
  });
  return (r.data || []).map((a) => ({
    id: a.id,
    name: a.name,
    status: a.account_status,
    currency: a.currency,
  }));
}

const INSIGHT_FIELDS = "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency";

async function accountInsights(accId, datePreset) {
  const r = await gget(`${accId}/insights`, {
    fields: INSIGHT_FIELDS,
    date_preset: datePreset,
  });
  return (r.data || [])[0] || null;
}

async function campaignInsights(accId, datePreset) {
  const r = await gget(`${accId}/insights`, {
    level: "campaign",
    fields: `campaign_name,${INSIGHT_FIELDS}`,
    date_preset: datePreset,
  });
  return r.data || [];
}

// Heurísticas simples para sinalizar o que olhar. NÃO são decisões — só alertas.
function flagsFor(row) {
  const flags = [];
  const ctr = Number(row.ctr || 0);
  const cpm = Number(row.cpm || 0);
  const freq = Number(row.frequency || 0);
  const clicks = Number(row.clicks || 0);
  const spend = Number(row.spend || 0);
  if (ctr > 0 && ctr < 1)
    flags.push("🔴 CTR baixo (<1%): criativo/oferta pode não estar atraindo.");
  if (ctr >= 3) flags.push("🟢 CTR alto (≥3%): criativo está engajando bem.");
  if (cpm > 40)
    flags.push("🟠 CPM alto (>R$40): impressão cara — revisar público/leilão.");
  if (freq > 3)
    flags.push("🟠 Frequência >3: público saturado, considerar ampliar ou trocar criativo.");
  if (spend >= 20 && clicks === 0)
    flags.push("🔴 Gastou sem nenhum clique: pausar/revisar.");
  return flags;
}

function renderRow(label, row) {
  if (!row) return `**${label}:** sem dados no período.\n`;
  return [
    `**${label}**`,
    "",
    "| Métrica | Valor |",
    "|---|---|",
    `| Investimento | ${BRL(row.spend)} |`,
    `| Impressões | ${num(row.impressions)} |`,
    `| Alcance | ${num(row.reach)} |`,
    `| Cliques | ${num(row.clicks)} |`,
    `| CTR | ${pct(row.ctr)} |`,
    `| CPC | ${BRL(row.cpc)} |`,
    `| CPM | ${BRL(row.cpm)} |`,
    `| Frequência | ${Number(row.frequency || 0).toFixed(2)} |`,
    "",
  ].join("\n");
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const accounts = await listAccounts();
  const parts = [];

  parts.push(`# 📊 Relatório diário de Meta Ads — ${today}`);
  parts.push("");
  parts.push(
    "> Gerado automaticamente (read-only). Não altera campanhas nem gasto. " +
      "Heurísticas são alertas para investigar, **não** decisões. " +
      "⚠️ Sem rastreamento de conversão, CTR/CPC medem clique, não assinante."
  );
  parts.push("");

  for (const acc of accounts) {
    const name = acc.name ? `${acc.name} (\`${acc.id}\`)` : `\`${acc.id}\``;
    parts.push(`## Conta — ${name}`);
    parts.push("");

    const [yest, l7, l30, camp7] = await Promise.all([
      accountInsights(acc.id, "yesterday"),
      accountInsights(acc.id, "last_7d"),
      accountInsights(acc.id, "last_30d"),
      campaignInsights(acc.id, "last_7d"),
    ]);

    parts.push(renderRow("Ontem", yest));
    parts.push(renderRow("Últimos 7 dias", l7));
    parts.push(renderRow("Últimos 30 dias", l30));

    if (l7) {
      const flags = flagsFor(l7);
      if (flags.length) {
        parts.push("**Alertas (7 dias):**");
        parts.push("");
        for (const f of flags) parts.push(`- ${f}`);
        parts.push("");
      }
    }

    if (camp7.length) {
      parts.push("### Por campanha (últimos 7 dias)");
      parts.push("");
      parts.push("| Campanha | Gasto | Impr. | Cliques | CTR | CPC |");
      parts.push("|---|---|---|---|---|---|");
      const sorted = [...camp7].sort(
        (a, b) => Number(b.spend || 0) - Number(a.spend || 0)
      );
      for (const c of sorted) {
        parts.push(
          `| ${c.campaign_name} | ${BRL(c.spend)} | ${num(c.impressions)} | ${num(
            c.clicks
          )} | ${pct(c.ctr)} | ${BRL(c.cpc)} |`
        );
      }
      parts.push("");
      // Destaques: melhor e pior CTR entre campanhas com gasto relevante.
      const releventes = sorted.filter((c) => Number(c.spend || 0) >= 1);
      if (releventes.length >= 2) {
        const byCtr = [...releventes].sort(
          (a, b) => Number(b.ctr || 0) - Number(a.ctr || 0)
        );
        parts.push(
          `- 🏆 Melhor CTR: **${byCtr[0].campaign_name}** (${pct(byCtr[0].ctr)})`
        );
        parts.push(
          `- 🐌 Pior CTR: **${byCtr[byCtr.length - 1].campaign_name}** (${pct(
            byCtr[byCtr.length - 1].ctr
          )})`
        );
        parts.push("");
      }
    }
  }

  parts.push("---");
  parts.push(
    "_Próximo passo para virar acionável: configurar rastreamento de conversão " +
      "(Pixel/evento de cadastro/assinatura) para medir custo por assinante, não só por clique._"
  );

  const md = parts.join("\n");
  const dir = join(process.cwd(), "docs", "ads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `relatorio-${today}.md`), md);
  await writeFile(join(dir, "ultimo.md"), md);
  console.log(`Relatório gerado: docs/ads/relatorio-${today}.md`);
  console.log(`Contas analisadas: ${accounts.length}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
