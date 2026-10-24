import { DEFAULT_HERO, DEFAULT_VILLAIN, kidIdForIndex } from '../characters/catalog.js';
import {
  pickHeroBanter,
  pickHeroLine,
  pickKidLine,
  pickVillainAngry,
  pickVillainIdle,
  pickVillainTaunt,
} from '../characters/cuteLines.js';
import {
  BOARD_H,
  BOARD_W,
  HERO_X,
  HERO_Y,
  PLAY_H,
  VILLAIN_X,
  VILLAIN_Y,
  buildLevel,
} from './levels.js';

export const TAU = Math.PI * 2;
export const SNAP = 0.28; // how close the gap centre must be to a collar (radians)

const WORDS = ['Saved!', 'Nice!', 'Great!', 'Awesome!', 'Perfect!'];
const INTRO_STAGGER = 0.1;
const INTRO_TIME = 0.55;
const RELEASE_TIME = 0.3;
const FLY_GRAVITY = 1100;
const KID_FALL_TIME = 0.52; // snappy hop to Mama
const RESCUE_CELEBRATE = 0.28; // brief pause before next baby flies in
const PARTY_DELAY = 0.85; // let the final catch land with the hero first
const BEAT_TIME = 2.5; // Mama rushes Grim, hits, he flees
const PARTY_SOUND_TIME = 6; // seconds of chirps/pops before they settle down
const PARTY_BEFORE_DIALOG = 1.55; // short party, then win dialog
const VILLAIN_SHAKE_TIME = 0.9; // angry shake when a cage breaks
const RING_BREAK_TIME = 0.62; // shard scatter duration
const VILLAIN_BREAK_TIME = 0.55; // villain shatter after last cage

export const norm = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const easeOutBack = (p) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
export const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
export const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

/**
 * Pure game state. No React in here, so it can be unit tested in Node.
 * Coordinates are board units (BOARD_W x BOARD_H).
 *
 * Characters are only ids here — looks live in src/characters/catalog.js.
 */
export class Game {
  constructor(def) {
    this.def = def;
    const b = buildLevel(def);
    this.R = b.R;
    this.T = b.T;
    this.stem = b.stem;
    this.gap = b.gap;

    this.heroId = def.hero || DEFAULT_HERO;
    this.villainId = def.villain || DEFAULT_VILLAIN;
    this.maxMoves = def.maxMoves ?? Math.max(4, def.links.length * 2);

    this.rings = b.rings.map((r, i) => ({
      ...r,
      freed: false,
      flyAt: null,
      fly: null,
      shake: 0,
      ox: 0,
      oy: 0,
      spin: 0,
      scale: 0,
      alpha: 0,
      introDelay: i * INTRO_STAGGER,
    }));
    this.collars = b.collars.map((c) => ({ ...c, released: false, rel: 0, flash: 0 }));
    this.particles = [];

    // One kid trapped in each ring-cage. Override with def.kids: ['pip', ...]
    this.kids = this.rings.map((r, i) => {
      const id = (def.kids && def.kids[i]) || kidIdForIndex(i);
      return {
        uid: `${r.id}-${id}`,
        id,
        ring: i,
        state: 'caged', // caged | queued | falling | rescued
        x: r.x,
        y: r.y,
        scale: 1,
        fall: null,
        bayX: null,
        bayY: null,
        say: null, // { text, until } — rare peep from a caged chick
      };
    });

    this.t = 0;
    this.introEnd = (this.rings.length - 1) * INTRO_STAGGER + INTRO_TIME;
    this.expr = 'neutral'; // neutral | sad | happy — shared by hero + babies
    this.exprUntil = 0;
    // Villain is always a little angry — only smug on a wrong-ring tap.
    this.villainExpr = 'angry';
    this.villainExprUntil = 1e9;
    this.heroPulse = 0; // catch celebration scale flash
    this.villainPulse = 0;
    // Opening lines: Mama first, then the villain answers (same bubble style).
    this.heroSay = {
      text: pickHeroLine(def.difficulty, Math.random()),
      until: this.introEnd + 3.4,
    };
    this.villainSay = null;
    this.pendingVillainIntro = {
      text: pickVillainIdle(Math.random()),
      at: this.introEnd + 1.8,
      dur: 2.4,
    };
    this.nextBanterAt = this.introEnd + 4.2 + Math.random() * 1.2;
    this.banterTurn = 1; // villain answers next, then they trade
    this.nextKidSayAt = this.introEnd + 1.6 + Math.random() * 0.8;
    this.rescueQueue = []; // ring indexes waiting to fly to hero (one at a time)
    this.rescueBusyUntil = 0;
    this.moves = 0;
    this.mistakes = 0;
    this.wordIndex = 0;
    this.drag = null;
    this.hintId = null;
    this.hintUntil = 0;
    this.winAt = null;
    this.partyAt = null;
    this.beatAt = null; // Mama vs villain finale
    this._beatHitFired = false;
    this.villainGone = false;
    this.villainBreakAt = null;
    this.villainBreaking = false;
    this.villainBreakT = 0;
    this.villainShakeUntil = 0;
    this.partyBurstAt = 0;
    this.partyRainAt = 0;
    this.partyHeartAt = 0;
    this.partyBeat = 0;
    this.partyStarted = false;
    this.won = false;
    this.lost = false;
    this.loseCheckAt = null;
    this.listener = null;
    this.tutorialActive = !!def.tutorial;
    this.tutorial = def.tutorial ? this.planTutorial() : null;
  }

