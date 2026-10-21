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
  check(eq(M.gearCost(1), { stone: 1, gold: 50 }) && eq(M.gearCost(5), { stone: 5, gold: 250 }), 'gearCost: L pedras, 50L ouro');
  check([1, 5, 6, 10, 11, 15, 16, 20].map(M.gearTier).join() === '1,1,2,2,3,3,4,4', 'gearTier: raridades');
  const m = mk();
  check(M.upgradeGear(m, 'weapon') === false && m.gear.weapon === 1, 'upgrade sem recursos falha');
  m.stone = 1; m.gold = 50;
  check(M.upgradeGear(m, 'weapon') && m.gear.weapon === 2 && m.stone === 0 && m.gold === 0, 'upgrade gasta recursos e sobe');
  m.gear.ring = 20; m.stone = 99; m.gold = 9999;
  check(M.upgradeGear(m, 'ring') === false && m.gear.ring === 20, 'nível 20 não sobe');
  const p = mk(); p.gear = { weapon: 6, armor: 4, ring: 3, bag: 5 }; p.xp = 300;
  const o = M.permOf(p); delete o.pet;
  check(eq(o, { hp: 6, block: 9, dmgPct: .1, crit: .02, gold: 4 }), 'permOf: arma 6, armadura 4, anel 3, bolsa 5, nível 3');
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
  check(eq(M.journeyRewards(10, true, 2, 'normal'), { gold: 165, stone: 3, xp: 100 }), 'jornada completa com Ascensão 2');
  check(eq(M.journeyRewards(5, false, 0, 'daily'), { gold: 25, stone: 0, xp: 50 }), 'diário: metade do ouro, sem pedras');
  check(M.journeyRewards(5, false, 0, 'duel').stone === 0, 'duelo: sem pedras');
}

// propaganda e loja
{
  const m = mk(); m.energy = 0;
  check(M.adUse(m, T0, 'energy') && M.adUse(m, T0, 'energy') && M.adUse(m, T0, 'energy') && m.energy === 30, 'propaganda de energia 3x (+10)');
  check(M.adUse(m, T0, 'energy') === false, 'propaganda de energia: 4ª falha');
  check(M.adUse(m, T0 + DAY, 'energy') === true, 'propaganda de energia: volta no dia seguinte');
  check(M.adUse(m, T0, 'shop') && m.gold === 50 && M.adUse(m, T0, 'shop') === false, 'propaganda da loja: 50 ouro 1x');
  check(M.adUse(m, T0, 'double') && M.adUse(m, T0, 'double') === false, 'propaganda do dobro 1x');
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

console.log(fails ? `\n${fails} FALHA(S)` : '\ntudo ok');
process.exit(fails ? 1 : 0);
