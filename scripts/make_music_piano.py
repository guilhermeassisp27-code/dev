"""
Trilha leve e positiva para anúncio CorretorPRO.
BPM 94, piano + shaker suave + bass quente + pad arejado.
Sem tensão em nenhuma seção — o objetivo é "quero isso".
"""
import numpy as np
import wave as wv

SR = 44100
BPM = 94
TOTAL = 44.5
N = int(TOTAL * SR)
rng = np.random.default_rng(77)

track = np.zeros(N)
beat_s = 60.0 / BPM

def place(sig, at_sec, gain=1.0):
    s = int(at_sec * SR)
    e = min(s + len(sig), N)
    if s < N and e > s:
        track[s:e] += sig[:e-s] * gain

def h(sec, amt=0.010):
    """Humanizar timing — impede som mecânico"""
    return sec + rng.uniform(-amt, amt)

def b(beats):
    return beats * beat_s

# ─── INSTRUMENTOS ────────────────────────────────────────────────────────────

def piano(freq, dur, vel=0.70):
    """Piano realista: ataque rápido, decay natural, harmônicos."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = (np.sin(2*np.pi*freq*t)
       + 0.42*np.sin(2*np.pi*freq*2*t)
       + 0.18*np.sin(2*np.pi*freq*3*t)
       + 0.07*np.sin(2*np.pi*freq*4*t)
       + 0.03*np.sin(2*np.pi*freq*5*t))
    env = 0.35*np.exp(-4.5*t) + 0.65*np.exp(-0.9*t)
    a_n = int(0.003*SR)
    if a_n: env[:a_n] *= np.linspace(0, 1, a_n)
    r_n = int(min(0.06, dur*0.18)*SR)
    if r_n: env[-r_n:] *= np.linspace(1, 0, r_n)
    return w * env * vel

def pad(freqs, dur, attack=0.9, vel=0.28):
    """Pad arejado e quente — preenche sem dominar."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = np.zeros(n)
    for f in freqs:
        for det in [-2, 0, 2]:
            fd = f * 2**(det/1200)
            w += np.sin(2*np.pi*fd*t)   * 0.11
            w += np.sin(2*np.pi*fd*2*t) * 0.035
    a_n = int(attack*SR)
    r_n = int(min(0.9, dur*0.15)*SR)
    if 0 < a_n < n: w[:a_n] *= np.linspace(0, 1, a_n)
    if 0 < r_n < n: w[-r_n:] *= np.linspace(1, 0, r_n)
    return w * vel

def kick(vel=0.38):
    """Kick suave — só marca o pulso, não briga."""
    n = int(0.28*SR)
    t = np.arange(n)/SR
    f = 50 + 28*np.exp(-20*t)
    w = np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-11*t)
    return w * vel

def shaker(vel=0.13):
    """Shaker leve — dá movimento sem pesar."""
    n = int(0.032*SR)
    t = np.arange(n)/SR
    return rng.standard_normal(n) * np.exp(-60*t) * vel

def bass(freq, dur, vel=0.42):
    """Bass quente e redondo."""
    n = int(dur * SR)
    t = np.arange(n)/SR
    w = np.sin(2*np.pi*freq*t) + 0.35*np.sin(2*np.pi*freq*2*t)
    a_n, r_n = int(0.012*SR), int(min(0.07, dur*0.25)*SR)
    env = np.ones(n)
    if a_n: env[:a_n] = np.linspace(0, 1, a_n)
    if r_n: env[-r_n:] = np.linspace(1, 0, r_n)
    return w * env * vel * np.exp(-1.0*t)

# ─── NOTAS ───────────────────────────────────────────────────────────────────
C2,D2,E2,F2,G2,A2,B2 = 65.4,73.4,82.4,87.3,98.0,110.0,123.5
C3,D3,E3,F3,G3,A3,B3 = 130.8,146.8,164.8,174.6,196.0,220.0,246.9
C4,D4,E4,F4,G4,A4,B4 = 261.6,293.7,329.6,349.2,392.0,440.0,493.9
C5,D5,E5,G5       = 523.3,587.3,659.3,784.0

C_p  = [C3,E3,G3,C4]
Am_p = [A2,C3,E3,A3]
F_p  = [F3,A3,C4,F4]
G_p  = [G2,B2,D3,G3]

# ─── FRASES MELÓDICAS (dó maior — positivo, aspiracional) ────────────────────
def FA(start):  # Frase A: ascendente, resolve em C
    notes = [(b(0),E4,.27),(b(.5),G4,.22),(b(1),A4,.36),(b(1.75),G4,.17),
             (b(2),E4,.26),(b(2.5),D4,.20),(b(3),C4,.46)]
    for dt,fr,du in notes:
        place(piano(fr, du), h(start+dt))

def FB(start):  # Frase B: mais leve, resolve em E
    notes = [(b(0),G4,.22),(b(.5),A4,.20),(b(1),C5,.32),(b(1.5),A4,.20),
             (b(2),G4,.26),(b(2.5),F4,.20),(b(3),E4,.42)]
    for dt,fr,du in notes:
        place(piano(fr, du), h(start+dt))

