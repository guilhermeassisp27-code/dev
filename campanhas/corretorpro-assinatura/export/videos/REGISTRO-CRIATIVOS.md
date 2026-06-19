# Registro dos criativos de vídeo — Campanha "20 reais inicial"

Versões **finais** que foram ao ar no Meta (conjunto: CorretorPRO - Corretores - Brasil).
Todos 9:16, 720p, destino `https://usecorretorpro.vercel.app/`, CTA "Saiba mais".

## Arquivos

| Anúncio no Meta | Arquivo | Duração | Observação |
|---|---|---|---|
| C1 - corretor carro - video 9x16 | `C1-corretor-carro-9x16-final.mp4` | ~27s | Cena carro/produto, correção de cor + card final (logo + proposta + "Teste agora"). Sem marca d'água "Ai". |
| C4 - corretora - video 9x16 | `C4-corretora-9x16-final.mp4` | ~37s | Rosto de IA distorcido (6,5–12,5s) coberto pela proposta real em tela cheia + correção de cor + card final. **É o criativo mais fraco** — candidato a pausar primeiro. |
| C6 - comparacao - video 9x16 | `C6-comparacao-9x16-final.mp4` | ~14s | Comparação de telas (Word x CorretorPRO). Naturalmente sem rostos de IA — **o mais limpo dos três**. |

## Pós-produção (ffmpeg)

- Remoção da marca "Ai" (canto superior esquerdo): `delogo=x=8:y=14:w=72:h=52`
- Correção de cor padrão: `eq=contrast=1.06:brightness=0.01:saturation=1.12,vignette=PI/5`
- Cobertura do rosto distorcido no C4: `overlay=0:0:enable='between(t,6.5,12.5)'` com a proposta real
- Cards finais montados em PIL (fundo azul-petróleo + logo branca + print real da proposta + botão CTA)

## Logo usada nos cards

- `marketing/logo/logo-corretorpro-branco.png` (para fundos escuros — usada nos cards)
- `marketing/logo/logo-corretorpro-escuro.png` (para fundos claros)

## Geração original

Vídeos gerados via IA (Seedance 2.0 / 2.0 Mini dentro do CapCut), faceless quando possível
para economizar créditos. A naturalidade da voz não foi avaliada por frames — só ouvindo.

> Estes são os masters de referência. Se um criativo precisar ser refeito/ajustado,
> partir daqui em vez de regerar do zero.
