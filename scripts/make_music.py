import numpy as np
import wave as wv

SR = 44100
BPM = 126
TOTAL = 45.0
N = int(TOTAL * SR)
np.random.seed(42)

track = np.zeros(N)
beat_s = 60.0 / BPM

def place(sig, at_sec, gain=1.0):
    start = int(at_sec * SR)
    end = min(start + len(sig), N)
    if start < N:
        track[start:end] += sig[:end-start] * gain

def b(beats):
    return beats * beat_s

# ─── SYNTHESIS ──────────────────────────────────────────────────────────────

def kick():
    n = int(0.45*SR)
    t = np.arange(n)/SR
    freq = 45 + 35*np.exp(-15*t)
    phase = 2*np.pi*np.cumsum(freq)/SR
    body = np.sin(phase)*np.exp(-7*t)
    click = np.sin(2*np.pi*900*t)*np.exp(-80*t)*0.35
    return np.clip((body+click)*0.9, -1, 1)

def snare():
    n = int(0.22*SR)
    t = np.arange(n)/SR
    noise = np.random.randn(n)*np.exp(-18*t)*0.65
    tone = (np.sin(2*np.pi*185*t)+0.4*np.sin(2*np.pi*260*t))*np.exp(-28*t)*0.28
    clk = np.exp(-120*t)*0.38
    return np.clip(noise+tone+clk, -1, 1)*0.6

def hihat(dur=0.05, amp=0.2):
    n = int(dur*SR)
    t = np.arange(n)/SR
    return np.random.randn(n)*np.exp(-30*t)*amp

def bass(freq, dur, amp=0.62):
    n = int(dur*SR)
    t = np.arange(n)/SR
    w = sum(np.sin(2*np.pi*freq*k*t)*(0.68**k) for k in range(1, 6))
    sub = np.sin(2*np.pi*freq*0.5*t)*np.exp(-3*t)
    at_n, rel_n = int(0.01*SR), int(min(0.06, dur*0.3)*SR)
    env = np.ones(n)
    if at_n: env[:at_n] = np.linspace(0, 1, at_n)
    if rel_n: env[-rel_n:] = np.linspace(1, 0, rel_n)
    return (w*0.62+sub*0.38)*env*amp

def pad(freqs, dur, attack=0.8, amp=0.45):
    n = int(dur*SR)
    t = np.arange(n)/SR
    w = np.zeros(n)
    for f in freqs:
        for det in [-4, 0, 4]:
            fd = f*(2**(det/1200))
            w += np.sin(2*np.pi*fd*t)*0.17
            w += np.sin(2*np.pi*fd*2*t)*0.055
    at_n = int(attack*SR)
    rel_n = int(min(0.5, dur*0.12)*SR)
    if 0 < at_n < n: w[:at_n] *= np.linspace(0, 1, at_n)
    if 0 < rel_n < n: w[-rel_n:] *= np.linspace(1, 0, rel_n)
    return w*amp

def lead(freq, dur, amp=0.32):
    n = int(dur*SR)
    t = np.arange(n)/SR
    vib = 1+0.004*np.sin(2*np.pi*5.5*t)
    w = (np.sin(2*np.pi*freq*vib*t) +
         0.27*np.sin(2*np.pi*freq*2*vib*t) +
         0.09*np.sin(2*np.pi*freq*3*t))
    at_n = int(0.015*SR)
    rel_n = int(min(0.08, dur*0.4)*SR)
    env = np.ones(n)
    if at_n: env[:at_n] = np.linspace(0, 1, at_n)
    if rel_n: env[-rel_n:] = np.linspace(1, 0, rel_n)
    return w*env*amp

# Notes
F2,G2,A2,B2,C3,D3,E3,F3,G3 = 87.3,98.0,110,123.5,130.8,146.8,164.8,174.6,196
A3,B3,C4,D4,E4,F4,G4        = 220,246.9,261.6,293.7,329.6,349.2,392
A4,B4,C5,D5,E5               = 440,493.9,523.3,587.3,659.3

