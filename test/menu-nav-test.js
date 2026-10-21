// Teste de navegação do menu com abas (Tarefa 8). Rodar no navegador, com o jogo aberto:
//   eval(await (await fetch('/test/menu-nav-test.js')).text());
//
// SEM NUVEM: os testes nunca gravam no Supabase de produção. O interruptor de teste é localStorage 'alforje-test-offline'='1'
//   (navOffline(true/false)). Com ele ligado o jogo não entra na conta de convidado (cloudInit sai antes), não lê, não grava
//   (markDirty/cloudPush saem e deixam CLOUD.ready=false) e não mexe em 'alforje-ts'. Ele sobrevive ao recarregar a página.
//   Cada nav* guarda perfil, jornada e localStorage antes e devolve tudo no fim. Depois de desligar, recarregue para a nuvem voltar.
//
//   navA()            -> liga o interruptor, guarda tudo em 'alforje-test-snap' e começa uma jornada do Diário (grátis: não gasta energia).
//   (recarregar a página)
//   await navB()      -> confere: recarregar com jornada mostra só #app; abandonar mostra só #menu com Jogar .on;
//                        cloudAdopt() com jornada ativa volta para #app. No fim devolve o que navA guardou e desliga o interruptor.
//   await navC()      -> luta começada, ☰ -> Codex (página do menu) durante a luta; a luta termina: resultado sobre #app, e depois de
//                        "Ir ao mercador" (e das escolhas que vierem) continua só #app. Rode navA() antes. No fim devolve tudo e desliga o interruptor.
//   await navMeta()   -> energia e progressão na jornada: migração do perfil antigo, cobrança de 10, perm, Diário grátis, restauração sem perm, adoção pela nuvem, sem energia.
//   await navCamp()   -> aba Jogar = Acampamento (pílulas, relógio da energia), JORNADA -> herói (custo no COMEÇAR) -> Voltar; energia 0 abre a janela
//                        de energia; propaganda: 3 s sem fechar, depois +10 e "1/3 hoje"; energia 99 trava a propaganda.
//   await menuSweep() -> passa por todas as abas, modos e páginas do menu rodando alforjeAudit() (precisa de test/ui-audit.js), com o interruptor
//                        ligado (o Placar mostra a mensagem sem conexão). Usa a escolha de herói (estado novo) e no fim devolve a jornada (não roda durante uma luta).
//   await boardLive() -> OPCIONAL, só lê: abre o Placar carregado de verdade (precisa da nuvem: interruptor desligado e página recarregada) e audita.
window.navVis = s => { const e = document.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; };
window.navOne = () => navVis('#menu') !== navVis('#app');
const NAV_OFF = 'alforje-test-offline', NAV_SNAP = 'alforje-test-snap', NAV_KEYS = ['alforje-prof6', 'alforje-run6', 'alforje-ts'];
window.navOffline = on => { if (on) localStorage.setItem(NAV_OFF, '1'); else localStorage.removeItem(NAV_OFF); const C = window.__alforje.CLOUD; if (on) { C.ready = false; clearTimeout(C.timer); C.dirty = false; } };
// guarda perfil, jornada e as chaves do localStorage (null = ausente)
window.navKeep = () => { const A = window.__alforje, ls = {}; NAV_KEYS.forEach(k => ls[k] = localStorage.getItem(k));
  return { ls, prof: JSON.stringify(A.PROF), state: JSON.stringify(A.state), mode: A.MENU.mode, ready: A.CLOUD.ready, off: localStorage.getItem(NAV_OFF) }; };
window.navPut = (k, view) => { const A = window.__alforje; A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
  A.PROF = JSON.parse(k.prof); A.state = JSON.parse(k.state); A.MENU.mode = k.mode;
  NAV_KEYS.forEach(n => { if (k.ls[n] == null) localStorage.removeItem(n); else localStorage.setItem(n, k.ls[n]); });
  if (k.off == null) localStorage.removeItem(NAV_OFF); else localStorage.setItem(NAV_OFF, k.off);
  A.CLOUD.ready = k.off == null ? k.ready : false;
  if (view) { if (A.state.cls && A.state.phase !== 'class') { A.showRun(); A.render(); } else A.campScreen(); } };
// fim de navB/navC: devolve o que navA guardou e desliga o interruptor
window.navEnd = () => { const raw = localStorage.getItem(NAV_SNAP); if (!raw) return false; const k = JSON.parse(raw); k.off = null; k.ready = false;
  navPut(k, true); localStorage.removeItem(NAV_SNAP); localStorage.removeItem(NAV_OFF); return true; };
