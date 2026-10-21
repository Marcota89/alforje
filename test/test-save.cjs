// Verificações de js/save.js (jornada e perfil salvos) e da retomada de luta (v8.1):
// a luta resolvida a partir da partida gravada na entrada dá exatamente o mesmo resultado da luta ao vivo.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, Math, Date, JSON, Object, Array, Set, Map, String, Number, Promise, Error, console };
vm.createContext(ctx);
for (const f of ['data.js', 'sim.js', 'save.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
const D = ctx.window.AlforjeData, S = ctx.window.AlforjeSim, SV = ctx.window.AlforjeSave;

let fails = 0;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };
const clone = o => JSON.parse(JSON.stringify(o));

// partida como pickClass monta (igual ao test-sim)
function startRun(dayIx, mode) {
  const cls = S.dailyClass(dayIx), seed = (mode === 'daily' ? 'D' : 'N') + S.dayStr(dayIx);
  const s = S.setState(S.fresh());
  s.cls = cls; s.mode = mode; s.seed = seed; s.rng = S.hashStr(seed) || 1; s.phase = 'shop';
  const C = D.CLASSES[cls]; s.bag = { cols: C.bag[0], rows: C.bag[1], pockets: {} };
  for (const [key, x, y] of C.kits[0].items) { const d = D.ITEMS[key]; s.items.push({ id: s.nid++, key, tier: 1, x, y, w: d.w, h: d.h, where: 'bag' }); }
  s.route = D.STOPS.map(st => Math.floor(S.R() * st.v.length)); S.rollElites();
  return s;
}

// ===== 1. jornada salva =====
{
  const s = startRun(3, 'normal');
  s.shop = [{ key: D.SHOPKEYS[0], tier: 2 }, null, { key: D.PETKEYS[0], tier: 1, pet: 1 }];
  s.pets = [{ key: D.PETKEYS[0], tier: 1, ch: 3 }, null, null];
  check(SV.runProblem(clone(s)) === '', 'jornada válida passa (' + SV.runProblem(clone(s)) + ')');
  check(SV.runProblem(clone(S.fresh())) === '', 'fresh() (acampamento) passa');
  const bad = {
    'sem bless': x => { delete x.bless; },
    'sem pets': x => { delete x.pets; },
    'sem shop': x => { delete x.shop; },
    'sem etiq': x => { delete x.etiq; },
    'item com chave inexistente': x => { x.items[0].key = 'itemremovido'; },
    'bênção oferecida inexistente': x => { x.cur = 'bless'; x.reward = ['nope', Object.keys(D.BLESS)[0]]; },
    'oferta da loja inexistente': x => { x.shop[1] = { key: 'sumiu', tier: 1 }; },
    'companheiro inexistente': x => { x.pets[1] = { key: 'dragao', tier: 1 }; },
    'bênção ativa inexistente': x => { x.bless = ['velha']; },
    'ouro texto': x => { x.gold = 'abc'; },
    'bag sem pockets': x => { delete x.bag.pockets; },
    'items não é lista': x => { x.items = {}; },
    'fase desconhecida': x => { x.phase = 'loja'; },
    'classe desconhecida': x => { x.cls = 'bardo'; },
    'tier 7': x => { x.items[0].tier = 7; },
    'fila com tela desconhecida': x => { x.queue = ['bless', 'festa']; },
  };
  for (const name in bad) { const x = clone(s); bad[name](x); check(SV.runProblem(x) !== '', 'jornada ruim recusada: ' + name + ' (' + SV.runProblem(x) + ')'); }
  check(SV.runProblem(null) !== '' && SV.runProblem([]) !== '' && SV.runProblem('x') !== '', 'null, lista e texto recusados');
  // campos opcionais de versões antigas: faltando é aceito e completado
  const old = clone(s); delete old.stats; delete old.merges; delete old.perm; delete old.queue; delete old.route;
  check(SV.runProblem(old) === '', 'campos opcionais faltando: aceita');
  SV.fillRun(old, S.fresh());
  check(Array.isArray(old.stats.forged) && old.merges === 0 && Array.isArray(old.queue) && old.gold === s.gold, 'fillRun completa só o que falta');
  const q = clone(s); q.gq = { buy: 2 }; q.pq = [['cx', 'sword', 'bought'], ['m', 'merge']];
  check(SV.runProblem(q) === '', 'filas gq/pq aceitas');
}

// ===== 2. perfil =====
{
  const base = { ver: '', best: 0, history: [], ach: {}, asc: {}, codex: { items: {}, foes: {}, recipes: {} }, miss: null, seals: 0, skin: 'couro' };
  const p = SV.fixProf({ ver: '8.0', best: 4, history: null, ach: null, asc: 5, codex: { items: null, foes: { boar: null, wolf: { met: 1, beat: 1 } }, recipes: null }, miss: 'x', seals: 'a', skin: 3 }, clone(base));
  check(Array.isArray(p.history) && typeof p.ach === 'object' && p.ach && typeof p.asc === 'object', 'perfil: history/ach/asc nulos voltam ao padrão');
  check(p.codex.items && p.codex.recipes && !('boar' in p.codex.foes) && p.codex.foes.wolf.met === 1, 'perfil: codex nulo saneado, entradas boas mantidas');
  check(p.miss === null && p.seals === 0 && p.skin === 'couro' && p.best === 4 && p.ver === '8.0', 'perfil: tipos errados voltam ao padrão, valores bons ficam');
}

// ===== 3. retomada da luta =====
// ao vivo: newBattle + passos fixos de 0,05 s acumulados por quadros de tamanho variável (como loop() da página)
function live(s) {
  S.setState(s); const b = S.newBattle(); let acc = 0, seed = 7, g = 0;
  while (!b.done && g++ < 400000) { seed = (seed * 1103515245 + 12345) >>> 0; acc += (0.004 + (seed % 46) / 1000) * [1, 2, 4][seed % 3]; while (acc >= .05 && !b.done) { S.step(b, .05); acc -= .05; } }
  return b;
}
// retomada: a partida gravada na entrada (JSON) é conferida, completada e resolvida com skip() (newBattle + step(B,.05) até o fim)
function resumed(saved) {
  const s = JSON.parse(saved); if (SV.runProblem(s) !== '') return null; SV.fillRun(s, S.fresh());
  S.setState(s); const b = S.newBattle(); let g = 0; while (!b.done && g++ < 20000) S.step(b, .05); if (!b.done) b.done = 'lose';
  return b;
}
const sig = b => JSON.stringify({ done: b.done, t: b.t, php: b.p.hp, ehp: b.e.hp, log: b.log, stats: b.stats, es: b.es, blocked: b.blocked, combust: b.combust });
{
  let same = 0, total = 0, wins = 0;
  const modes = ['normal', 'daily'];
  for (let d = 0; d < 6; d++) for (const mode of modes) {
    const s = startRun(40 + d, mode);
    if (mode === 'normal') s.perm = { hp: 6, block: 3, dmgPct: .04, crit: .02, gold: 1, pet: null };
    for (let r = 0; r < 6; r++) {
      // entrada da luta como fight() grava: fila zerada, prova pendente no Diário, fase 'battle'
      s.gq = null; s.pq = null; if (mode === 'daily') s.pfPending = S.snapOf(s); s.phase = 'battle';
      const saved = JSON.stringify(s);
      const a = live(clone(s)), b = resumed(saved);
      total++; if (b && sig(a) === sig(b)) same++; if (a.done === 'win') wins++;
      // segue a partida como o page faz (vitória: mais 1 tier num item)
      s.phase = 'shop'; s.pfPending = null;
      if (a.done === 'win') { s.wins++; s.stopLosses = 0; const it = s.items.find(i => i.tier < 4); if (it) it.tier++; } else { s.stopLosses++; s.lives--; }
      s.round++; if (s.lives <= 0) break;
    }
  }
  check(same === total && total >= 40, `luta retomada === luta ao vivo em ${same}/${total} entradas (normal e Diário; ${wins} vitórias)`);
}

// ===== 4. Diário inteiro com recarga em toda luta: a prova é a mesma e passa na conferência =====
{
  for (let i = 0; i < 3; i++) {
    const dayIx = 60 + i;
    const run = reload => {
      const s = startRun(dayIx, 'daily'); const proof = [];
      while (true) {
        s.pfPending = S.snapOf(s); s.phase = 'battle';
        let st = s, b;
        if (reload) { st = JSON.parse(JSON.stringify(s)); b = resumed(JSON.stringify(st)); } else b = live(s);
        // finish(): a prova pendente vira 1 registro, uma vez
        proof.push({ k: st.pfPending, res: b.done === 'win' ? 'win' : 'lose' }); st.pfPending = null; st.phase = 'shop';
        if (st !== s) Object.assign(s, st);
        if (b.done === 'win') { s.wins++; s.stopLosses = 0; const it = s.items.find(x => x.tier < 4); if (it) it.tier++; } else { s.stopLosses++; s.lives--; }
        s.round++; if (s.wins >= D.GOAL || s.lives <= 0) break;
      }
      const won = s.wins >= D.GOAL;
      return { v: 2, d: S.dayStr(dayIx), s: Math.round(s.wins * 100 + (won ? 250 : 0) + s.lives * 25), cls: s.cls, w: s.wins, t: 1, pf: proof };
    };
    const a = run(false), b = run(true);
    const v = S.verifyDaily(clone(b), dayIx);
    check(JSON.stringify(a) === JSON.stringify(b) && v.ok, `Diário ${a.d}: recarregando em toda luta, mesma prova (${b.pf.length} lutas, 1 registro por luta) e passa na conferência${v.ok ? '' : ': ' + v.why}`);
  }
}

console.log(fails ? `\n${fails} FALHA(S)` : '\ntudo ok');
process.exit(fails ? 1 : 0);
