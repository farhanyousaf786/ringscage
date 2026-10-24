import { Game, norm, SNAP } from '../src/game/engine.js';
import { LEVELS, buildLevel, BOARD_W, PLAY_H } from '../src/game/levels.js';

let failures = 0;
const check = (cond, msg) => {
  if (!cond) {
    failures += 1;
    console.log('  FAIL:', msg);
  }
};

for (const def of LEVELS) {
  console.log(`Level ${def.id} ${def.name} (${def.difficulty})`);
  const b = buildLevel(def);
  const ids = Object.fromEntries(def.rings.map((r, i) => [r.id, i]));

  // links are N units apart (N>=1; long rods use N=2); non-links stay ≥ 1 unit
  const linked = new Set(def.links.map(([a, c]) => [ids[a], ids[c]].sort().join('-')));
  b.rings.forEach((r1, i) =>
    b.rings.forEach((r2, j) => {
      if (j <= i) return;
      const dist = Math.hypot(r1.x - r2.x, r1.y - r2.y);
      const units = dist / b.d;
      if (linked.has(`${i}-${j}`)) {
        const n = Math.round(units);
        check(n >= 1 && Math.abs(units - n) < 1e-4, `link ${i}-${j} not integer units: ${units}`);
      } else check(dist >= b.d - 1e-6, `rings ${i}-${j} too close: ${dist} < ${b.d}`);
    })
  );

  // everything fits on the board (per-ring size)
  b.rings.forEach((r, i) => {
    const pad = (r.R ?? b.R) + (r.T ?? b.T) / 2;
    check(r.x - pad >= 0 && r.x + pad <= BOARD_W, `ring ${i} outside board horizontally`);
    check(r.y - pad >= 0 && r.y + pad <= PLAY_H, `ring ${i} outside playfield vertically`);
  });

  // graph must be acyclic (holder -> held)
  const adj = def.links.reduce((m, [a, c]) => ((m[a] ||= []).push(c), m), {});
  const state = {};
  const dfs = (n) => {
    if (state[n] === 1) return false;
    if (state[n] === 2) return true;
    state[n] = 1;
    for (const m of adj[n] || []) if (!dfs(m)) return false;
    state[n] = 2;
    return true;
  };
  check(def.rings.every((r) => dfs(r.id)), 'link graph has a cycle');

  // no ring starts with its gap already on one of its collars (or covering a stem)
  const g = new Game(def);
  g.collars.forEach((c) => {
    const held = g.rings[c.held];
    check(Math.abs(norm(held.angle - c.phi)) > SNAP + 0.3, `ring ${c.held} starts with gap near its collar`);
    const holder = g.rings[c.holder];
    const stemDir = c.phi + Math.PI;
    check(Math.abs(norm(holder.angle - stemDir)) > g.gap / 2 + 0.1, `ring ${c.holder} gap covers its stem`);
  });

  check(def.maxMoves > 0, 'missing maxMoves');
  check(def.hero, 'missing hero');
  check(Array.isArray(def.kids) && def.kids.length === def.rings.length, 'kids must match ring count');
  check(g.kids.length === def.rings.length, 'engine kids mismatch');

  // simulate a full solve through the real rules (counting each alignment as one move)
  g.update(g.introEnd + 0.1);
  let steps = 0;
  let order = [];
  let movesUsed = 0;
  while (!g.rings.every((r) => r.freed) && steps < 200) {
    steps += 1;
    const ready = g.rings.findIndex((_, i) => g.isReady(i));
    check(ready >= 0, 'deadlock: no ready ring');
    if (ready < 0) break;
    g.rings.forEach((r, i) => {
      if (g.isLocked(i)) {
        const before = g.mistakes;
        g.startDrag(r.x + g.R, r.y);
        check(!g.drag, `locked ring ${i} allowed a drag`);
        g.mistakes = before;
      }
    });
    const c = g.heldBy(ready)[0];
    order.push(def.rings[ready].id);
    g.rotateTo(ready, c.phi);
    movesUsed += 1;
    for (let k = 0; k < 40; k += 1) g.update(0.05);
  }
  // finish queued one-by-one rescues + celebrate + win delay
  for (let k = 0; k < 400; k += 1) g.update(0.05);
  check(g.rescuedCount === g.totalKids, 'not all kids rescued on win');
  check(g.won, 'level never reached the won state');
  check(g.kids.every((kid) => kid.state === 'rescued' && kid.bayX != null), 'rescued kids missing bay positions');
  check(movesUsed <= def.maxMoves, `optimal solve ${movesUsed} exceeds maxMoves ${def.maxMoves}`);
  console.log(
    `  rings=${def.rings.length} collars=${def.links.length} maxMoves=${def.maxMoves} d=${b.d.toFixed(1)} R=${b.R.toFixed(1)} order=${order.join(' > ')} moves=${movesUsed} rescued=${g.rescuedCount} won=${g.won}`
  );
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll levels valid and solvable');
process.exit(failures ? 1 : 0);
