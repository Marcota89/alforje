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

// 0. "diário inalterado": golden regravado com o sim da v1.2 rodada 2 (teto de veneno/queimadura, Tocha, elites e chefe, Couraça Viva 12%, classes, Adaga 3).
//    Antes: gravado do sim da v8 (sem bônus permanentes). Dias 0..19, mesma política de melhoria de playDaily. Mudar o sim muda este golden: regrave e publique a função do servidor junto.
const DAILY_GOLDEN = [
  "1:W12.6,L18.5,L18.5,L18.5,L18.5,L18.5",
  "5:W7.2,W6.3,W5.4,W3.6,W4.5,L3.4,L2.7,L2.7,L3.1,L2.7",
  "2:W6.6,W6,L4.7,L4.7,L5.7,L4.7,L4.7",
  "2:W26,W19,L11.1,L13.7,L12.1,L11.9,L13.7",
  "9:W9,W11.9,W10,W5,W5.8,L6.4,W5.8,W8,L8,W6,L10.3,W10,L3,L3",
  "0:L14,L14,L14,L12.7,L14",
  "2:W6.3,W6.3,L4,L4.7,L4,L4,L4.7",
  "2:W6.6,W6,L5.2,L6,L5,L5.7,L6",
  "7:W21.4,L14,W14.2,L12,L11.7,W11.8,W4.8,W9.4,L6.8,W4.6,W14.2,L7.8",
  "5:W11.9,W8.8,W12,W5.8,W5.8,L8.5,L8.8,L8.8,L8.8,L8.8",
  "1:L23.3,L23.3,W22.2,L18.7,L18.7,L18.7",
  "2:W5.4,W7.2,L3.6,L3.1,L3.1,L3.1,L3.6",
  "5:W6.6,W6.6,L5.9,L5.9,L5.7,L5.7,W6,W3.2,W4.9,L3.1",
  "5:W26,W14.2,L13.9,W19,W7.5,W7,L7.3,L10.5,L10.5,L7.3",
  "5:W9,W8.8,W11.9,W6.2,W5.8,L6.7,L6,L6,L6.7,L6",
  "1:L23.3,L23.3,W20.6,L12.7,L12.7,L12.7",
  "5:W8.1,W8.1,L4.1,L5.3,L4.8,L4.1,W5.4,W3.6,W3.6,L1.7",
  "2:W6.6,W6.6,L4.7,L5.7,L5.7,L4.7,L5.7",
  "2:W26,W14.2,L11.9,L11.9,L11.8,L13.7,L13.7",
  "5:W9,W8.8,W8,W6.2,W6,L8.8,L8.5,L8.8,L8.5,L8.8"
];
{
  let okAll = 0;
  for (let d = 0; d < 20; d++) {
    const s = startDaily(d), r = [];
    while (true) {
      const o = liveFight(s); r.push((o.res === 'win' ? 'W' : 'L') + o.t);
      if (o.res === 'win') { s.wins++; s.stopLosses = 0; const it = s.items.find(i => i.tier < 4); if (it) it.tier++; } else { s.stopLosses++; s.lives--; }
      s.round++; if (s.wins >= D.GOAL || s.lives <= 0) break;
    }
    const got = s.wins + ':' + r.join(',');
    if (got === DAILY_GOLDEN[d]) okAll++; else console.log('  dia ' + d + ' esperado ' + DAILY_GOLDEN[d] + ' obtido ' + got);
  }
  check(okAll === 20, 'diario inalterado: dias 0..19 identicos ao golden (' + okAll + '/20)');
}

