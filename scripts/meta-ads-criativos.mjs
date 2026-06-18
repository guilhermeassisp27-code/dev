#!/usr/bin/env node
// Sobe criativos (imagem estática + carrossel) como anúncios NOVOS e PAUSADOS,
// reaproveitando a página, o link de destino e o CTA do anúncio que JÁ ESTÁ
// rodando na campanha. Assim a automação nunca chuta para onde manda o clique.
//
// SEGURANÇA:
//   - Cria os anúncios sempre PAUSADOS (você revisa e ativa no Meta).
//   - Sem --apply ele apenas SIMULA: mostra página/link resolvidos e o que criaria.
//   - Não mexe em orçamento, status de conjunto, nem nada além de criar anúncios.
//
// Variáveis de ambiente:
//   META_MANAGE_TOKEN (ou META_ACCESS_TOKEN) — token com escopo ads_management
//   META_API_VERSION  (opcional)             — default v21.0
//
// Uso:
//   node scripts/meta-ads-criativos.mjs simular            # dry-run (default)
//   node scripts/meta-ads-criativos.mjs aplicar --apply    # cria os anúncios PAUSADOS

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const TOKEN = process.env.META_MANAGE_TOKEN || process.env.META_ACCESS_TOKEN;
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;
const PLANO_PATH = join(process.cwd(), "ads", "criativos-plano.json");

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
  if (json.error)
    throw new Error(`Graph ${method} ${path}: ${json.error.message} (code ${json.error.code})`);
  return json;
}

// Sobe um arquivo de imagem e devolve o hash que o Meta usa nos criativos.
async function uploadImage(accId, filePath) {
  const bytes = await readFile(join(process.cwd(), filePath));
  const form = new FormData();
  form.append("bytes", bytes.toString("base64"));
  form.append("access_token", TOKEN);
  const res = await fetch(`${BASE}/${accId}/adimages`, { method: "POST", body: form });
  const json = await res.json();
  if (json.error) throw new Error(`upload ${filePath}: ${json.error.message}`);
  const imgs = json.images || {};
  const first = Object.values(imgs)[0];
  if (!first?.hash) throw new Error(`upload ${filePath}: resposta sem hash`);
  return first.hash;
}

async function resolveCampaignAdset(accId, campanha) {
  const r = await graph(`${accId}/adsets`, {
    params: { fields: "id,name,campaign{id,name}", limit: "200" },
  });
  const adsets = r.data || [];
  const ref = String(campanha).toLowerCase();
  let ms = adsets.filter((a) => a.name.toLowerCase().includes(ref));
  if (!ms.length) ms = adsets.filter((a) => (a.campaign?.name || "").toLowerCase().includes(ref));
  if (!ms.length) die(`campanha/conjunto "${campanha}" não encontrado — confira o nome no plano.`);
  if (ms.length > 1) die(`"${campanha}" casa com ${ms.length} conjuntos — use um nome mais específico.`);
  return ms[0];
}

// Pega o destino (página, link, CTA, instagram) de um anúncio que já existe na conta.
async function herdarDestino(accId) {
  const r = await graph(`${accId}/ads`, {
    params: {
      fields:
        "id,name,effective_status,creative{object_story_spec,instagram_actor_id}",
      limit: "50",
    },
  });
  const ads = r.data || [];
  for (const ad of ads) {
    const spec = ad.creative?.object_story_spec;
    const ld = spec?.link_data;
    if (spec?.page_id && ld?.link) {
      return {
        page_id: spec.page_id,
        instagram_actor_id: spec.instagram_actor_id || ad.creative?.instagram_actor_id || null,
        link: ld.link,
        call_to_action: ld.call_to_action || { type: "LEARN_MORE" },
        de_anuncio: ad.name,
      };
    }
  }
  die(
    "não encontrei nenhum anúncio existente com página + link para herdar o destino. " +
      "Suba 1 anúncio manualmente no Meta primeiro (ou me passe page_id e link)."
  );
}

