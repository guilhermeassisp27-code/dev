# WhatsApp F1 — O que fazer na Meta para liberar o "Conectar meu WhatsApp"

O código do F1 (Embedded Signup) está 100% pronto e no ar, mas **desligado por
um kill-switch**: o botão só funciona quando você setar duas variáveis no Vercel,
e só faz sentido setá-las depois que a Meta aprovar o app. Este guia é a parte
manual na Meta, tela por tela, com o link de cada passo.

Tudo é feito **no mesmo app** que você já criou no F0 (tipo Business, com o
produto WhatsApp). Você reaproveita ele — não cria app novo.

> Todos os passos oficiais estão documentados pela Meta. Fontes no fim do arquivo.

---

## Visão geral: são 3 aprovações + 1 configuração + ligar o interruptor

| # | Etapa | Onde | Tempo Meta | Status |
|---|---|---|---|---|
| 1 | Verificação de Empresa | Business Settings | 2–5 dias úteis | ✅ Aprovado 11/07/2026 |
| 2 | App Review (Advanced Access) | App Dashboard → App Review | ~5 dias úteis | ⬜ Fazer |
| 3 | Access Verification | App Settings → Basic | ~5 dias úteis | ⬜ Fazer (depois do 2) |
| 4 | Criar a configuração do Embedded Signup | Facebook Login for Business | imediato | ⬜ Fazer |
| 5 | App em modo Live + envs no Vercel | App Dashboard + Vercel | imediato | ⬜ Fazer por último |

A ordem importa: **2 → 3** (o Access Verification só abre depois do App Review).
O passo **4** pode ser feito em paralelo. O passo **5** é o último.

Abra seu app aqui e deixe essa aba fixa: **https://developers.facebook.com/apps/**
(clique no app do WhatsApp que você criou no F0).

---

## Passo 1 — Verificação de Empresa ✅ (já feito)

Aprovado em 11/07/2026 (GP ASSIS CONSULTORIA EMPRESARIAL). É pré-requisito de
tudo abaixo. Nada a fazer.

Onde se confere: **https://business.facebook.com/settings** → Central de Segurança
(Security Center).

---

## Passo 2 — App Review: pedir Advanced Access das 2 permissões

É **esta** aprovação que libera outros corretores a conectar o WhatsApp deles —
não a Verificação de Empresa. Você precisa de Advanced Access em DUAS permissões:

- `whatsapp_business_messaging` — enviar mensagem em nome do corretor
- `whatsapp_business_management` — acessar a conta WhatsApp Business (WABA) do corretor

**Onde:** no seu app → menu lateral esquerdo → **App Review → Permissions and Features**
(URL: `https://developers.facebook.com/apps/SEU_APP_ID/app-review/permissions/`).

**Passo a passo (repita para cada uma das 2 permissões):**

1. Ache `whatsapp_business_messaging` na lista → clique **Request Advanced Access**
   → **Continue the Request**.
2. Na seção **Requested Permissions and Features**, clique a setinha **Complete Form**
   da permissão.
