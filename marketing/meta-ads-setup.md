# Meta Ads — Configuração Completa da Campanha · CorretorPRO

> Pixel: 2015826029060952 — já instalado na landing + Hotmart
> Landing: https://usecorretorpro.vercel.app
> Orçamento inicial: R$30–50/dia (Fase 1 de teste)

---

## Antes de começar — checklist rápido

- [x] Meta Pixel instalado na landing (PageView + InitiateCheckout)
- [x] Pixel conectado na Hotmart (evento Purchase)
- [x] Perfil do Instagram ativo com posts
- [x] Criativos de vídeo gravados (4 roteiros prontos)
- [ ] Conta de anúncios com pagamento configurado
- [ ] Campanha no ar

---

## PARTE 1 — Pré-configuração da conta (faça uma vez)

### 1.1 Acessar o Gerenciador de Anúncios
Acesse: **business.facebook.com → Gerenciador de Anúncios**
(ou ads.facebook.com)

### 1.2 Vincular o Instagram à conta
`Configurações do negócio → Contas do Instagram → Adicionar`
→ Conecte o @usecorretorpro (ou o @ que criou)

### 1.3 Verificar que o Pixel está ativo
`Gerenciador de Eventos → Conjunto de dados → CorretorPRO`
→ Status: verde "Ativo"
→ Eventos recebidos: PageView e InitiateCheckout aparecem
→ Se ainda não aparece: acesse a landing uma vez e atualize

### 1.4 Configurar forma de pagamento
`Configurações → Pagamentos → Adicionar método`
→ Cartão de crédito recomendado (débito pode ter limite baixo)
→ Defina limite de gasto diário da conta (ex: R$80) para não ultrapassar o planejado

---

## PARTE 2 — Criar a Campanha

### Clique em "+ Criar" no Gerenciador de Anúncios

**Tela 1 — Objetivo:**
- Selecione: **Vendas**
- Clique em Continuar

**Tela 2 — Nome da campanha:**
```
CPR | Teste Criativo v1 | [data de hoje]
```

**Configurações da campanha:**
| Campo | Valor |
|-------|-------|
| Categoria especial de anúncio | Nenhuma |
| Limite de gasto da campanha | Deixe em branco por ora |
| Otimização do orçamento da campanha (CBO) | ATIVADO |
| Orçamento diário da campanha | R$ 50,00 |
| Estratégia de lance | Menor custo (padrão) |

> CBO ativo = o algoritmo distribui o dinheiro entre os criativos conforme performance. Ideal para teste.

---

## PARTE 3 — Configurar o Conjunto de Anúncios

Nome do conjunto:
```
CPR | Público Aberto | Brasil
```

### 3.1 Conversão
| Campo | Valor |
|-------|-------|
| Local de conversão | Site |
| Pixel | CorretorPRO (2015826029060952) |
| Evento de otimização | **Purchase** |

> Se "Purchase" aparecer em cinza/sem dados, use **InitiateCheckout** por enquanto. Quando acumular 50+ compras, volte para Purchase.

### 3.2 Orçamento e Programação
| Campo | Valor |
|-------|-------|
| Tipo de orçamento | Diário |
| Valor | R$ 50,00 (ou R$ 30 se quiser mais conservador) |
| Início | Imediatamente |
| Fim | Sem data de término |

### 3.3 Público
**IMPORTANTE: Deixe aberto. Não segmente por interesses no começo.**

| Campo | Valor |
|-------|-------|
| Locais | Brasil |
| Idade | 25 – 55 |
| Gênero | Todos |
| Interesses | **NENHUM — deixe em branco** |
| Expansão do público | Ativada (padrão) |

> O algoritmo do Meta em 2024+ acha o corretor sozinho quando o criativo é bom. Interesses limitam o aprendizado. Confie no amplo.

### 3.4 Posicionamentos
- Selecione: **Posicionamentos Advantage+** (automático)
- Deixe o Meta escolher entre Feed, Reels, Stories, Facebook

> Não mude os posicionamentos agora. Dados mostrarão qual converte melhor. Aí você exclui os ruins.

---

## PARTE 4 — Criar os Anúncios

Crie **3 a 4 anúncios** dentro do mesmo conjunto. Cada um = um criativo diferente.

### Nome padrão de cada anúncio:
```
CPR | [Ângulo] | [Formato]
Exemplo: CPR | Velocidade | Vídeo 9x16
```

### Configurações comuns a todos os anúncios:
| Campo | Valor |
|-------|-------|
| Identidade | Sua Página do Facebook + Instagram @usecorretorpro |
| URL do site | https://usecorretorpro.vercel.app |
| Botão de chamada para ação (CTA) | "Saiba mais" ou "Inscrever-se" |
| Pixel de rastreamento | CorretorPRO (confirmar que está selecionado) |

---

## Anúncio 1 — Ângulo: Velocidade

**Criativo:** Vídeo gravado na tela mostrando proposta sendo gerada em menos de 60s

**Texto principal (copy):**
```
Proposta profissional em 60 segundos.

Sem Word. Sem Canva. Sem enrolação.

O corretor que manda a proposta primeiro tem mais chance de fechar. Simples assim.

→ Teste grátis por 7 dias, sem cartão de crédito.
```

**Título (headline):**
```
Proposta pronta em 60 segundos
```

**Descrição (opcional):**
```
Direto do celular. Com a sua marca. Pronto para enviar no WhatsApp.
```

---

## Anúncio 2 — Ângulo: Dor / Concorrência

**Criativo:** Vídeo tipo talking head ou texto animado na tela

