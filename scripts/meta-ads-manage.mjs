#!/usr/bin/env node
// Gerenciador de Meta Ads com TRAVA DE SEGURANÇA (escrita controlada).
//
// Diferente do relatório (read-only), este script PODE alterar a campanha —
// mas só orçamento diário e status (ligar/pausar) de conjuntos de anúncios,
// e só quando explicitamente autorizado com --apply. Sem --apply ele apenas
// SIMULA (dry-run) e mostra o que mudaria. Respeita limites do plano para
// nunca estourar o gasto por engano.
//
// Variáveis de ambiente:
//   META_MANAGE_TOKEN   (obrigatório p/ aplicar)  token com escopo ads_management
//   META_API_VERSION    (opcional)                default v21.0
//
// Uso:
//   node scripts/meta-ads-manage.mjs listar [act_XXXX]      # read-only: campanhas + conjuntos
//   node scripts/meta-ads-manage.mjs aplicar                # SIMULA o ads/plano-mudancas.json
//   node scripts/meta-ads-manage.mjs aplicar --apply        # EXECUTA de verdade

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const TOKEN = process.env.META_MANAGE_TOKEN || process.env.META_ACCESS_TOKEN;
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;
const PLANO_PATH = join(process.cwd(), "ads", "plano-mudancas.json");

const BRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n || 0)
  );

function die(msg) {
  console.error(`ERRO: ${msg}`);
  process.exit(1);
}

if (!TOKEN) die("defina META_MANAGE_TOKEN (token com escopo ads_management).");

async function graph(path, { method = "GET", params = {}, body } = {}) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const init = { method };
  if (body) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const json = await res.json();
  if (json.error) {
    throw new Error(
      `Graph API ${method} ${path}: ${json.error.message} (code ${json.error.code})`
    );
  }
  return json;
}

// daily_budget vem na menor unidade da moeda (centavos p/ BRL).
const centsToBRL = (c) => Number(c || 0) / 100;
const brlToCents = (r) => Math.round(Number(r) * 100);

async function resolveAccount(arg) {
  if (arg && arg.startsWith("act_")) return arg;
  const r = await graph("me/adaccounts", { params: { fields: "account_id,name" } });
  const accs = r.data || [];
  if (!accs.length) die("nenhuma conta de anúncio encontrada para este token.");
  return accs[0].id; // primeira conta; passe act_XXXX para escolher outra
}

async function listAdsets(accId) {
  const r = await graph(`${accId}/adsets`, {
    params: {
      fields: "id,name,status,effective_status,daily_budget,campaign{id,name,daily_budget}",
      limit: "200",
    },
  });
  return r.data || [];
}

async function cmdListar(accArg) {
  const accId = await resolveAccount(accArg);
  console.log(`Conta: ${accId}\n`);
  const adsets = await listAdsets(accId);
  if (!adsets.length) return console.log("Sem conjuntos de anúncios.");
  for (const a of adsets) {
    const orc = a.daily_budget
      ? `${BRL(centsToBRL(a.daily_budget))} (no conjunto)`
      : a.campaign?.daily_budget
      ? `${BRL(centsToBRL(a.campaign.daily_budget))} (na campanha/CBO)`
      : "(sem orçamento diário — talvez vitalício)";
    console.log(`• ${a.name}`);
    console.log(`    id: ${a.id}`);
    console.log(`    campanha: ${a.campaign?.name || "—"}`);
    console.log(`    status: ${a.effective_status} | orçamento/dia: ${orc}\n`);
  }
  console.log(
    "Use os nomes ou ids acima no ads/plano-mudancas.json (campo \"adset\")."
  );
}

// Identifica o tipo de mídia do criativo (imagem única, vídeo, carrossel, post existente).
function tipoCreative(cr) {
  if (!cr) return "—";
  const spec = cr.object_story_spec || {};
  if (spec.video_data) return "vídeo";
  if (Array.isArray(spec.link_data?.child_attachments) && spec.link_data.child_attachments.length)
    return "carrossel";
  if (spec.link_data) return "imagem única";
  if (cr.object_story_id || cr.effective_object_story_id) return "post existente (Reels/feed)";
  if (cr.asset_feed_spec) return "Advantage+ (asset_feed_spec)";
  return cr.object_type || "desconhecido";
}