  emit(type, payload) {
    if (this.listener) this.listener(type, payload);
  }

  get totalCollars() {
    return this.collars.length;
  }

  get releasedCollars() {
    return this.collars.filter((c) => c.released).length;
  }

  get rescuedCount() {
    return this.kids.filter((k) => k.state === 'rescued').length;
  }

  get totalKids() {
    return this.kids.length;
  }

  get movesLeft() {
    return Math.max(0, this.maxMoves - this.moves);
  }

  get stars() {
    if (!this.won) return 0;
    const left = this.movesLeft;
    if (this.mistakes === 0 && left >= Math.ceil(this.maxMoves * 0.35)) return 3;
    if (left >= 1 || this.mistakes <= 1) return 2;
    return 1;
  }

  get interactive() {
    return this.t >= this.introEnd && !this.won && !this.lost && !this.hammerBusy;
  }

  /* ---------- queries ---------- */

  holding(i) {
    return this.collars.filter((c) => c.holder === i && !c.released);
  }

  heldBy(i) {
    return this.collars.filter((c) => c.held === i && !c.released);
  }

  isLocked(i) {
    return this.holding(i).length > 0;
  }

  isReady(i) {
    const r = this.rings[i];
    return !r.freed && !this.isLocked(i) && this.heldBy(i).length > 0;
  }

  ringPos(i) {
    const r = this.rings[i];
    return { x: r.x + r.ox, y: r.y + r.oy };
  }

  ringRadius(i) {
    const r = this.rings[i];
    return (r.R != null ? r.R : this.R) * (r.scale || 1);
  }

  collarPoint(c) {
    const h = this.rings[c.held];
    const rad = this.ringRadius(c.held);
    return {
      x: h.x + Math.cos(c.phi) * rad,
      y: h.y + Math.sin(c.phi) * rad,
    };
  }

  stemStart(c) {
    const p = this.rings[c.holder];
    const rad = this.ringRadius(c.holder);
    return {
      x: p.x + Math.cos(c.phi + Math.PI) * rad,
      y: p.y + Math.sin(c.phi + Math.PI) * rad,
    };
  }

  /* ---------- input ---------- */

  hitTest(x, y) {
    let best = -1;
    let bestD = Infinity;
    this.rings.forEach((r, i) => {
      if (r.freed || r.scale < 0.5) return;
      const RR = r.R != null ? r.R : this.R;
      const TT = r.T != null ? r.T : this.T;
      const pad = TT / 2 + RR * 0.22;
      const d = Math.abs(Math.hypot(x - r.x, y - r.y) - RR);
      if (d <= pad && d < bestD) {
        best = i;
        bestD = d;
      }
    });
    return best;
  }

  startDrag(x, y) {
    if (!this.interactive) return false;
    if (this.movesLeft <= 0) return false;
    const i = this.hitTest(x, y);
    if (i < 0) return false;
    const r = this.rings[i];

    if (this.isLocked(i)) {
      r.shake = 0.45;
      this.mistakes += 1;
      // Wrong / locked ring still spends a move.
      this.moves += 1;
      this.holding(i).forEach((c) => {
        c.flash = 1;
      });
      // Wrong ring: Mama + chicks worry, villain smugs it up.
      this.setExpr('sad', 1.6);
      this.setVillainExpr('happy', 1.8);
      this.villainPulse = 1;
      this.villainSay = { text: pickVillainTaunt(Math.random()), until: this.t + 1.7 };
      this.emit('hud', null);
      this.emit('locked', { ring: i });
      if (this.moves >= this.maxMoves && this.winAt == null) {
        this.loseCheckAt = this.t + 1.35;
      }
      return false;
    }

    this.tutorialActive = false;
    this.drag = { ring: i, last: Math.atan2(y - r.y, x - r.x), moved: false, sliding: false };
    return true;
  }

  moveDrag(x, y) {
    if (!this.drag) return;
    const r = this.rings[this.drag.ring];
    if (r.freed) {
      this.emit('rotateEnd', null);
      this.drag = null;
      return;
    }
    const a = Math.atan2(y - r.y, x - r.x);
    const d = norm(a - this.drag.last);
    this.drag.last = a;
    if (Math.abs(d) > 0.006) {
      this.drag.moved = true;
      // One continuous ASMR slide for the whole drag (no pulsed restarts).
      if (!this.drag.sliding) {
        this.drag.sliding = true;
        this.emit('rotateStart', null);
      }
    }
    r.angle = norm(r.angle + d);
    this.checkRelease(this.drag.ring);
  }

