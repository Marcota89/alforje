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
    R.camp = !!q('#mpage .camp') && !!q('#campGo') && /JORNADA/.test(q('#campGo').textContent) && /10/.test(q('#campGo small').textContent) && !!q('#campGo img.ri-ico[src*="ui_energy"]')
      && q('#mtabs [data-nav="jogar"]').classList.contains('on') && /0\/3 hoje/.test(q('#adEnergy').textContent);
    R.pills = /18\/30/.test(q('#pEn').textContent) && !!q('#pGold') && !!q('#pRuby');
    // o relógio roda com o menu na tela (painel escondido segura os timers: além de esperar, o tick é chamado direto)
    const t0 = q('#pEn [data-et]').textContent; await wait(1100); if (q('#pEn [data-et]').textContent === t0) A.menuTick(); const t1 = q('#pEn [data-et]').textContent;
    R.timer = A.menuTicking() && /^\+1 em \d+:\d\d$/.test(t0) && t0 !== t1 && q('.camp [data-et]').textContent === t1;
    // 2) JORNADA -> escolha de herói (custo no COMEÇAR) -> Voltar -> Acampamento
    q('#campGo').click(); q('[data-mode="normal"]').click();
    R.hero = !!q('#goBtn') && !!q('#back') && /COMEÇAR 10/.test(q('#goBtn').textContent) && !!q('#goBtn img[src*="ui_energy"]');
    q('[data-mode="daily"]').click(); R.freeDaily = /COMEÇAR · grátis/.test(q('#goBtn').textContent);
    q('[data-mode="normal"]').click(); q('#back').click();
    R.backToCamp = !!q('#campGo') && !q('#goBtn');
    // 3) energia 0: COMEÇAR (normal) abre a janela de energia e não cria jornada
    m.energy = 0; m.eAt = Date.now(); q('#campGo').click(); q('#goBtn').click();
    R.noEnergy = !q('#overlay').hidden && !!q('#overlay #noEn') && /Faltam/.test(q('#overlay').textContent) && !!q('#overlay #adEnergy') && !!q('#overlay #neShop') && !!q('#overlay #neGoals') && !!q('#overlay #neDaily') && /Diário e Duelo não gastam energia/.test(q('#overlay').textContent)
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
    R.liveNeed = q('#overlay [data-need]').textContent === '3' && /2\/3 hoje/.test(q('#overlay #adEnergy').textContent);
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
    R.restored = A.PROF.meta.energy === e0 && A.state.perm == null && A.state.cls === 'warrior';
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
//   await navDaily()  -> Diário e Loja (Tarefa 5): bônus do dia (+100), 2º clique desabilitado, dobro (+200), metas até 40 pontos e baú, virada do dia SEM recarregar
//                        (Date.now deslocado só dentro do teste e devolvido no fim), compra de energia 2x (3ª desabilitada), compra não conta como meta 'buy',
//                        propaganda do ouro e botões IR. Sem nuvem; devolve perfil, jornada e localStorage no fim.
window.navDaily = async () => {
  const A = window.__alforje, AM = window.AlforjeMeta, R = {}, q = s => document.querySelector(s), wait = ms => new Promise(r => setTimeout(r, ms));
  const PK = 'alforje-prof6', RK = 'alforje-run6', TK = 'alforje-ts';
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), ts: localStorage.getItem(TK), mode: A.MENU.mode,
    profObj: JSON.parse(JSON.stringify(A.PROF)), stateObj: JSON.parse(JSON.stringify(A.state)), ready: A.CLOUD.ready };
  const hadRun = !!(keep.stateObj.cls && keep.stateObj.phase !== 'class');
  const off0 = localStorage.getItem(NAV_OFF); navOffline(true);
  const realNow = Date.now; let shift = 0; Date.now = () => realNow.call(Date) + shift; // só dentro deste teste
  if (!window.alforjeAudit) return { error: 'carregue test/ui-audit.js antes' };
  const aud = () => window.alforjeAudit();
  try {
    if (hadRun) { A.state.phase = 'class'; A.state.cls = null; }
    const m = A.META(); m.day = ''; A.META(); // dia novo: zera propagandas, compras e sorteia as metas
    m.cal.last = ''; m.cal.idx = 0; m.gold = 0; m.ruby = 100; m.energy = 10; m.eAt = Date.now(); m.stone = 0; m.food = 0; m.egg = 0;
    m.goals.ids = ['win5', 'merge3', 'cal1', 'daily1', 'upgrade1']; m.goals.p = {}; m.goals.done = []; m.goals.pts = 0; m.goals.chests = [false, false, false];
    // 1) aba Diário: calendário 4x2, hoje em verde, ponto vermelho na aba
    q('[data-nav="diario"]').click();
    R.page = !!q('#dCal') && q('#dCal').querySelectorAll('.dcell').length === 7 && !!q('#dCal .dcell.d7') && q('#dCal .dcell.now') === q('#dCal .dcell') && !!q('#dGoals');
    R.dot1 = !!q('#mtabs [data-nav="diario"] .k-dot') && q('#mtabs [data-nav="diario"] .k-dot').textContent === '1';
    const a0 = aud(); if (a0) R.audit0 = a0;
    const a1 = aud(); if (a1) R.audit1 = a1;
    // 2) PEGAR: ouro +100; o 2º clique não faz nada (botão desabilitado)
    q('#calGet').click();
    R.claim = m.gold === 100 && q('#calGet').disabled && q('#calDbl').disabled && /100/.test(q('#toast').textContent) && m.cal.idx === 1;
    q('#calGet').click(); R.noTwice = m.gold === 100;
    R.dot0 = !q('#mtabs [data-nav="diario"] .k-dot');
    R.calGoal = m.goals.p.cal1 === 1 && m.goals.done.includes('cal1'); // gev('cal') ao pegar o bônus
    // 3) dobro em outro perfil (calendário zerado, mesmo dia): propaganda de 3 s e ouro +200
    m.cal.last = ''; m.cal.idx = 0; m.gold = 0; m.ad.double = 0; A.dailyScreen();
    q('#calDbl').click(); await wait(1200);
    R.adOpen = !q('#overlay').hidden && !!q('#adCount') && m.gold === 0;
    await wait(2400);
    R.double = q('#overlay').hidden && m.gold === 200 && m.ad.double === 1 && q('#calGet').disabled && q('#calDbl').disabled;
    // dobro já usado hoje: o botão fica desabilitado e o texto avisa; o PEGAR simples ainda funciona
    m.cal.last = ''; m.cal.idx = 0; m.gold = 0; A.dailyScreen();
    R.dblUsed = q('#calDbl').disabled && /já usado/.test(q('#calDbl').textContent) && !q('#calGet').disabled;
    q('#calGet').click(); R.dblUsedGold = m.gold === 100;
    // dia 7 pego: o índice volta a 0; a célula 0 é "amanhã" (não ✔) e só as 7 anteriores ficam pegas
    m.cal.last = ''; m.cal.idx = 6; A.dailyScreen(); q('#calGet').click();
    const cs = [...document.querySelectorAll('#dCal .dcell')];
    R.wrap = cs.length === 7 && m.cal.idx === 0 && cs[0].classList.contains('nxt') && !cs[0].classList.contains('got') && /amanhã/.test(cs[0].getAttribute('aria-label')) && cs.slice(1).every(c => c.classList.contains('got')) && /Dia 1/.test(q('#dCal .muted').textContent);
    m.cal.last = AM.dayKey(Date.now()); m.cal.idx = 1; m.gold = 0; A.dailyScreen(); // pego hoje; amanhã é o Dia 2
    // 4) metas até 40 pontos e baú (energia 95 + 10: sobra e avisa)
    const done = id => { const d = AM.GOALS[id]; AM.goalEvent(m, Date.now(), d.ev, d.n); };
    done('win5'); m.energy = 95; m.gold = 0;
    A.dailyScreen();
    R.pts = m.goals.pts === 40 && q('[data-chest="0"]') && !q('[data-chest="0"]').disabled && q('[data-chest="1"]').disabled && q('[data-chest="2"]').disabled;
    R.dot2 = q('#mtabs [data-nav="diario"] .k-dot') && q('#mtabs [data-nav="diario"] .k-dot').textContent === '1';
    q('[data-chest="0"]').click();
    R.chest = m.gold === 100 && m.energy === 99 && m.goals.chests[0] === true && q('[data-chest="0"]').disabled && /Energia no máximo \(99\)/.test(q('#toast').textContent);
    R.dot3 = !q('#mtabs [data-nav="diario"] .k-dot');
    const a2 = aud(); if (a2) R.audit2 = a2;
    // 5) botões IR: Jogar, Diário (Desafio), Equipar, calendário
    q('[data-ir="play"]') && (R.irPlayBtn = true);
    const goals = () => [...document.querySelectorAll('#dGoals .dgoal')];
    const irOf = t => goals().find(g => g.textContent.includes(t)).querySelector('[data-ir]');
    R.irKinds = irOf('Desafio Diário').dataset.ir === 'daily' && irOf('Melhore').dataset.ir === 'equip' && irOf('Funda 3').dataset.ir === 'play';
    irOf('Funda 3').click(); R.irPlay = !!q('#campGo') && q('#mtabs [data-nav="jogar"]').classList.contains('on');
    A.dailyScreen(); irOf('Desafio Diário').click(); R.irDaily = !!q('#goBtn') && A.MENU.mode === 'daily';
    A.dailyScreen(); irOf('Melhore').click(); R.irEquip = q('#mtabs [data-nav="equip"]').classList.contains('on');
    A.dailyScreen('goals'); R.irGoalsScroll = !!q('#dGoals');
    // 6) virada do dia sem recarregar: a página aberta se refaz sozinha, metas novas e bônus do Dia 2 por pegar
    A.dailyScreen(); const day0 = q('#dCal').dataset.day; shift += 86400000; A.menuTick();
    R.nextDay = q('#dCal') && q('#dCal').dataset.day !== day0 && q('#dCal').dataset.day === AM.dayKey(Date.now()) && m.day === q('#dCal').dataset.day;
    R.nextCal = !q('#calGet').disabled && q('#dCal .dcell.now .dn').textContent === 'Dia 2' && m.goals.pts === 0 && !q('[data-chest="0"]').classList.contains('got') && !!q('#mtabs [data-nav="diario"] .k-dot');
    // reabrir pela aba também mostra o dia novo
    q('[data-nav="loja"]').click(); q('[data-nav="diario"]').click(); R.reopen = q('#dCal').dataset.day === AM.dayKey(Date.now()) && !q('#calGet').disabled;
    // limites: energia 99 trava a compra de energia; ouro 99999 trava a propaganda do ouro
    m.ruby = 100; m.energy = 99; m.gold = 99999; m.ad.shop = 0; m.buys.energy30 = 0; A.shopScreen();
    R.capEnergy = q('[data-buy="energy30"]').disabled && /Energia no máximo/.test(q('[data-buy="energy30"]').closest('.shopc').textContent);
    R.capGold = q('#adShop').disabled && /Ouro no máximo/.test(q('#adShop').textContent);
    q('[data-buy="energy30"]').click(); R.capNoSpend = m.ruby === 100 && m.energy === 99;
    // IR -> Desafio com jornada em andamento: não mexe na jornada, só avisa
    const st0 = A.state, ph0 = A.state.phase, cls0 = A.state.cls; A.state.cls = 'warrior'; A.state.phase = 'shop'; m.goals.ids = ['daily1', 'win5', 'merge3', 'forge1', 'buy8']; A.dailyScreen();
    q('[data-ir="daily"]').click();
    R.irRun = A.state === st0 && A.state.cls === 'warrior' && A.state.phase === 'shop' && !!q('#dGoals') && !q('#goBtn') && /Termine ou abandone/.test(q('#toast').textContent);
    A.state.cls = cls0; A.state.phase = ph0; m.goals.ids = ['buy8', 'win5', 'merge3', 'forge1', 'daily1'];
    // 7) Loja: energia 2x por 15 💎 (3ª desabilitada), não conta como meta 'buy'; ouro por propaganda 1/dia
    m.goals.ids = ['buy8', 'win5', 'merge3', 'forge1', 'daily1']; m.goals.p = {}; m.energy = 20; m.ruby = 100; m.gold = 0; m.stone = 0; m.food = 0; m.egg = 0;
    q('[data-nav="loja"]').click();
    R.shop = document.querySelectorAll('#shopL .shopc').length === 4 && /0\/2 hoje/.test(q('[data-buy="energy30"]').closest('.shopc').textContent);
    const a3 = aud(); if (a3) R.audit3 = a3;
    q('[data-buy="energy30"]').click(); R.buy1 = m.energy === 50 && m.ruby === 85 && /1\/2 hoje/.test(q('[data-buy="energy30"]').closest('.shopc').textContent) && /Comprou/.test(q('#toast').textContent);
    q('[data-buy="energy30"]').click(); R.buy2 = m.energy === 80 && m.ruby === 70;
    R.buy3 = q('[data-buy="energy30"]').disabled && /Esgotado/.test(q('[data-buy="energy30"]').closest('.shopc').textContent);
    q('[data-buy="energy30"]').click(); R.buy3No = m.energy === 80 && m.ruby === 70;
    q('[data-buy="stone3"]').click(); q('[data-buy="food5"]').click(); q('[data-buy="egg"]').click();
    R.others = m.stone === 3 && m.food === 5 && m.egg === 1 && m.ruby === 70 - 10 - 10 - 30;
    R.noBuyGoal = !m.goals.p.buy8;
    m.ruby = 5; q('[data-nav="diario"]').click(); q('[data-nav="loja"]').click();
    R.poor = [...document.querySelectorAll('[data-buy]')].every(b => b.disabled) && /Faltam/.test(q('#shopL').textContent);
    m.ad.shop = 0; m.gold = 10; A.shopScreen(); q('#adShop').click(); await wait(3400);
    R.adGold = m.gold === 60 && m.ad.shop === 1 && q('#adShop').disabled && /\+50/.test(q('#toast').textContent);
    const a4 = aud(); if (a4) R.audit4 = a4;
  } finally {
    Date.now = realNow;
    A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
    A.PROF = keep.profObj; A.state = keep.stateObj; A.MENU.mode = keep.mode;
    [[PK, keep.prof], [RK, keep.run], [TK, keep.ts]].forEach(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); });
    if (off0 == null) localStorage.removeItem(NAV_OFF);
    A.CLOUD.ready = off0 == null ? keep.ready : false;
    if (hadRun) { A.showRun(); A.render(); } else A.campScreen();
  }
  R.tsSame = localStorage.getItem(TK) === keep.ts; R.clockBack = Math.abs(Date.now() - realNow.call(Date)) < 50;
  const audits = [R.audit0, R.audit1, R.audit2, R.audit3, R.audit4].filter(Boolean);
  R.auditClean = audits.every(a => a.length === 0);
  R.pass = R.tsSame && R.clockBack && R.auditClean && ['page', 'dot1', 'claim', 'noTwice', 'dot0', 'calGoal', 'wrap', 'capEnergy', 'capGold', 'capNoSpend', 'irRun', 'adOpen', 'double', 'dblUsed', 'dblUsedGold', 'pts', 'dot2', 'chest', 'dot3', 'irKinds', 'irPlay', 'irDaily', 'irEquip',
    'nextDay', 'nextCal', 'reopen', 'shop', 'buy1', 'buy2', 'buy3', 'buy3No', 'others', 'noBuyGoal', 'poor', 'adGold'].every(k => R[k]);
  return R;
};
//   await navGear()   -> Equipar e Pets (Tarefa 6): melhora a arma até o nível 3 (pedras e ouro descontados certo, permOf, meta 'upgrade'), peça selecionada,
//                        botão desabilitado sem recursos e no nível 20, pontos nas abas (Equipar com melhoria, Pets com ovo), jornada nova com o dano, choca um ovo
//                        (pet novo na coleção), alimenta, marca para levar (um por vez) e confere que a próxima jornada normal começa com ele na vaga 0
//                        e o Diário (e o desafio sem companheiros) não. Sem nuvem; devolve perfil, jornada e localStorage no fim. Precisa de test/ui-audit.js.
window.navGear = async () => {
  const A = window.__alforje, AM = window.AlforjeMeta, R = {}, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const PK = 'alforje-prof6', RK = 'alforje-run6', TK = 'alforje-ts';
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  if (!window.alforjeAudit) return { error: 'carregue test/ui-audit.js antes' };
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), ts: localStorage.getItem(TK), mode: A.MENU.mode, chal: A.MENU.chal,
    profObj: JSON.parse(JSON.stringify(A.PROF)), stateObj: JSON.parse(JSON.stringify(A.state)), ready: A.CLOUD.ready };
  const hadRun = !!(keep.stateObj.cls && keep.stateObj.phase !== 'class');
  const off0 = localStorage.getItem(NAV_OFF); navOffline(true);
  const aud = () => window.alforjeAudit(), audits = [];
  const fresh = () => { A.state.phase = 'class'; A.state.cls = null; };
  try {
    if (hadRun) fresh();
    const m = A.META(); m.day = ''; A.META();
    Object.assign(m, { gold: 1000, stone: 10, food: 20, egg: 1, ruby: 0, xp: 0, energy: 30, eAt: Date.now(), petOn: null });
    m.pets = {}; for (const k in m.gear) m.gear[k] = 1;
    m.goals.ids = ['upgrade1', 'win5', 'merge3', 'forge1', 'buy8']; m.goals.p = {}; m.goals.done = []; m.goals.pts = 0; m.goals.chests = [false, false, false];
    const dot = k => q(`#mtabs [data-nav="${k}"] .k-dot`);
    // 1) página Equipar: 4 peças, arma selecionada, pontos nas duas abas (melhoria possível e ovo)
    q('[data-nav="equip"]').click(); q('[data-slot="weapon"]').click(); // a peça marcada é lembrada entre visitas: começa pela arma
    const cells = qa('#eqG .eqs');
    R.page = cells.length === 4 && cells[0].dataset.slot === 'weapon' && cells[0].getAttribute('aria-pressed') === 'true' && cells.slice(1).every(c => c.getAttribute('aria-pressed') === 'false') && !!q('#eqUp') && qa('.eqst li').length === 5;
    R.cellText = /Nv 1/.test(cells[0].textContent) && /\+0% dano/.test(cells[0].textContent) && /Comum/.test(cells[0].textContent);
    R.dotEq = !!dot('equip') && /melhoria/.test(q('#mtabs [data-nav="equip"]').getAttribute('aria-label'));
    R.dotPets = !!dot('pets') && /ovo/.test(q('#mtabs [data-nav="pets"]').getAttribute('aria-label'));
    // custos e bônus vêm de meta.js (o balanceamento v1.2 mudou os números): o nível L custa gearCost(L)
    const C1 = AM.gearCost(1), C2 = AM.gearCost(2), C3 = AM.gearCost(3), pc = v => String(+v.toFixed(1)).replace('.', ','), W3 = AM.gearBonus('weapon', 3);
    const upTxt = c => new RegExp('MELHORAR · ' + c.stone + ' · ' + c.gold.toLocaleString('pt-BR'));
    R.btn1 = !q('#eqUp').disabled && upTxt(C1).test(q('#eqUp').textContent);
    audits.push(aud());
    // 2) arma até o nível 3: 1 pedra + 50 ouro, depois 2 pedras + 100 ouro
    q('#eqUp').click();
    R.up1 = m.gear.weapon === 2 && m.stone === 10 - C1.stone && m.gold === 1000 - C1.gold && upTxt(C2).test(q('#eqUp').textContent) && /Nv 2/.test(q('.eqs.sel').textContent);
    R.goal = m.goals.p.upgrade1 === 1 && m.goals.done.includes('upgrade1') && m.goals.pts === 20;
    q('#eqUp').click();
    R.up2 = m.gear.weapon === 3 && m.stone === 10 - C1.stone - C2.stone && m.gold === 1000 - C1.gold - C2.gold && m.gear.armor === 1 && q('.eqs.sel').textContent.includes('+' + pc(W3) + '% dano');
    const p = AM.permOf(m);
    R.perm = Math.abs(p.dmgPct - W3 / 100) < 1e-9 && p.block === 0 && p.crit === 0 && p.gold === 0 && p.hp === 0 && q('.eqst').textContent.includes('Dano +' + pc(W3) + '%');
    // 3) escolher outra peça: só ela é marcada e melhorada
    q('[data-slot="armor"]').click();
    R.selArmor = q('[data-slot="armor"]').getAttribute('aria-pressed') === 'true' && q('[data-slot="weapon"]').getAttribute('aria-pressed') === 'false' && /Armadura/.test(q('.eqd').textContent);
    const gA = 1000 - 2 * C1.gold - C2.gold;
    q('#eqUp').click(); R.upArmor = m.gear.armor === 2 && m.gear.weapon === 3 && m.stone === 10 - 2 * C1.stone - C2.stone && m.gold === gA && q('.eqst').textContent.includes('Escudo +' + AM.gearBonus('armor', 2));
    // 4) sem recursos: botão desabilitado, texto do que falta, sem ponto na aba, clique não muda nada
    m.stone = 0; A.equipScreen();
    R.poor = q('#eqUp').disabled && new RegExp('Faltam ' + C2.stone + ' ').test(q('.eqd').textContent) && !dot('equip');
    const g0 = JSON.stringify(m.gear); q('#eqUp').click(); R.poorNo = JSON.stringify(m.gear) === g0 && m.gold === gA;
    m.stone = 5; m.gold = 10; m.gear.armor = 3; A.equipScreen(); R.poorGold = q('#eqUp').disabled && new RegExp('Faltam ' + (C3.gold - 10).toLocaleString('pt-BR') + ' ').test(q('.eqd').textContent);
    // nível 20: máximo
    m.stone = 99; m.gold = 9999; m.gear.armor = 20; A.equipScreen();
    R.max = q('#eqUp').disabled && /NÍVEL MÁXIMO/.test(q('#eqUp').textContent) && q('.eqs.sel').classList.contains('t4') && /Lendário/.test(q('.eqs.sel').textContent);
    audits.push(aud());
    // 5) jornada nova recebe os bônus da arma (nível 3)
    m.gear.armor = 1; m.stone = 0; m.gold = 0; m.egg = 1; m.food = 20; m.pets = {}; m.petOn = null; A.MENU.mode = 'normal'; A.MENU.chal = null; fresh();
    A.pickClass('warrior');
    R.journeyPerm = A.state.cls === 'warrior' && A.state.mode === 'normal' && Math.abs(A.state.perm.dmgPct - W3 / 100) < 1e-9 && A.state.perm.block === 0;
    R.journeyNoPet = !A.state.pets[0];
    // 6) Pets: 5 em silhueta, chocar o ovo dá um pet novo
    q('[data-nav="pets"]').click();
    const lockN = () => qa('#mpage .petc.lock').length;
    R.petsPage = qa('#mpage .petc').length === 5 && lockN() === 5 && !!q('#petH') && /Chocar ovo \(1\)/.test(q('#hatch').textContent) && !q('#hatch').disabled && !!dot('pets');
    audits.push(aud());
    q('#hatch').click();
    const keys = Object.keys(m.pets), k = keys[0];
    R.hatch = keys.length === 1 && m.pets[k] === 1 && m.egg === 0 && lockN() === 4 && /Novo companheiro/.test(q('#toast').textContent) && q('#hatch').disabled && /Chocar ovo \(0\)/.test(q('#hatch').textContent) && !dot('pets');
    R.hatchNoEgg = (q('#hatch').click(), Object.keys(m.pets).length === 1 && m.egg === 0);
    // 7) alimentar: Nv 1 -> 2 custa 2 rações; conta como meta 'upgrade'
    m.goals.p = {}; m.goals.done = []; m.goals.pts = 0; A.petsScreen();
    q(`[data-feed="${k}"]`).click();
    R.feed = m.pets[k] === 2 && m.food === 18 && m.goals.p.upgrade1 === 1 && /Nv 2\/10/.test(q('#mpage .petc:not(.lock)').textContent) && /Alimentar · 3/.test(q(`[data-feed="${k}"]`).textContent);
    m.food = 2; A.petsScreen(); R.feedPoor = q(`[data-feed="${k}"]`).disabled; q(`[data-feed="${k}"]`).click(); R.feedPoorNo = m.pets[k] === 2 && m.food === 2;
    m.food = 99; m.pets[k] = 10; A.petsScreen(); R.feedMax = q(`[data-feed="${k}"]`).disabled && /Nível máximo/.test(q(`[data-feed="${k}"]`).textContent);
    m.pets[k] = 2; m.food = 18;
    // 8) levar na jornada: um por vez, marcado
    const other = AM_other(k); m.pets[other] = 1; A.petsScreen();
    q(`[data-take="${k}"]`).click();
    R.take = m.petOn === k && q(`[data-take="${k}"]`).getAttribute('aria-pressed') === 'true' && /Na jornada/.test(q(`[data-take="${k}"]`).textContent) && q(`[data-take="${other}"]`).getAttribute('aria-pressed') === 'false';
    q(`[data-take="${other}"]`).click();
    R.takeOne = m.petOn === other && q(`[data-take="${k}"]`).getAttribute('aria-pressed') === 'false';
    q(`[data-take="${other}"]`).click(); R.takeOff = m.petOn === null;
    q(`[data-take="${k}"]`).click(); R.takeAgain = m.petOn === k;
    audits.push(aud());
    // 9) próxima jornada normal: o levado na vaga 0 (nível 2 = efeitos x1,1); Diário e desafio sem companheiros não
    A.MENU.mode = 'normal'; fresh(); A.pickClass('warrior');
    const s0 = A.state.pets[0];
    R.journeyPet = !!s0 && s0.key === k && Math.abs(s0.mul - 1.1) < 1e-9 && s0.ch > 0 && A.state.mode === 'normal';
    A.MENU.mode = 'daily'; fresh();
    for (const c of window.AlforjeData.CLASSKEYS) { A.pickClass(c); if (A.state.cls) break; }
    R.dailyNoPet = A.state.mode === 'daily' && !A.state.pets[0] && A.state.perm == null;
    A.MENU.mode = 'challenge'; A.MENU.chal = 'nopets'; m.energy = 30; fresh(); A.pickClass('warrior');
    R.nopets = A.state.chal === 'nopets' && !A.state.pets[0];
    A.MENU.mode = 'normal'; A.MENU.chal = null;
    // 10) já tem todos: o ovo vira 10 rações
    for (const c of window.AlforjeData.PETKEYS) m.pets[c] = m.pets[c] || 1; m.egg = 1; m.food = 5; q('[data-nav="pets"]').click();
    R.allTxt = /já tem todos/i.test(q('#petH').textContent);
    q('#hatch').click(); R.allFood = m.egg === 0 && m.food === 15 && /virou 10/.test(q('#toast').textContent);
    audits.push(aud());
  } finally {
    A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
    A.PROF = keep.profObj; A.state = keep.stateObj; A.MENU.mode = keep.mode; A.MENU.chal = keep.chal;
    [[PK, keep.prof], [RK, keep.run], [TK, keep.ts]].forEach(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); });
    if (off0 == null) localStorage.removeItem(NAV_OFF);
    A.CLOUD.ready = off0 == null ? keep.ready : false;
    if (hadRun) { A.showRun(); A.render(); } else A.campScreen();
  }
  R.tsSame = localStorage.getItem(TK) === keep.ts;
  R.audits = audits; R.auditClean = audits.length === 5 && audits.every(a => a.length === 0);
  R.pass = R.tsSame && R.auditClean && ['page', 'cellText', 'dotEq', 'dotPets', 'btn1', 'up1', 'goal', 'up2', 'perm', 'selArmor', 'upArmor', 'poor', 'poorNo', 'poorGold', 'max', 'journeyPerm', 'journeyNoPet',
    'petsPage', 'hatch', 'hatchNoEgg', 'feed', 'feedPoor', 'feedPoorNo', 'feedMax', 'take', 'takeOne', 'takeOff', 'takeAgain', 'journeyPet', 'dailyNoPet', 'nopets', 'allTxt', 'allFood'].every(x => R[x]);
  return R;
  function AM_other(k) { return window.AlforjeData.PETKEYS.find(x => x !== k); }
};