**Texto principal (copy):**
```
O cliente pediu a proposta às 14h.

Você está formatando no Word.

O outro corretor enviou às 14h12 — com logo, PDF bonito e condições organizadas.

Sabe quem fechou?

CorretorPRO gera sua proposta profissional em menos de 2 minutos. Com a sua identidade. Do celular.

→ 7 dias grátis: usecorretorpro.vercel.app
```

**Título:**
```
Quem manda a proposta primeiro, fecha
```

---

## Anúncio 3 — Ângulo: Antes / Depois

**Criativo:** Split screen ou sequência — proposta feia (Word) vs proposta CorretorPRO

**Texto principal (copy):**
```
Antes: proposta no Word, sem logo, sem formatação, cliente some.

Depois: PDF com sua marca, layout profissional, cliente fecha.

A diferença não é o imóvel. É a apresentação.

CorretorPRO: crie propostas que vendem — R$2,30 por dia.

Teste 7 dias grátis, cancele quando quiser.
```

**Título:**
```
Sua proposta está custando negócios?
```

---

## Anúncio 4 — Ângulo: Preço Ancorado

**Criativo:** Vídeo simples, fala direta para a câmera (talking head)

**Texto principal (copy):**
```
R$2,30 por dia.

Isso é o que separa uma proposta amadora de uma proposta que fecha.

Se você fechar 1 negócio a mais por mês, a ferramenta se paga centenas de vezes.

Corretores que usam o CorretorPRO chegam na reunião com a proposta pronta, profissional e com a própria marca.

→ Comece grátis por 7 dias. Sem cartão.
```

**Título:**
```
R$2,30/dia para fechar mais negócios
```

---

## PARTE 5 — Revisar e Publicar

**Checklist antes de publicar:**
- [ ] Objetivo: Vendas
- [ ] Evento de otimização: Purchase (ou InitiateCheckout)
- [ ] Pixel selecionado em todos os anúncios
- [ ] URL correta: https://usecorretorpro.vercel.app
- [ ] Instagram conectado (seu perfil aparece no anúncio)
- [ ] 3–4 criativos de vídeo carregados
- [ ] CBO ativado com R$30–50/dia
- [ ] Público: Brasil, 25–55, sem interesses

Clique em **Publicar**. O Meta vai revisar (geralmente aprovado em 1–24h).

---

## PARTE 6 — O que fazer nos primeiros 7 dias

### Regras de ouro:
1. **Não mexa durante 2–3 dias.** Toda edição reseta o aprendizado.
2. **Olhe os números 1x por dia**, sempre no mesmo horário (ex: manhã cedo).
3. **Não adicione orçamento nos primeiros 7 dias** — deixe o teste completar.

### O que olhar (Gerenciador → Colunas → Desempenho e cliques):

| Métrica | Meta | Ação se abaixo |
|---------|------|----------------|
| CTR do link | > 1,5% | Pause o criativo após R$30 gastos |
| CPM | < R$40 | Se muito alto, checar relevância do criativo |
| Custo por clique no link | < R$2,00 | — |
| Custo por InitiateCheckout | < R$15 | Acima de R$30 = landing fraca |
| Custo por compra (CPA) | < R$67 | Acima de R$100 após R$150 gastos = pause |

### Quando pausar um criativo:
- CTR < 0,8% após R$30 gastos → PAUSE
- CPA > R$100 após R$150 gastos → PAUSE
- Custo por InitiateCheckout > R$30 → revisar landing ou criativo

### Quando escalar:
- CPA < R$67 por 3 dias seguidos → aumento de +20% no orçamento
- Nunca mais que 20% de aumento por vez (a cada 2–3 dias)

---

## PARTE 7 — Retargeting (ativar na semana 2)

Quando o criativo vencedor estiver confirmado, crie uma **segunda campanha de retargeting**.

### Público de retargeting:
`Públicos → Criar público → Público personalizado → Site`
- Visitaram a URL: usecorretorpro.vercel.app
- Janela: 30 dias
- Excluir: quem já comprou (evento Purchase)

### Copy de retargeting:
```
Você visitou o CorretorPRO mas não experimentou ainda.

Entendemos — testar algo novo dá trabalho.

Por isso a gente dá 7 dias grátis, sem cartão, sem compromisso.

Se não gostar, cancela em 1 clique.

Justo?

→ usecorretorpro.vercel.app
```

**Orçamento de retargeting:** R$10–15/dia separado (não misture com o topo de funil).

---

## PARTE 8 — Próximos passos por fase

| Semana | Ação |
|--------|------|
| 1–2 | Teste de criativo, não mexa, observe |
| 3 | Pause perdedores, escale vencedor +20% |
| 4 | Ative retargeting, crie variações do vencedor |
| Mês 2 | Lookalike de compradores 1% (quando tiver 50+ compras) |
| Mês 3 | Google Ads Search: "proposta corretor", "modelo proposta imóvel" |

---

## Dúvidas frequentes

**P: Preciso de conta Business para anunciar?**
R: Não obrigatório, mas recomendado. O Business Manager dá mais controle e evita bloqueios de conta pessoal.

**P: Meta vai reprovar meu anúncio?**
R: Pouco provável para esse nicho. Se reprovar, veja o motivo no Gerenciador → geralmente é texto demais na imagem ou claim muito agressivo.

**P: Posso anunciar só pelo celular?**
R: Sim, pelo app Meta Business Suite. Mas para analisar dados e criar campanhas complexas, prefira o computador.

**P: Quando começo a ver resultado?**
R: O algoritmo precisa de 50 eventos de otimização para "aprender". Com R$50/dia e CPA de ~R$50–70, isso leva 1–2 semanas. Antes disso os números são instáveis — não tome decisões precipitadas.