def FC(start):  # Frase C: B-section, mais alta
    notes = [(b(0),A4,.26),(b(.5),C5,.22),(b(1),E5,.40),(b(1.5),D5,.20),
             (b(2),C5,.28),(b(2.5),B4,.20),(b(3),A4,.48)]
    for dt,fr,du in notes:
        place(piano(fr, du), h(start+dt))

def FD(start, vel=1.0):  # Frase D: CTA — sobe até G5
    notes = [(b(0),C5,.28),(b(.5),E5,.26),(b(1),G5,.46),(b(1.5),E5,.22),
             (b(2),C5,.28),(b(2.5),B4,.20),(b(3),A4,.52)]
    for dt,fr,du in notes:
        place(piano(fr, du*vel, vel), h(start+dt))

k_s = kick()

# ─── SEÇÃO 1: 0–4s — só piano, muito leve ────────────────────────────────────
place(pad(C_p, 4.6, attack=2.0, vel=0.20), 0)
FA(0)

# ─── SEÇÃO 2: 4–12s — beat suave entra ───────────────────────────────────────
place(pad(C_p, 4.2, attack=0.7, vel=0.22), 4.0)
place(pad(G_p, 4.2, attack=0.7, vel=0.22), 8.0)

for bar in range(2):
    at = 4.0 + bar*beat_s*4
    root = C2 if bar == 0 else G2
    place(k_s, h(at+b(0)), 0.44)
    place(k_s, h(at+b(2)), 0.40)
    for i in range(8):
        place(shaker(0.13 if i%2==0 else 0.08), h(at+b(i*0.5), 0.008))
    place(bass(root, beat_s*0.65), at+b(0))
    place(bass(root*1.5, beat_s*0.40), at+b(2))

FB(4.0)
FA(8.0)

# ─── SEÇÃO 3: 12–21s — energia sobe suavemente ────────────────────────────────
chords_3 = [Am_p, Am_p, F_p, G_p, C_p]
roots_3  = [A2,   A2,   F2,  G2,  C2 ]
for bar in range(5):
    at = 12.0 + bar*beat_s*4
    place(pad(chords_3[bar], beat_s*4+0.2, attack=0.35, vel=0.24), at)
    place(k_s, h(at+b(0)), 0.44)
    place(k_s, h(at+b(2)), 0.40)
    for i in range(8):
        place(shaker(0.14 if i%2==0 else 0.09), h(at+b(i*0.5), 0.007))
    place(bass(roots_3[bar], beat_s*0.60), at+b(0))
    place(bass(roots_3[bar]*1.5, beat_s*0.38), at+b(2))

FB(12.0)
FC(16.0)

# ─── SEÇÃO 4: 21–35s — produção completa, confiante ──────────────────────────
prog_ch = [C_p, Am_p, F_p, G_p]
prog_br = [C2,  A2,   F2,  G2 ]
for bar in range(8):
    at = 21.0 + bar*beat_s*4
    place(pad(prog_ch[bar%4], beat_s*4+0.15, attack=0.10, vel=0.27), at)
    place(k_s, h(at+b(0)), 0.48)
    place(k_s, h(at+b(2)), 0.44)
    for i in range(16):
        amp = 0.16 if i%4==0 else (0.10 if i%2==0 else 0.06)
        place(shaker(amp), h(at+b(i*0.25), 0.006))
    br = prog_br[bar%4]
    place(bass(br, beat_s*0.55), at+b(0))
    place(bass(br*1.5, beat_s*0.30), at+b(2))
    place(bass(br, beat_s*0.28), at+b(2.75))

FA(21.0)
FB(21.0+b(4))
FC(21.0+b(8))
FA(21.0+b(12))

# ─── SEÇÃO 5: 35–44s — pico positivo / CTA ────────────────────────────────────
for bar in range(5):
    at = 35.0 + bar*beat_s*4
    place(pad(prog_ch[bar%4], beat_s*4+0.15, attack=0.06, vel=0.32), at)
    place(k_s, h(at+b(0)), 0.54)
    place(k_s, h(at+b(2)), 0.50)
    for i in range(16):
        amp = 0.18 if i%4==0 else (0.12 if i%2==0 else 0.07)
        place(shaker(amp), h(at+b(i*0.25), 0.006))
    br = prog_br[bar%4]
    place(bass(br, beat_s*0.55), at+b(0))
    place(bass(br, beat_s*0.28), at+b(1.5))
    place(bass(br*1.5, beat_s*0.30), at+b(2))
    place(bass(br, beat_s*0.25), at+b(3))

FD(35.0, 1.05)
FC(35.0+b(4))

# ─── MASTER ──────────────────────────────────────────────────────────────────
fo_s = int(43.2*SR)
track[fo_s:] *= np.linspace(1, 0, N-fo_s)
peak = np.max(np.abs(track))
track /= peak
track = np.tanh(track * 1.30) / 1.30
track /= np.max(np.abs(track))
track *= 0.88

(track.clip(-1,1)*32767).astype(np.int16).tofile('/tmp/raw16.raw')
with wv.open('/tmp/vid/music2.wav', 'w') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((track.clip(-1,1)*32767).astype(np.int16).tobytes())
print(f'Done — BPM={BPM}, dur={TOTAL}s, peak_raw={peak:.2f}')