Am_p = [A2,C3,E3,A3]; Em_p = [E3,G3,B3,E4]; C_p = [C3,E3,G3,C4]
G_p  = [G2,B2,D3,G3]; F_p  = [F2,A2,C3,F3]

k_s = kick(); sn_s = snare()

# ─── SECTION 1: 0–4s — TENSION (hook card) ───────────────────────────────────
place(pad(Am_p, 4.6, attack=1.5, amp=0.40), 0)
place(k_s, b(0), 0.68); place(k_s, b(2), 0.68)
for i in range(8):
    place(hihat(0.05, 0.16), b(i*0.5))
# Snare roll before drop
for i in range(6):
    place(sn_s, b(3.25)+i*(beat_s/16), 0.18+i*0.07)

# ─── SECTION 2: 4–12s — FULL BEAT, TENSE (WhatsApp scene) ───────────────────
for bar in range(4):
    at = 4.0 + bar*beat_s*4
    place(k_s,  at+b(0));         place(k_s, at+b(1.5), 0.74)
    place(k_s,  at+b(2));         place(k_s, at+b(2.75), 0.62)
    place(sn_s, at+b(1));         place(sn_s, at+b(3))
    for i in range(8):
        place(hihat(0.05 if i<7 else 0.13, 0.21 if i%2==0 else 0.12), at+b(i*0.5))
    for st,(f,d) in enumerate([(A2,.38),(A2,.17),(C3,.24),(G2,.17),(A2,.36),(E3*.67,.21),(G2,.21),(D3*.67,.17)]):
        place(bass(f,d), at+st*beat_s/2)

place(pad(Em_p, 4.2, attack=0.22, amp=0.36), 4.0)
place(pad(Am_p, 4.2, attack=0.22, amp=0.36), 8.0)

# ─── SECTION 3: 12–21s — REVEAL / ENERGY SHIFT (Registro de Visita) ─────────
for bar in range(5):
    at = 12.0 + bar*beat_s*4
    place(k_s,  at+b(0));         place(k_s, at+b(1.5), 0.76)
    place(k_s,  at+b(2))
    place(sn_s, at+b(1), 0.82);   place(sn_s, at+b(3), 0.82)
    for i in range(16):
        amp = 0.21 if i%4==0 else (0.13 if i%2==0 else 0.07)
        place(hihat(0.032 if i<15 else 0.11, amp), at+b(i*0.25))
    for st,(f,d) in enumerate([(C3,.36),(E3,.17),(G3,.21),(E3,.17),(C3,.36),(G2,.21),(A2,.21),(G2,.17)]):
        place(bass(f,d), at+st*beat_s/2, 0.60)

place(pad(C_p, 4.6, attack=0.28, amp=0.42), 12.0)
place(pad(G_p, 4.6, attack=0.28, amp=0.42), 16.0)
place(pad(Am_p, 1.6, attack=0.18, amp=0.36), 20.0)

lead3 = [(12.0,E4,.33),(12+b(.5),G4,.28),(12+b(1),A4,.52),(12+b(1.75),G4,.20),
         (12+b(2),E4,.30),(12+b(2.5),D4,.26),(12+b(3),C4,.62),
         (12+b(4),E4,.30),(12+b(4.5),F4,.26),(12+b(5),G4,.48),
         (12+b(5.75),A4,.20),(12+b(6),G4,.30),(12+b(7),E4,.62)]
for at,fr,du in lead3: place(lead(fr,du), at, 0.88)

# ─── SECTION 4: 21–35s — FULL PRODUCTION, CONFIDENT (Proposta + CRM) ─────────
for bar in range(8):
    at = 21.0 + bar*beat_s*4
    place(k_s,  at+b(0));          place(k_s, at+b(0.75), 0.66)
    place(k_s,  at+b(1.5), 0.80);  place(k_s, at+b(2))
    place(k_s,  at+b(2.75), 0.68)
    place(sn_s, at+b(1), 0.88);    place(sn_s, at+b(3), 0.88)
    place(sn_s, at+b(3.5), 0.33)
    for i in range(16):
        amp = 0.23 if i%4==0 else (0.14 if i%2==0 else 0.08)
        place(hihat(0.032 if i<14 else 0.11, amp), at+b(i*0.25))

