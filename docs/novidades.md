# Novidades CorretorPRO

Changelog das melhorias da ferramenta. O agente `produto` adiciona uma entrada
no TOPO a cada melhoria; o agente `marketing` lê a entrada mais recente para
criar o anúncio aos corretores.

Formato de cada entrada:

```
## [AAAA-MM-DD] Título curto da novidade
**Para o corretor:** o benefício em 1 frase (sem jargão técnico).
**O que mudou:** 1–2 linhas do que foi implementado.
**Status:** proposto | em PR | publicado
```

---

## [2026-06-24] Alerta de lead esquecido + sugestão de follow-up no WhatsApp
**Para o corretor:** a Agenda agora avisa quando um lead fica "frio" — sem nenhuma interação há 3 dias (atenção) ou 7+ dias (crítico, com destaque pulsante) — e te entrega uma mensagem de retomada já pronta para revisar e mandar no WhatsApp em 1 clique.
**O que mudou:** cada lead ganhou o campo `ultimaInteracao` (dentro do mesmo jsonb `leads` de `cpr_user_data`, sem nova coluna/tabela), atualizado ao criar o lead, aceitar uma captação, marcar visita como realizada, registrar contato manual ou enviar o follow-up pelo WhatsApp. A Agenda de Visitas calcula os dias sem contato e exibe um badge de alerta (`X dias sem contato`) nos cards — clicar abre um modal com uma mensagem de follow-up gerada localmente por template (varia o tom conforme os dias parado, sem chamar nenhuma IA externa) e o botão "Enviar no WhatsApp" que monta o link `wa.me/<DDI+telefone>?text=...` reaproveitando a mesma lógica de limpeza de telefone (DDI 55 já embutido vs. só DDD) usada em `app/api/hotmart-webhook/route.ts`. Não há nenhum envio automático — o corretor sempre revisa e confirma manualmente dentro do WhatsApp, sem custo de API e sem aprovação Meta.
**Por que essa dor é real:** pesquisa de mercado confirma que "lead esquecido entre o primeiro contato e o fechamento" é hoje a dor #1 do corretor autônomo — perde-se a venda não por falta de leads, mas por falta de um sistema que alerte o momento certo do recontato (ver fontes abaixo). Concorrentes diretos como WAX e Tecimob já resolvem isso com lembretes/alertas automáticos de follow-up; WAX relata "mais de 1.000 corretores pararam de perder vendas por falta de follow-up" e alertas de oportunidade aumentando em 20% o fechamento.
**Fontes:** [Funil de Vendas Imobiliário: o fim do lead esquecido — Converta+](https://convertamais.com/blog/gestao-de-leads/funil-de-vendas-imobiliario-o-fim-do-lead-esquecido/), [Onde o lead morre no funil — Homer](https://blog.homer.com.br/2026/01/onde-o-lead-morre-no-funil/), [Os 8 erros de follow-up imobiliário — Praedium](https://praedium.com.br/blog/erros-follow-up-imobiliario/), [WAX — CRM para WhatsApp Web de corretores](https://waxcrm.com/)
**Status:** em PR

## [2026-06-20] Captação de leads pela internet — link público do corretor
**Para o corretor:** agora você tem um link de contato com a sua marca para colocar na bio do Instagram, no status do WhatsApp ou nos anúncios. O cliente preenche os dados dele e cai direto na sua Agenda de Visitas — você só aceita e segue para a visita, o registro e a proposta, sem redigitar nada.
**O que mudou:** nova página pública `/captura/<slug>` (Next.js, sem login) com o nome/CRECI/logo/cor do corretor, gerada a partir de um `slug` salvo no `perfil`. O envio passa pela rota `app/api/captura/route.ts` (service role, com honeypot anti-spam e validação de tamanho) e grava na nova tabela `cpr_public_leads` (ver `supabase-setup.sql`), atrelada ao dono do slug. Dentro do `tool.html`, a aba "Agenda de Visitas" ganhou o bloco "Captar leads pela internet": mostra o link (copiar / compartilhar no WhatsApp) e a caixa de leads recebidos, onde o corretor aceita (vira lead da agenda) ou descarta cada um. RLS garante que cada corretor só enxerga os próprios leads; a inserção pública não tem superfície anônima direta (só via API com service role). Fecha o ciclo capturar → agendar → Registro de Visita → proposta, tudo dentro do CorretorPRO.
**Status:** em PR

## [2026-06-20] Recuperação automática de carrinho abandonado (Hotmart)
**Para o corretor (negócio):** quem chega a abrir o checkout e não compra agora vira lead recuperável automaticamente — não se perde mais 100% de quem já demonstrou intenção de comprar.
**O que mudou:** novo evento `PURCHASE_OUT_OF_SHOPPING_CART` tratado no webhook (`app/api/hotmart-webhook/route.ts`). Ao abandonar o checkout, o lead (nome, email, telefone, plano) é salvo na nova tabela `cpr_abandoned_carts` (ver `supabase-setup.sql`), um link de WhatsApp pré-preenchido é gerado para contato manual imediato, e um email de recuperação é disparado automaticamente via API da Brevo (não pelo SMTP do Supabase — chamada direta à API, requer as novas env vars `BREVO_API_KEY` e `BREVO_SENDER_EMAIL` no Vercel). Dedupe por email evita reenviar o mesmo email em re-tentativas do mesmo evento. Não altera a validação do `hottok` nem o fluxo de compra/cancelamento existentes.
**Pendência operacional:** ativar o evento "Carrinho abandonado" no painel da Hotmart (Ferramentas → Webhook) apontando para a mesma URL do webhook já configurada, e cadastrar `BREVO_API_KEY`/`BREVO_SENDER_EMAIL` no Vercel.
**Status:** em PR

## [2026-06-17] Landing page — cores com foco estratégico de conversão + CTA em duas camadas
**Para o corretor:** a página de vendas agora deixa mais claro o que é "destaque/premium" (dourado, já existia) e o que é "o prazo está acabando" (agora em vermelho-coral, separado do dourado) — sem confundir as duas mensagens. Quem ainda não está pronto para assinar agora tem um botão secundário para ver a demonstração antes.
**O que mudou:** pesquisa de psicologia das cores aplicada a imóveis/SaaS confirmou que a base navy + âmbar/dourado já está correta para confiança e status premium (não foi alterada). O ponto fraco identificado: a faixa de escassez real (preço de lançamento + countdown) usava a mesma cor âmbar do CTA e de quase todo o resto da página, perdendo o efeito de urgência. Criada nova cor dedicada (`--urgency`, vermelho-coral) só para essa faixa de prazo, e reforçado o contraste do selo de garantia de 7 dias (borda e peso da fonte) para ele competir melhor visualmente perto do checkout. Inspirado em benchmarks de ferramentas para corretores (Follow Up Boss), o CTA principal do hero agora vem acompanhado de um CTA secundário ("Ver demonstração") em camada mais leve, sem alterar a paleta navy/âmbar. CTA, plano em destaque, badges e footer permanecem em âmbar — já validados pela pesquisa. Não foram alterados preços, links de checkout, countdown (JS) nem pixel.
**Status:** publicado

## [2026-06-17] Modelos de Proposta — 3 visuais para escolher
**Para o corretor:** sua proposta não fica igual à de todo mundo — escolha entre Clássico, Moderno e Minimalista e mande sempre com a cara que combina com o imóvel e a sua marca.
**O que mudou:** nova seção "Modelo da Proposta" em Configurações, com 3 cards clicáveis (Clássico = visual atual; Moderno = cabeçalho e destaques em bloco de cor; Minimalista = mais limpo, tipografia maior, menos cor). A escolha é salva no perfil (mesma coluna `perfil` jsonb usada hoje para logo/cor) e aplicada automaticamente em toda nova proposta gerada — é só troca de CSS, sem duplicar o cálculo financeiro nem o conteúdo da proposta. PDF e impressão continuam no padrão limpo de sempre, independente do modelo escolhido.
**Dor validada:** já estava no roadmap priorizado ("corretores têm estilos diferentes; um único layout não serve para todos os imóveis — alto padrão vs popular"). Pesquisa sobre identidade visual no setor (blogs de marketing imobiliário) reforça que a paleta/estilo comunica posicionamento — imóveis de alto padrão pedem visual mais sóbrio/minimalista, enquanto público mais jovem/popular responde melhor a cores vibrantes e blocos de destaque; hoje o CorretorPRO só deixava o corretor variar a cor da marca, não o layout em si. Reforça o posicionamento usado na landing/anúncio de "parecer uma imobiliária grande".
**Status:** em PR

## [2026-06-17] Agenda de Visitas — funil de leads antes da venda
**Para o corretor:** pare de perder vendas por esquecer follow-up. Agende a visita com o cliente assim que marcar, e a ferramenta lembra você de quem ainda não foi atendido — e quando o cliente vira mesmo o registro de visita ou a proposta, os dados já vêm preenchidos.
**O que mudou:** nova aba "Agenda de Visitas" (seção "Funil" no menu). Cadastro rápido de lead com nome, telefone, imóvel de interesse, data/hora e observação. Lista ordenada mostra atrasadas, hoje e agendadas primeiro, com badge na sidebar contando pendências. Botão "Marcar como realizada" libera "Gerar Registro de Visita" e "Gerar Proposta", que pré-preenchem nome, telefone e endereço a partir do lead — sem redigitar. Dados salvos em nova coluna jsonb (`leads`) na mesma tabela `cpr_user_data`, seguindo o padrão de `perfil`/`historico`.
**Dor validada:** pesquisa em CRMs imobiliários (DNA de Vendas, Website Imobiliário, ImobDesk) mostra que o follow-up esquecido é apontado como uma das principais causas de perda de venda — "o cliente diz 'vou pensar' e o corretor não anota, não programa lembrete e não retorna"; estudos citados (Salesforce) associam uso de CRM a até 29% mais negócios fechados. O CorretorPRO hoje só atuava DEPOIS da visita (Registro de Visita/Proposta); esta é a primeira função que cobre o ANTES.
**Status:** em PR

## [2026-06-09] Registro de Visita — proteção jurídica da corretagem
**Para o corretor:** gere em segundos o termo que comprova que foi você quem apresentou o imóvel — sua garantia de receber a comissão caso o negócio feche por fora (arts. 722 a 729 do Código Civil).
**O que mudou:** nova aba "Registro de Visita" gera um termo profissional com a marca do corretor: dados do visitante (nome, CPF), imóvel, data/hora, declaração com amparo legal e campos de assinatura para cliente e corretor. Dá pra copiar, baixar em PDF, enviar por WhatsApp e salvar na nuvem junto com as propostas.
**Status:** publicado

## [2026-06-09] CRM leve — status por proposta e painel de negociações
**Para o corretor:** saiba exatamente em qual fase cada negociação está — do primeiro envio até o fechamento — sem precisar lembrar de cabeça ou manter planilha separada.
**O que mudou:** cada proposta salva ganha um badge de status clicável (Nova / Enviada / Em negociação / Fechada / Perdida). O topo de "Minhas Propostas" exibe um painel com a contagem em cada fase e botões de filtro para o corretor focar no que precisa de atenção. O status persiste no Supabase junto com o restante dos dados.
**Status:** em PR

## [2026-06-07] Simulação de financiamento SAC × Price na proposta
**Para o corretor:** agora a proposta de compra já responde "quanto fica a parcela?" — mostrando SAC e Price lado a lado, com 1ª parcela, última parcela e total pago.
**O que mudou:** novo bloco "Simulação de Financiamento · SAC × Price" nas propostas de Compra (cálculo client-side sobre 80% do valor, com o prazo e a taxa informados). Incluído também no Copiar texto, no PDF e na mensagem de WhatsApp.
**Status:** publicado
## [2026-06-06] Busca no histórico e duplicar proposta
**Para o corretor:** encontre qualquer proposta salva em segundos e reutilize ela como ponto de partida para um novo cliente — sem redigitar tudo do zero.
**O que mudou:** adicionada barra de busca em "Minhas Propostas" que filtra por cliente, tipo de imóvel, endereço ou tipo de negociação em tempo real; adicionado botão "Duplicar" em cada proposta salva que pré-preenche o formulário com os dados daquela proposta para edição imediata.
**Status:** em PR

<!-- Novas entradas vão acima desta linha, sempre no topo -->
