# Registro dos criativos de vídeo — Campanha "20 reais inicial"

Versões **finais** que foram ao ar no Meta (conjunto: CorretorPRO - Corretores - Brasil).
Todos 9:16, 720p, destino `https://usecorretorpro.vercel.app/`, CTA "Saiba mais".

## Arquivos

| Anúncio no Meta | Arquivo | Duração | Observação |
|---|---|---|---|
| C1 - corretor carro - video 9x16 | `C1-corretor-carro-9x16-final.mp4` | ~27s | Cena carro/produto, correção de cor + card final (logo + proposta + "Teste agora"). Sem marca d'água "Ai". |
| ~~C4 - corretora - video 9x16~~ (PAUSADO) | `C4-corretora-9x16-final.mp4` | ~37s | ⚠️ **DESCONTINUADO.** Tinha pessoas de IA; um frame chegou a exibir uma modelo de lingerie no anúncio ao vivo. Substituído pelo C4 novo (faceless). |
| **C4 novo (faceless)** | `C4-novo-faceless-9x16-final.mp4` | ~20s | **Substitui o C4 antigo.** 100% sem pessoas/rostos (ambientes premium: sala, chaves+café, celular, varanda no pôr do sol). "Ai" removido, correção de cor, **selo da logo CorretorPRO** no canto sup. direito durante todo o vídeo + card final com a proposta real e "Saiba mais". |
| C6 - comparacao - video 9x16 | `C6-comparacao-9x16-final.mp4` | ~14s | Comparação de telas (Word x CorretorPRO). Naturalmente sem rostos de IA — **o mais limpo**. |

## Pós-produção (ffmpeg)

- Remoção da marca "Ai": `delogo` no canto superior esquerdo (C1/C4 antigo `x=8:y=14:w=72:h=52`; C4 novo `x=10:y=10:w=64:h=54`)
- Correção de cor: `eq=contrast=1.05-1.06:brightness≈0.01:saturation=1.10-1.12,vignette=PI/5-6`
- C4 novo: selo da logo (chip translúcido navy + logo branca) sobreposto em `overlay=W-w-20:20` durante todo o vídeo
- Cobertura do rosto distorcido (C4 antigo): `overlay=0:0:enable='between(t,6.5,12.5)'` com a proposta real
- Cards finais montados em PIL (fundo azul-petróleo + logo branca + print real da proposta + botão CTA)

### Lição aprendida (importante)
Vídeo de IA com **pessoas/rostos** é arriscado (rostos distorcidos e até frames impróprios). Daqui pra frente, **gerar sempre faceless** — só ambientes, objetos e telas. O C6 e o C4 novo provam que dá pra fazer criativo forte sem nenhuma pessoa.

## Logo usada nos cards

- `marketing/logo/logo-corretorpro-branco.png` (para fundos escuros — usada nos cards)
- `marketing/logo/logo-corretorpro-escuro.png` (para fundos claros)

## Geração original

Vídeos gerados via IA (Seedance 2.0 / 2.0 Mini dentro do CapCut), faceless quando possível
para economizar créditos. A naturalidade da voz não foi avaliada por frames — só ouvindo.

> Estes são os masters de referência. Se um criativo precisar ser refeito/ajustado,
> partir daqui em vez de regerar do zero.