window.navA = () => { const A = window.__alforje;
  if (!localStorage.getItem(NAV_SNAP)) { const k = navKeep(); k.off = null; localStorage.setItem(NAV_SNAP, JSON.stringify(k)); }
  navOffline(true);
  const mode = A.MENU.mode; A.MENU.mode = 'daily'; A.state.phase = 'class'; A.state.cls = null;
  for (const c of window.AlforjeData.CLASSKEYS) { A.pickClass(c); if (A.state.cls) break; }
  A.MENU.mode = mode;
  return { app: navVis('#app'), menu: navVis('#menu'), one: navOne(), daily: A.state.mode === 'daily', offline: localStorage.getItem(NAV_OFF) === '1' };
};
window.navB = async () => {
  const A = window.__alforje, R = {};
  if (localStorage.getItem(NAV_OFF) !== '1') return { error: 'rode navA() e recarregue antes' };
  const ts0 = localStorage.getItem('alforje-ts');
  const menu = document.querySelector('#menu');
  R.reload_onlyApp = !!menu && menu.hidden === true && navVis('#app');
  R.offline = !A.CLOUD.ready && !A.CLOUD.uid;
  const snap = { t: Date.now(), prof: JSON.stringify(A.PROF), run: JSON.stringify(A.state) };
  try {
    // abandonar: ☰ -> Abandonar -> confirmar
    document.querySelector('#helpBtn').click();
    document.querySelector('#abandon').click();
    document.querySelector('#cfOk').click();
    const jog = document.querySelector('#mtabs [data-nav="jogar"]');
    R.abandon_onlyMenu = navVis('#menu') && !navVis('#app') && !!jog && jog.classList.contains('on') && document.querySelector('#overlay').hidden;
    // cloudAdopt com jornada ativa
    A.cloudAdopt(snap);
    R.adopt_onlyApp = navVis('#app') && !navVis('#menu');
    R.noPush = !A.CLOUD.ready && !A.CLOUD.dirty;
  } finally { R.restored = navEnd(); }
  R.pass = R.reload_onlyApp && R.offline && R.abandon_onlyMenu && R.adopt_onlyApp && R.noPush && R.restored;
  return R;
};
window.navC = async () => {
  const A = window.__alforje, q = s => document.querySelector(s), R = {};
  if (!A.state.cls || A.state.phase !== 'shop') return { error: 'precisa de uma jornada na loja (rode navA() antes)' };
  if (localStorage.getItem(NAV_OFF) !== '1') return { error: 'rode navA() antes (liga o interruptor sem nuvem)' };
  try {
    A.fight(true);
    R.battle = A.state.phase === 'battle';
    q('#helpBtn').click(); q('#codexBtn').click();
    R.menuDuringBattle = navVis('#menu') && !navVis('#app');
    A.skip(); A.finish();
    R.resultOnApp = navVis('#app') && !navVis('#menu') && !q('#overlay').hidden;
    // continua: Ir ao mercador e escolhas (bênção, subclasse, encruzilhada) até a loja
    for (let i = 0; i < 6 && !q('#overlay').hidden; i++) {
      const b = q('#overlay #next') || q('#overlay [data-bless]') || q('#overlay [data-sub]') || q('#overlay #evA') || q('#overlay [data-exp]') || q('#overlay #closeOv');
      if (!b) break; b.click();
      if (!navVis('#app') || navVis('#menu')) { R.brokeAt = i; break; }
    }
    R.afterOnlyApp = navVis('#app') && !navVis('#menu');
    R.noPush = !A.CLOUD.ready && !A.CLOUD.dirty;
  } finally { R.restored = navEnd(); }
  R.pass = R.battle && R.menuDuringBattle && R.resultOnApp && R.afterOnlyApp && R.brokeAt === undefined && R.noPush && R.restored;
  return R;
};
window.menuSweep = async () => {
  const A = window.__alforje, out = {}, q = s => document.querySelector(s), click = s => { const e = q(s); if (!e) throw new Error('sem ' + s); e.click(); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const run = async (name, fn) => { fn(); await wait(120); const r = window.alforjeAudit(); if (!navOne()) r.push('menu e jornada juntos'); out[name] = r; };
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const K = navKeep(), hadRun = !!(A.state.cls && A.state.phase !== 'class'); navOffline(true);
  if (hadRun) A.state.phase = 'class';
  const M = A.MENU, keep = { mode: M.mode, chal: M.chal };
  try {
  await run('jogar:acampamento', () => { A.campScreen(); });
  for (const t of ['equip', 'pets', 'diario', 'loja']) await run('aba:' + t, () => click(`[data-nav="${t}"]`));
  await run('aba:jogar', () => click('[data-nav="jogar"]'));
  await run('pilula->loja', () => { A.campScreen(); click('#pGold'); });
  await run('heroi:normal', () => { A.campScreen(); click('#campGo'); click('[data-mode="normal"]'); });
  for (const m of ['daily', 'challenge', 'seed', 'duel']) await run('heroi:' + m, () => { A.classScreen(); click(`[data-mode="${m}"]`); });
  await run('heroi:challenge+desafio', () => { click('[data-mode="challenge"]'); const c = q('[data-chal]:not(:disabled)'); if (c) c.click(); });
  await run('heroi:historia+ascensao', () => { click('[data-mode="normal"]'); document.querySelectorAll('#mpage details').forEach(d => d.open = true); });
  await run('janela:semEnergia', () => { A.campScreen(); A.noEnergy(); });
  await run('janela:propaganda', () => { click('#closeOv'); A.watchAd('energy'); });
  click('[data-nav="jogar"]'); // troca a página: a propaganda some sem pagar
  await run('mais', () => { A.campScreen(); click('#cMore'); });
  for (const t of ['items', 'foes', 'recipes']) await run('codex:' + t, () => { A.moreScreen(); click('#codexBtn'); click(`[data-codex="${t}"]`); });
  await run('missoes', () => { A.moreScreen(); click('#missBtn'); });
  await run('placar', () => { A.moreScreen(); click('#boardBtn'); });
  out.boardBackMore = (click('#backRet'), !!q('#codexBtn'));
  await run('placar<-heroi(diario)', () => { A.classScreen(); click('[data-mode="daily"]'); click('#boardBtn'); });
  out.boardBackHero = (click('#backRet'), !!q('#goBtn'));
  for (const b of ['optBtn', 'achBtn', 'histBtn', 'howBtn', 'newsBtn']) await run('mais:' + b, () => { A.moreScreen(); click('#' + b); });
  M.mode = keep.mode; M.chal = keep.chal;
  await run('voltar->mais', () => { A.moreScreen(); click('#achBtn'); click('#backMore'); });
  out.backToMore = !!q('#codexBtn') && q('#mtabs [data-nav="jogar"]').classList.contains('on');
  await run('mais->voltar->acampamento', () => { A.moreScreen(); click('#back'); });
  out.jogarOn = !!q('#campGo') && q('#mtabs [data-nav="jogar"]').classList.contains('on');
  } finally { navPut(K, true); }
  if (hadRun) out.restored = navVis('#app') && !navVis('#menu');
  return out;
};
window.boardLive = async () => {
  const A = window.__alforje, q = s => document.querySelector(s);
  if (!A.CLOUD.ready) return { error: 'precisa da nuvem: navOffline(false) e recarregar' };
  A.moreScreen(); q('#boardBtn').click(); await new Promise(r => setTimeout(r, 1500));
  const r = window.alforjeAudit(); q('#backRet').click(); return r;
};
window.navCamp = async () => {
  const A = window.__alforje, R = {}, q = s => document.querySelector(s), wait = ms => new Promise(r => setTimeout(r, ms));
  const PK = 'alforje-prof6', RK = 'alforje-run6', TK = 'alforje-ts';
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), ts: localStorage.getItem(TK), mode: A.MENU.mode,
    profObj: JSON.parse(JSON.stringify(A.PROF)), stateObj: JSON.parse(JSON.stringify(A.state)), ready: A.CLOUD.ready };
  const hadRun = !!(keep.stateObj.cls && keep.stateObj.phase !== 'class');
  const off0 = localStorage.getItem(NAV_OFF); navOffline(true); // o teste nunca empurra dados de teste para a nuvem
  try {
    if (hadRun) { A.state.phase = 'class'; A.state.cls = null; }
    // 1) aba Jogar fora da jornada: Acampamento, pílulas e "+1 em m:ss" andando
    q('[data-nav="jogar"]').click();
    const m = A.META(); m.energy = 18; m.eAt = Date.now() - 60000; m.ad.energy = 0; A.campScreen();
    R.camp = !!q('#mpage .camp') && !!q('#campGo') && /JORNADA/.test(q('#campGo').textContent) && /⚡ 10/.test(q('#campGo').textContent)
      && q('#mtabs [data-nav="jogar"]').classList.contains('on') && /0\/3 hoje/.test(q('#adEnergy').textContent);
    R.pills = /18\/30/.test(q('#pEn').textContent) && !!q('#pGold') && !!q('#pRuby');
    // o relógio roda com o menu na tela (painel escondido segura os timers: além de esperar, o tick é chamado direto)
    const t0 = q('#pEn [data-et]').textContent; await wait(1100); if (q('#pEn [data-et]').textContent === t0) A.menuTick(); const t1 = q('#pEn [data-et]').textContent;
    R.timer = A.menuTicking() && /^\+1 em \d+:\d\d$/.test(t0) && t0 !== t1 && q('.camp [data-et]').textContent === t1;
    // 2) JORNADA -> escolha de herói (custo no COMEÇAR) -> Voltar -> Acampamento
    q('#campGo').click(); q('[data-mode="normal"]').click();
    R.hero = !!q('#goBtn') && !!q('#back') && /COMEÇAR ⚡10/.test(q('#goBtn').textContent);
    q('[data-mode="daily"]').click(); R.freeDaily = /COMEÇAR · grátis/.test(q('#goBtn').textContent);
    q('[data-mode="normal"]').click(); q('#back').click();
    R.backToCamp = !!q('#campGo') && !q('#goBtn');
    // 3) energia 0: COMEÇAR (normal) abre a janela de energia e não cria jornada
    m.energy = 0; m.eAt = Date.now(); q('#campGo').click(); q('#goBtn').click();
    R.noEnergy = !q('#overlay').hidden && !!q('#overlay #noEn') && /Faltam/.test(q('#overlay').textContent) && !!q('#overlay #adEnergy') && !!q('#overlay #neShop') && !!q('#overlay #neGoals')
      && A.state.phase === 'class' && !A.state.cls;
    // 4) propaganda de energia: 3 s sem botão para fechar, depois +10 e "1/3 hoje"
    q('#overlay #adEnergy').click();
    await wait(1500);
    R.adWaiting = !q('#overlay').hidden && !!q('#adCount') && !q('#overlay button') && A.META().energy === 0;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    R.adNoClose = !q('#overlay').hidden && !!q('#adCount');
    await wait(2000);
    R.adDone = q('#overlay').hidden && A.META().energy === 10 && A.META().ad.energy === 1;
    A.campScreen(); R.adCount = /1\/3 hoje/.test(q('#adEnergy').textContent);
    // 5) energia 98: a propaganda entra só +1 (limite 99); com 99 o botão fica travado e a propaganda não abre
    m.energy = 98; A.campScreen(); q('#adEnergy').click(); await wait(3300);
    R.capAdd = A.META().energy === 99 && A.META().ad.energy === 2 && /limite 99/.test(q('#toast').textContent);
    A.campScreen(); const ab = q('#adEnergy'); R.capBtn = ab.disabled && /máximo/.test(ab.textContent);
    A.watchAd('energy'); R.capNoAd = q('#overlay').hidden && A.META().ad.energy === 2;
    // 6) "Faltam" e N/3 vivos: a janela de energia acompanha a energia sem redesenhar
    m.energy = 3; m.eAt = Date.now(); A.noEnergy(); m.energy = 7; await wait(1100); A.menuTick();
    R.liveNeed = q('#overlay [data-need]').textContent === '⚡ 3' && /2\/3 hoje/.test(q('#overlay #adEnergy').textContent);
    A.closeOverlay();
    // 7) com o menu escondido o relógio para
    A.showRun(); const h0 = q('#pEn [data-et]').textContent; await wait(1100); R.tickStops = !A.menuTicking() && q('#pEn [data-et]').textContent === h0;
  } finally {
    A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
    A.PROF = keep.profObj; A.state = keep.stateObj; A.MENU.mode = keep.mode;
    [[PK, keep.prof], [RK, keep.run], [TK, keep.ts]].forEach(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); });
    if (off0 == null) localStorage.removeItem(NAV_OFF);
    A.CLOUD.ready = off0 == null ? keep.ready : false;
    if (hadRun) { A.showRun(); A.render(); } else A.campScreen();
  }
  R.tsSame = localStorage.getItem(TK) === keep.ts;
  R.pass = R.tsSame && R.capAdd && R.capBtn && R.capNoAd && R.liveNeed && R.camp && R.pills && R.timer && R.hero && R.freeDaily && R.backToCamp && R.noEnergy && R.adWaiting && R.adNoClose && R.adDone && R.adCount && R.tickStops;
  return R;
};
window.navMeta = async () => {
  const A = window.__alforje, R = {}, PK = 'alforje-prof6', RK = 'alforje-run6', TK = 'alforje-ts';
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), ts: localStorage.getItem(TK), mode: A.MENU.mode,
    profObj: JSON.parse(JSON.stringify(A.PROF)), stateObj: A.state ? JSON.parse(JSON.stringify(A.state)) : null, ready: A.CLOUD.ready };
  const off0 = localStorage.getItem(NAV_OFF); navOffline(true); // o teste nunca empurra dados de teste para a nuvem
  try {
    // 1) perfil antigo (sem meta, 12 vitórias): migra com XP 120 e energia 30
    const old = JSON.parse(keep.prof); delete old.meta; old.totalWins = 12;
    localStorage.setItem(PK, JSON.stringify(old)); A.loadProf();
    R.migrated = !!A.PROF.meta && A.PROF.meta.xp === 120 && A.PROF.meta.energy === 30;
    // 2) jornada normal: cobra 10 e guarda os bônus
    A.state.phase = 'class'; A.pickClass('warrior');
    R.normal = A.PROF.meta.energy === 20 && !!A.state.perm && A.state.mode === 'normal';
    // 3) Diário: grátis e sem bônus (a classe do dia é uma das quatro)
    A.state.phase = 'class'; A.MENU.mode = 'daily';
    A.state.cls = null;
    for (const k of window.AlforjeData.CLASSKEYS) { A.pickClass(k); if (A.state.cls) break; }
    R.daily = A.state.mode === 'daily' && A.PROF.meta.energy === 20 && A.state.perm == null;
    // 4) jornada salva sem perm: restaurar não cobra e continua sem bônus
    A.MENU.mode = 'normal'; A.state.phase = 'class'; A.pickClass('warrior');
    const s = JSON.parse(JSON.stringify(A.state)); delete s.perm; const e0 = A.PROF.meta.energy;
    A.cloudAdopt({ t: Date.now() + 1e4, prof: JSON.stringify(A.PROF), run: JSON.stringify(s) });
    R.restored = A.PROF.meta.energy === e0 && A.state.perm === undefined && A.state.cls === 'warrior';
    // 5) nuvem com perfil sem meta: migra ao adotar
    const cp = JSON.parse(JSON.stringify(A.PROF)); delete cp.meta; cp.totalWins = 7;
    A.cloudAdopt({ t: Date.now() + 2e4, prof: JSON.stringify(cp), run: JSON.stringify(s) });
    R.adopted = !!A.PROF.meta && A.PROF.meta.xp === 70 && A.PROF.meta.energy === 30;
    // 6) sem energia: não cria a jornada
    A.state.phase = 'class'; A.PROF.meta.energy = 5; A.PROF.meta.eAt = Date.now(); const before = A.state;
    A.pickClass('warrior');
    R.noEnergy = A.state === before && A.state.phase === 'class' && A.PROF.meta.energy === 5;
    // 7) Desfazer não rende meta: comprar e desfazer 8x deixa buy8 em 0; comprar e lutar conta
    A.state.phase = 'class'; A.state.cls = null; A.PROF.meta.energy = 30; A.PROF.meta.goals = { ids: ['buy8', 'win5', 'merge3', 'forge1', 'daily1'], p: {}, done: [], pts: 0, chests: [false, false, false] };
    A.pickClass('warrior'); A.state.gold = 999; let undone = 0;
    for (let i = 0; i < 8; i++) { A.buy(0); if (A.state.undo) { document.querySelector('#undo').click(); undone++; } }
    const p0 = A.PROF.meta.goals.p.buy8 || 0; A.buy(0); A.fight(true);
    R.undoNoFarm = undone > 0 && p0 === 0 && A.PROF.meta.goals.p.buy8 === 1;
    // 8) duelo com código inválido não começa
    A.state.phase = 'class'; A.state.cls = null; A.MENU.mode = 'duel'; A.MENU.duel = 'xx'; A.pickClass('warrior');
    R.duelInvalid = !A.state.cls;
  } finally {
    A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
    A.PROF = keep.profObj; if (keep.stateObj) A.state = keep.stateObj;
    A.MENU.mode = keep.mode;
    [[PK, keep.prof], [RK, keep.run], [TK, keep.ts]].forEach(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); });
    if (off0 == null) localStorage.removeItem(NAV_OFF);
    A.CLOUD.ready = off0 == null ? keep.ready : false;
  }
  R.tsSame = localStorage.getItem(TK) === keep.ts;
  R.pass = R.tsSame && R.migrated && R.normal && R.daily && R.restored && R.adopted && R.noEnergy && R.undoNoFarm && R.duelInvalid;
  return R;
};
