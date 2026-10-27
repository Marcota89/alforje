// Verificações de js/meta.js (regras puras): energia, calendário, metas, nível, equipamento, companheiros, jornada, contadores.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, Math, Date, JSON, Object, Array, Set, Map, String, Number, Promise, Error };
vm.createContext(ctx);
for (const f of ['data.js', 'meta.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
const D = ctx.window.AlforjeData, M = ctx.window.AlforjeMeta;

let fails = 0;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };
// bloco que lança erro (função que não existe numa versão antiga) conta como falha e não derruba os outros
const pending = []; /* checagens assíncronas (cloud.js) terminam antes do resumo */
const tryBlock = fn => { try { fn(); } catch (e) { check(false, 'erro: ' + e.message); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const DAY = 86400000, T0 = Date.UTC(2026, 9, 21, 12, 0, 0);
const mk = (prof, now) => M.ensureMeta(prof || { totalWins: 0, ach: {} }, now == null ? T0 : now);

// migração
{
  const prof = { totalWins: 7, ach: { a: 1 } };
  const m = M.ensureMeta(prof, T0);
  check(m.energy === 30 && m.xp === 70 && M.levelOf(70).lv === 1, 'migração: energia 30, XP 70, nível 1');
  check(m.achBase.includes('a'), 'migração: achBase contém as conquistas já existentes');
  const snap = JSON.stringify(prof);
  M.ensureMeta(prof, T0);
  check(JSON.stringify(prof) === snap, 'ensureMeta idempotente');
  check(M.dayKey(T0) === '2026-10-21', 'dayKey é a data UTC');
}

// energia
{
  let m = mk(); m.energy = 0; m.eAt = T0;
  check(M.tickEnergy(m, T0 + 480000 * 5) === 5, 'energia: 0 + 5 intervalos = 5');
  check(M.nextEnergyIn(m, T0 + 480000 * 5 + 1000) === 479000, 'energia: próxima recarga em 479 s');
  m = mk(); m.energy = 25; m.eAt = T0;
  check(M.tickEnergy(m, T0 + 480000 * 100) === 30 && M.nextEnergyIn(m, T0 + 480000 * 100) === 0, 'energia: 25 + muito tempo = 30, sem espera');
  m = mk(); m.energy = 40; m.eAt = T0;
  check(M.tickEnergy(m, T0 + 480000 * 50) === 40, 'energia: acima do máximo não muda');
  m = mk(); m.energy = 12; m.eAt = T0;
  check(M.tickEnergy(m, T0 - 1e6) === 12 && m.eAt === T0 - 1e6 && M.nextEnergyIn(m, T0 - 1e6) === 480000, 'relógio para trás: mesmo valor, marca refeita, sem negativo');
  m = mk(); m.energy = 9;
  check(M.spendEnergy(m, 10, T0) === false && m.energy === 9, 'gastar 10 com 9 falha sem alterar');
  m = mk(); m.energy = 30;
  check(M.spendEnergy(m, 10, T0) && m.energy === 20 && M.nextEnergyIn(m, T0) === 480000, 'gastar a partir de 30 inicia a recarga');
  m = mk(); m.energy = 90;
  check(M.addRes(m, 'energy', 20) === 9 && m.energy === 99, 'addRes energia limita em 99 e devolve o que entrou');
  m = mk(); m.gold = 99990;
  check(M.addRes(m, 'gold', 50) === 9 && m.gold === 99999, 'addRes ouro limita em 99999');
  const r = M.applyReward(m, { gold: 5, energy: 3 });
  check(r.added.gold === 0 && r.lost.gold === 5 && r.added.energy === 3, 'applyReward informa o que entrou e o que se perdeu');
}

// calendário
{
  const m = mk();
  let c = M.calToday(m, T0);
  check(c.idx === 0 && c.reward.gold === 100 && !c.claimed, 'calendário: dia 1 = 100 ouro');
  const r = M.claimCal(m, T0, false);
  check(r.gold === 100 && m.gold === 100, 'calendário: pegou 100 ouro');
  check(M.claimCal(m, T0 + 1000, false) === null && M.calToday(m, T0).claimed, 'calendário: segunda vez no mesmo dia dá null');
  const r2 = M.claimCal(m, T0 + 3 * DAY, false);
  check(r2 && r2.energy === 10, 'calendário: pular dias não zera (idx 1)');
  const m2 = mk(); const r3 = M.claimCal(m2, T0, true);
  check(r3.gold === 200 && m2.gold === 200, 'calendário: dobro dá 200 ouro');
  const m3 = mk(); let last;
  for (let i = 0; i < 7; i++) last = M.claimCal(m3, T0 + i * DAY, false);
  check(eq(last, { gold: 300, stone: 5, ruby: 10 }) && M.calToday(m3, T0 + 7 * DAY).idx === 0, 'calendário: 7º dia e volta ao 1º');
}

// metas
{
  const a = M.goalsToday(mk(), T0), b = M.goalsToday(mk(), T0 + 3600000);
  check(a.ids.length === 5 && new Set(a.ids).size === 5 && eq(a.ids, b.ids), 'metas: mesma data, mesmos 5 ids, sem repetição');
  let differ = false;
  for (let i = 1; i < 20; i++) if (!eq(M.goalsToday(mk(), T0 + i * DAY).ids, a.ids)) differ = true;
  check(differ, 'metas: dias diferentes podem diferir');
  check(a.ids.every(id => M.GOALS[id]), 'metas: todos os ids existem');
  // acha um dia com win5 sorteada
  let t = T0; while (!M.goalsToday(mk(), t).ids.includes('win5')) t += DAY;
  const m = mk(null, t);
  check(eq(M.goalEvent(m, t, 'win', 5), ['win5']), 'metas: 5 vitórias completam win5');
  check(M.goalEvent(m, t, 'win', 5).length === 0, 'metas: meta pronta não completa de novo');
  check(M.goalsToday(m, t).pts === 20, 'metas: 20 pontos');
  // completa mais uma para chegar a 40
  const others = M.goalsToday(m, t).ids.filter(id => id !== 'win5');
  for (const id of others.slice(0, 1)) M.goalEvent(m, t, M.GOALS[id].ev, M.GOALS[id].n);
  let g = M.goalsToday(m, t);
  check(g.pts === 40 && g.chests[0].ready && !g.chests[1].ready, 'metas: 40 pontos deixam o baú 0 pronto');
  const rc = M.claimChest(m, t, 0);
  check(eq(rc, { gold: 100, energy: 10 }) && m.gold === 100, 'baú 0 dá 100 ouro + 10 energia');
  check(M.claimChest(m, t, 0) === null && M.claimChest(m, t, 1) === null, 'baú só uma vez; baú 1 sem pontos é null');
  g = M.goalsToday(m, t + DAY);
  check(g.pts === 0 && g.done.length === 0 && g.chests.every(c => !c.claimed && !c.ready), 'virada do dia zera progresso e baús');
  check(M.goalsToday(m, t).endsIn > 0 && M.goalsToday(m, t).endsIn <= DAY, 'metas: endsIn em (0, 1 dia]');
}

// níveis
{
  check(M.levelOf(99).lv === 1 && M.levelOf(100).lv === 2 && M.levelOf(299).lv === 2 && M.levelOf(300).lv === 3, 'nível: limiares 100 e 300');
  check(eq(M.levelOf(150), { lv: 2, into: 50, need: 200 }), 'nível: into e need');
  check(M.levelOf(1e9).lv === 30, 'nível: máximo 30');
  const m = mk(); check(M.addXp(m, 350) === 2 && m.xp === 350, 'addXp devolve níveis ganhos');
}

// equipamento
{
  check(eq(M.gearCost(1), { stone: 1, gold: 25 }) && eq(M.gearCost(5), { stone: 9, gold: 625 }) && eq(M.gearCost(19), { stone: 121, gold: 9025 }), 'v1.4 (ID 8) gearCost: ⌈L²/3⌉ pedras, 25×L² ouro');
  { let st = 0, gd = 0; for (let L = 1; L < 20; L++) { st += M.gearCost(L).stone; gd += M.gearCost(L).gold; }
    check(st === 832 && gd === 61750, 'v1.4 (ID 8): uma peça do 1 ao 20 custa 832 pedras (antes 190) e 61.750 de ouro'); }
  check([1, 5, 6, 10, 11, 15, 16, 20].map(M.gearTier).join() === '1,1,2,2,3,3,4,4', 'gearTier: raridades');
  const m = mk();
  check(M.upgradeGear(m, 'weapon') === false && m.gear.weapon === 1, 'upgrade sem recursos falha');
  m.stone = 1; m.gold = 25;
  check(M.upgradeGear(m, 'weapon') && m.gear.weapon === 2 && m.stone === 0 && m.gold === 0, 'upgrade gasta recursos e sobe');
  m.gear.armor = 10; m.stone = 34; m.gold = 2499;
  check(M.upgradeGear(m, 'armor') === false && m.gear.armor === 10, 'v1.2: nível 10 → 11 pede 2.500 de ouro (2.499 não basta)');
  m.gold = 2500; check(M.upgradeGear(m, 'armor') && m.gear.armor === 11 && m.gold === 0 && m.stone === 0, 'v1.4: nível 10 → 11 com 34 pedras e 2.500 de ouro');
  m.gear.ring = 20; m.stone = 99; m.gold = 9999;
  check(M.upgradeGear(m, 'ring') === false && m.gear.ring === 20, 'nível 20 não sobe');
  const p = mk(); p.gear = { weapon: 6, armor: 4, ring: 3, bag: 5 }; p.xp = 300;
  const o = M.permOf(p); delete o.pet;
  check(eq(o, { hp: 2, block: 6, dmgPct: .05, crit: .01, gold: 2 }), 'v1.2 permOf: arma 6 (+5%), armadura 4 (+6), anel 3 (+1%), bolsa 5 (+2), nível 3 (+2 vida)');
  const q = mk(); q.gear = { weapon: 20, armor: 20, ring: 20, bag: 20 }; q.xp = 1e9; const oq = M.permOf(q); delete oq.pet;
  check(eq(oq, { hp: 29, block: 38, dmgPct: .19, crit: .095, gold: 9 }), 'v1.2 permOf no máximo: +29 vida, +38 escudo, +19% dano, +9,5% crítico, +9 ouro (antes 87/57/38%/19%/19)');
  check([1, 2, 3, 4, 5, 20].map(L => M.gearBonus('bag', L)).join() === '0,0,1,1,2,9', 'v1.2: Bolsa +1 ouro a cada 2 níveis');
  // migração: quem já tinha níveis mantém os níveis; só a fórmula muda (sem reembolso)
  const old = { totalWins: 40, ach: {}, meta: { v: 1, day: '', energy: 12, eAt: T0, xp: 4500, gold: 321, ruby: 0, stone: 7, food: 0, egg: 0, gear: { weapon: 14, armor: 9, ring: 20, bag: 7 }, pets: { raven: 6 }, petOn: 'raven' } };
  const mm = M.ensureMeta(old, T0);
  check(eq(mm.gear, { weapon: 14, armor: 9, ring: 20, bag: 7 }) && mm.xp === 4500 && mm.gold === 321 && mm.stone === 7 && mm.pets.raven === 6, 'v1.2 migração: níveis, XP e recursos preservados');
  check(M.permOf(mm).dmgPct === .13 && M.permOf(mm).block === 16 && M.permOf(mm).crit === .095 && M.permOf(mm).gold === 3 && M.permOf(mm).hp === M.levelOf(4500).lv - 1, 'v1.2 migração: bônus recalculados pela fórmula nova');
  check(M.permOf(mk()).hp === 0 && M.permOf(mk()).pet === null, 'permOf base: zero e sem companheiro');
}

// companheiros
{
  const m = mk(); m.egg = 1;
  for (const k of D.PETKEYS) m.pets[k] = 1;
  check(M.hatch(m, () => 0) === 'food' && m.food === 10 && m.egg === 0, 'hatch com todos: 10 rações');
  check(M.hatch(m, () => 0) === null, 'hatch sem ovo: null');
  const n = mk(); n.egg = 2;
  const k1 = M.hatch(n, () => 0), k2 = M.hatch(n, () => .99);
  check(D.PETKEYS.includes(k1) && D.PETKEYS.includes(k2) && k1 !== k2 && n.pets[k1] === 1, 'hatch escolhe um que falta, sem repetir');
  check(M.feedCost(1) === 2 && M.feedCost(9) === 10, 'feedCost = L+1');
  const f = mk(); const key = D.PETKEYS[0]; f.pets[key] = 1; f.food = 2;
  check(M.feedPet(f, key) && f.pets[key] === 2 && f.food === 0, 'feedPet sobe o nível');
  check(M.feedPet(f, key) === false, 'feedPet sem ração falha');
  f.pets[key] = 10; f.food = 99;
  check(M.feedPet(f, key) === false && M.feedPet(f, 'naoexiste') === false, 'feedPet: nível 10 e pet que não tem falham');
  const p = mk(); p.pets[key] = 4; M.setPetOn(p, key);
  check(M.permOf(p).pet.key === key && M.permOf(p).pet.mul === 1.3, 'permOf: pet nível 4 → mul 1,3');
  M.setPetOn(p, 'naoexiste'); check(p.petOn === null, 'setPetOn ignora pet que não tem');
}

// jornada
{
  check(eq(M.journeyRewards(10, true, 2, 'normal'), { gold: 165, stone: 2, xp: 100 }), 'jornada completa com Ascensão 2 (v1.4 ID 8: 1 pedra a cada 4 vitórias)');
  check(eq(M.journeyRewards(5, false, 0, 'daily'), { gold: 25, stone: 0, xp: 50 }), 'diário: metade do ouro, sem pedras');
  check(M.journeyRewards(5, false, 0, 'duel').stone === 0, 'duelo: sem pedras');
}

// propaganda e loja
{
  const m = mk(); m.energy = 0;
  check(M.adUse(m, T0, 'energy') && M.adUse(m, T0, 'energy') && M.adUse(m, T0, 'energy') && m.energy === 30, 'propaganda de energia 3x (+10)');
  check(M.adUse(m, T0, 'energy') === false, 'propaganda de energia: 4ª falha');
  check(M.adUse(m, T0 + DAY, 'energy') === 10, 'propaganda de energia: volta no dia seguinte');
  check(M.adUse(m, T0, 'shop') && m.gold === 50 && M.adUse(m, T0, 'shop') === false, 'propaganda da loja: 50 ouro 1x');
  check(M.adUse(m, T0, 'double') && M.adUse(m, T0, 'double') === false, 'propaganda do dobro 1x');
  const cap = mk(); cap.energy = 95;
  check(M.adUse(cap, T0, 'energy') === 4 && cap.energy === 99 && cap.ad.energy === 1, 'propaganda de energia perto de 99: devolve só o que entrou (4)');
  check(M.adUse(cap, T0, 'energy') === false && cap.energy === 99 && cap.ad.energy === 1, 'propaganda de energia com 99: recusa sem gastar a vez');
  const cg = mk(); cg.gold = 99999;
  check(M.adUse(cg, T0, 'shop') === false && cg.ad.shop === 0, 'propaganda da loja com ouro no limite: recusa sem gastar a vez');
  const c10 = mk(); check(M.adUse(c10, T0, 'energy') === 10, 'propaganda de energia normal devolve 10');
  const b = mk(); b.ruby = 100; b.energy = 0;
  check(M.buy(b, T0, 'energy30') && M.buy(b, T0, 'energy30') && b.energy === 60 && b.ruby === 70, 'loja: energia 2x');
  check(M.buy(b, T0, 'energy30') === false && M.buy(b, T0 + DAY, 'energy30'), 'loja: energia limitada a 2 por dia');
  b.ruby = 100;
  check(M.buy(b, T0, 'stone3') && b.stone === 3 && M.buy(b, T0, 'food5') && b.food === 5 && M.buy(b, T0, 'egg') && b.egg === 1 && b.ruby === 50, 'loja: pedras, rações e ovo');
  b.ruby = 0; check(M.buy(b, T0, 'egg') === false && M.buy(b, T0, 'xyz') === false, 'loja: sem rubis ou oferta inválida falha');
}

// conquistas
{
  const prof = { totalWins: 0, ach: { a: 1 } };
  const m = M.ensureMeta(prof, T0);
  check(M.achRuby(m, ['a']) === 0 && m.ruby === 0, 'achRuby: conquista antiga não paga');
  check(M.achRuby(m, ['a', 'b']) === 5 && m.ruby === 5, 'achRuby: conquista nova paga 5 rubis');
  check(M.achRuby(m, ['a', 'b']) === 0 && m.ruby === 5, 'achRuby: só uma vez');
}

// rodada de correção 1
{
  // meta antiga/parcial
  const old = { totalWins: 3, ach: { a: 1 }, meta: { energy: 12, gold: 5 } };
  const m = M.ensureMeta(old, T0);
  check(m.gear.weapon === 1 && m.gear.bag === 1 && eq(m.pets, {}) && m.cal.idx === 0 && m.ad.energy === 0 && m.buys.energy30 === 0 && m.goals.ids.length === 5 && m.achBase.includes('a') && eq(m.achPaid, {}), 'backfill: meta parcial recebe todos os campos');
  check(m.energy === 12 && m.gold === 5 && m.ruby === 0 && m.xp === 30, 'backfill: mantém o que existe e zera/deriva o que falta');
  check(M.adUse(m, T0, 'energy') && M.buy(m, T0, 'egg') === false && M.claimCal(m, T0, true) && M.goalEvent(m, T0, 'win', 1) !== undefined && M.achRuby(m, ['z']) === 5, 'backfill: funções seguintes não quebram');
  const p2 = { totalWins: 0, meta: { v: 1, energy: 30, eAt: T0, xp: 0, gold: 0, ruby: 0, stone: 0, food: 0, egg: 0, gear: { weapon: 1, armor: 1, ring: 1, bag: 1 }, pets: {}, petOn: null, cal: { last: '', idx: 0 }, day: '2026-10-21' } };
  const m2 = M.ensureMeta(p2, T0);
  check(m2.day === '2026-10-21' && m2.ad && m2.buys && m2.goals && m2.goals.ids.length === 5 && M.adUse(m2, T0, 'energy'), 'backfill: meta de hoje sem ad/buys/goals');

  // o dia só avança
  const b = mk(); b.ruby = 99; b.energy = 0;
  M.claimCal(b, T0, false); M.adUse(b, T0, 'shop'); M.buy(b, T0, 'energy30'); M.buy(b, T0, 'energy30');
  M.goalEvent(b, T0, M.GOALS[b.goals.ids[0]].ev, 99);
  const gSnap = JSON.stringify(b.goals), back = T0 - 2 * DAY;
  check(M.calToday(b, back).claimed && M.claimCal(b, back, false) === null, 'relógio para trás: calendário continua pego');
  check(M.adUse(b, back, 'shop') === false && M.buy(b, back, 'energy30') === false, 'relógio para trás: contadores de propaganda e loja não zeram');
  check(JSON.stringify(b.goals) === gSnap && M.goalsToday(b, back).pts === b.goals.pts && b.day === '2026-10-21', 'relógio para trás: metas não são sorteadas de novo');
  check(M.ensureMeta({ meta: b }, back) === b && b.day === '2026-10-21', 'relógio para trás: ensureMeta não rola o dia');

  // dobro dentro de claimCal
  const d = mk();
  check(M.claimCal(d, T0, true).gold === 200 && d.ad.double === 1, 'dobro: paga 200 e gasta o contador');
  const e = mk(); M.adUse(e, T0, 'double');
  check(M.claimCal(e, T0, true).gold === 100 && e.gold === 100, 'dobro já usado hoje: paga o simples');
  const f = mk(); M.claimCal(f, T0, false);
  check(M.claimCal(f, T0, true) === null && f.ad.double === 0, 'dobro: já pego hoje não gasta o contador');

  // rollover pelas funções de evento
  const g = mk(); g.goals.pts = 100; g.goals.done = ['x'];
  check(M.claimChest(g, T0 + DAY, 0) === null && g.goals.pts === 0, 'virada: claimChest rola o dia e não paga o baú velho');
  const h = mk(); h.goals.p = { zzz: 1 };
  M.goalEvent(h, T0 + DAY, 'win', 1); check(h.day === '2026-10-22' && h.goals.p.zzz === undefined, 'virada: goalEvent rola o dia');
  const k = mk(); M.claimCal(k, T0, false); M.adUse(k, T0, 'double');
  check(M.claimCal(k, T0 + DAY, true).energy === 20 && k.ad.double === 1, 'virada: claimCal no dia novo (dobro volta a valer)');

  // baús 1 e 2, calendário dias 2 a 6
  const c = mk(); c.goals.pts = 100;
  const r1 = M.claimChest(c, T0, 1), r2 = M.claimChest(c, T0, 2);
  check(eq(r1, { stone: 2, food: 3 }) && c.stone === 2 && c.food === 3, 'baú 1: 2 pedras + 3 rações');
  check(eq(r2, { ruby: 15, energy: 10 }) && c.ruby === 15, 'baú 2: 15 rubis + 10 energia');
  const w = mk(), exp = [{ gold: 100 }, { energy: 10 }, { stone: 3 }, { food: 5 }, { ruby: 20 }, { egg: 1 }];
  check(exp.every((x, i) => eq(M.claimCal(w, T0 + i * DAY, false), x)), 'calendário: dias 1 a 6 conforme a tabela');
  check(w.gold === 100 && w.stone === 3 && w.food === 5 && w.ruby === 20 && w.egg === 1, 'calendário: recursos creditados');

  // achRuby e hatch no limite
  const a = mk(); a.ruby = 99998;
  check(M.achRuby(a, ['n']) === 1 && a.ruby === 99999, 'achRuby devolve só o que entrou');
  const hh = mk(); hh.egg = 1; hh.food = 99999; for (const kk of D.PETKEYS) hh.pets[kk] = 1;
  check(M.hatch(hh, () => 0) === null && hh.egg === 1, 'hatch com rações no limite: não consome o ovo');
  check(M.dayKey(NaN) === new Date().toISOString().slice(0, 10), 'dayKey não finito vira hoje');

  // Ruling 5: prêmio de conta do Diário/Duelo só na 1ª jornada do dia
  const rw = mk();
  check(M.rewardOk(rw, T0, 'daily') && M.rewardOk(rw, T0, 'duel') && M.rewardOk(rw, T0, 'normal'), 'prêmio: tudo liberado no começo do dia');
  M.markReward(rw, T0, 'daily');
  check(M.rewardOk(rw, T0, 'daily') === false && M.rewardOk(rw, T0, 'duel') === true, 'prêmio: Diário pago bloqueia só o Diário');
  M.markReward(rw, T0, 'duel'); M.markReward(rw, T0, 'normal');
  check(M.rewardOk(rw, T0, 'duel') === false && M.rewardOk(rw, T0, 'normal') && M.rewardOk(rw, T0, 'seed') && M.rewardOk(rw, T0, 'challenge') && rw.rw.normal === undefined, 'prêmio: Duelo bloqueia; normal, seed e desafio nunca');
  check(M.rewardOk(rw, T0 + DAY, 'daily') && M.rewardOk(rw, T0 + DAY, 'duel') && rw.rw.daily === 0, 'prêmio: dia novo libera de novo');
  M.markReward(rw, T0 + DAY, 'daily');
  check(M.rewardOk(rw, T0 + DAY - 3600000, 'daily') === false, 'prêmio: relógio para trás não libera');
  const oldM = M.ensureMeta({ totalWins: 0, meta: { v: 1, day: '2026-10-21', energy: 30, eAt: T0 } }, T0);
  check(oldM.rw.daily === 0 && oldM.rw.duel === 0, 'prêmio: meta antiga ganha o contador');

  // Ruling 6: dia salvo muito à frente do relógio = correção
  const c1 = mk(); M.claimCal(c1, T0, false); M.claimCal(c1, T0 + DAY, false); M.markReward(c1, T0 + DAY, 'daily');
  check(M.calToday(c1, T0).claimed && c1.day === '2026-10-22', 'relógio 1 dia à frente: segue travado (Ruling 1)');
  const ck = mk(); M.claimCal(ck, T0, false); M.adUse(ck, T0, 'shop');
  M.claimCal(ck, T0 + 3 * DAY, false); M.adUse(ck, T0 + 3 * DAY, 'shop'); M.markReward(ck, T0 + 3 * DAY, 'daily'); ck.goals.pts = 40;
  const ct = M.calToday(ck, T0);
  check(ck.day === '2026-10-21' && ck.dayMax === '2026-10-24' && ck.ad.shop === 1 && ck.goals.pts === 40 && ck.rw.daily === 1 && ct.claimed && ck.cal.last === '2026-10-24',
    'relógio 3 dias à frente: só o marcador do dia volta; contadores, metas e calendário continuam usados');
  check(M.calToday(ck, T0 + DAY).claimed && ck.ad.shop === 1 && ck.day === '2026-10-22', 'dia real seguinte, ainda antes do dia já aberto: nada reabre');
  check(!M.calToday(ck, T0 + 4 * DAY).claimed && ck.ad.shop === 0 && ck.rw.daily === 0 && ck.dayMax === '2026-10-25', 'depois do dia mais adiantado já aberto: o dia vira normalmente');
  const c2 = mk(); c2.day = '2026-10-23';
  M.goalsToday(c2, T0); check(c2.day === '2026-10-23', 'exatamente 2 dias à frente: ainda não corrige');

  // Loop do relógio (P1 #4): 10 ciclos de +3 dias / pegar tudo / voltar não rendem nada a mais
  {
    const lp = mk(); lp.energy = 0;
    const grab = t => { let n = 0; if (M.claimCal(lp, t, true)) n++; for (let i = 0; i < 3; i++) if (M.adUse(lp, t, 'energy')) n++; if (M.adUse(lp, t, 'shop')) n++;
      if (M.rewardOk(lp, t, 'daily')) { M.markReward(lp, t, 'daily'); n++; } return n; };
    const first = grab(T0);
    let real = 0, future = 0; const perCycle = [];
    for (let c = 0; c < 10; c++) { lp.energy = 0; const f = grab(T0 + 3 * DAY); future += f; const r = grab(T0); real += r; perCycle.push(f + '/' + r); }
    check(first === 6, 'loop do relógio: dia real paga uma vez (calendário, 3 propagandas, ouro, prêmio do Diário)');
    check(real === 0, 'loop do relógio: 10 voltas ao dia real não pagam nada de novo (' + perCycle.join(' ') + ')');
    check(future === 6, 'loop do relógio: o dia adiantado paga só na 1ª ida, e nunca de novo (' + future + ')');
    let between = 0; for (let d = 1; d <= 3; d++) between += grab(T0 + d * DAY);
    check(between === 0 && grab(T0 + 4 * DAY) === 6, 'loop do relógio: dias reais até o dia já aberto não pagam; o dia seguinte paga normal');
  }

  // teto do dayMax: relógio mais de 14 dias à frente não trava o calendário por semanas/anos
  {
    const fz = mk(); M.claimCal(fz, T0, false);
    M.claimCal(fz, T0 + 30 * DAY, false); M.adUse(fz, T0 + 30 * DAY, 'shop');
    const back = M.calToday(fz, T0);
    check(back.claimed && eq(fz.used, [['2026-10-21', '2026-10-21'], ['2026-11-20', '2026-11-20']]) && fz.dayMax === '2026-10-21' && fz.capOn === '2026-10-21' && fz.ad.shop === 1,
      'v1.4 relógio 30 dias à frente e de volta: hoje segue pego, contadores usados; a trava desce até a âncora (o último dia aberto antes do salto)');
    check(!M.calToday(fz, T0 + DAY).claimed, 'relógio 30 dias à frente: o dia real seguinte (nunca aberto) abre normalmente');
    M.calToday(fz, T0 + 30 * DAY);
    check(fz.dayOpen === '2026-10-22' && fz.dayMax === '2026-10-22', 'v1.4: o dia já aberto lá na frente (em m.used) não reabre quando o relógio volta a ele');
    // perfil antigo (v8.4, sem m.used) com a trava muito à frente: sem histórico abaixo dela não há âncora, então a trava fica e a tela diz quando abre
    const om = mk(); om.dayMax = '2027-06-01'; om.cal.last = '2027-06-01'; delete om.dayOpen; delete om.used; delete om.capOn;
    const old = M.ensureMeta({ totalWins: 0, ach: {}, meta: om }, T0);
    check(eq(old.used, [['2027-06-01', '2027-06-01']]) && old.dayMax === '2027-06-01' && M.calToday(old, T0).claimed && M.calToday(old, T0 + DAY).claimed && (M.clockWait(old, T0 + DAY) || {}).day === '2027-06-02',
      'perfil antigo com a trava 14+ dias à frente e nada abaixo: segue travado, nada reabre, e clockWait diz a próxima data (2027-06-02)');
    // perfil da v8.5 de antes desta correção (days + far): vira m.used; tudo da data mais antiga até a trava conta como usado
    const v85 = M.ensureMeta({ totalWins: 0, ach: {}, meta: { day: '2026-10-21', dayOpen: '2026-10-22', dayMax: '2026-10-22', days: ['2026-10-19', '2026-10-21', '2026-10-22'], far: ['2026-11-20', '2026-11-21'], capOn: '2026-10-21', cal: { last: '2026-10-22', idx: 1 } } }, T0);
    check(eq(v85.used, [['2026-10-19', '2026-10-22'], ['2026-11-20', '2026-11-21']]) && v85.days === undefined && v85.far === undefined && M.calToday(v85, T0 + DAY).claimed && !M.calToday(v85, T0 + 2 * DAY).claimed,
      'migração v8.5: days/far viram m.used (10-19 a 10-22 inteiro, nada passado reabre); a próxima data nova abre');
    M.calToday(v85, T0 + 30 * DAY); check(v85.dayOpen === '2026-10-23' && v85.dayMax === '2026-10-23', 'migração v8.5: a data lá na frente que já pagou continua usada');
    const near = mk(); M.claimCal(near, T0 + 10 * DAY, false); M.calToday(near, T0);
    check(near.dayMax === '2026-10-31' && near.cal.last === '2026-10-31', '10 dias à frente: dentro do teto, segue travado até o dia aberto');
  }

  // meta do dia com id desconhecido (P2 #7): sorteia de novo, e goalEvent não quebra
  {
    const g = mk(); g.goals.ids[2] = 'oldgoal_removed';
    M.goalsToday(g, T0);
    check(g.goals.ids.every(id => M.GOALS[id]), 'metas: id desconhecido força novo sorteio');
    const h = mk(); h.goals.ids[0] = 'nope';
    let threw = false; try { M.goalEvent(h, T0, 'buy', 1); } catch (e) { threw = true; }
    check(!threw && h.goals.ids.every(id => M.GOALS[id]), 'metas: goalEvent com id desconhecido não lança');
  }

  // Ruling 7: compra que não cabe inteira é recusada
  const sh = mk(); sh.ruby = 100; sh.energy = 80;
  check(M.buy(sh, T0, 'energy30') === false && sh.ruby === 100 && sh.energy === 80 && sh.buys.energy30 === 0, 'loja: energia 80 + 30 > 99 recusa sem gastar rubis');
  sh.energy = 69; check(M.buy(sh, T0, 'energy30') && sh.energy === 99 && sh.ruby === 85, 'loja: energia que cabe justo (69 + 30 = 99) compra');
  sh.stone = 99998; check(M.buy(sh, T0, 'stone3') === false && sh.ruby === 85 && sh.stone === 99998, 'loja: 3 pedras com 99998 recusa');
  sh.stone = 99996; check(M.buy(sh, T0, 'stone3') && sh.stone === 99999, 'loja: 3 pedras que cabem compra');
  sh.egg = 99999; check(M.buy(sh, T0, 'egg') === false, 'loja: ovo no limite recusa');
}

// v1.2 (rodada 2) — decisão 10: na jornada, os bônus valem 100% na A0 e caem até 30% na A10
{
  const q = mk(); q.gear = { weapon: 20, armor: 20, ring: 20, bag: 20 }; q.xp = 1e9; q.pets = { raven: 10 }; q.petOn = 'raven';
  const full = M.permOf(q), a0 = M.permFor(q, 0), a5 = M.permFor(q, 5), a10 = M.permFor(q, 10);
  check(eq(a0, full), 'v1.2: permFor na A0 = permOf (100%)');
  check(Math.abs(M.permScale(5) - .65) < 1e-9 && Math.abs(M.permScale(10) - .3) < 1e-9 && M.permScale(12) === M.permScale(10), 'v1.2: escala 100% → 65% (A5) → 30% (A10), sem passar do teto');
  const f10 = M.permScale(10); check(a10.hp === Math.round(29 * f10) && a10.block === Math.round(38 * f10) && Math.abs(a10.dmgPct - .19 * f10) < 1e-9 && Math.abs(a10.crit - .095 * f10) < 1e-9 && a10.gold === Math.floor(9 * f10), `v1.2: A10 com tudo no máximo: +${a10.hp} vida, +${a10.block} escudo, +${(a10.dmgPct * 100).toFixed(1)}% dano, +${(a10.crit * 100).toFixed(2)}% crítico, +${a10.gold} ouro`);
  check(Math.abs(a10.pet.mul - (1 + (full.pet.mul - 1) * f10)) < 1e-9 && a5.hp < a0.hp && a10.hp < a5.hp, 'v1.2: o bônus do companheiro também escala; A0 > A5 > A10');
}

// v1.2 — decisão 12: Ascensão libera com 2 vitórias de jornada no nível atual
{
  const p = { asc: {}, sticker: {} };
  check(M.ASC_WINS === 2, 'v1.2: ASC_WINS = 2');
  check(M.ascWin(p, 'warrior', 0) === false && (p.asc.warrior || 0) === 0 && p.ascW.warrior === 1, 'v1.2: 1ª vitória na A0 ainda não libera a A1');
  check(M.ascWin(p, 'warrior', 0) === true && p.asc.warrior === 1 && p.ascW.warrior === 0, 'v1.2: 2ª vitória na A0 libera a A1 e zera a contagem');
  check(M.ascWin(p, 'warrior', 0) === false && p.asc.warrior === 1 && p.ascW.warrior === 0, 'v1.2: vitória abaixo do nível atual não conta');
  check(M.ascWin(p, 'rogue', 0) === false && p.asc.warrior === 1 && p.ascW.rogue === 1 && p.ascW.warrior === 0, 'v1.2: contagem é por classe');
  const q = { asc: { pyro: 10 }, ascW: {} };
  check(M.ascWin(q, 'pyro', 10) === false && q.asc.pyro === 10, 'v1.2: A10 é o teto');
  const old = { asc: { paladin: 6 } }; // perfil de antes da v1.2: mantém o nível, começa a contagem do zero
  check(M.ascWin(old, 'paladin', 6) === false && old.asc.paladin === 6 && M.ascWin(old, 'paladin', 6) === true && old.asc.paladin === 7, 'v1.2 migração: perfil antigo mantém a A6 e precisa de 2 vitórias para a A7');
}

// v1.2 — decisão 13: Duelo (e Seed) não contam para desbloqueios, conquistas nem jornada completa
check(M.progressCounts('normal') && M.progressCounts('daily') && M.progressCounts('challenge') && !M.progressCounts('duel') && !M.progressCounts('seed'), 'v1.2: progressCounts — Duelo e Seed não contam; Normal, Diário e Desafio contam');
{ const r = M.journeyRewards(10, true, 0, 'duel'); check(r.gold === 75 && r.xp === 100 && r.stone === 0, 'v1.2: Duelo ainda paga a recompensa de conta do dia (metade do ouro, XP)'); }

// v1.2 — decisão 14: meta impossível é trocada pela próxima do sorteio do dia, só para aquele jogador
{
  const rich = t => M.ensureMeta({ totalWins: 0, ach: {}, meta: { gold: 5000, stone: 50 } }, t);
  let t = T0, guard = 0; while (!M.goalsToday(rich(t), t).ids.includes('upgrade1') && guard++ < 60) t += DAY;
  const base = M.goalsToday(rich(t), t).ids;
  check(base.includes('upgrade1'), 'v1.2: achou um dia com a meta "Melhore uma peça" (' + M.dayKey(t) + ')');
  const maxed = (pets, food) => { const m = rich(t); for (const k in m.gear) m.gear[k] = M.GEAR_MAX; m.pets = pets; m.food = food || 0; m.goals = null; return m; };
  const full = maxed({ raven: M.PET_MAX, owl: M.PET_MAX });
  const g = M.goalsToday(full, t);
  check(!g.ids.includes('upgrade1') && g.ids.length === base.length && new Set(g.ids).size === g.ids.length, 'v1.2: tudo no máximo → a meta some, sem repetir outra (' + g.ids.join(',') + ')');
  const ix = base.indexOf('upgrade1'), nx = g.ids[ix];
  check(nx && !base.includes(nx) && g.ids.filter((x, i) => i !== ix).join() === base.filter((x, i) => i !== ix).join(), 'v1.2: entra a próxima da lista do dia, no mesmo lugar (' + nx + ')');
  check(M.goalsToday(rich(t), t).ids.includes('upgrade1'), 'v1.2: só para aquele jogador — quem pode melhorar mantém a meta');
  check(M.goalsToday(maxed({ raven: 3 }, 10), t).ids.includes('upgrade1'), 'v1.2: equipamento no máximo mas companheiro para alimentar → meta continua');
  check(!M.goalsToday(maxed({}), t).ids.includes('upgrade1'), 'v1.2: equipamento no máximo e nenhum companheiro → meta trocada');
  const done = rich(t); M.goalEvent(done, t, 'upgrade', 1); for (const k in done.gear) done.gear[k] = M.GEAR_MAX;
  check(M.goalsToday(done, t).done.includes('upgrade1') && M.goalsToday(done, t).ids.includes('upgrade1'), 'v1.2: meta já cumprida não é trocada');
  check(M.goalEvent(full, t, M.GOALS[nx].ev, M.GOALS[nx].n).includes(nx), 'v1.2: a meta nova conta normalmente');
}


// v1.3 etapa 2 — Laboratório: não conta nem rende nada
check(!M.progressCounts('lab') && M.isLab('lab') && !M.isLab('normal'), 'v1.3: progressCounts — o Laboratório não conta');
{ const r = M.journeyRewards(10, true, 5, 'lab'); check(r.gold === 0 && r.stone === 0 && r.xp === 0, 'v1.3: Laboratório não rende ouro, pedras nem XP'); }
{ const m = mk(); check(M.rewardOk(m, T0, 'lab') === false && M.rewardOk(m, T0, 'normal') === true, 'v1.3: rewardOk recusa o Laboratório'); const s0 = JSON.stringify(m.rw); M.markReward(m, T0, 'lab'); check(JSON.stringify(m.rw) === s0, 'v1.3: markReward do Laboratório não mexe no contador do dia'); }

// v1.3 etapa 2 — descobertas do Codex (+2 rubis, uma vez cada; o Codex antigo não conta)
{
  const codex = { items: { sword: { seen: 3, bought: 1, merged: 0, forged: 0, wins: 2 }, whet: { seen: 0, bought: 0, merged: 0, forged: 0, wins: 0 } }, foes: { rat: { met: 2, beat: 1 }, slime: { met: 1, beat: 0 } }, recipes: { heroblade: 1 } };
  const prof = { totalWins: 3, ach: {}, codex };
  const m = M.ensureMeta(prof, T0);
  check(m.dsc.i.sword === 0 && m.dsc.r.heroblade === 0 && m.dsc.f.rat === 0, 'descobertas: o que já estava no Codex na migração fica como antigo (0)');
  check(!('whet' in m.dsc.i) && !('slime' in m.dsc.f), 'descobertas: item nunca visto e inimigo só encontrado (não derrotado) não entram');
  check(M.discNew(m).total === 0, 'descobertas: perfil antigo começa sem novidades');
  check(M.discClaim(m, 'i', 'sword') === null && m.ruby === 0, 'descobertas: entrada antiga não paga');
  // novidades depois da migração
  codex.items.whet.seen = 1; codex.items.whet.merged = 1; codex.items.axe = { seen: 0, bought: 1, merged: 0, forged: 0, wins: 0 }; codex.foes.slime.beat = 1; codex.recipes.infernal = 1;
  M.ensureMeta(prof, T0);
  const n = M.discNew(m);
  check(n.i === 2 && n.f === 1 && n.r === 1 && n.total === 4, 'descobertas: item fundido, item comprado, inimigo derrotado e receita forjada viram novidade (' + JSON.stringify(n) + ')');
  check(M.discIs(m, 'i', 'whet') && !M.discIs(m, 'i', 'sword'), 'descobertas: discIs só marca as novas');
  const r1 = M.discClaim(m, 'i', 'whet');
  check(r1 && r1.added === 2 && m.ruby === 2 && m.dsc.i.whet === 2, 'descobertas: abrir paga +2 rubis e marca como paga');
  check(M.discClaim(m, 'i', 'whet') === null && m.ruby === 2, 'descobertas: abrir de novo não paga');
  const snap = JSON.stringify(m.dsc); M.ensureMeta(prof, T0);
  check(JSON.stringify(m.dsc) === snap && M.discNew(m).total === 3, 'descobertas: sincronizar de novo não reabre nem duplica');
  // recarregar (perfil salvo e lido de volta) não devolve a novidade já paga
  const re = JSON.parse(JSON.stringify(prof)); const m2 = M.ensureMeta(re, T0 + 1000);
  check(m2.dsc.i.whet === 2 && m2.ruby === 2 && M.discClaim(m2, 'i', 'whet') === null, 'descobertas: perfil recarregado não paga de novo');
  // limite de rubis
  m.ruby = M.CAP - 1; const r2 = M.discClaim(m, 'f', 'slime');
  check(r2 && r2.added === 1 && r2.lost === 1 && m.ruby === M.CAP && m.dsc.f.slime === 2, 'descobertas: respeita o limite de 99.999 rubis (paga só o que cabe)');
  check(M.DISC_RUBY === 2, 'descobertas: valem 2 rubis');
  // perfil novo: tudo conta
  const fresh = { totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } }; const mf = M.ensureMeta(fresh, T0);
  fresh.codex.items.sword = { seen: 1, bought: 1 }; M.ensureMeta(fresh, T0);
  check(M.discNew(mf).i === 1, 'descobertas: perfil novo conta desde a primeira');
  // perfil sem Codex (formato muito antigo) não quebra
  const bare = { totalWins: 0, ach: {} }; const mb = M.ensureMeta(bare, T0);
  check(M.discNew(mb).total === 0 && mb.dsc && typeof mb.dsc.i === 'object', 'descobertas: perfil sem Codex não quebra');
  // registro corrompido é refeito como base (sem dar nada)
  const bad = { totalWins: 0, ach: {}, codex, meta: JSON.parse(JSON.stringify(prof.meta)) }; bad.meta.dsc = 'x'; const mx = M.ensureMeta(bad, T0);
  check(M.discNew(mx).total === 0 && mx.dsc.i.whet === 0, 'descobertas: registro com defeito volta à base (nada a pagar)');
}

// v1.4 (ID 3) — descoberta paga só pelo esforço: comprar/fundir o item, forjar a receita, vencer o inimigo
tryBlock(() => {
  const codex = { items: { sword: { seen: 2, bought: 0, merged: 0, forged: 0, wins: 0 } }, foes: { rat: { met: 1, beat: 0 } }, recipes: {} };
  const prof = { totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } };
  const m = M.ensureMeta(prof, T0); prof.codex = codex; M.ensureMeta(prof, T0);
  check(M.discNew(m).total === 0 && !('sword' in m.dsc.i), 'ID 3: item só visto na loja (e inimigo só encontrado) não vira novidade');
  codex.items.sword.bought = 1; M.ensureMeta(prof, T0);
  check(M.discIs(m, 'i', 'sword'), 'ID 3: o mesmo item comprado vira novidade');
  codex.items.helm = { seen: 1, bought: 0, merged: 2, forged: 0, wins: 0 }; codex.items.heroblade = { seen: 1, bought: 0, merged: 0, forged: 1, wins: 0 }; codex.foes.rat.beat = 1; codex.recipes.heroblade = 1;
  M.ensureMeta(prof, T0);
  check(M.discIs(m, 'i', 'helm') && M.discIs(m, 'i', 'heroblade') && M.discIs(m, 'f', 'rat') && M.discIs(m, 'r', 'heroblade'), 'ID 3: fundir, forjar e vencer viram novidade');
  // migração: novidades marcadas só por ver deixam de valer, sem tirar rubis já pagos
  const old = { totalWins: 0, ach: {}, codex: { items: { bomb: { seen: 3 }, torch: { seen: 1 }, dagger: { seen: 1, bought: 1 } }, foes: {}, recipes: {} },
    meta: { ruby: 10, dsc: { i: { bomb: 1, torch: 2, dagger: 1, sumiu: 1 }, r: { naoexiste: 1 }, f: { fantasma: 1 } } } };
  const mo = M.ensureMeta(old, T0);
  check(!('bomb' in mo.dsc.i) && mo.dsc.i.torch === 2 && mo.dsc.i.dagger === 1 && mo.ruby === 10, 'ID 3: novidade antiga só vista deixa de valer; a já paga continua paga; rubis intactos');
  check(!('sumiu' in mo.dsc.i) && !('naoexiste' in mo.dsc.r) && !('fantasma' in mo.dsc.f) && M.discNew(mo).total === 1, 'ID 3 / P2 #8: chave que o jogo não conhece sai do registro (selo zera)');
  old.codex.items.bomb.bought = 1; M.ensureMeta(old, T0);
  check(M.discIs(mo, 'i', 'bomb'), 'ID 3: a novidade que deixou de valer volta quando o item é comprado');
  // limite de 10 por dia
  const many = { totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } }; const ml = M.ensureMeta(many, T0);
  const keys = Object.keys(D.ITEMS).slice(0, 15); for (const k of keys) many.codex.items[k] = { seen: 1, bought: 1 }; M.ensureMeta(many, T0);
  let paid = 0; for (const k of keys.slice(0, 10)) { const r = M.discClaim(ml, 'i', k); if (r && r.added === 2) paid++; }
  const r11 = M.discClaim(ml, 'i', keys[10]);
  check(M.DISC_DAY === 10 && paid === 10 && r11 && r11.limit === true && ml.ruby === 20 && M.discIs(ml, 'i', keys[10]) && M.discLeft(ml) === 0, 'ID 3: no máximo 10 novidades por dia (20 rubis); a 11ª espera');
  const ml2 = M.ensureMeta(many, T0 + DAY);
  check(M.discLeft(ml2) === 10 && M.discClaim(ml2, 'i', keys[10]).added === 2, 'ID 3: no dia seguinte a fila continua');
  // relógio para trás e para a frente não renova o limite
  M.ensureMeta(many, T0); const lb = M.discLeft(ml2); M.ensureMeta(many, T0 + DAY);
  check(lb === 9 && M.discLeft(ml2) === 9, 'ID 3: relógio para trás e de volta não renova o limite do dia');
});
// v1.4 (ID 11) — "Coletar todos" respeita o limite do dia
tryBlock(() => {
  const p = { totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } }; const m = M.ensureMeta(p, T0);
  const keys = Object.keys(D.ITEMS).slice(0, 13); for (const k of keys) p.codex.items[k] = { seen: 1, merged: 1 }; M.ensureMeta(p, T0);
  const a = M.discClaimAll(m);
  check(a.n === 10 && a.added === 20 && a.rest === 3 && m.ruby === 20 && M.discNew(m).total === 3, 'ID 11: Coletar todos abre 10 (+20 rubis) e deixa 3 para amanhã');
  const b = M.discClaimAll(m);
  check(b.n === 0 && b.added === 0 && b.rest === 3 && m.ruby === 20, 'ID 11: Coletar todos no limite não paga nada');
  M.ensureMeta(p, T0 + DAY); const c = M.discClaimAll(m);
  check(c.n === 3 && c.rest === 0 && m.ruby === 26, 'ID 11: amanhã Coletar todos pega o resto');
});