function buildSpec(c, destino, hashes) {
  const cta = destino.call_to_action;
  const base = { page_id: destino.page_id };
  if (destino.instagram_actor_id) base.instagram_actor_id = destino.instagram_actor_id;

  if (c.tipo === "carousel") {
    base.link_data = {
      link: destino.link,
      message: c.texto,
      multi_share_optimized: true,
      multi_share_end_card: true,
      child_attachments: hashes.map((h) => ({
        image_hash: h,
        link: destino.link,
        name: c.headline,
        description: c.descricao,
        call_to_action: cta,
      })),
    };
  } else {
    base.link_data = {
      image_hash: hashes[0],
      link: destino.link,
      message: c.texto,
      name: c.headline,
      description: c.descricao,
      call_to_action: cta,
    };
  }
  return base;
}

async function main() {
  const apply = process.argv.includes("--apply");
  let plano;
  try {
    plano = JSON.parse(await readFile(PLANO_PATH, "utf8"));
  } catch {
    die(`não consegui ler ${PLANO_PATH}.`);
  }
  const accId = plano.conta;
  const status = (plano.status_novos_anuncios || "PAUSED").toUpperCase();
  if (status !== "PAUSED")
    die("por segurança este script só cria anúncios PAUSED. Ajuste status_novos_anuncios.");
  const criativos = Array.isArray(plano.criativos) ? plano.criativos : [];
  if (!criativos.length) die("o plano não tem criativos.");

  console.log(`Conta: ${accId}`);
  console.log(`Modo: ${apply ? "🔴 APLICAR (cria anúncios PAUSADOS)" : "🟡 SIMULAÇÃO (dry-run)"}\n`);

  const adset = await resolveCampaignAdset(accId, plano.campanha);
  console.log(`Conjunto alvo: ${adset.name} (${adset.id}) — campanha ${adset.campaign?.name}`);

  const destino = await herdarDestino(accId);
  console.log(`Destino herdado do anúncio "${destino.de_anuncio}":`);
  console.log(`  página: ${destino.page_id}` + (destino.instagram_actor_id ? ` | ig: ${destino.instagram_actor_id}` : ""));
  console.log(`  link:   ${destino.link}`);
  console.log(`  CTA:    ${destino.call_to_action.type}\n`);

  let criados = 0;
  for (const c of criativos) {
    const arquivos = c.tipo === "carousel" ? c.imagens || [] : [c.imagem];
    if (!arquivos.length || arquivos.some((a) => !a)) {
      console.log(`✗ ${c.nome}: sem arquivo de imagem — pulando.`);
      continue;
    }

    if (!apply) {
      console.log(`🟡 [simulado] criaria anúncio PAUSADO "${c.nome}"`);
      console.log(`     tipo: ${c.tipo} | imagens: ${arquivos.length}`);
      console.log(`     headline: ${c.headline}`);
      console.log(`     texto: ${String(c.texto).split("\n")[0]}…\n`);
      criados++;
      continue;
    }

    const hashes = [];
    for (const f of arquivos) hashes.push(await uploadImage(accId, f));
    const spec = buildSpec(c, destino, hashes);
    const creative = await graph(`${accId}/adcreatives`, {
      method: "POST",
      body: { name: `${c.nome} — creative`, object_story_spec: spec },
    });
    const ad = await graph(`${adset.id}/ads`, {
      method: "POST",
      body: {
        name: c.nome,
        adset_id: adset.id,
        creative: { creative_id: creative.id },
        status: "PAUSED",
      },
    });
    console.log(`✅ ${c.nome}: anúncio ${ad.id} criado PAUSADO (creative ${creative.id}).`);
    criados++;
  }

  console.log(`\nResumo: ${criados} ${apply ? "criado(s) PAUSADO(s)" : "simulado(s)"}.`);
  if (apply)
    console.log("Abra o Meta Ads Manager, revise os anúncios e ATIVE os que aprovar.");
  else console.log("Nada foi criado. Para criar de verdade, rode com --apply.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