  endDrag() {
    if (this.drag?.sliding) this.emit('rotateEnd', null);
    if (this.drag && this.drag.moved) {
      this.moves += 1;
      this.emit('hud', null);
      if (this.moves >= this.maxMoves && this.winAt == null) {
        // Give the last move time to release collars / fly cages / land kids.
        this.loseCheckAt = this.t + 1.35;
      }
    }
    this.drag = null;
  }

  /** Test / tooling helper: put a ring's gap at an exact angle. */
  rotateTo(i, angle) {
    this.rings[i].angle = norm(angle);
    this.checkRelease(i);
  }

  /* ---------- rules ---------- */

  checkRelease(i) {
    const r = this.rings[i];
    let released = false;
    this.heldBy(i).forEach((c) => {
      if (Math.abs(norm(r.angle - c.phi)) < SNAP) {
        c.released = true;
        c.rel = 0;
        released = true;
        const p = this.collarPoint(c);
        this.burst(p.x, p.y, this.rings[c.holder].color, 12);
      }
    });
    if (!released) return;

    const word = WORDS[this.wordIndex % WORDS.length];
    this.wordIndex += 1;
    this.setExpr('happy', 1.35);
    this.setVillainExpr('angry', 1.4);
    this.villainPulse = 0.7;
    this.emit('praise', word);
    this.emit('hud', null);
    this.settle();
  }

  setExpr(kind, dur = 1.2) {
    this.expr = kind;
    this.exprUntil = this.t + dur;
    this.emit('expr', kind);
  }

  setVillainExpr(kind, dur = 1.2) {
    this.villainExpr = kind;
    // Temporary moods (smug / defeated) expire back to angry — never “neutral chill”.
    this.villainExprUntil = kind === 'angry' ? 1e9 : this.t + dur;
  }

  /** Any ring with no collars left (neither holding nor held) is free: schedule it to fly off. */
  settle() {
    let k = 0;
    this.rings.forEach((r, i) => {
      if (r.freed || r.flyAt != null) return;
      if (this.holding(i).length === 0 && this.heldBy(i).length === 0) {
        r.flyAt = this.t + RELEASE_TIME + 0.05 + k * 0.14;
        k += 1;
      }
    });
  }

  /** Cage opens: ring shatters into shards (smooth break), baby queues for rescue. */
  startFly(r) {
    r.freed = true;
    r.fly = null;
    const R = r.R != null ? r.R : this.R;
    const span = (TAU - this.gap) / 4;
    const start = this.gap / 2;
    r.shards = [];
    for (let i = 0; i < 4; i += 1) {
      const a0 = start + i * span;
      const a1 = a0 + span * 0.92;
      const mid = (a0 + a1) / 2;
      const ang = r.angle + mid;
      const sp = 160 + Math.random() * 240;
      r.shards.push({
        a0,
        a1,
        R,
        T: r.T != null ? r.T : this.T,
        ox: 0,
        oy: 0,
        spin: 0,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 140 - Math.random() * 80,
        rotV: (Math.random() < 0.5 ? -1 : 1) * (2.8 + Math.random() * 4.5),
        life: 1,
      });
    }
    r.breakT = 0;
    r.alpha = 1;
    r.scale = 1;
    this.burst(r.x + r.ox, r.y + r.oy, r.color, 16);
    this.emit('ringBreak', { ring: r.index, color: r.color });
    this.queueKidRescue(r.index);
    if (this.rings.every((x) => x.freed)) {
      this.loseCheckAt = null;
      this.scheduleVillainBreak(0.08);
    }
  }

  scheduleVillainBreak(delay = 0.25) {
    if (this.villainGone || this.villainBreaking || this.villainBreakAt != null) return;
    this.villainBreakAt = this.t + delay;
  }

  beginVillainBreak() {
    if (this.villainGone || this.villainBreaking) return;
    this.villainBreaking = true;
    this.villainBreakT = 0;
    this.villainBreakAt = null;
    this.setVillainExpr('sad', 99);
    this.villainPulse = 1;
    this.villainShakeUntil = this.t + VILLAIN_BREAK_TIME;
    this.villainSay = { text: 'Nooo — my cages!', until: this.t + 1.4 };
    this.burst(VILLAIN_X, VILLAIN_Y - 22, 'gold', 22);
    this.burst(VILLAIN_X - 8, VILLAIN_Y - 12, 'pink', 14);
    this.emit('villainBreak', null);
  }

  get villainBreakP() {
    if (!this.villainBreaking) return 0;
    return clamp01(this.villainBreakT / VILLAIN_BREAK_TIME);
  }

