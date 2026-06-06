# Equipe de Agentes — CorretorPRO

Cinco agentes especializados. Cada um lê o `CLAUDE.md` (memória do projeto) e tem
um papel e regras próprias. Funcionam de duas formas: **sob demanda** (você chama
numa sessão do Claude Code) e **automático** (rodam agendados via GitHub Actions).

## Os agentes

| Agente | Papel | Faz sozinho? |
|---|---|---|
| `dev` | Engenheiro: bugs, features, build, webhook, tool.html | Sim — gera PR para revisão (não faz merge) |
| `marketing` | Conteúdo e vídeo: roteiros, copy, calendário editorial | Sim — escreve material pronto (não grava vídeo) |
| `suporte` | Diagnóstico de problemas de usuário e logs | Sim — entrega causa raiz + correção |
| `dados` | Relatórios de assinantes, churn, uso, conversão | Sim — read-only, nunca altera produção |
| `trafego` | Tráfego pago: campanhas, públicos, verba, análise | Plano/recomendação — NÃO gasta nem sobe campanha sozinho |

## Como chamar sob demanda

Dentro de uma sessão do Claude Code, basta pedir e o agente certo é acionado.
Exemplos:

- "Use o agente **dados** e me dê um relatório de assinantes ativos e churn deste mês."
- "Use o agente **marketing** e crie 5 roteiros de Reels sobre fechar vendas mais rápido."
- "Use o agente **dev** para corrigir o bug X em tool.html."
- "Use o agente **suporte**: o cliente fulano@email.com não consegue salvar propostas."
- "Use o agente **trafego** e monte a estrutura de campanha Meta com R$30/dia."

## Modo automático (agendado)

O workflow `.github/workflows/agentes-automaticos.yml` roda os agentes em horários
fixos (ex.: relatório de dados toda segunda, lote de conteúdo toda semana) e abre
PR / commit com o resultado para você revisar.

Requisito: adicionar o secret `ANTHROPIC_API_KEY` no GitHub
(Settings → Secrets and variables → Actions → New repository secret).

## Limites importantes (segurança)

- Nenhum agente commita segredos nem mexe em `main` sem PR.
- `trafego` e qualquer ação que gaste dinheiro: sempre requer aprovação humana.
- `dados` é read-only em produção.
- `dev` abre PR; o merge é seu.
