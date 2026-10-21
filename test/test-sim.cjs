// Headless checks for js/data.js + js/sim.js: determinism, daily proof replay, tamper rejection, ghost plausibility.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, Math, Date, JSON, Object, Array, Set, Map, String, Number, Promise, Error };
vm.createContext(ctx);
for (const f of ['data.js', 'sim.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
const D = ctx.window.AlforjeData, S = ctx.window.AlforjeSim;

let fails = 0;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };

// Start a daily run the same way pickClass does (fresh, seed, kit, route, elites).
function startDaily(dayIx) {
  const cls = S.dailyClass(dayIx), seed = 'D' + S.dayStr(dayIx);
  const s = S.setState(S.fresh());
  s.cls = cls; s.mode = 'daily'; s.seed = seed; s.rng = S.hashStr(seed) || 1;
  const C = D.CLASSES[cls]; s.bag = { cols: C.bag[0], rows: C.bag[1], pockets: {} };
  for (const [key, x, y] of C.kits[0].items) { const d = D.ITEMS[key]; s.items.push({ id: s.nid++, key, tier: 1, x, y, w: d.w, h: d.h, where: 'bag' }); }
  s.route = D.STOPS.map(st => Math.floor(S.R() * st.v.length)); S.rollElites();
  return s;
}
// Live loop exactly like the page: newBattle + fixed 0.05 s steps.
function liveFight(s) {
  S.setState(s); const b = S.newBattle(); let g = 0;
  while (!b.done && g++ < 20000) S.step(b, .05);
  return { res: b.done || 'lose', t: Math.round(b.t * 10) / 10 };
}
// Play a whole daily run: the player keeps the kit and gets one free upgrade per win (stays within the gold cap).
function playDaily(dayIx) {
  const s = startDaily(dayIx); const proof = [];
  while (true) {
    const k = S.snapOf(s), out = liveFight(s);
    proof.push({ k: JSON.parse(JSON.stringify(k)), res: out.res });
    if (out.res === 'win') { s.wins++; s.stopLosses = 0; const it = s.items.find(i => i.tier < 4); if (it) it.tier++; }
    else { s.stopLosses++; s.lives--; }
    s.round++;
    if (s.wins >= D.GOAL || s.lives <= 0) break;
  }
  const won = s.wins >= D.GOAL;
  const sc = Math.round(s.wins * 100 + (won ? 250 : 0) + s.lives * 25);
  return { s, entry: { v: 2, d: S.dayStr(dayIx), s: sc, cls: s.cls, w: s.wins, t: 1, pf: proof } };
}

// 1. determinism
const day = Math.floor(Date.now() / 864e5);
const a = liveFight(startDaily(day)), b = liveFight(startDaily(day));
check(a.res === b.res && a.t === b.t, `mesma luta duas vezes dÃ¡ o mesmo resultado (${a.res} em ${a.t}s / ${b.res} em ${b.t}s)`);
let same = 0;
for (let i = 0; i < 20; i++) { const x = liveFight(startDaily(day + i)), y = liveFight(startDaily(day + i)); if (x.res === y.res && x.t === y.t) same++; }
check(same === 20, `20 seeds diferentes, cada uma repetida: ${same}/20 idÃªnticas`);

// 2. seedRoute matches the route a daily start draws
const st0 = startDaily(day), rt = S.seedRoute(st0.seed, 0);
check(JSON.stringify(rt.route) === JSON.stringify(st0.route) && JSON.stringify(rt.elites) === JSON.stringify(st0.elites), 'seedRoute reproduz rota e elites do inÃ­cio da partida');

// 3. full daily runs verify, for each of the five classes
const classes = new Set();
for (let i = 0; i < 5; i++) {
  const { entry } = playDaily(day + i); classes.add(entry.cls);
  const v = S.verifyDaily(entry, day + i);
  check(v.ok, `DiÃ¡rio ${entry.d} (${entry.cls}, ${entry.w} vitÃ³rias, ${entry.pf.length} lutas, ${entry.s} pontos) passa na conferÃªncia${v.ok ? '' : ': ' + v.why}`);
}
check(classes.size === 5, `classe do dia gira pelas 5 classes: ${[...classes].join(', ')}`);

// 4. tampering is rejected
const { entry } = playDaily(day);
const clone = () => JSON.parse(JSON.stringify(entry));
const t1 = clone(); t1.s += 100; check(!S.verifyDaily(t1, day).ok, 'pontuaÃ§Ã£o inflada Ã© recusada: ' + S.verifyDaily(t1, day).why);
const t2 = clone(); const li = t2.pf.findIndex(f => f.res === 'lose'); if (li >= 0) { t2.pf[li].res = 'win'; check(!S.verifyDaily(t2, day).ok, 'derrota trocada por vitÃ³ria Ã© recusada: ' + S.verifyDaily(t2, day).why); }
const t3 = clone(); t3.pf[0].k.i = t3.pf[0].k.i.map(x => [x[0], 4, x[2], x[3], x[4], x[5], 0, 0]); check(!S.verifyDaily(t3, day).ok, 'itens LendÃ¡rios na 1Âª luta sÃ£o recusados: ' + S.verifyDaily(t3, day).why);
const t4 = clone(); t4.cls = t4.cls === 'warrior' ? 'rogue' : 'warrior'; check(!S.verifyDaily(t4, day).ok, 'classe diferente da do dia Ã© recusada: ' + S.verifyDaily(t4, day).why);
const t5 = clone(); delete t5.pf; t5.v = undefined; check(!S.verifyDaily(t5, day).ok, 'registro antigo, sem prova, Ã© recusado: ' + S.verifyDaily(t5, day).why);
const t6 = clone(); t6.pf[0].k.i.push(t6.pf[0].k.i[0].slice()); check(!S.verifyDaily(t6, day).ok, 'item sobreposto Ã© recusado: ' + S.verifyDaily(t6, day).why);
const t7 = clone(); t7.d = S.dayStr(day - 1); check(!S.verifyDaily(t7, day).ok, 'registro de outro dia Ã© recusado: ' + S.verifyDaily(t7, day).why);

// 5. ghost plausibility
const g = { c: 'warrior', b: [5, 4, {}], lv: 0, i: [['shield', 2, 0, 0, 2, 2], ['sword', 3, 2, 0, 1, 2]], p: [0, 0, 0], s: 'berserker', bl: ['sangue'] };
check(S.ghostPlausible(g, 10).ok, 'fantasma normal Ã© aceito');
check(!S.ghostPlausible(Object.assign({}, g, { i: [...g.i, ['axe', 1, 0, 0, 2, 2]] }), 10).ok, 'fantasma com itens sobrepostos Ã© recusado');
check(!S.ghostPlausible(Object.assign({}, g, { b: [7, 6, {}], lv: 0 }), 10).ok, 'fantasma com mochila maior que as ampliaÃ§Ãµes Ã© recusado');
const full = { c: 'warrior', sub: null, bl: [], b: [5, 4, {}], lv: 0, i: [], p: [], w: 1, r: 2, a: 0, ch: null };
for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) full.i.push(['dagger', 4, x, y, 1, 1]);
check(!S.buildPlausible(full).ok, 'mochila cheia de LendÃ¡rios na 2Âª rodada Ã© recusada: ' + S.buildPlausible(full).why);
const kitOk = { c: 'alchemist', sub: null, bl: [], b: [5, 4, {}], lv: 0, i: [['bomb', 1, 0, 0, D.ITEMS.bomb.w, D.ITEMS.bomb.h], ['potion', 1, 1, 0, 1, 1], ['mortar', 1, 1, 1, D.ITEMS.mortar.w, D.ITEMS.mortar.h]], p: [], w: 0, r: 1, a: 0, ch: null };
check(S.buildPlausible(kitOk).ok, 'kit inicial do Alquimista na 1Âª rodada Ã© aceito' + (S.buildPlausible(kitOk).ok ? '' : ': ' + S.buildPlausible(kitOk).why));
let kitsOk = 0; for (const c of D.CLASSKEYS) for (const kit of D.CLASSES[c].kits) { const k = { c, sub: null, bl: [], b: [D.CLASSES[c].bag[0], D.CLASSES[c].bag[1], {}], lv: 0, p: [], w: 0, r: 1, a: 0, ch: null, i: kit.items.map(([key, x, y]) => [key, 1, x, y, D.ITEMS[key].w, D.ITEMS[key].h]) }; if (S.buildPlausible(k).ok) kitsOk++; }
check(kitsOk === 10, `os 10 kits iniciais passam na 1Âª rodada: ${kitsOk}/10`);

console.log(fails ? `\n${fails} falha(s)` : '\ntudo certo');
process.exit(fails ? 1 : 0);