async function cmdAuditoria(accArg) {
  const accId = await resolveAccount(accArg);
  console.log(`Conta: ${accId}\n`);

  const camps = await graph(`${accId}/campaigns`, {
    params: {
      fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget",
      limit: "100",
    },
  });
  console.log("================ CAMPANHAS ================");
  for (const c of camps.data || []) {
    const orc = c.daily_budget
      ? `${BRL(centsToBRL(c.daily_budget))}/dia (CBO)`
      : c.lifetime_budget
      ? `${BRL(centsToBRL(c.lifetime_budget))} vitalício`
      : "orçamento no conjunto";
    console.log(`• ${c.name}  [${c.effective_status}]`);
    console.log(`    id: ${c.id} | objetivo: ${c.objective} | orçamento: ${orc}\n`);
  }

  const adsets = await listAdsets(accId);
  console.log("================ CONJUNTOS ================");
  for (const a of adsets) {
    console.log(`• ${a.name}  [${a.effective_status}]  (campanha: ${a.campaign?.name || "—"})`);
  }

  const ads = await graph(`${accId}/ads`, {
    params: {
      fields:
        "id,name,status,effective_status,adset{name},campaign{name},creative{id,object_type,object_story_spec,asset_feed_spec,effective_object_story_id}",
      limit: "200",
    },
  });
  console.log("\n================ ANÚNCIOS ================");
  for (const ad of ads.data || []) {
    console.log(`• ${ad.name}  [${ad.effective_status}]`);
    console.log(`    conjunto: ${ad.adset?.name || "—"} | campanha: ${ad.campaign?.name || "—"}`);
    console.log(`    tipo de mídia: ${tipoCreative(ad.creative)}\n`);
  }
  console.log(`Resumo: ${(camps.data || []).length} campanha(s), ${adsets.length} conjunto(s), ${(ads.data || []).length} anúncio(s).`);
}


function matchAdset(adsets, ref) {
  const r = String(ref).toLowerCase();
  const byId = adsets.find((a) => a.id === String(ref));
  if (byId) return byId;
  // 1º tenta pelo nome do conjunto; se não achar, pelo nome da campanha
  // (o usuário costuma pensar em "campanha", não em "conjunto").
  let ms = adsets.filter((a) => a.name.toLowerCase().includes(r));
  if (!ms.length)
    ms = adsets.filter((a) => (a.campaign?.name || "").toLowerCase().includes(r));
  if (ms.length === 1) return ms[0];
  if (ms.length > 1)
    die(`"${ref}" casa com ${ms.length} conjuntos — use o id exato (rode "listar").`);
  return null;
}

