#!/usr/bin/env python3
"""Gera os slides dos carrosseis do CorretorPRO em PNG 1080x1350 (4:5),
identidade da marca (navy + ambar), margens seguras para o feed do Instagram."""
import cairosvg

W, H = 1080, 1350
NAVY = "#0F172A"
NAVY2 = "#131E36"
NAVY3 = "#1B2944"
AMBER = "#F59E0B"
AMBER_H = "#FBBF24"
WHITE = "#FFFFFF"
T = "#F1F5F9"
T2 = "#94A3B8"
RED = "#F87171"
CARD = "#16223C"

DEFS = f"""
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{NAVY3}"/>
      <stop offset="55%" stop-color="{NAVY2}"/>
      <stop offset="100%" stop-color="{NAVY}"/>
    </linearGradient>
    <linearGradient id="amb" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{AMBER_H}"/>
      <stop offset="100%" stop-color="{AMBER}"/>
    </linearGradient>
  </defs>
"""

def bg():
    return f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'

def brand(x=90, y=130):
    return (f'<text x="{x}" y="{y}" font-family="Inter" font-weight="800" '
            f'font-size="34" letter-spacing="-1" fill="{WHITE}">Corretor'
            f'<tspan fill="{AMBER}">PRO</tspan></text>')

def dots(active, total=4, cx=540, y=1255):
    gap = 34
    start = cx - (total-1)*gap/2
    s = ""
    for i in range(total):
        col = AMBER if i == active else "#33415C"
        r = 7 if i == active else 5
        s += f'<circle cx="{start+i*gap}" cy="{y}" r="{r}" fill="{col}"/>'
    return s

def swipe(y=1180):
    return (f'<text x="540" y="{y}" text-anchor="middle" font-family="Inter" '
            f'font-weight="700" font-size="30" fill="{T2}">arrasta pro lado '
            f'<tspan fill="{AMBER}">&#8594;</tspan></text>')

def lines(txt_lines, x, y, size, lh, weight, fill, anchor="start", spans=None):
    """spans: dict {line_index: [(substring, color), ...]} para colorir."""
    out = []
    for i, ln in enumerate(txt_lines):
        out.append(f'<text x="{x}" y="{y+i*lh}" text-anchor="{anchor}" '
                   f'font-family="Inter" font-weight="{weight}" font-size="{size}" '
                   f'letter-spacing="-1" fill="{fill}">{ln}</text>')
    return "".join(out)

def check(x, y, color=AMBER):
    return (f'<g><circle cx="{x}" cy="{y}" r="26" fill="{color}"/>'
            f'<path d="M{x-12} {y} l8 9 l16 -18" stroke="{NAVY}" stroke-width="5" '
            f'fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>')

def cross(x, y, color=RED):
    return (f'<g><circle cx="{x}" cy="{y}" r="26" fill="{color}"/>'
            f'<path d="M{x-10} {y-10} l20 20 M{x+10} {y-10} l-20 20" stroke="{NAVY}" '
            f'stroke-width="5" fill="none" stroke-linecap="round"/></g>')

def save(name, body):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}{bg()}{body}</svg>'
    cairosvg.svg2png(bytestring=svg.encode(), write_to=name, output_width=W, output_height=H)
    print(name)

# ---------- CARROSSEL 1 — ANTES/DEPOIS ----------

# Slide 1 — capa
s1 = brand()
s1 += lines(["Sua proposta", "hoje vs. com o", "CorretorPRO"], 90, 560, 96, 110, "800", WHITE)
# "CorretorPRO" em ambar na 3a linha: redo line 3
s1 = brand()
s1 += (f'<text x="90" y="560" font-family="Inter" font-weight="800" font-size="96" '
       f'letter-spacing="-2" fill="{WHITE}">Sua proposta</text>')
s1 += (f'<text x="90" y="670" font-family="Inter" font-weight="800" font-size="96" '
       f'letter-spacing="-2" fill="{WHITE}">hoje <tspan fill="{T2}">vs.</tspan></text>')
s1 += (f'<text x="90" y="780" font-family="Inter" font-weight="800" font-size="96" '
       f'letter-spacing="-2" fill="{AMBER}">CorretorPRO</text>')
s1 += f'<rect x="92" y="820" width="150" height="10" rx="5" fill="url(#amb)"/>'
s1 += swipe()
s1 += dots(0)
save("c1-slide1.png", s1)

# Slide 2 — ANTES
s2 = brand()
s2 += (f'<text x="90" y="300" font-family="Inter" font-weight="800" font-size="88" '
       f'letter-spacing="-2" fill="{RED}">ANTES</text>')
items2 = ["Word travando no celular", "Formatação quebrada",
          "40 minutos pra montar", "Visual de amador"]
y = 470
for it in items2:
    s2 += cross(126, y, RED)
    s2 += (f'<text x="180" y="{y+14}" font-family="Inter" font-weight="600" '
           f'font-size="44" fill="{T}">{it}</text>')
    y += 130
s2 += dots(1)
save("c1-slide2.png", s2)

# Slide 3 — DEPOIS
s3 = brand()
s3 += (f'<text x="90" y="300" font-family="Inter" font-weight="800" font-size="88" '
       f'letter-spacing="-2" fill="{AMBER}">DEPOIS</text>')
items3 = ["Abre direto no celular", "Seu logo, CRECI e cor",
          "Pronta em 60 segundos", "Visual de quem fecha negócio"]
y = 470
for it in items3:
    s3 += check(126, y, AMBER)
    s3 += (f'<text x="180" y="{y+14}" font-family="Inter" font-weight="600" '
           f'font-size="42" fill="{T}">{it}</text>')
    y += 130
s3 += dots(2)
save("c1-slide3.png", s3)

# Slide 4 — CTA
s4 = brand()
s4 += (f'<text x="540" y="560" text-anchor="middle" font-family="Inter" font-weight="800" '
       f'font-size="92" letter-spacing="-2" fill="{WHITE}">Teste gr&#225;tis</text>')
s4 += (f'<text x="540" y="668" text-anchor="middle" font-family="Inter" font-weight="800" '
       f'font-size="92" letter-spacing="-2" fill="{AMBER}">agora</text>')
# pill CTA
s4 += f'<rect x="330" y="780" width="420" height="100" rx="50" fill="url(#amb)"/>'
s4 += (f'<text x="540" y="843" text-anchor="middle" font-family="Inter" font-weight="800" '
       f'font-size="40" fill="{NAVY}">Link na bio</text>')
s4 += (f'<text x="540" y="980" text-anchor="middle" font-family="Inter" font-weight="700" '
       f'font-size="38" fill="{T2}">@corretorpro.app</text>')
s4 += dots(3)
save("c1-slide4.png", s4)
