"""Generates the cute celebration SFX (baby chirps, bubble pops, sparkle) into assets/sounds.

Run:  python3 tools/make_party_sounds.py
"""
import math
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def write(name, samples, peak=0.8):
    x = np.asarray(samples, dtype=np.float64)
    m = np.max(np.abs(x)) or 1.0
    x = x / m * peak
    pcm = (x * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', name, round(len(x) / SR, 2), 's')


def env(n, attack=0.008, release=0.03):
    t = np.arange(n) / SR
    dur = n / SR
    a = np.clip(t / attack, 0, 1)
    r = np.clip((dur - t) / release, 0, 1)
    return a * r


def chirp(f0, f1, dur, vib=0.0, vib_rate=28.0, gain=1.0):
    """A soft, round 'pi!' — sine sweep with a touch of 2nd harmonic and vibrato."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    k = t / dur
    f = f0 + (f1 - f0) * (k ** 0.8)
    f = f * (1 + vib * np.sin(2 * math.pi * vib_rate * t))
    phase = 2 * math.pi * np.cumsum(f) / SR
    wave_ = np.sin(phase) + 0.28 * np.sin(2 * phase) + 0.08 * np.sin(3 * phase)
    # bell-ish decay so it sounds chirpy, not beepy
    decay = np.exp(-3.2 * k)
    return wave_ * env(n, 0.006, dur * 0.35) * (0.35 + 0.65 * decay) * gain


def silence(dur):
    return np.zeros(int(SR * dur))


def seq(*parts):
    return np.concatenate(parts)


# --- baby chick chirps (three variants so repeats don't sound identical) ----------------
write(
    'chirp1.wav',
    seq(chirp(2300, 3300, 0.07), silence(0.035), chirp(2500, 3600, 0.08)),
)
write(
    'chirp2.wav',
    seq(chirp(2000, 3000, 0.06, vib=0.02), silence(0.03), chirp(2800, 3800, 0.06), silence(0.03), chirp(2400, 3400, 0.09, vib=0.03)),
)
write(
    'chirp3.wav',
    seq(chirp(3200, 2500, 0.09, vib=0.025), silence(0.04), chirp(2200, 3500, 0.1)),
)


# --- bubble pop / confetti pop ----------------------------------------------------------
def pop():
    n = int(SR * 0.11)
    t = np.arange(n) / SR
    k = t / 0.11
    f = 900 + 1500 * np.exp(-14 * k)  # quick downward 'bloop'
    phase = 2 * math.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-26 * t)
    click = np.random.default_rng(3).standard_normal(n) * np.exp(-220 * t) * 0.25
    return (body + click) * env(n, 0.001, 0.02)


write('pop.wav', pop())


# --- sparkle (little twinkle run) for the party start ----------------------------------
def twinkle():
    notes = [1568.0, 1976.0, 2349.3, 3135.9, 2637.0, 3951.1]
    parts = []
    for i, f in enumerate(notes):
        n = int(SR * 0.16)
        t = np.arange(n) / SR
        tone = (np.sin(2 * math.pi * f * t) + 0.35 * np.sin(2 * math.pi * 2 * f * t)) * np.exp(-9 * t)
        parts.append(tone * env(n, 0.004, 0.05))
        if i < len(notes) - 1:
            parts.append(silence(0.04))
    out = np.zeros(sum(len(p) for p in parts) + 1000)
    pos = 0
    for p in parts:
        out[pos : pos + len(p)] += p
        pos += len(p) - int(SR * 0.05) if len(p) > 1000 else len(p)
    return out


write('twinkle.wav', twinkle(), peak=0.7)