  tryStartParty() {
    if (this.winAt != null || this.won || this.lost) return;
    if (!this.rings.every((r) => r.freed)) return;
    if (this.rescuedCount !== this.totalKids) return;
    if (this.rescueQueue.length > 0) return;
    if (this.kids.some((k) => k.state === 'falling' || k.state === 'queued')) return;
    if (!this.villainGone) {
      this.scheduleVillainBreak(0);
      return;
    }
    this.beatAt = null;
    this.partyAt = this.t + 0.12;
    this.winAt = this.partyAt + PARTY_BEFORE_DIALOG;
    this.heroSay = { text: 'We did it, fluffballs!', until: this.t + 1.6 };
  }

  /**
   * Cage opens: baby stays put at that spot (does NOT ride the flying ring),
   * then flies to the hero one-by-one from where they were freed.
   */
  queueKidRescue(ringIndex) {
    const kid = this.kids.find((k) => k.ring === ringIndex && k.state === 'caged');
    if (!kid) return;
    if (this.rescueQueue.includes(ringIndex)) return;
    const r = this.rings[ringIndex];
    // Detach now so they never vanish with the cage / reappear at the hero.
    kid.x = r.x + r.ox;
    kid.y = r.y + r.oy;
    kid.scale = 1;
    kid.state = 'queued';
    this.rescueQueue.push(ringIndex);
    // Chirp the instant the cage opens — villain gets angry + shaky.
    this.setVillainExpr('angry', 1.6);
    this.villainPulse = 1;
    this.villainShakeUntil = this.t + VILLAIN_SHAKE_TIME;
    this.villainSay = { text: pickVillainAngry(Math.random()), until: this.t + 1.8 };
    this.emit('kidFree', { kidId: kid.id, ring: ringIndex });
    this.emit('hud', null);
  }

  pumpRescueQueue() {
    // Up to 2 babies in the air; next launches mid-flight so they pile in fast.
    const falling = this.kids.filter((k) => k.state === 'falling');
    if (falling.length >= 2) return;
    if (falling.length === 1) {
      const f = falling[0].fall;
      if (!f || f.t / f.dur < 0.38) return;
    } else if (this.t < this.rescueBusyUntil) {
      return;
    }
    const ringIndex = this.rescueQueue.shift();
    if (ringIndex == null) return;
    this.startKidFall(ringIndex);
  }

  /** Expire bubbles; Mama ↔ villain banter more often; kids peep sometimes. */
  pumpCuteSays() {
    if (this.heroSay && this.t >= this.heroSay.until) this.heroSay = null;
    if (this.villainSay && this.t >= this.villainSay.until) this.villainSay = null;
    this.kids.forEach((k) => {
      if (k.say && this.t >= k.say.until) k.say = null;
    });

    if (
      this.pendingVillainIntro &&
      this.t >= this.pendingVillainIntro.at &&
      !this.villainSay
    ) {
      const intro = this.pendingVillainIntro;
      this.pendingVillainIntro = null;
      this.villainSay = { text: intro.text, until: this.t + intro.dur };
    }

    if (this.won || this.lost || this.partying || this.beating || this.beatAt != null) return;

    // Mid-game chat: Mama and villain take turns.
    if (this.t >= this.nextBanterAt) {
      this.nextBanterAt = this.t + 2.6 + Math.random() * 2.2;
      const turn = this.banterTurn % 2;
      this.banterTurn += 1;
      if (turn === 0 && !this.heroSay) {
        this.heroSay = { text: pickHeroBanter(Math.random()), until: this.t + 2.0 };
      } else if (turn === 1 && !this.villainSay) {
        this.villainSay = { text: pickVillainIdle(Math.random()), until: this.t + 2.0 };
      }
    }

    // Caged chicks peep often on their own clock (not waiting for Mama/villain turns).
    if (this.t >= this.nextKidSayAt) {
      this.nextKidSayAt = this.t + 1.1 + Math.random() * 1.4;
      const caged = this.kids.filter((k) => k.state === 'caged' && !this.rings[k.ring].freed && !k.say);
      if (caged.length) {
        const kid = caged[Math.floor(Math.random() * caged.length)];
        kid.say = { text: pickKidLine(Math.random()), until: this.t + 1.5 };
        // Sometimes a second chick peeps too.
        const others = caged.filter((k) => k !== kid);
        if (others.length && Math.random() < 0.35) {
          const kid2 = others[Math.floor(Math.random() * others.length)];
          kid2.say = { text: pickKidLine(Math.random()), until: this.t + 1.35 };
        }
      }
    }
  }