async function cmdAplicar(apply) {
  let plano;
  try {
    plano = JSON.parse(await readFile(PLANO_PATH, "utf8"));
  } catch {
    die(`não consegui ler ${PLANO_PATH}. Crie o plano de mudanças primeiro.`);
  }

  const accId = plano.conta || (await resolveAccount());
  const lim = plano.limites || {};
  const tetoBRL = Number(lim.orcamento_diario_max_brl ?? 0);
  const maxPct = Number(lim.aumento_max_pct ?? 0);
  const mudancas = Array.isArray(plano.mudancas) ? plano.mudancas : [];
  if (!mudancas.length) die("o plano não tem nenhuma mudança em \"mudancas\".");
  if (!tetoBRL) die("defina limites.orcamento_diario_max_brl no plano (trava de segurança).");

  console.log(`Conta: ${accId}`);
  console.log(`Modo: ${apply ? "🔴 APLICAR (vai alterar a campanha)" : "🟡 SIMULAÇÃO (dry-run)"}`);
  console.log(`Travas: teto ${BRL(tetoBRL)}/dia` + (maxPct ? `, aumento máx ${maxPct}%` : "") + "\n");

  const adsets = await listAdsets(accId);
  let aplicadas = 0;
  let bloqueadas = 0;

  for (const m of mudancas) {
    const alvo = matchAdset(adsets, m.adset);
    if (!alvo) {
      console.log(`✗ conjunto "${m.adset}" não encontrado — pulando.`);
      bloqueadas++;
      continue;
    }

    const ops = []; // cada op: { id, body, descr }
    let bloqueou = false;

    // --- Orçamento diário (no conjunto OU na campanha, se for CBO) ---
    if (m.orcamento_diario_brl != null) {
      const novo = Number(m.orcamento_diario_brl);
      let alvoOrc, atualCents, onde;
      if (alvo.daily_budget) {
        alvoOrc = alvo.id;
        atualCents = Number(alvo.daily_budget);
        onde = "conjunto";
      } else if (alvo.campaign?.daily_budget) {
        alvoOrc = alvo.campaign.id;
        atualCents = Number(alvo.campaign.daily_budget);
        onde = "campanha/CBO";
      } else {
        console.log(`✗ ${alvo.name}: sem orçamento diário no conjunto nem na campanha (talvez vitalício) — ajuste manual.`);
        bloqueadas++;
        bloqueou = true;
      }

      if (!bloqueou) {
        const atual = centsToBRL(atualCents);
        if (novo > tetoBRL) {
          console.log(`✗ ${alvo.name}: ${BRL(novo)} excede o teto ${BRL(tetoBRL)} — BLOQUEADO.`);
          bloqueadas++;
          bloqueou = true;
        } else if (maxPct && novo > atual * (1 + maxPct / 100)) {
          console.log(
            `✗ ${alvo.name}: ${BRL(atual)}→${BRL(novo)} é +${(((novo / atual) - 1) * 100).toFixed(0)}%, ` +
              `acima do máx ${maxPct}% — BLOQUEADO.`
          );
          bloqueadas++;
          bloqueou = true;
        } else {
          ops.push({
            id: alvoOrc,
            body: { daily_budget: brlToCents(novo) },
            descr: `orçamento (${onde}) ${BRL(atual)} → ${BRL(novo)}`,
          });
        }
      }
    }

    if (bloqueou) continue;

    // --- Status (ACTIVE / PAUSED) no conjunto ---
    if (m.status) {
      const s = String(m.status).toUpperCase();
      if (!["ACTIVE", "PAUSED"].includes(s))
        die(`status inválido "${m.status}" (use ACTIVE ou PAUSED).`);
      ops.push({ id: alvo.id, body: { status: s }, descr: `status ${alvo.status} → ${s}` });
    }

    if (!ops.length) {
      console.log(`• ${alvo.name}: nada a mudar.`);
      continue;
    }

    const descr = ops.map((o) => o.descr).join(" | ");
    if (!apply) {
      console.log(`🟡 [simulado] ${alvo.name}: ${descr}`);
      aplicadas++;
      continue;
    }

    for (const o of ops) await graph(o.id, { method: "POST", body: o.body });
    console.log(`✅ ${alvo.name}: ${descr}`);
    aplicadas++;
  }

  console.log(
    `\nResumo: ${aplicadas} ${apply ? "aplicada(s)" : "simulada(s)"}, ${bloqueadas} bloqueada(s)/puladas.`
  );
  if (!apply)
    console.log("Nada foi alterado. Para executar de verdade, rode com --apply.");
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const apply = rest.includes("--apply");
  if (cmd === "listar") return cmdListar(rest.find((a) => a.startsWith("act_")));
  if (cmd === "auditoria") return cmdAuditoria(rest.find((a) => a.startsWith("act_")));
  if (cmd === "aplicar") return cmdAplicar(apply);
  console.log(
    "Uso:\n" +
      "  node scripts/meta-ads-manage.mjs listar [act_XXXX]\n" +
      "  node scripts/meta-ads-manage.mjs auditoria [act_XXXX]  # campanhas + conjuntos + anúncios\n" +
      "  node scripts/meta-ads-manage.mjs aplicar           # simula\n" +
      "  node scripts/meta-ads-manage.mjs aplicar --apply   # executa"
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