// v1.4 (ID 2, rodada de correção 1) — relógio: cada data do calendário paga no máximo uma vez, para sempre (m.used + trava m.dayMax);
// a correção de relógio quebrado só desce a trava até a âncora do histórico, 1 vez a cada 30 dias do histórico
tryBlock(() => {
  const harvest = (m, t) => { let n = 0; m.energy = 0; const r = M.claimCal(m, t, true); if (r) n++; for (let i = 0; i < 3; i++) if (M.adUse(m, t, 'energy')) n++; if (M.adUse(m, t, 'shop')) n++;
    if (M.rewardOk(m, t, 'daily')) { M.markReward(m, t, 'daily'); n++; } m.ruby += 30; for (let i = 0; i < 2; i++) { m.energy = 0; if (M.buy(m, t, 'energy30')) n++; } m.energy = 0; return n; };
  const newP = () => ({ totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } });
  /* visita com o relógio em t: devolve a data se ela abriu agora (m.ad é trocado só quando uma data abre) */
  const visit = (p, t) => { const a0 = p.meta && p.meta.ad; const m = M.ensureMeta(p, t); return m.ad !== a0 ? m.dayOpen : null; };
  const claims = (p, ts) => { let n = 0; for (const t of ts) { const m = M.ensureMeta(p, t); if (M.claimCal(m, t, false)) n++; } return n; };
  // 1) o caso da spec: 20 ciclos de +15 dias e volta pagam o mesmo que 1
  const loop = (jump, cycles) => { const p = newP(); const m = M.ensureMeta(p, T0); const per = [];
    let tot = 0; for (let c = 0; c < cycles; c++) { const a = harvest(m, T0), b = harvest(m, T0 + jump * DAY); M.ensureMeta(p, T0); tot += a + b; per.push(a + '/' + b); } return { m, tot, per }; };
  const one = loop(15, 1), twenty = loop(15, 20);
  check(one.tot === 16 && twenty.tot === one.tot, 'ID 2: 20 ciclos de +15 dias/volta pagam o mesmo que 1 (' + twenty.tot + ' x ' + one.tot + '; ' + twenty.per.slice(0, 4).join(' ') + ' …)');
  // 2) relógio em T−1000 e andando 1 dia por vez por 200 dias (no mesmo dia real): nada abre
  { const p = newP(); M.claimCal(M.ensureMeta(p, T0), T0, false); const ts = []; for (let i = 0; i <= 200; i++) ts.push(T0 - 1000 * DAY + i * DAY);
    const n = claims(p, ts); check(n === 0 && p.meta.capOn === undefined, 'ID 2 (I-1): relógio 1000 dias atrás andando 200 dias: 0 resgates, 0 correções (' + n + ')'); }
  // 3) 5 datas passadas diferentes no mesmo dia real: 0 correções e 0 resgates
  { const p = newP(); M.claimCal(M.ensureMeta(p, T0), T0, false); let n = 0, caps = 0;
    for (let r = 0; r < 5; r++) { const P = T0 - (1000 + 500 * r) * DAY, c0 = p.meta.capOn; const ts = []; for (let i = 0; i <= 100; i++) ts.push(P + i * DAY); n += claims(p, ts); M.ensureMeta(p, T0); if (p.meta.capOn !== c0) caps++; }
    check(n === 0 && caps === 0 && p.meta.capOn === undefined, 'ID 2 (I-1): 5 âncoras no passado no mesmo dia real: 0 correções, 0 resgates (' + caps + '/' + n + ')'); }
  // 4) +60 dias, volta, +60 dias de novo: a 2ª ida não paga nenhuma data já paga
  { const p = newP(); M.ensureMeta(p, T0); const seen = {}; let dup = 0, first = 0, second = 0;
    for (let i = 1; i <= 60; i++) { const d = visit(p, T0 + i * DAY); if (d) { first++; if (seen[d]) dup++; seen[d] = 1; } }
    M.ensureMeta(p, T0);
    for (let i = 1; i <= 60; i++) { const d = visit(p, T0 + i * DAY); if (d) { second++; if (seen[d]) dup++; seen[d] = 1; } }
    check(first === 60 && second === 0 && dup === 0, 'ID 2 (I-2): +60 dias, volta, +60 de novo: 2ª ida não paga nada (' + first + '/' + second + ', repetidas ' + dup + ')'); }
  // 5) caso legítimo: relógio pula +5000 dias e é consertado; o dia real seguinte abre; 2º pulo dentro de 30 dias do histórico fica travado
  { const p = newP(); M.ensureMeta(p, T0); visit(p, T0 + 5000 * DAY); visit(p, T0 + 5001 * DAY);
    const fix = visit(p, T0 + DAY), nxt = visit(p, T0 + 2 * DAY);
    check(fix === '2026-10-22' && nxt === '2026-10-23' && p.meta.capOn === '2026-10-21' && p.meta.dayMax === '2026-10-23', 'ID 2: relógio +5000 dias e consertado: o dia real abre normalmente (correção na âncora 2026-10-21)');
    visit(p, T0 + 6000 * DAY); let n = 0; for (let i = 3; i <= 40; i++) if (visit(p, T0 + i * DAY)) n++;
    check(n === 0 && M.clockWait(p.meta, T0 + 40 * DAY) !== null, 'ID 2: 2º pulo dentro de 30 dias do histórico: a trava fica (0 datas abertas em 38 dias reais) e clockWait avisa'); }
  // 6) propriedade: 2.000 passeios aleatórios do relógio — nenhuma data abre 2 vezes, e quem nunca passa do dia real R abre no máximo R − 1º dia + 1 datas
  { let s0 = 12345; const rnd = () => { s0 = (s0 * 1103515245 + 12345) >>> 0; return s0 / 4294967296; };
    let twice = 0, over = 0, walks = 0;
    for (let w = 0; w < 2000; w++) { const p = newP(), F = T0 + Math.floor(rnd() * 40) * DAY; let t = F, R = F; const seen = {}; let opens = 0;
      const step = () => { const d = visit(p, t); if (d) { opens++; if (seen[d]) twice++; seen[d] = 1; } if (t > R) R = t; };
      step();
      for (let k = 0; k < 40; k++) { const x = rnd();
        if (x < .45) t += DAY; else if (x < .6) t += Math.ceil(rnd() * 40) * DAY; else if (x < .75) t -= Math.ceil(rnd() * 60) * DAY;
        else if (x < .9) t = F + Math.floor((rnd() * 3300) - 3000) * DAY; else t += Math.ceil(rnd() * 3000) * DAY;
        step(); }
      if (opens > Math.round((R - F) / DAY) + 1) over++; walks++; }
    check(walks === 2000 && twice === 0 && over === 0, 'ID 2: 2.000 passeios aleatórios do relógio: nenhuma data aberta 2 vezes (' + twice + '), aberturas ≤ dias reais (' + over + ')'); }
  // 7) m.used guarda no máximo 64 faixas; ao juntar, as datas do meio contam como usadas
  { const p = newP(); M.ensureMeta(p, T0); for (let i = 1; i <= 100; i++) visit(p, T0 + i * 3 * DAY);
    const u = p.meta.used; check(u.length === 64 && u[0][0] === '2026-10-21', 'ID 2: m.used limitado a 64 faixas, juntando as mais próximas (' + u.length + ')'); }
});