3. No pop-up, escreva **em detalhe** como o Selo usa a permissão (descrição do caso
   de uso: "plataforma que conecta o WhatsApp Business do corretor autônomo para um
   assistente qualificar leads recebidos; o corretor conecta o próprio número via
   Embedded Signup").
4. Faça **upload de um vídeo (screencast)** mostrando o fluxo real: corretor logado
   no Selo → clica "Conectar meu WhatsApp" → popup do Embedded Signup → número
   conectado → mensagem sendo recebida/respondida. Clique **Upload File**.
5. Repita 1–4 para `whatsapp_business_management`.
6. Clique **Submit For Review**.

O vídeo é o que mais reprova. A Meta tem um exemplo do que o screencast precisa
mostrar: **https://developers.facebook.com/docs/whatsapp/solution-providers/app-review/sample-submission**

> Dica para gravar o vídeo: você pode usar o modo demo/ambiente de teste — o app
> já responde 503 no kill-switch, mas para o screencast o que a Meta quer ver é a
> INTERFACE do fluxo (o popup, os passos). Se precisar, a gente liga as envs num
> preview do Vercel só para gravar e desliga depois.

---

## Passo 3 — Access Verification (só abre depois do Passo 2 aprovado)

A Meta exige confirmar que você é um Tech Provider legítimo para manusear dados de
outra empresa (a WABA do corretor).

**Onde:** no seu app → **App Settings → Basic** (menu lateral esquerdo)
(URL: `https://developers.facebook.com/apps/SEU_APP_ID/settings/basic/`).

**Passo a passo:**

1. Role até a seção **Access verification**.
2. Clique **Start verification**.
3. Preencha as informações pedidas.
4. Clique **Request advanced access**.

Leva ~5 dias úteis. Concluir os 3 (Verificação de Empresa + App Review +
Access Verification) sobe seu limite de onboarding de **10 → 200 corretores por
janela de 7 dias**.

---

## Passo 4 — Criar a configuração do Embedded Signup (gera o Configuration ID)

O Embedded Signup roda sobre o produto **Facebook Login for Business**. Você cria
uma "configuração" e ela gera um **Configuration ID** — é uma das duas envs que o
Selo precisa.

### 4a. Ativar o produto

No seu app → página inicial do App Dashboard → ache o card **Facebook Login for
Business** → **Set Up**.

### 4b. Criar a configuração

1. Menu lateral → **Facebook Login for Business → Configurations**.
2. Clique **+ Create Configuration**.
3. **Nome:** qualquer coisa (ex.: "Selo — Conectar WhatsApp"). Não aparece para o
   corretor. → **Next**.
4. **Login variation:** selecione **WhatsApp Embedded Signup**.
5. **Use cases:** selecione **Other**. **Type:** selecione **Business**.
6. Clique **Create**.
7. **Copie o Configuration ID** (aparece como "Configuration Number"). ← guarde,
   vira a env `WHATSAPP_ES_CONFIG_ID`.

### 4c. Configurar OAuth e domínios (senão o popup não devolve os dados)

Menu lateral → **Facebook Login for Business → Settings**.

1. Em **Client OAuth settings**, ligue (**Yes**) todos estes:
   - Client OAuth login
   - Web OAuth login
   - Enforce HTTPS
   - Embedded Browser OAuth Login
   - Use Strict Mode for redirect URIs
   - Login with the JavaScript SDK
2. Em **Valid OAuth Redirect URIs**, adicione: `https://app.selosales.com.br`
3. Em **Allowed Domains for the JavaScript SDK**, adicione: `https://app.selosales.com.br`

> Por que esse domínio: a ferramenta (tool.html) roda em `app.selosales.com.br`, e
> é essa a página que abre o popup. Sem o domínio nos dois campos, a Meta **não
> devolve** o waba_id / phone_number_id / code para a página — o fluxo trava.
> Precisa ser HTTPS e domínio fixo (sem curinga).

---

## Passo 5 — Ligar o interruptor (app em Live + 2 envs no Vercel)

Só depois dos passos 2, 3 e 4 concluídos.

### 5a. Colocar o app em modo Live

No topo do App Dashboard tem um botão de modo do app: mude de **Development** para
**Live**. Sem isso, o Embedded Signup não funciona para corretores reais (só para
quem é admin do app).

### 5b. Setar as 2 variáveis no Vercel

Vercel → projeto do Selo → **Settings → Environment Variables**:

```
WHATSAPP_APP_ID=<App ID do seu app>            # App Settings → Basic → "App ID" (número no topo)
WHATSAPP_ES_CONFIG_ID=<Configuration ID>       # o número que você copiou no Passo 4b
```

Depois de salvar, faça um redeploy do projeto no Vercel (as envs novas só valem no
próximo deploy). **Não precisa mexer no tool.html** — ele pergunta a config ao
backend automaticamente. No instante em que as duas envs existem, o botão
"Conectar meu WhatsApp" passa a abrir o popup de verdade.

---

## Depois de ligar: o que cada corretor vai precisar

- Ter uma conta **Meta Business** (o popup guia a criação se não tiver).
- **Cadastrar um meio de pagamento** na conta WhatsApp Business dele — exigência da
  Meta para Tech Providers. (O caso de uso do Selo — lead inicia a conversa, bot
  responde em 24h — é mensagem de serviço, custo zero; o cartão é exigência formal.)
- Conectar em **modo coexistência** se ele já usa o número no app WhatsApp Business
  (não perde o app no celular). Número dedicado novo entra por registro direto.

---

## Limites e prazos (para planejar o beta)

- **Onboarding:** 10 corretores / 7 dias no começo; sobe para 200 / 7 dias após os
  3 passos de verificação. Bate certo com o beta de 10.
- **Prazos Meta:** App Review ~5 dias úteis; Access Verification ~5 dias úteis.
  Some ~2 semanas do envio até liberar tudo.

---

## Mapa: valor da Meta → variável do Selo

| Variável (Vercel) | De onde vem na Meta |
|---|---|
| `WHATSAPP_APP_ID` | App Settings → Basic → **App ID** (número no topo) |
| `WHATSAPP_ES_CONFIG_ID` | Facebook Login for Business → Configurations → **Configuration ID** (Passo 4b) |
| `WHATSAPP_APP_SECRET` | App Settings → Basic → App Secret (já setado no F0) |
| `WHATSAPP_ACCESS_TOKEN` | Token do System User (já setado no F0 — número do piloto) |
| `WHATSAPP_VERIFY_TOKEN` | String que você inventou no F0 (já setado) |

---

## Fontes (documentação oficial da Meta e guias de provedores)

- Become a Tech Provider — https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers
- Embedded Signup (overview) — https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview
- Embedded Signup (implementation) — https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation
- App Review — https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/app-review
- App Review — exemplo de submissão (o que o vídeo precisa mostrar) — https://developers.facebook.com/docs/whatsapp/solution-providers/app-review/sample-submission
- Solution Partner / tipos de parceiro — https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/overview