  /** Continuous hop from free-spot → hero, then stand beside them. */
  startKidFall(ringIndex) {
    const kid = this.kids.find((k) => k.ring === ringIndex && k.state === 'queued');
    if (!kid) return;
    const slot = this.kids.filter((k) => k.state === 'rescued').length;
    // Keep rescued chicks between Mama and the villain — never under Grim.
    const bayMax = VILLAIN_X - 54;
    const gap = Math.min(28, (bayMax - HERO_X - 36) / Math.max(1, this.kids.length - 0.5));
    const slotX = Math.min(bayMax, HERO_X + 40 + slot * gap);
    kid.state = 'falling';
    kid.slot = slot;
    kid.fall = {
      x0: kid.x,
      y0: kid.y,
      x1: slotX,
      y1: HERO_Y,
      hx: HERO_X + 10,
      hy: HERO_Y - 10,
      t: 0,
      dur: KID_FALL_TIME,
    };
    this.emit('hud', null);
  }

  finishKidRescue(kid) {
    kid.state = 'rescued';
    kid.say = null;
    kid.fall = null;
    kid.scale = 1;
    kid.bayX = kid.x;
    kid.bayY = HERO_Y;
    kid.y = HERO_Y;
    this.heroPulse = 1;
    this.setExpr('happy', RESCUE_CELEBRATE + 0.35);
    this.burst(HERO_X, HERO_Y - 22, 'gold', 18);
    this.rescueBusyUntil = this.t + RESCUE_CELEBRATE;
    // Tiny cheer from the parent after a catch (not every time — keep it light).
    if (Math.random() < 0.55 && !this.partying) {
      const cheers = [
        'Gotcha, fluff!',
        'Safe with me!',
        'One more hug!',
        'Yay, peep!',
        'Soft landing!',
        'Come here!',
      ];
      this.heroSay = {
        text: cheers[Math.floor(Math.random() * cheers.length)],
        until: this.t + 1.6,
      };
    }
    this.emit('heroCatch', { kidId: kid.id, rescued: this.rescuedCount });
    this.emit('rescue', { kidId: kid.id, rescued: this.rescuedCount });
    this.emit('hud', null);

    // Last baby in — wait for villain shatter, then flock party → win dialog.
    this.tryStartParty();
  }

  /** 0..1 how far into the party we are (0 = not started). */
  get partyP() {
    if (this.partyAt == null || this.t < this.partyAt) return 0;
    return clamp01((this.t - this.partyAt) / 0.8);
  }

  get partying() {
    return this.partyAt != null && this.t >= this.partyAt;
  }

  get beating() {
    return this.beatAt != null && this.t >= this.beatAt && this.t < this.beatAt + BEAT_TIME;
  }

  get beatP() {
    if (this.beatAt == null || this.t < this.beatAt) return 0;
    return clamp01((this.t - this.beatAt) / BEAT_TIME);
  }

  get villainShaking() {
    return this.t < this.villainShakeUntil || this.villainBreaking;
  }

  /**
   * Mama rushes the villain, bonks him, then hops home while he flees.
   * p: 0–0.32 rush · 0.32–0.52 hit · 0.52–1.0 return / villain flees
   */
  beatHeroPos() {
    const p = this.beatP;
    const targetX = VILLAIN_X - 40;
    if (p < 0.32) {
      const q = easeOutCubic(p / 0.32);
      return {
        x: HERO_X + (targetX - HERO_X) * q,
        y: HERO_Y - Math.sin(q * Math.PI) * 28,
        cheer: 1,
        spin: 0,
        grow: 1 + 0.15 * q,
      };
    }
    if (p < 0.52) {
      const q = (p - 0.32) / 0.2;
      return {
        x: targetX + Math.sin(q * Math.PI * 3) * 6,
        y: HERO_Y - 10 - Math.sin(q * Math.PI) * 22,
        cheer: 1,
        spin: Math.sin(q * Math.PI * 2) * 12,
        grow: 1.2,
      };
    }
    const q = easeOutCubic((p - 0.52) / 0.48);
    return {
      x: targetX + (HERO_X - targetX) * q,
      y: HERO_Y - Math.sin(q * Math.PI) * 16 * (1 - q),
      cheer: 0.9,
      spin: 0,
      grow: 1.1 - 0.1 * q,
    };
  }

  beatVillainPos() {
    const p = this.beatP;
    if (p < 0.32) {
      return {
        x: VILLAIN_X,
        y: VILLAIN_Y,
        spin: Math.sin(this.t * 20) * 4,
        grow: 1,
        alpha: 1,
        expr: 'angry',
      };
    }
    if (p < 0.52) {
      const q = (p - 0.32) / 0.2;
      return {
        x: VILLAIN_X + Math.sin(q * 40) * 10,
        y: VILLAIN_Y - q * 8,
        spin: Math.sin(q * 30) * 18,
        grow: 1 - 0.08 * q,
        alpha: 1,
        expr: 'sad',
      };
    }
    // Fly up / off-screen and fade out
    const q = easeOutCubic((p - 0.52) / 0.48);
    return {
      x: VILLAIN_X + q * 40,
      y: VILLAIN_Y - q * (PLAY_H * 0.55),
      spin: q * 420,
      grow: 1 - 0.35 * q,
      alpha: 1 - q,
      expr: 'sad',
    };
  }