// v1.4 (rodada de correção 2, R1-I-1) — a correção desce bloco por bloco enquanto a âncora estiver mais de 14 dias à frente do relógio
tryBlock(() => {
  const newP = () => ({ totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } });
  const visit = (p, t) => { const a0 = p.meta && p.meta.ad; const m = M.ensureMeta(p, t); return m.ad !== a0 ? m.dayOpen : null; };
  const opensFrom = (p, d0, n) => { let k = 0; for (let i = 0; i < n; i++) if (visit(p, T0 + (d0 + i) * DAY)) k++; return k; };
  // cenário do revisor: relógio +365 dias por 60 dias reais, com uma pausa de 20 dias no meio; depois consertado
  { const p = newP(); visit(p, T0); for (let i = 1; i <= 60; i++) { if (i > 20 && i <= 40) continue; visit(p, T0 + (365 + i) * DAY); }
    const fix = visit(p, T0 + 61 * DAY), after = opensFrom(p, 62, 120);
    check(fix === M.dayKey(T0 + 61 * DAY) && after === 120 && p.meta.capOn === '2026-10-21' && M.clockWait(p.meta, T0 + 200 * DAY) === null,
      'R1-I-1: relógio +365 d com uma pausa de 20 d dentro, consertado: o dia real abre e os 120 seguintes também (âncora no histórico real)'); }
  // vários blocos aninhados lá na frente (+300, +200, +100, cada um com pausa > 14 d): a correção desce todos até o histórico real
  { const p = newP(); for (let i = 0; i < 5; i++) visit(p, T0 + i * DAY);
    for (const base of [100, 200, 300]) for (let i = 0; i < 5; i++) visit(p, T0 + (base + i) * DAY);
    const fix = visit(p, T0 + 5 * DAY);
    check(fix === M.dayKey(T0 + 5 * DAY) && p.meta.capOn === M.dayKey(T0 + 4 * DAY) && opensFrom(p, 6, 30) === 30, 'R1-I-1: 3 blocos aninhados lá na frente: a correção desce até o histórico real e o jogador segue (30/30)');
    // as datas lá na frente continuam usadas: quando o relógio real chega nelas, não pagam de novo
    let again = 0; for (const base of [100, 200, 300]) for (let i = 0; i < 5; i++) if (visit(p, T0 + (base + i) * DAY)) again++;
    check(again === 0, 'R1-I-1: as datas dos blocos lá na frente nunca pagam de novo (' + again + ')'); }
  // o laço da spec (20× +15 d / volta) continua sem pagar nada a mais
  { const p = newP(); visit(p, T0); let n = 0; for (let c = 0; c < 20; c++) { if (visit(p, T0 + 15 * DAY)) n++; if (visit(p, T0)) n++; }
    check(n === 1, 'R1-I-1: 20× (+15 d / volta) abre só a data +15 uma vez (' + n + ')'); }
  // a checagem dos 30 dias vale para a âncora final: 2º relógio quebrado dentro de 30 dias do histórico fica travado
  { const p = newP(); visit(p, T0); visit(p, T0 + 400 * DAY); visit(p, T0 + DAY); visit(p, T0 + 2 * DAY);
    visit(p, T0 + 500 * DAY); visit(p, T0 + 700 * DAY); const n = opensFrom(p, 3, 20);
    check(n === 0 && p.meta.capOn === '2026-10-21', 'R1-I-1: 2º salto dentro de 30 dias do histórico, mesmo com blocos aninhados: a trava fica (' + n + ')'); }
  // fuzz: nenhuma data paga 2 vezes com blocos aninhados e relógio ida e volta
  { let s0 = 777; const rnd = () => { s0 = (s0 * 1103515245 + 12345) >>> 0; return s0 / 4294967296; }; let twice = 0;
    for (let w = 0; w < 500; w++) { const p = newP(), seen = {}; let t = T0;
      for (let k = 0; k < 40; k++) { const x = rnd(); t = x < .5 ? t + DAY : x < .7 ? t + Math.ceil(rnd() * 400) * DAY : x < .9 ? T0 + Math.floor(rnd() * 60) * DAY : t - Math.ceil(rnd() * 100) * DAY;
        const d = visit(p, t); if (d) { if (seen[d]) twice++; seen[d] = 1; } } }
    check(twice === 0, 'R1-I-1: 500 passeios com blocos aninhados: nenhuma data paga 2 vezes (' + twice + ')'); }
});
// v1.4 (rodada de correção 2, R1-M-1) — piso do servidor: com a nuvem respondendo, nada antes de (dia do servidor − 1) abre
tryBlock(() => {
  const newP = () => ({ totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } });
  const visit = (p, t, srv) => { const a0 = p.meta && p.meta.ad; const m = M.ensureMeta(p, t, srv); return m.ad !== a0 ? m.dayOpen : null; };
  const walk = srv => { const p = newP(); let n = 0; for (let i = 0; i <= 1000; i++) if (visit(p, T0 - 1000 * DAY + i * DAY, srv)) n++; return { p, n }; };
  const withSrv = walk(T0), noSrv = walk(undefined);
  /* revisão final (I-1): com a hora do servidor na sessão, o dia que abre é o do servidor (antes: o piso deixava abrir também o dia − 1) */
  check(withSrv.n === 1 && withSrv.p.meta.srvDay === '2026-10-21' && withSrv.p.meta.dayOpen === '2026-10-21', 'R1-M-1: perfil novo com o relógio 1000 dias atrás, servidor conhecido: só o dia do servidor abre, uma vez (' + withSrv.n + ')');
  check(noSrv.n === 1001 && noSrv.p.meta.srvDay === undefined, 'R1-M-1: sem dia do servidor (só neste aparelho), nada muda (' + noSrv.n + ')');
  // aparelho 1 dia atrás do servidor (fuso, virada do dia): abre normalmente, pelo dia do servidor (revisão final, I-1)
  { const p = newP(); check(visit(p, T0, T0 + DAY) === '2026-10-22' && visit(p, T0 + DAY, T0 + 2 * DAY) === '2026-10-23', 'R1-M-1: aparelho até 1 dia atrás do servidor abre normalmente (pelo dia do servidor)'); }
  // o piso só sobe e fica no perfil: depois, mesmo sem nuvem, um relógio no passado não abre
  { const p = newP(); visit(p, T0 - 100 * DAY); visit(p, T0 - 100 * DAY, T0); M.ensureMeta(p, T0, T0 - DAY / 2); const sd = p.meta.srvDay;
    const r = JSON.parse(JSON.stringify(p)); let n = 0; for (let i = 1; i <= 30; i++) if (visit(r, T0 - 100 * DAY + i * DAY)) n++;
    check(sd === '2026-10-21' && n === 0, 'R1-M-1: o dia do servidor só sobe (hora do servidor até 1 dia mais baixa não muda) e vale depois de recarregar, mesmo sem nuvem (' + n + ')'); }
  // piso com defeito no perfil é descartado
  { const m = M.ensureMeta({ totalWins: 0, ach: {}, meta: { srvDay: 'ontem' } }, T0); check(m.srvDay === undefined, 'R1-M-1: srvDay com defeito é descartado'); }
});
// v1.4 (rodada de correção 3) — R2-M-1, R2-M-2 e R2-M-3
tryBlock(() => {
  const newP = () => ({ totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } });
  const visit = (p, t, srv) => { const a0 = p.meta && p.meta.ad; const m = M.ensureMeta(p, t, srv); return m.ad !== a0 ? m.dayOpen : null; };
  const opensFrom = (p, d0, n) => { let k = 0; for (let i = 0; i < n; i++) if (visit(p, T0 + (d0 + i) * DAY)) k++; return k; };
  // R2-M-1: conserto do relógio em duas etapas (+300 → +200 → hora real): a 2ª correção reaplica a mesma âncora e o jogador segue
  { const p = newP(); for (let i = 0; i < 5; i++) visit(p, T0 + i * DAY); for (let i = 0; i < 3; i++) visit(p, T0 + (300 + i) * DAY);
    for (let i = 0; i < 3; i++) visit(p, T0 + (200 + i) * DAY); const cap1 = p.meta.capOn;
    const fix = visit(p, T0 + 5 * DAY), more = opensFrom(p, 6, 30);
    check(cap1 === M.dayKey(T0 + 4 * DAY) && fix === M.dayKey(T0 + 5 * DAY) && more === 30 && p.meta.capOn === cap1, 'R2-M-1: conserto em duas etapas (+300 → +200 → real): o dia real abre e os 30 seguintes também (' + more + ')');
    let again = 0; for (const b of [200, 300]) for (let i = 0; i < 3; i++) if (visit(p, T0 + (b + i) * DAY)) again++;
    check(again === 0, 'R2-M-1: as datas lá na frente continuam usadas'); }
  // R2-M-1: com um dia real aberto no meio, a âncora muda e a espera de 30 dias volta a valer
  { const p = newP(); visit(p, T0); visit(p, T0 + 400 * DAY); visit(p, T0 + DAY); visit(p, T0 + 2 * DAY); visit(p, T0 + 500 * DAY);
    check(opensFrom(p, 3, 20) === 0 && p.meta.capOn === '2026-10-21', 'R2-M-1: 2º salto depois de abrir dias reais, dentro de 30 dias: a trava fica'); }
  // R2-M-2: hora do servidor absurda é ignorada (sem exceção); piso gravado no futuro volta para o dia do servidor
  { const p = newP(); let err = null; try { visit(p, T0, 1e17 * 1000); visit(p, T0, Date.UTC(2010, 0, 1)); visit(p, T0, NaN); } catch (e) { err = e.message; }
    check(err === null && p.meta.srvDay === undefined, 'R2-M-2: hora do servidor fora de [2020-01-01, 8,64e15 ms] é ignorada, sem exceção (' + err + ')'); }
  { const p = newP(); visit(p, T0); p.meta.srvDay = '2100-01-01'; const blocked = visit(p, T0 + DAY);
    const back = visit(p, T0 + 2 * DAY, T0 + 2 * DAY);
    check(blocked === null && back === '2026-10-23' && p.meta.srvDay === '2026-10-23', 'R2-M-2: piso gravado em 2100 trava só até a próxima hora do servidor, que o devolve ao dia do servidor'); }
  { const p = newP(); visit(p, T0, T0); M.ensureMeta(p, T0, T0 - 30 * DAY);
    check(p.meta.srvDay === M.dayKey(T0 - 30 * DAY), 'R2-M-2: piso mais de 1 dia à frente da hora do servidor recebida é limitado a ela'); }
  // R2-M-3 (refeito na revisão final, I-1): aparelho 5 dias atrás do servidor. Conectado, abre o dia do servidor e não há aviso;
  // numa sessão sem nuvem o piso barra a data do aparelho e o aviso pede para acertar a data (não promete uma data que anda)
  { const p = newP(); visit(p, T0 - 10 * DAY); const m = M.ensureMeta(p, T0 - 5 * DAY, T0); const on = m.dayOpen, wOn = M.clockWait(m, T0 - 5 * DAY);
    M.ensureMeta(p, T0 - 5 * DAY); const wOff = M.clockWait(p.meta, T0 - 5 * DAY), opened = visit(p, T0 + DAY);
    check(on === '2026-10-21' && wOn === null && eq(wOff, { late: true }) && opened === '2026-10-22' && M.clockWait(p.meta, T0 + DAY) === null,
      'R2-M-3: aparelho 5 dias atrás: conectado abre o dia do servidor sem aviso; sem nuvem, aviso "acerte a data" (' + JSON.stringify(wOff) + '); com a data certa, abre e o aviso some'); }
  // isDay: data impossível no perfil não trava nada nem lança
  { const m = M.ensureMeta({ totalWins: 0, ach: {}, meta: { srvDay: '2026-13-45', capOn: '2026-02-31x' } }, T0);
    check(m.srvDay === undefined && m.capOn === undefined && M.clockWait(m, T0) === null, 'rodada 3: srvDay/capOn com data impossível saem do perfil'); }
});
// v1.4 (revisão final, I-1) — relógio atrasado e jogo conectado: o dia que abre é o maior entre o do aparelho e o do servidor
tryBlock(() => {
  const newP = () => ({ totalWins: 0, ach: {}, codex: { items: {}, foes: {}, recipes: {} } });
  const D0 = Date.UTC(2026, 9, 21), H = 3600000;
  // um dia real: visitas às 1 h, 9 h e 20 h (UTC real). lag = quanto o aparelho está atrás; online = a sessão tem a hora do servidor.
  // Conta bônus pagos (e a data de cada um), propagandas de energia, recompensa do Diário, metas novas e limite do Codex zerado.
  const live = (p, i, lag, online, L) => { for (const h of [1, 9, 20]) { const t = D0 + i * DAY + h * H, dev = t - lag;
      const m = M.ensureMeta(p, dev, online ? t : undefined); if (L.g0 !== m.goals) { L.goals++; L.g0 = m.goals; }
      if (m.dscN === 0) L.dsc++; m.dscN = M.DISC_DAY;
      const c = M.claimCal(m, dev, false); if (c) { L.cal++; L.days.push(m.dayOpen); }
      m.energy = 0; for (let k = 0; k < 2; k++) if (M.adUse(m, dev, 'energy')) L.ad++;
      if (M.rewardOk(m, dev, 'daily')) { M.markReward(m, dev, 'daily'); L.rw++; } } };
  const fresh = () => ({ cal: 0, ad: 0, rw: 0, goals: 0, dsc: 0, days: [], g0: null });
  const once = days => new Set(days).size === days.length && days.every((d, i) => !i || d > days[i - 1]);
  // 5 dias com o relógio certo e conectado; depois o relógio cai 2 dias atrás e o jogador segue conectado por 30 dias
  { const p = newP(), L0 = fresh(); for (let i = 0; i < 5; i++) live(p, i, 0, true, L0);
    const L = fresh(); L.g0 = p.meta.goals; for (let i = 5; i < 35; i++) live(p, i, 2 * DAY, true, L);
    const want = []; for (let i = 5; i < 35; i++) want.push(M.dayKey(D0 + i * DAY));
    check(L.cal === 30 && eq(L.days, want), 'I-1: aparelho 2 dias atrás + hora do servidor por 30 dias: 1 bônus por dia do servidor, nas datas do servidor (' + L.cal + ')');
    check(L.ad === 90 && L.rw === 30 && L.goals === 30 && L.dsc === 30, 'I-1: e os limites do dia viram todo dia: propagandas 3/dia (' + L.ad + '), recompensa do Diário (' + L.rw + '), metas novas (' + L.goals + '), limite do Codex (' + L.dsc + ')');
    const m = p.meta; check(m.dayMax === want[29] && m.day === want[29] && m.srvDay === want[29], 'I-1: trava, marcador e piso ficam no dia do servidor (' + m.dayMax + ')');
    const g = M.goalsToday(M.ensureMeta(p, D0 + 34 * DAY + 20 * H - 2 * DAY - 5 * H, D0 + 34 * DAY + 20 * H), D0 + 34 * DAY + 20 * H - 2 * DAY - 5 * H);
    check(g.endsIn === 4 * H, 'I-1: o relógio das metas conta até a virada do dia do servidor (' + g.endsIn / H + ' h)'); }
  // o mesmo jogador sem nuvem (mesmos 5 dias conectado, depois 30 sem nuvem): comportamento de antes, 2 dias travados (as datas do
  // aparelho já tinham aberto) e depois 1 por dia, cada data uma vez
  { const p = newP(), L0 = fresh(); for (let i = 0; i < 5; i++) live(p, i, 0, true, L0);
    const L = fresh(); L.g0 = p.meta.goals; for (let i = 5; i < 35; i++) live(p, i, 2 * DAY, false, L);
    check(L.cal === 28 && once(L0.days.concat(L.days)) && L.days[0] === M.dayKey(D0 + 5 * DAY), 'I-1: o mesmo sem nuvem não muda: 28 bônus em 30 dias, cada data uma vez (' + L.cal + ')'); }
  // conectado com o aparelho atrás e depois sem nuvem no mesmo dia: as datas do aparelho já estão abaixo da trava, nada a mais
  { const p = newP(), L = fresh(); live(p, 0, 0, true, L); live(p, 1, 2 * DAY, true, L); live(p, 1, 2 * DAY, false, L); live(p, 1, DAY, false, L);
    check(L.cal === 2 && once(L.days), 'I-1: trocar entre conectado e sem nuvem no mesmo dia não paga de novo (' + L.cal + ')'); }
  // quem adianta o relógio não ganha nada a mais com a hora do servidor: os mesmos bônus, as mesmas datas, a mesma trava
  { const run = online => { const p = newP(), L = fresh(); let k = 0;
      for (let i = 0; i < 10; i++) for (const h of [1, 9, 20]) { const t = D0 + i * DAY + h * H, dev = t + (++k) * DAY;
        const m = M.ensureMeta(p, dev, online ? t : undefined); if (M.claimCal(m, dev, false)) { L.cal++; L.days.push(m.dayOpen); } }
      return { L, used: JSON.stringify(p.meta.used), max: p.meta.dayMax }; };
    const a = run(true), b = run(false);
    check(a.L.cal === b.L.cal && eq(a.L.days, b.L.days) && a.used === b.used && a.max === b.max && once(a.L.days), 'I-1: relógio adiantado a cada visita: com a hora do servidor, nada a mais (' + a.L.cal + ' = ' + b.L.cal + ')'); }
  // passeio aleatório (relógio para trás e para a frente, com e sem nuvem): nenhuma data paga 2 vezes e nada passa do maior relógio visto
  { const rnd = (s => () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296)(7); let bad = 0;
    for (let w = 0; w < 300; w++) { const p = newP(), days = []; let top = '';
      for (let i = 0; i < 40; i++) { const t = D0 + i * DAY / 2, x = rnd(), dev = t + (x < .4 ? -Math.floor(rnd() * 5) : x < .7 ? 0 : Math.floor(rnd() * 30)) * DAY, on = rnd() < .5;
        const hi = M.dayKey(Math.max(dev, on ? t : -Infinity)); if (hi > top) top = hi;
        const m = M.ensureMeta(p, dev, on ? t : undefined); if (M.claimCal(m, dev, false)) days.push(m.dayOpen); }
      if (new Set(days).size !== days.length || days.some(d => d > top)) bad++; }
    check(bad === 0, 'I-1: 300 passeios mistos (atrás, adiantado, com e sem nuvem): cada data paga no máximo uma vez (' + bad + ')'); }
});
// v1.4 (rodada de correção 3, R2-M-2) — js/cloud.js ignora iat fora de [2020-01-01, 8,64e15 ms]
tryBlock(() => {
  const tok = iat => 'h.' + Buffer.from(JSON.stringify({ iat })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.s';
  const load = (iat, perf) => { const c = { window: {}, Date, JSON, Number, Math, atob, console }; if (perf) c.performance = perf; c.window.ALFORJE_CONFIG = { url: 'u', key: 'k' };
    c.window.supabase = { createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: tok(iat), user: { id: 'x' } } } }), onAuthStateChange: () => {} } }) };
    vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'cloud.js'), 'utf8'), c, { filename: 'cloud.js' }); return c.window.AlforjeCloud; };
  const ok = load(Math.floor(T0 / 1000)), huge = load(1e17), old = load(Date.UTC(2010, 0, 1) / 1000);
  let clk = 1000; const mono = load(Math.floor(T0 / 1000), { now: () => clk });
  pending.push(Promise.all([ok.init(), huge.init(), old.init(), mono.init()]).then(() => {
    check(ok.serverTime() === Math.floor(T0 / 1000) * 1000 && huge.serverTime() === null && old.serverTime() === null, 'R2-M-2: cloud.js aceita iat bom e ignora iat absurdo (1e17 s) ou antigo (2010)');
    const s0 = mono.serverTime(); clk += 2 * 3600000; const s1 = mono.serverTime(); clk = 0;
    check(s0 === Math.floor(T0 / 1000) * 1000 && s1 === s0 + 2 * 3600000 && mono.serverTime() === s0, 'revisão final (I-1): serverTime = iat + tempo monotônico desde o token (2 h depois: +2 h; relógio monotônico para trás não desce do iat)');
  }).catch(e => check(false, 'cloud.js: ' + e.message)));
});