// 0b. permanent bonuses (state.perm) and pet multiplier (p.mul) read by makePlayer
{
  const mk = (perm, mul) => { const s = startDaily(3); s.perm = perm; if (mul != null) s.pets[0] = { key: 'raven', tier: 1, mul }; S.setState(s); return S.makePlayer(); };
  const base = mk(undefined), nul = mk(null);
  check(JSON.stringify(base) === JSON.stringify(nul), 'perm=null identico ao sem campo');
  const P0 = { hp: 0, block: 0, dmgPct: 0, crit: 0 };
  check(JSON.stringify(mk(P0)) === JSON.stringify(base), 'perm todo zero identico ao sem campo');
  check(mk({ ...P0, hp: 30 }).hp === base.hp + 30 && mk({ ...P0, hp: 30 }).max === base.max + 30, 'perm.hp +30 na vida inicial');
  const pb = mk({ ...P0, block: 9 });
  check(pb.block === base.block + 9 && pb.initBlk.some(e => e[0] === 'perm' && e[3] === 9 && e[2] === 'shield'), 'perm.block +9 no escudo inicial, com entrada propria em initBlk');
  const pd = mk({ ...P0, dmgPct: .5 });
  check(base.weapons[0].dmg > 0 && pd.weapons[0].dmg === Math.round(base.weapons[0].dmg * 1.5), 'perm.dmgPct .5 -> dano da arma inicial x1,5 (' + base.weapons[0].dmg + ' -> ' + pd.weapons[0].dmg + ')');
  const pc = mk({ ...P0, crit: .2 });
  check(Math.abs(pc.weapons[0].crit - Math.min(.9, base.weapons[0].crit + .2)) < 1e-9, 'perm.crit .2 soma ao critico da arma');
  check(mk({ ...P0, crit: .95 }).weapons.every(w => w.crit <= .9), 'critico respeita o teto de 0,9');
  const pet0 = mk(null, 1), pet13 = mk(null, 1.3);
  const pw = x => x.weapons.find(w => w.pet === 0 && w.dmg > 0);
  check(pw(pet0) && pw(pet13).dmg === Math.round(pw(pet0).dmg * 1.3) && pw(pet13).dmg > pw(pet0).dmg, 'pet mul 1,3 -> dano do pet x1,3 (' + (pw(pet0) && pw(pet0).dmg) + ' -> ' + pw(pet13).dmg + ')');
  // class skills (Combustao / Mistura Volatil) scale with dmgPct; perm null unchanged
  const skillDmg = (cls, perm) => { const s = S.setState(S.fresh()); s.cls = cls; s.perm = perm; s.sub = cls === 'alchemist' ? 'demolidor' : null; s.seed = 'sk'; s.rng = 7; const C = D.CLASSES[cls]; s.bag = { cols: C.bag[0], rows: C.bag[1], pockets: {} };
    for (const [key, x, y] of C.kits[0].items) { const d = D.ITEMS[key]; s.items.push({ id: s.nid++, key, tier: 1, x, y, w: d.w, h: d.h, where: 'bag' }); }
    s.route = D.STOPS.map(() => 0); S.rollElites(); S.setState(s); const b = S.newBattle(); let g = 0; while (!b.done && g++ < 20000) S.step(b, .05); return b.stats.skill ? b.stats.skill.dmg / b.stats.skill.act : 0; };
  for (const c of ['pyro', 'alchemist']) { const k0 = skillDmg(c, null), k1 = skillDmg(c, { ...P0, dmgPct: .5 }); check(k0 > 0 && k1 > k0, c + ': dano medio por uso de habilidade cresce com dmgPct .5 (' + k0 + ' -> ' + k1 + ')'); check(skillDmg(c, null) === k0, c + ': perm null estavel'); }
  check(S.setState(Object.assign(S.fresh(), { cls: 'pyro' })) && S.makePlayer().pdm === 1, 'pdm = 1 sem perm');
  const petPct = mk({ ...P0, dmgPct: .5 }, 1);
  check(pw(petPct).dmg === Math.round(pw(pet0).dmg * 1.5), 'dmgPct tambem vale para o pet');
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

// ===== v1.2: balanceamento =====
// mochila de teste (Guerreiro 7x6, parada `wins`) e luta contra um boneco que não ataca, por `secs` segundos
function rig(items, opts) {
  opts = opts || {}; const s = S.setState(S.fresh()); s.cls = opts.cls || 'warrior'; s.sub = opts.sub || null; s.seed = 'v12'; s.rng = 5; s.wins = opts.wins || 0; s.round = s.wins + 1;
  s.bag = { cols: 7, rows: 6, pockets: {} }; s.route = D.STOPS.map(() => 0); s.elites = {};
  for (const [key, tier, x, y] of items) { const d = D.ITEMS[key]; s.items.push({ id: s.nid++, key, tier, x, y, w: d.w, h: d.h, where: 'bag' }); }
  return s;
}
function dummy(s, secs) {
  S.setState(s); const b = S.newBattle();
  b.e = { side: 'e', name: 'Boneco', hp: 1e6, max: 1e6, block: 0, reflect: 0, critMult: 2, mult: 1, burn: 0, poison: 0, frost: 0, bt: 1, pt: 2, pti: b.p.poisonTick, bdi: b.p.burnDecay, ft: 3, trig: null, mods: [], chill: 0, weapons: [], heals: [] };
  b.ft = 1e9; b.ft0 = 1e9; let maxBurn = 0, maxPoison = 0;
  while (b.t < secs) { S.step(b, .05); maxBurn = Math.max(maxBurn, b.e.burn); maxPoison = Math.max(maxPoison, b.e.poison); }
  return { dmg: 1e6 - b.e.hp, maxBurn, maxPoison, b };
}
// decisão 1: Anel do Veterano não empilha — só o de maior raridade conta
{
  const sw = ['sword', 1, 0, 0];
  const dm = rings => S.withState(rig([sw, ...rings], { wins: 9 }), () => S.weaponStats(S.inWhere('bag')[0]).dmg);
  const none = dm([]), one1 = dm([['vetring', 1, 3, 3]]), two1 = dm([['vetring', 1, 3, 3], ['vetring', 1, 5, 5]]), one3 = dm([['vetring', 3, 3, 3]]), mix = dm([['vetring', 1, 3, 3], ['vetring', 3, 5, 5], ['vetring', 2, 6, 0]]);
  check(one1 > none && two1 === one1, `v1.2 Anel do Veterano: 2 anéis Comuns = 1 anel (${none} -> ${one1} -> ${two1})`);
  check(mix === one3 && one3 > one1, `v1.2 Anel do Veterano: Comum + Raro + Épico = só o Épico (${mix} = ${one3})`);
  const s = rig([['dagger', 1, 0, 0], ['dagger', 1, 1, 0], ['vetring', 1, 3, 3]], { wins: 9 });
  check(S.withState(s, () => S.inWhere('bag').filter(S.isWeapon).every(w => S.weaponStats(w).dmg > D.ITEMS.dagger.dmg)), 'v1.2 Anel do Veterano: o bônus continua valendo para todas as armas');
}
// decisão 2: teto de veneno e queimadura
{
  const base = dummy(rig([['sword', 1, 3, 2]]), 20).dmg;
  let worst = 0; for (let t = 1; t <= 4; t++) for (const [x, y] of [[2, 2], [4, 2], [3, 1], [3, 4]]) worst = Math.max(worst, dummy(rig([['sword', 1, 3, 2], ['torch', t, x, y]]), 20).dmg / base);
  check(worst <= 3, `v1.2 Tocha (qualquer raridade, melhor posição) multiplica a Espada Curta T1 por no máximo 3× (${worst.toFixed(2)}×)`);
  const st = rig([['staff', 4, 0, 0]]); const sw = S.withState(st, () => S.weaponStats(st.items[0]).burn); const r = dummy(st, 30);
  check(r.maxBurn <= Math.round(S.DOT_K.burn * sw), `v1.2 queimadura no alvo não passa do teto (${r.maxBurn} <= ${S.DOT_K.burn}×${sw})`);
  const v = rig([['viper', 4, 0, 0]]); const pv = S.withState(v, () => S.weaponStats(v.items[0]).poison); const rv = dummy(v, 30);
  check(rv.maxPoison <= Math.round(S.DOT_K.poison * pv) && rv.maxPoison > 0, `v1.2 veneno no alvo não passa do teto (${rv.maxPoison} <= ${S.DOT_K.poison}×${pv})`);
  const two = dummy(rig([['staff', 2, 0, 0], ['staff', 2, 1, 0]]), 30), one = dummy(rig([['staff', 2, 0, 0]]), 30);
  check(two.maxBurn > one.maxBurn, `v1.2 o teto soma as armas: duas fontes de queimadura sobem o teto (${one.maxBurn} -> ${two.maxBurn})`);
  const d40 = dummy(rig([['firedagger', 2, 0, 0]]), 40).dmg, d20 = dummy(rig([['firedagger', 2, 0, 0]]), 20).dmg;
  check(d40 / d20 < 2.3, `v1.2 dano contínuo deixa de crescer ao quadrado: Adaga Ígnea T2 em 40 s = ${(d40 / d20).toFixed(2)}× o de 20 s (antes 3,6×)`);
  const py = dummy(rig([['firedagger', 1, 0, 0]], { cls: 'pyro' }), 30);
  check(py.b.combust > 0, `v1.2 Piromante ainda alcança a Combustão com aplicação pequena (${py.b.combust} combustões)`);
  // inimigos comuns não têm teto (o veneno do Assassino Venenoso continua acumulando no herói)
  const s = S.setState(S.fresh()); s.cls = 'warrior'; s.seed = 'v12p'; s.rng = 9; s.bag = { cols: 5, rows: 4, pockets: {} }; s.wins = 8; s.round = 9; s.route = D.STOPS.map(() => 1); s.elites = {};
  s.items.push({ id: s.nid++, key: 'shield', tier: 4, x: 0, y: 0, w: 2, h: 2, where: 'bag' }, { id: s.nid++, key: 'helm', tier: 4, x: 2, y: 0, w: 2, h: 1, where: 'bag' });
  s.items.push({ id: s.nid++, key: 'dagger', tier: 1, x: 4, y: 0, w: 1, h: 1, where: 'bag' });
  S.setState(s); const bb = S.newBattle(); let mp = 0, g = 0; while (!bb.done && g++ < 4000) { S.step(bb, .05); mp = Math.max(mp, bb.p.poison); }
  check(S.foeDef().arch === 'veneno' && mp > 2 * (1 + Math.floor(8 / 3)), `v1.2 inimigo comum sem teto: o veneno do Ceifador acumula (${mp})`);
}
// decisão 3: a forja não rebaixa
check(S.forgeTier(4, 1) === 4 && S.forgeTier(1, 3) === 3 && S.forgeTier(2, 2) === 2, 'v1.2 forja herda a maior raridade (4+1 -> 4, 1+3 -> 3)');
// decisões 4 e 5: Salamandra 1× por parada; a reserva extra da Tartaruga só vale na parada
{
  const s = S.fresh(); s.hammerUsed = true;
  check(S.salamanderHeat(s) === true && s.freeHammer && !s.hammerUsed, 'v1.2 Salamandra: 1ª vez na parada esquenta o Martelo (grátis e liberado)');
  s.hammerUsed = true; s.freeHammer = false;
  check(S.salamanderHeat(s) === false && s.hammerUsed && !s.freeHammer, 'v1.2 Salamandra: 2ª vez na mesma parada é recusada');
  S.newStop(s, 2); check(!s.salamUsed && !s.hammerUsed && !s.freeHammer && S.salamanderHeat(S.newStop(s, 2)), 'v1.2 Salamandra: volta na parada seguinte (Martelo grátis não passa de uma parada para outra)');
  const t = S.fresh(); t.extraLock = 2; t.shop = [{ key: 'sword', tier: 1, locked: true }, { key: 'dagger', tier: 1, locked: true }, null, { key: 'axe', tier: 2, locked: true }, { key: 'bow', tier: 1, locked: true }];
  S.newStop(t, 2);
  check(t.extraLock === 0 && t.shop.filter(o => o && o.locked).length === 2 && t.shop[0].locked && t.shop[1].locked && !t.shop[3].locked && !t.shop[4].locked, 'v1.2 Tartaruga: na parada seguinte ficam só 2 reservas (as extras são soltas)');
  const u = S.fresh(); u.shop = [{ key: 'sword', tier: 1, locked: true }, { key: 'dagger', tier: 1, locked: true }, { key: 'axe', tier: 1, locked: true }];
  S.newStop(u, 3); check(u.shop.every(o => o.locked), 'v1.2 Tartaruga: com Olho Clínico (limite 3) as 3 reservas ficam');
}
// decisão 8: Bênção de Prata depois da 6ª vitória
check(S.blessTier(6) === 'p' && [3, 8, 9].every(w => S.blessTier(w) === 'b'), 'v1.2 Bênção de Prata na 6ª vitória; 3ª, 8ª (A1+) e 9ª dão Bronze');
check(D.SILVER_WIN + 3 < D.GOAL, `v1.2 Juros Compostos (Prata) ainda rende em ${D.GOAL - 1 - D.SILVER_WIN} paradas antes do chefe`);
// decisões 6 e 7: a elite da parada 9 deixou de ser a parede; a Ascensão pesa desde a A1
{
  const hp = (asc, wins) => { const s = S.setState(S.fresh()); s.cls = 'warrior'; s.asc = asc; s.wins = wins; s.route = D.STOPS.map(() => 0); s.elites = {}; return S.foeStats().hp; };
  check(D.STOPS[8].hp < D.STOPS[7].hp * 1.15 && D.STOPS[9].hp > 2 * D.STOPS[8].hp, `v1.2 elite da parada 9 (vida base ${D.STOPS[8].hp}) abaixo do chefe (${D.STOPS[9].hp})`);
  check(hp(1, 4) > hp(0, 4) && hp(5, 4) > hp(1, 4) && hp(10, 4) > hp(5, 4), `v1.2 Ascensão: vida do inimigo da parada 5 sobe já na A1 (${hp(0, 4)}, ${hp(1, 4)}, ${hp(5, 4)}, ${hp(10, 4)})`);
}
// rodada 2 (decisões 6/7): elites das paradas 3 e 6 com 1 modificador mesmo na A10; reforço da Ascensão menor no começo e nas elites
{
  const st = S.setState(S.fresh()); st.asc = 10; st.rng = 77; st.route = D.STOPS.map(() => 0); S.rollElites();
  check(st.elites[2].every(m => m.length === 1) && st.elites[5].every(m => m.length === 1) && st.elites[7].every(m => m.length === 2) && st.elites[8].every(m => m.length === 2) && st.elites[9].every(m => m.length === 2),
    'v1.2 A10: elites das paradas 3 e 6 com 1 modificador; 8, 9 e o chefe com 2');
  const ratio = wins => { const hp = asc => { const s = S.setState(S.fresh()); s.cls = 'warrior'; s.asc = asc; s.wins = wins; s.route = D.STOPS.map(() => 0); s.elites = {}; return S.foeStats().hp; }; return hp(10) / hp(0); };
  check(ratio(0) < ratio(6) && ratio(8) < ratio(6), `v1.2 A10: reforço de vida menor na parada 1 (×${ratio(0).toFixed(2)}) que na 7 (×${ratio(6).toFixed(2)}), e menor na elite da parada 9 (×${ratio(8).toFixed(2)})`);
}
// decisão 9: teto de ouro apertado — uma jornada honesta passa, mochila 1,5× acima do teto não
{
  check(S.goldCap(1) === 50 && S.goldCap(2) === 128 && S.goldCap(10) === 400 && S.goldCap(14) === 568, `v1.2 goldCap: 50 na 1ª rodada, depois 60+34·r até a 10ª e +42 por rodada na Sobrevivência (r2 ${S.goldCap(2)}, r10 ${S.goldCap(10)}, r14 ${S.goldCap(14)}; antes 213/939/1243)`);
  check(S.keyCost('infernal', 4) === Math.min(5 * 8 + 2, 5 + 2 * 8) && S.keyCost('infernal', 1) === 7 && S.keyCost('sword', 3) === 12, `v1.2 item forjado conta pelo custo dos ingredientes (Cajado Infernal Lendário = ${S.keyCost('infernal', 4)}, não 80)`);
  let mono = true; for (let r = 2; r <= S.MAXFIGHTS + 1; r++) if (S.goldCap(r) < S.goldCap(r - 1)) mono = false;
  check(mono, 'v1.2 goldCap só cresce com a rodada');
  const k = { c: 'warrior', sub: null, bl: [], b: [7, 5, {}], lv: 3, i: [], p: [], w: 9, r: 10, a: 0, ch: null };
  let y = 0, x = 0; while (S.buildPlausible(k).ok) { k.i.push(['dagger', 4, x, y, 1, 1]); if (++x >= 7) { x = 0; y++; } if (y >= 5) break; }
  const why = S.buildPlausible(k).why; k.i.pop();
  check(why === 'mochila cara demais para a rodada' && S.buildPlausible(k).cost <= S.goldCap(10), `v1.2 goldCap recusa a 1ª mochila acima do teto da rodada 10 (${S.goldCap(10)})`);
}

console.log(fails ? `\n${fails} falha(s)` : '\ntudo certo');
process.exit(fails ? 1 : 0);