  /**
   * Keep party sprites fully on the board — feet origin, fluffy body sticks UP,
   * so y must stay below the top edge or they get cut off.
   */
  clampParty(x, y, grow, bodyUp = 40) {
    const margin = 10 + bodyUp * grow;
    return {
      x: Math.max(28, Math.min(BOARD_W - 28, x)),
      y: Math.max(margin, Math.min(BOARD_H - 12, y)),
    };
  }

  /** Where a rescued kid is while partying (bay → roam + hop, never clipped at top). */
  partyPos(kid, i) {
    const p = easeOutCubic(this.partyP);
    const t = this.t;
    const total = Math.max(1, this.kids.length);
    const lane = (i + 0.5) / total;
    const grow = 1 + 0.55 * p;
    // Keep the roam lower so hops don’t push heads off-screen.
    const wx = BOARD_W * (0.14 + 0.72 * lane) + Math.sin(t * 1.3 + i * 2.3) * BOARD_W * 0.12;
    const wy = PLAY_H * 0.58 + Math.sin(t * 0.9 + i * 1.9) * PLAY_H * 0.22;
    const hop = Math.abs(Math.sin(t * 4.8 + i * 1.3)) * 34;
    const bx = kid.bayX != null ? kid.bayX : HERO_X + 42;
    const by = kid.bayY != null ? kid.bayY : HERO_Y;
    const flipPhase = (t * 0.7 + i * 0.37) % 1;
    const flip = flipPhase < 0.3 ? (flipPhase / 0.3) * 360 : 0;
    const raw = {
      x: bx + (wx - bx) * p,
      y: by + (wy - by) * p - hop * p,
    };
    const c = this.clampParty(raw.x, raw.y, grow, 38);
    return {
      x: c.x,
      y: c.y,
      grow,
      spin: flip ? flip * p : Math.sin(t * 7 + i) * 12 * p,
    };
  }