// v1.4 (ID 8) — pedras crescentes e ração sem uso vira ouro
tryBlock(() => {
  const m = mk(); for (const k of D.PETKEYS.slice(0, 2)) m.pets[k] = M.PET_MAX; m.cal.idx = 3;
  const r = M.claimCal(m, T0 + 3 * DAY, false);
  check(M.foodIdle(m) && r.food === undefined && r.gold === 150 && m.food === 0 && m.gold === 150, 'ID 8: com todos os companheiros obtidos no máximo, as 5 rações do calendário viram 150 de ouro');
  m.goals.pts = 100; const c = M.claimChest(m, T0 + 3 * DAY, 1);
  check(c.stone === 2 && c.food === undefined && c.gold === 90 && m.food === 0, 'ID 8: baú com ração vira ouro (3 rações = 90)');
  m.egg = 1; for (const k of D.PETKEYS) m.pets[k] = M.PET_MAX; const g0 = m.gold;
  check(M.hatch(m, () => 0) === 'gold' && m.gold === g0 + 300 && m.food === 0, 'ID 8: ovo com todos no máximo vira 300 de ouro');
  m.ruby = 50; check(M.buy(m, T0 + 3 * DAY, 'food5') === false && m.ruby === 50, 'ID 8: loja não vende ração sem uso');
  const n = mk(); n.pets[D.PETKEYS[0]] = 3; n.cal.idx = 3; const rn = M.claimCal(n, T0 + 3 * DAY, false);
  check(!M.foodIdle(n) && rn.food === 5 && n.food === 5, 'ID 8: com companheiro para alimentar, a ração continua ração');
  const z = mk(); check(!M.foodIdle(z), 'ID 8: sem nenhum companheiro, a ração continua ração');
});
// v1.4 (ID 12) — "Melhore uma peça ou alimente um companheiro" sai quando, no sorteio do dia, não há recursos para nada
tryBlock(() => {
  const prof = g => ({ totalWins: 0, ach: {}, meta: Object.assign({}, g) });
  let t = T0, guard = 0; while (!M.goalsToday(M.ensureMeta(prof({ gold: 5000, stone: 50 }), t), t).ids.includes('upgrade1') && guard++ < 60) t += DAY;
  const poor = M.ensureMeta(prof({ gold: 0, stone: 0 }), t);
  check(!poor.goals.ids.includes('upgrade1') && poor.goals.ids.length === 5, 'ID 12: sem ouro/pedras/rações para nada na hora do sorteio → meta trocada');
  const nearly = M.ensureMeta(prof({ gold: 24, stone: 5 }), t);
  check(!nearly.goals.ids.includes('upgrade1'), 'ID 12: 24 de ouro (falta 1 para a melhoria mais barata) → trocada');
  const ok = M.ensureMeta(prof({ gold: 25, stone: 1 }), t);
  check(ok.goals.ids.includes('upgrade1'), 'ID 12: com recurso para a melhoria mais barata → fica');
  const feed = M.ensureMeta(prof({ gold: 0, stone: 0, food: 2, pets: { raven: 1 } }), t);
  check(feed.goals.ids.includes('upgrade1'), 'ID 12: com ração para alimentar → fica');
  ok.gold = 0; ok.stone = 0; M.goalsToday(ok, t + 3600000);
  check(ok.goals.ids.includes('upgrade1'), 'ID 12: gastar depois do sorteio não troca a meta no meio do dia');
});
// v1.4 (ID 16) — o perfil limita números absurdos (P2 r2 #12)
tryBlock(() => {
  const bad = { totalWins: -5, ach: {}, meta: { energy: 1e9, gold: -50, ruby: 1e12, stone: 2.5, food: 'x', egg: NaN, xp: 3e9, gear: { weapon: 1e6, armor: 2.5, ring: -3, bag: '7' },
    pets: { raven: 999, owl: -5, turtle: 'x', dragao: 3 }, cal: { last: '', idx: 2.5 }, ad: { energy: -100, double: 7, shop: 1.5 }, buys: { energy30: -9 }, rw: { daily: -1 }, day: '2026-10-21', dayMax: 'nunca' } };
  const m = M.ensureMeta(bad, T0);
  check(m.energy === M.ENERGY_CAP && m.gold === 0 && m.ruby === M.CAP && m.stone === 2 && m.food === 0 && m.egg === 0 && m.xp === 1e7, 'ID 16: recursos e XP inteiros, não negativos e no teto');
  check(eq(m.gear, { weapon: 20, armor: 2, ring: 1, bag: 1 }) && eq(m.pets, { raven: 10 }) && m.cal.idx === 2, 'ID 16: níveis de equipamento 1–20, companheiros 1–10 (desconhecidos saem), calendário 0–6');
  check(m.ad.energy === 0 && m.ad.double === 1 && m.ad.shop === 1 && m.buys.energy30 === 0 && m.rw.daily === 0 && m.dayMax !== 'nunca', 'ID 16: contadores do dia dentro dos limites');
  const po = M.permOf(m); check(po.dmgPct === .19 && po.pet === null, 'ID 16: bônus de conta dentro do máximo');
  check(eq(M.journeyRewards(-3, false, NaN, 'normal'), { gold: 0, stone: 0, xp: 0 }), 'ID 16: prêmio de jornada com vitórias negativas não tira nada');
});

Promise.all(pending).then(() => { console.log(fails ?`\n${fails} FALHA(S)` : '\ntudo ok'); process.exit(fails ? 1 : 0); });
