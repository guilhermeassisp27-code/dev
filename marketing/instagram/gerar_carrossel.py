#!/usr/bin/env python3
"""Gerador dos carrosseis do CorretorPRO — PNG 1080x1350 (4:5).
Sistema de design consistente: grid alinhado à esquerda, hierarquia tipográfica,
identidade navy + âmbar. Sem emoji na arte. Fonte Inter."""
import cairosvg

W, H = 1080, 1350
LX = 96               # margem esquerda (grid)
RX = W - 96           # margem direita
CW = RX - LX          # largura util do conteudo (888)
URL = "usecorretorpro.vercel.app"

# paleta (mesma da landing)
NAVY, NAVY2, NAVY3 = "#0F172A", "#131E36", "#1B2944"
CARD, LINE = "#16223C", "rgba(255,255,255,0.09)"
AMBER, AMBER_H = "#F59E0B", "#FBBF24"
WHITE, T, T2, T3 = "#FFFFFF", "#F1F5F9", "#94A3B8", "#64748B"
RED, GREEN = "#F87171", "#22C55E"

DEFS = f"""<defs>
  <radialGradient id="bg" cx="28%" cy="0%" r="120%">
    <stop offset="0%" stop-color="{NAVY3}"/>
    <stop offset="55%" stop-color="{NAVY2}"/>
    <stop offset="100%" stop-color="{NAVY}"/>
  </radialGradient>
  <linearGradient id="amb" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="{AMBER_H}"/>
    <stop offset="100%" stop-color="{AMBER}"/>
  </linearGradient>
</defs>"""

def esc(s):
    return s.replace("&", "&amp;")

def txt(x, y, s, size, weight, fill, anchor="start", ls="-1", op="1"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Inter" '
            f'font-weight="{weight}" font-size="{size}" letter-spacing="{ls}" '
            f'fill="{fill}" fill-opacity="{op}">{esc(s)}</text>')

def frame(idx, total):
    """fundo + marca + indicador de slides."""
    s = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    # marca topo
    s += (f'<text x="{LX}" y="128" font-family="Inter" font-weight="800" font-size="34" '
          f'letter-spacing="-1.5" fill="{WHITE}">Corretor<tspan fill="{AMBER}">PRO</tspan></text>')
    # linha sutil sob a marca
    s += f'<rect x="{LX}" y="156" width="{CW}" height="1.5" fill="{LINE}"/>'
    # dots
    gap, r = 30, 5
    start = LX
    for i in range(total):
        on = (i == idx)
        if on:
            s += f'<rect x="{start}" y="1262" width="40" height="10" rx="5" fill="{AMBER}"/>'
            start += 40 + 14
        else:
            s += f'<circle cx="{start+5}" cy="1267" r="{r}" fill="#33415C"/>'
            start += 18 + 14
    return s

def eyebrow(label, y=300):
    s = f'<rect x="{LX}" y="{y-26}" width="46" height="8" rx="4" fill="url(#amb)"/>'
    s += txt(LX+64, y, label.upper(), 28, "700", AMBER, ls="3")
    return s

def heading(lines, y, size=88, lh=None, color=WHITE):
    lh = lh or int(size*1.06)
    s = ""
    for i, ln in enumerate(lines):
        # suporta destaque ambar via tupla (texto, 'amber')
        if isinstance(ln, tuple):
            s += txt(LX, y+i*lh, ln[0], size, "800", AMBER, ls="-2")
        else:
            s += txt(LX, y+i*lh, ln, size, "800", color, ls="-2")
    return s

def body(lines, y, size=42, lh=None, color=T2):
    lh = lh or int(size*1.32)
    s = ""
    for i, ln in enumerate(lines):
        s += txt(LX, y+i*lh, ln, size, "500", color, ls="-0.5")
    return s

def badge(num, x, y, d=104):
    s = f'<rect x="{x}" y="{y}" width="{d}" height="{d}" rx="26" fill="url(#amb)"/>'
    s += txt(x+d/2, y+d/2+24, num, 56, "800", NAVY, anchor="middle", ls="-2")
    return s