  /** Mama floats with the flock — bigger orbit, still fully on screen. */
  partyHeroPos() {
    const p = easeOutCubic(this.partyP);
    const t = this.t;
    const grow = 1 + 0.35 * p;
    const wx = BOARD_W * 0.5 + Math.sin(t * 1.05) * BOARD_W * 0.22;
    const wy = PLAY_H * 0.5 + Math.cos(t * 0.85) * PLAY_H * 0.2;
    const hop = Math.abs(Math.sin(t * 4.2)) * 30;
    const flipPhase = (t * 0.55) % 1;
    const flip = flipPhase < 0.22 ? (flipPhase / 0.22) * 360 : 0;
    const raw = {
      x: HERO_X + (wx - HERO_X) * p,
      y: HERO_Y + (wy - HERO_Y) * p - hop * p,
    };
    const c = this.clampParty(raw.x, raw.y, grow, 48);
    return {
      x: c.x,
      y: c.y,
      grow,
      spin: flip ? flip * p : Math.sin(t * 5.5) * 10 * p,
    };
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * TAU;
      const sp = 70 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 70,
        life: 1,
        color,
        s: 3 + Math.random() * 3.5,
      });
    }
  }

  /* ---------- hint + hammer + tutorial ---------- */

  hint() {
    if (this.won || this.lost) return false;
    const i = this.rings.findIndex((_, idx) => this.isReady(idx));
    if (i < 0) return false;
    this.hintId = i;
    this.hintUntil = this.t + 3.4;
    return true;
  }

  /** Pick a cage for the hammer (ready tip → free tip → any). -1 if none. */
  pickHammerTarget() {
    if (this.won || this.lost) return -1;
    let i = this.rings.findIndex((_, idx) => this.isReady(idx));
    if (i < 0) {
      i = this.rings.findIndex((r, idx) => !r.freed && this.holding(idx).length === 0);
    }
    if (i < 0) {
      i = this.rings.findIndex((r) => !r.freed);
    }
    return i;
  }

  /**
   * Hammer power-up: smash one cage open with the break animation.
   * Prefer calling pickHammerTarget + smashRing after the fly-in anim.
   */
  hammer() {
    if (!this.interactive) return false;
    const i = this.pickHammerTarget();
    if (i < 0) return false;
    return this.smashRing(i);
  }

  /** Force-release every collar on/from this ring, then shatter it. */
  smashRing(i) {
    const r = this.rings[i];
    if (!r || r.freed) return false;
    // Slip every collar that holds this cage or that this cage holds.
    [...this.heldBy(i), ...this.holding(i)].forEach((c) => {
      if (c.released) return;
      c.released = true;
      c.rel = 0;
      const p = this.collarPoint(c);
      this.burst(p.x, p.y, this.rings[c.holder]?.color || r.color, 10);
    });
    this.setExpr('happy', 1.2);
    this.setVillainExpr('angry', 1.5);
    this.villainPulse = 1;
    this.emit('praise', 'SMASH!');
    this.emit('hud', null);
    // Shatter immediately (skip the delayed fly-off).
    r.flyAt = null;
    this.startFly(r);
    this.settle();
    return true;
  }

  get activeHintId() {
    return this.hintId != null && this.t < this.hintUntil ? this.hintId : null;
  }

  planTutorial() {
    const i = this.rings.findIndex((_, idx) => this.isReady(idx));
    if (i < 0) return null;
    const c = this.heldBy(i)[0];
    const r = this.rings[i];
    let delta = norm(c.phi - r.angle);
    if (Math.abs(Math.abs(delta) - Math.PI) < 0.01) delta = Math.PI;
    return { ring: i, from: r.angle, delta };
  }

  pendingCageMotion() {
    return this.rings.some(
      (r) =>
        (!r.freed && r.flyAt != null) ||
        (r.freed && r.shards) ||
        (r.freed && r.fly && r.alpha > 0.05) ||
        this.villainBreaking
    );
  }

  pendingKidMotion() {
    return (
      this.kids.some((k) => k.state === 'falling' || k.state === 'queued') ||
      this.rescueQueue.length > 0 ||
      this.t < this.rescueBusyUntil
    );
  }

  /* ---------- simulation ---------- */

  update(dt) {
    this.t += dt;
    if (this.expr !== 'neutral' && this.t >= this.exprUntil) this.expr = 'neutral';
    if (this.t >= this.villainExprUntil) {
      if (this.partying || this.won) this.villainExpr = 'sad';
      else if (this.lost) this.villainExpr = 'happy';
      else this.villainExpr = 'angry'; // default resting face
      this.villainExprUntil = 1e9;
    }
    if (this.villainPulse > 0) this.villainPulse = Math.max(0, this.villainPulse - dt * 1.2);

    this.rings.forEach((r) => {
      if (r.shake > 0) r.shake = Math.max(0, r.shake - dt);

      if (!r.freed) {
        const p = clamp01((this.t - r.introDelay) / INTRO_TIME);
        r.scale = p <= 0 ? 0 : easeOutBack(p);
        r.alpha = clamp01(p * 2.2);
        if (r.flyAt != null && this.t >= r.flyAt) this.startFly(r);
      } else if (r.shards) {
        r.breakT += dt;
        r.shards.forEach((s) => {
          s.vy += FLY_GRAVITY * 0.9 * dt;
          s.ox += s.vx * dt;
          s.oy += s.vy * dt;
          s.spin += s.rotV * dt;
          s.life = Math.max(0, 1 - r.breakT / RING_BREAK_TIME);
        });
        r.alpha = 0;
        if (r.breakT >= RING_BREAK_TIME) r.shards = null;
      } else if (r.fly) {
        const f = r.fly;
        f.t += dt;
        f.vy += FLY_GRAVITY * dt;
        r.ox += f.vx * dt;
        r.oy += f.vy * dt;
        r.spin += f.spin * dt;
        r.scale = 1 + 0.25 * clamp01(f.t / 0.7);
        r.alpha = 1 - clamp01((f.t - 0.12) / 0.7);
      }
    });

    if (this.villainBreakAt != null && this.t >= this.villainBreakAt) {
      this.beginVillainBreak();
    }
    if (this.villainBreaking) {
      this.villainBreakT += dt;
      if (this.villainBreakT >= VILLAIN_BREAK_TIME) {
        this.villainBreaking = false;
        this.villainGone = true;
        this.villainSay = null;
        this.tryStartParty();
      }
    }

    // Caged: glued to ring. Queued: frozen at free spot. Falling: fly to hero.
    this.kids.forEach((kid) => {
      if (kid.state === 'caged') {
        const r = this.rings[kid.ring];
        kid.x = r.x + r.ox;
        kid.y = r.y + r.oy;
        kid.scale = Math.min(1, r.scale);
      } else if (kid.state === 'queued') {
        kid.scale = 1 + 0.08 * Math.sin(this.t * 6 + kid.ring);
      } else if (kid.state === 'falling' && kid.fall) {
        kid.fall.t += dt;
        const p = clamp01(kid.fall.t / kid.fall.dur);
        const e = easeOutCubic(p);
        // Two-beat path: fly toward hero, then settle into the slot.
        const mid = 0.55;
        let tx;
        let ty;
        if (p < mid) {
          const q = easeOutCubic(p / mid);
          tx = kid.fall.x0 + (kid.fall.hx - kid.fall.x0) * q;
          ty = kid.fall.y0 + (kid.fall.hy - kid.fall.y0) * q - Math.sin(q * Math.PI) * 48;
        } else {
          const q = easeOutCubic((p - mid) / (1 - mid));
          tx = kid.fall.hx + (kid.fall.x1 - kid.fall.hx) * q;
          ty = kid.fall.hy + (kid.fall.y1 - kid.fall.hy) * q - Math.sin(q * Math.PI) * 12;
        }
        kid.x = tx;
        kid.y = ty;
        kid.scale = 1 + 0.22 * Math.sin(p * Math.PI);
        if (p >= 1) this.finishKidRescue(kid);
      }
    });

    if (this.heroPulse > 0) this.heroPulse = Math.max(0, this.heroPulse - dt * 1.15);

    this.pumpCuteSays();
    this.pumpRescueQueue();

    this.collars.forEach((c) => {
      if (c.released && c.rel < 1) c.rel = Math.min(1, c.rel + dt / RELEASE_TIME);
      if (c.flash > 0) c.flash = Math.max(0, c.flash - dt * 2.2);
    });

    if (this.particles.length) {
      this.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.g != null ? p.g : 520) * dt;
        p.life -= dt * (p.decay != null ? p.decay : 1 / 0.9);
      });
      this.particles = this.particles.filter((p) => p.life > 0);
    }

    // Confetti pops all over the screen for as long as the party runs (also behind the dialog).
    // Beat finale: one hit burst + villain line, then he’s gone for the party.
    if (this.beating) {
      const p = this.beatP;
      if (p >= 0.32 && p < 0.36 && !this._beatHitFired) {
        this._beatHitFired = true;
        this.setVillainExpr('sad', 99);
        this.villainSay = { text: 'Ow! Nooo!', until: this.t + 1.2 };
        this.heroSay = { text: 'That’s for the chicks!', until: this.t + 1.4 };
        this.burst(VILLAIN_X - 20, VILLAIN_Y - 28, 'gold', 22);
        this.burst(VILLAIN_X - 10, VILLAIN_Y - 18, 'pink', 14);
        this.emit('beatHit', null);
      }
      if (p >= 0.95) this.villainGone = true;
    }

    if (this.partying && !this.partyStarted) {
      this.partyStarted = true;
      this.villainGone = true;
      this.setVillainExpr('sad', 99);
      this.villainSay = null;
      this.heroSay = { text: 'We did it, fluffballs!', until: this.t + 2.2 };
      this.emit('party', null);
    }
    if (this.partying) {
      const colors = ['gold', 'pink', 'teal', 'purple', 'orange', 'blue', 'green'];
      const pick = () => colors[Math.floor(Math.random() * colors.length)];

      // fireworks-ish bursts all over the screen + a beat for the chirp / pop sounds
      if (this.t >= this.partyBurstAt) {
        this.partyBurstAt = this.t + 0.24;
        this.partyBeat += 1;
        this.burst(BOARD_W * (0.08 + Math.random() * 0.84), PLAY_H * (0.1 + Math.random() * 0.7), pick(), 16);
        if (this.t < this.partyAt + PARTY_SOUND_TIME) this.emit('partyBeat', this.partyBeat);
      }

      // confetti rain from the top
      if (this.t >= this.partyRainAt) {
        this.partyRainAt = this.t + 0.05;
        this.particles.push({
          x: Math.random() * BOARD_W,
          y: -8,
          vx: (Math.random() - 0.5) * 50,
          vy: 70 + Math.random() * 70,
          g: 90,
          decay: 0.42,
          life: 1,
          color: pick(),
          s: 3 + Math.random() * 3.5,
        });
      }

      // little hearts float up from the happy kids
      if (this.t >= this.partyHeartAt) {
        this.partyHeartAt = this.t + 0.3;
        const idx = Math.floor(Math.random() * this.kids.length);
        const kid = this.kids[idx];
        if (kid && kid.state === 'rescued') {
          const pp = this.partyPos(kid, idx);
          this.particles.push({
            x: pp.x + (Math.random() - 0.5) * 8,
            y: pp.y - 30,
            vx: (Math.random() - 0.5) * 30,
            vy: -50 - Math.random() * 40,
            g: -6,
            decay: 0.62,
            life: 1,
            color: Math.random() < 0.5 ? 'pink' : 'orange',
            s: 5 + Math.random() * 3,
            shape: 'heart',
          });
        }
      }
    }

    if (this.winAt != null && !this.won && this.t >= this.winAt) {
      // Wait until every kid has landed with the hero.
      if (!this.pendingKidMotion() && this.rescuedCount === this.totalKids) {
        this.won = true;
        this.emit('won', {
          stars: this.stars,
          moves: this.moves,
          rescued: this.rescuedCount,
        });
      }
    }

    if (
      this.loseCheckAt != null &&
      !this.won &&
      !this.lost &&
      this.t >= this.loseCheckAt &&
      !this.pendingCageMotion() &&
      !this.pendingKidMotion()
    ) {
      if (this.rings.every((r) => r.freed)) {
        // Last move cleared the board — win path will fire.
        this.loseCheckAt = null;
      } else {
        this.lost = true;
        this.setVillainExpr('happy', 99);
        this.villainSay = { text: 'All mine!', until: this.t + 3 };
        this.emit('lost', {
          moves: this.moves,
          rescued: this.rescuedCount,
          total: this.totalKids,
        });
      }
    }
  }
}