prog4_p = [C_p,Am_p,F_p,G_p]; prog4_b = [C3,A2,F2,G2]
for bar in range(8):
    at = 21.0 + bar*beat_s*4
    place(pad(prog4_p[bar%4], beat_s*4+0.12, attack=0.08, amp=0.41), at)
    br = prog4_b[bar%4]
    for st in range(8):
        place(bass(br if st%2==0 else br*1.5, 0.21), at+st*beat_s/2, 0.66)

lead4 = [(21+b(0),E4,.30),(21+b(.5),G4,.26),(21+b(1),A4,.46),(21+b(1.75),G4,.18),
         (21+b(2),E4,.26),(21+b(2.5),D4,.23),(21+b(3),C4,.58),
         (21+b(4),E4,.26),(21+b(4.5),F4,.23),(21+b(5),G4,.43),
         (21+b(5.75),A4,.18),(21+b(6),G4,.26),(21+b(7),E4,.58),
         (21+b(8),A4,.30),(21+b(8.5),C5,.26),(21+b(9),E5,.46),
         (21+b(9.75),D5,.18),(21+b(10),C5,.32),(21+b(11),A4,.62),
         (21+b(12),G4,.26),(21+b(12.5),A4,.23),(21+b(13),C5,.46),(21+b(14),E5,.80)]
for at,fr,du in lead4:
    if at < 35.0: place(lead(fr,du), at, 0.90)

# ─── SECTION 5: 35–44s — PEAK / TRIUMPHANT CTA ───────────────────────────────
for bar in range(5):
    at = 35.0 + bar*beat_s*4
    place(k_s,  at+b(0), 1.05);    place(k_s, at+b(0.5), 0.70)
    place(k_s,  at+b(1.5), 0.82);  place(k_s, at+b(2), 1.0)
    place(k_s,  at+b(2.5), 0.66);  place(k_s, at+b(2.75), 0.70)
    place(sn_s, at+b(1), 1.0);     place(sn_s, at+b(3), 1.0)
    place(sn_s, at+b(0.25), 0.30); place(sn_s, at+b(2.25), 0.30)
    for i in range(16):
        amp = 0.27 if i%4==0 else (0.17 if i%2==0 else 0.10)
        place(hihat(0.032 if i<14 else 0.14, amp), at+b(i*0.25))

big_roots = [C3,G2,A2,G2,C3]
for bar in range(5):
    at = 35.0 + bar*beat_s*4
    place(pad(C_p if bar%2==0 else G_p, beat_s*4+0.12, attack=0.05, amp=0.50), at)
    br = big_roots[bar]
    for st in range(8):
        place(bass(br if st%2==0 else br*1.5, 0.21), at+st*beat_s/2, 0.70)

lead5 = [(35+b(0),A4,.38),(35+b(.5),C5,.26),(35+b(1),E5,.46),(35+b(1.5),D5,.23),
         (35+b(2),C5,.33),(35+b(2.5),B4,.23),(35+b(3),A4,.65),
         (35+b(4),G4,.33),(35+b(5),A4,.33),(35+b(6),C5,.48),(35+b(7),E5,.75),
         (35+b(8),E5,.30),(35+b(8.5),D5,.26),(35+b(9),C5,.33),
         (35+b(9.5),B4,.23),(35+b(10),A4,.58)]
for at,fr,du in lead5:
    if at < 44.5: place(lead(fr,du,0.38), at, 1.0)

# ─── MASTER ──────────────────────────────────────────────────────────────────
# Fade out
fo_s = int(42.5*SR)
track[fo_s:] *= np.linspace(1, 0, N-fo_s)

# Normalize + soft limiter
peak = np.max(np.abs(track))
track /= peak
track *= 0.80
track = np.tanh(track*1.25)/1.25
track /= np.max(np.abs(track))
track *= 0.88

data = track.clip(-1,1)
data16 = (data*32767).astype(np.int16)

with wv.open('/tmp/vid/music.wav', 'w') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes(data16.tobytes())

print(f'Done — {TOTAL}s, raw peak={peak:.3f}')