def list_item(icon, label, x, y, color):
    """item com icone circular + texto, alinhado."""
    s = ""
    cx, cy = x+30, y
    s += f'<circle cx="{cx}" cy="{cy}" r="30" fill="{color}"/>'
    if icon == "check":
        s += (f'<path d="M{cx-13} {cy} l9 10 l18 -20" stroke="{NAVY}" stroke-width="6" '
              f'fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    else:  # x
        s += (f'<path d="M{cx-11} {cy-11} l22 22 M{cx+11} {cy-11} l-22 22" stroke="{NAVY}" '
              f'stroke-width="6" fill="none" stroke-linecap="round"/>')
    s += txt(x+82, y+15, label, 44, "600", T)
    return s

def pill(label, y, w=440):
    x = LX
    s = f'<rect x="{x}" y="{y}" width="{w}" height="104" rx="52" fill="url(#amb)"/>'
    s += txt(x+w/2, y+66, label, 40, "800", NAVY, anchor="middle", ls="-1")
    return s

def url_tag(y):
    """endereco do site, discreto e alinhado."""
    s = f'<circle cx="{LX+11}" cy="{y-9}" r="6" fill="{GREEN}"/>'
    s += txt(LX+32, y, URL, 34, "700", T, ls="-0.5")
    return s

def swipe(y=1180):
    return txt(RX, y, "arraste para o lado  →", 30, "700", T2, anchor="end")

def save(name, idx, total, body_svg):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
           f'viewBox="0 0 {W} {H}">{DEFS}{frame(idx,total)}{body_svg}</svg>')
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=name,
                     output_width=W, output_height=H)
    print(name)

# ====== SLIDE BUILDERS por tipo ======

def cover(idx, total, eye, head, hint=True, size=92):
    b = eyebrow(eye, 320)
    b += heading(head, 470, size=size)
    b += f'<rect x="{LX+2}" y="{470+len(head)*int(size*1.06)+6}" width="120" height="10" rx="5" fill="url(#amb)"/>'
    if hint:
        b += swipe()
    return idx, total, b

def numbered(idx, total, num, head, bd):
    b = badge(num, LX, 420)
    b += heading(head, 640, size=66, lh=74)
    y0 = 640 + len(head)*74 + 36
    b += body(bd, y0, size=40)
    return idx, total, b

def statement(idx, total, eye, head, bd=None, size=72):
    b = eyebrow(eye, 360)
    b += heading(head, 520, size=size, lh=int(size*1.1))
    if bd:
        y0 = 520 + len(head)*int(size*1.1) + 40
        b += body(bd, y0, size=42)
    return idx, total, b

def checklist(idx, total, eye, head, items):
    b = eyebrow(eye, 320)
    b += heading(head, 470, size=72, lh=80)
    y0 = 470 + len(head)*80 + 80
    for i, it in enumerate(items):
        b += list_item("check", it, LX, y0+i*120, GREEN)
    return idx, total, b

def price(idx, total, eye, head, big, subs):
    b = eyebrow(eye, 320)
    b += heading(head, 470, size=64, lh=72)
    yb = 470 + len(head)*72 + 120
    b += txt(LX, yb, big, 150, "800", AMBER, ls="-5")
    b += txt(LX+8, yb+70, subs[0], 42, "500", T, ls="-0.5")
    if len(subs) > 1:
        b += txt(LX+8, yb+130, subs[1], 42, "500", T2, ls="-0.5")
    return idx, total, b

def cta(idx, total, eye, head, pill_label):
    b = eyebrow(eye, 340)
    b += heading(head, 500, size=82, lh=92)
    yb = 500 + len(head)*92 + 60
    b += pill(pill_label, yb)
    b += txt(LX+8, yb+170, "no link da bio", 36, "600", T2)
    b += url_tag(1120)
    return idx, total, b

# ====== CONTEUDO DOS 6 CARROSSEIS ======

def build():
    jobs = []

    # ===== CARROSSEL 1 — ANTES / DEPOIS (4) =====
    t = 4
    jobs.append(("c1-slide1.png", *cover(0,t,"Comparativo",
        ["Sua proposta","hoje vs. o",("CorretorPRO","amber")])))
    # antes
    b = eyebrow("O jeito antigo", 300)
    b += txt(LX, 430, "ANTES", 96, "800", RED, ls="-3")
    itens = ["Word travando no celular","Formatação quebrada",
             "40 minutos pra montar","Visual de amador"]
    for i,it in enumerate(itens):
        b += list_item("x", it, LX, 600+i*128, RED)
    jobs.append(("c1-slide2.png", 1, t, b))
    # depois
    b = eyebrow("Com o CorretorPRO", 300)
    b += txt(LX, 430, "DEPOIS", 96, "800", AMBER, ls="-3")
    itens = ["Abre direto no celular","Seu logo, CRECI e cor",
             "Pronta em 60 segundos","Visual de quem fecha"]
    for i,it in enumerate(itens):
        b += list_item("check", it, LX, 600+i*128, GREEN)
    jobs.append(("c1-slide3.png", 2, t, b))
    jobs.append(("c1-slide4.png", *cta(3,t,"Comece agora",
        ["Teste","grátis hoje"],"Quero testar")))

    # ===== CARROSSEL 2 — 3 ERROS (5) =====
    t = 5
    jobs.append(("c2-slide1.png", *cover(0,t,"Guia rápido",
        ["3 erros que","fazem você",("perder venda","amber")])))
    jobs.append(("c2-slide2.png", *numbered(1,t,"01",
        ["Demorar pra","mandar"],
        ["O cliente quente esfria.","Quem manda primeiro, vende."])))
    jobs.append(("c2-slide3.png", *numbered(2,t,"02",
        ["Cara de","amador"],
        ["Word desformatado passa","desconfiança. Visual importa."])))
    jobs.append(("c2-slide4.png", *numbered(3,t,"03",
        ["Proposta sem","a sua marca"],
        ["Sem logo e CRECI, você vira","só mais um corretor."])))
    jobs.append(("c2-slide5.png", *cta(4,t,"A solução",
        ["Resolva os","3 de uma vez"],"Quero testar")))

    # ===== CARROSSEL 3 — DEMONSTRAÇÃO / 3 PASSOS (5) =====
    t = 5
    jobs.append(("c3-slide1.png", *cover(0,t,"Em 60 segundos",
        ["Monte uma","proposta em",("3 passos","amber")])))
    jobs.append(("c3-slide2.png", *numbered(1,t,"1",
        ["Preencha o","imóvel"],
        ["Endereço, valor e condições.","Rápido, direto do celular."])))
    jobs.append(("c3-slide3.png", *numbered(2,t,"2",
        ["Aplique a","sua marca"],
        ["Seu logo, seu CRECI e a","cor da sua imobiliária."])))
    jobs.append(("c3-slide4.png", *numbered(3,t,"3",
        ["Envie no","WhatsApp"],
        ["A proposta sai pronta.","Tudo em menos de 1 minuto."])))
    jobs.append(("c3-slide5.png", *cta(4,t,"Simples assim",
        ["Faça a","sua agora"],"Quero testar")))

    # ===== CARROSSEL 4 — PROPOSTA BONITA VENDE (5) =====
    t = 5
    jobs.append(("c4-slide1.png", *cover(0,t,"Reflexão",
        ["Proposta bonita","não vende?",("Será.","amber")])))
    jobs.append(("c4-slide2.png", *statement(1,t,"Pense comigo",
        ["O imóvel é o","mesmo. O preço","também."],
        ["O que muda é a percepção","de quem te atende."])))
    jobs.append(("c4-slide3.png", *statement(2,t,"Percepção",
        ["Uma proposta","profissional diz:"],
        ["“dá pra confiar nesse","corretor.” Sem você falar nada."])))
    jobs.append(("c4-slide4.png", *statement(3,t,"O que decide",
        ["E confiança","fecha venda."],
        ["É ela que faz o cliente","assinar com você."])))
    jobs.append(("c4-slide5.png", *cta(4,t,"Seja o profissional",
        ["Pareça","profissional"],"Quero testar")))

    # ===== CARROSSEL 5 — PREÇO ANCORADO (4) =====
    t = 4
    jobs.append(("c5-slide1.png", *cover(0,t,"Vale a pena?",
        ["Quanto vale","parecer mais",("profissional?","amber")])))
    jobs.append(("c5-slide2.png", *statement(1,t,"Faça a conta",
        ["Uma comissão","paga anos de","CorretorPRO."],
        ["O retorno de uma única venda","cobre a ferramenta."])))
    jobs.append(("c5-slide3.png", *price(2,t,"Investimento",
        ["Menos que um almoço","por semana."],
        "R$67",["por mês — cancele quando quiser.","Plano anual sai ainda mais barato."])))
    jobs.append(("c5-slide4.png", *cta(3,t,"Sem fidelidade",
        ["Comece","hoje"],"Quero testar")))

    # ===== CARROSSEL 6 — COMECE AGORA (3) =====
    t = 3
    jobs.append(("c6-slide1.png", *cover(0,t,"Pronto pra usar",
        ["Sua próxima","proposta sai em",("60 segundos","amber")])))
    jobs.append(("c6-slide2.png", *checklist(1,t,"Tudo incluso",
        ["O que você","ganha"],
        ["Seu logo e CRECI","Direto do celular","Pronta pro WhatsApp","Sem fidelidade"])))
    jobs.append(("c6-slide3.png", *cta(2,t,"Comece agora",
        ["Teste","grátis hoje"],"Quero testar")))

    for name, idx, total, b in jobs:
        save(name, idx, total, b)

if __name__ == "__main__":
    build()
