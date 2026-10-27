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
//   await navLab()    -> Laboratório (v1.3): grátis, ouro infinito, Catálogo, adversário, perder não tira vida, nada muda no perfil (ver abaixo).
//   await navCodexNew() -> descobertas do Codex (v1.3): selo NOVO!, bolinhas, +2 rubis uma vez (ver abaixo).
//   await boardLive() -> OPCIONAL, só lê: abre o Placar carregado de verdade (precisa da nuvem: interruptor desligado e página recarregada) e audita.
window.navVis = s => { const e = document.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; };
window.navOne = () => navVis('#menu') !== navVis('#app');
const NAV_OFF = 'alforje-test-offline', NAV_SNAP = 'alforje-test-snap', NAV_KEYS = ['alforje-prof6', 'alforje-run6', 'alforje-lab6', 'alforje-ts'];
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
  for (const m of ['daily', 'challenge', 'seed', 'duel', 'lab']) await run('heroi:' + m, () => { A.classScreen(); click(`[data-mode="${m}"]`); });
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
    // 3) energia 0: v1.4 (ID 19) a JORNADA fica cinza e já abre a janela de energia; COMEÇAR (normal) também abre e não cria jornada
    m.energy = 0; m.eAt = Date.now(); A.campScreen(); R.campLow = q('#campGo').classList.contains('noen'); q('#campGo').click();
    R.campOpensEnergy = !q('#overlay').hidden && !!q('#overlay #noEn') && !q('#goBtn'); A.closeOverlay();
    A.classScreen(); q('[data-mode="normal"]').click(); q('#goBtn').click();
    R.noEnergy = !q('#overlay').hidden && !!q('#overlay #noEn') && /Faltam/.test(q('#overlay').textContent) && !!q('#overlay #adEnergy') && !!q('#overlay #neShop') && !!q('#overlay #neGoals') && !!q('#overlay #neDaily') && !!q('#overlay #neLab') && /Diário, Duelo e Laboratório não gastam energia/.test(q('#overlay').textContent)
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
  R.pass = R.tsSame && R.capAdd && R.capBtn && R.capNoAd && R.liveNeed && R.camp && R.pills && R.timer && R.hero && R.freeDaily && R.backToCamp && R.campLow && R.campOpensEnergy && R.noEnergy && R.adWaiting && R.adNoClose && R.adDone && R.adCount && R.tickStops;
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

// ===== v1.3 etapa 2 =====
// diferença entre dois perfis (caminhos que mudaram), para provar que o Laboratório não mexe em nada da conta
window.navDiff = (a, b, p = '') => { const out = [];
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...navDiff(a[k], b[k], p ? p + '.' + k : k)); return out; }
  return [p || '(raiz)']; };
//   await navLab() -> Laboratório: começar não gasta energia; ouro infinito (∞) e compras não descontam; o Catálogo só tem itens já
//                     descobertos e põe na mochila em qualquer raridade; escolher o adversário (parada, variação, modificador, Ascensão);
//                     perder não tira vida nem avança; vencer não conta; luta retomada (recarregar/nuvem) continua Laboratório; sair volta ao
//                     acampamento; o PROF (perfil e meta) não muda, só preferências de interface; nada vai para a fila de envios; o ouro infinito
//                     não vaza para uma jornada normal. No fim devolve tudo.
window.navLab = async () => {
  const A = window.__alforje, R = {}, q = s => document.querySelector(s), PK = 'alforje-prof6', RK = 'alforje-run6', LK = 'alforje-lab6', TK = 'alforje-ts', POST = 'alforje-post-pending';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), lab: localStorage.getItem(LK), ts: localStorage.getItem(TK), post: localStorage.getItem(POST), mode: A.MENU.mode,
    profObj: JSON.parse(JSON.stringify(A.PROF)), stateObj: JSON.parse(JSON.stringify(A.state)), ready: A.CLOUD.ready };
  const off0 = localStorage.getItem(NAV_OFF); navOffline(true);
  R.catAudit = []; R.oppAudit = [];
  try {
    // perfil de teste: alguns itens no Codex (o Catálogo mostra só eles), energia abaixo do máximo
    const C = A.PROF.codex; for (const k of ['sword', 'whet', 'clover', 'dagger', 'shield']) C.items[k] = C.items[k] || { seen: 1, bought: 0, merged: 0, forged: 0, wins: 0 };
    A.META().energy = 15; A.META().eAt = Date.now(); A.META(); A.closeOverlay(); localStorage.setItem(PK, JSON.stringify(A.PROF));
    const P0 = JSON.parse(JSON.stringify(A.PROF)), post0 = localStorage.getItem(POST);
    // janela sem energia destaca o Laboratório
    A.campScreen(); A.noEnergy(); R.noEnergyLab = !!q('#neLab'); q('#neLab').click(); R.noEnergyGoesLab = A.MENU.mode === 'lab' && !!q('#goBtn') && /grátis/.test(q('#goBtn').textContent);
    // começar: grátis
    q('#goBtn').click();
    const pm = window.AlforjeMeta.permFor(A.META(), 0);/* v1.4 (ID 13): os bônus da conta valem no Laboratório, como numa jornada normal */
    R.start = A.state.mode === 'lab' && !!A.state.cls && A.state.phase === 'shop' && A.PROF.meta.energy === 15 && !!A.state.perm && A.state.perm.dmgPct === pm.dmgPct && A.state.perm.hp === pm.hp;
    R.goldInf = A.state.gold === 99999 && /∞/.test(q('#stats').textContent) && navVis('#app');
    R.noCoach = q('#coach').hidden;
    // compra não desconta
    const n0 = A.state.items.length; let bought = false; for (let i = 0; i < A.state.shop.length && !bought; i++) { const o = A.state.shop[i]; if (o && !o.pet) { A.buy(i); bought = true; } }
    R.buyFree = bought && A.state.gold === 99999 && (A.state.items.length > n0 || A.state.merges > 0);
    // Catálogo: só o que está no Codex; Lendário direto na mochila
    q('#labCat').click(); const keys = [...document.querySelectorAll('[data-lcat]')].map(b => b.dataset.lcat);
    R.catKnownOnly = keys.length >= 5 && keys.every(k => { const x = A.PROF.codex.items[k]; return x && (x.seen || x.bought || x.forged); });
    const unknown = Object.keys(window.AlforjeData.ITEMS).find(k => !A.PROF.codex.items[k]);
    R.catRefusesUnknown = !unknown || A.labPlace(unknown, 4) === false;
    q('[data-ltier="4"]').click(); const ni = A.state.nid; q('[data-lcat="sword"]').click();
    const placed = A.state.items.find(i => i.id === ni); R.catPlace = !!placed && placed.key === 'sword' && placed.tier === 4 && placed.where === 'bag';
    R.catAudit = window.alforjeAudit ? window.alforjeAudit() : ['sem auditoria'];
    q('#closeOv').click();
    // adversário: parada 6, 2ª variação, um modificador, Ascensão 2
    q('#foeinfo').click(); R.oppOpen = !!q('[data-lstop]');
    q('[data-lstop="6"]').click(); q('[data-lvar="1"]').click(); const mod = q('[data-lmod]').dataset.lmod; q(`[data-lmod="${mod}"]`).click();
    q('[data-lasc="1"]').click(); q('[data-lasc="1"]').click(); R.oppAudit = window.alforjeAudit ? window.alforjeAudit() : ['sem auditoria'];
    q('#labGo').click();
    // o balão do Mascate sobre a faixa do inimigo: um toque fecha e a faixa age (aqui, abre a escolha do adversário)
    A.sayMerchant(true, 'hammer'); const fr = q('#foeinfo').getBoundingClientRect(), mb = q('#mline').getBoundingClientRect(), cx = fr.left + fr.width / 2, cy = fr.top + fr.height / 2;
    const over = !q('#mline').hidden && cy >= mb.top && cy <= mb.bottom;
    q('#mline').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
    if (!q('#mline').hidden) q('#mline').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));/* v1.4 (ID 17): o 1º toque completa o texto */
    R.bubbleTapStrip = over && q('#mline').hidden && !!q('[data-lstop]'); q('#labNo').click();
    // Laboratório não vai para a nuvem; a nuvem com jornada vazia mantém a local
    R.noCloudRun = A.runJSON() === '';
    const f = A.foeDef(); R.oppSet = A.state.wins === 5 && f.stop === 5 && f.name === window.AlforjeData.STOPS[5].v[1].name && f.mods.includes(mod) && A.state.asc === 2 && /P6/.test(q('#stats').textContent);
    // perder: troca a mochila por uma adaga Comum contra o chefe na A10
    A.labOppApply({ stop: 10, v: 0, mods: ['furia'], asc: 10 });
    A.state.items = [{ id: A.state.nid++, key: 'dagger', tier: 1, x: 0, y: 0, w: 1, h: 1, where: 'bag' }];
    const L0 = A.state.lives, W0 = A.state.wins; A.fight(true); A.skip(); A.finish();
    R.loseKeeps = A.B.done === 'lose' && A.state.lives === L0 && A.state.wins === W0 && A.state.phase === 'shop' && /Laboratório/.test(q('#overlay').textContent) && !!q('#next');
    q('#next').click(); R.backToShop = q('#overlay').hidden && A.state.phase === 'shop' && A.state.mode === 'lab';
    // vencer: Lendários contra a parada 1 na A0; não conta vitória
    A.labOppApply({ stop: 1, v: 0, mods: [], asc: 0 });
    A.state.items = []; A.labPlace('sword', 4); A.labPlace('whet', 4); A.labPlace('clover', 4); A.labPlace('shield', 4);
    const tw0 = A.PROF.totalWins; A.fight(true); A.skip(); A.finish();
    R.winNoCount = A.B.done === 'win' && A.state.wins === 0 && A.PROF.totalWins === tw0 && A.state.phase === 'shop';
    q('#next').click();
    // luta retomada (recarregar no meio ou nuvem): continua Laboratório
    A.fight(true); const mid = JSON.parse(localStorage.getItem(LK)); R.savedLab = mid.mode === 'lab' && mid.phase === 'battle' && localStorage.getItem(RK) === keep.run;
    // (a) recarregar no meio da luta: o boot resolve a luta salva (resumeFight) e cai no resultado do Laboratório
    A.state = JSON.parse(JSON.stringify(mid)); A.resumeFight();
    R.resumeLab = A.state.mode === 'lab' && A.state.phase === 'shop' && A.state.gold === 99999 && /Laboratório/.test(q('#overlay').textContent) && A.state.lives === L0;
    if (q('#next')) q('#next').click();
    // (b) a nuvem traz a mesma luta pendente: continua Laboratório
    A.cloudAdopt({ t: Date.now() + 1e4, prof: JSON.stringify(A.PROF), run: JSON.stringify(mid) });
    await wait(50);
    R.adoptLab = A.state.mode === 'lab' && A.state.phase === 'shop' && A.state.gold === 99999 && /Laboratório/.test(q('#overlay').textContent) && A.state.lives === L0;
    if (q('#next')) q('#next').click();
    R.reloadKeepsLab = JSON.parse(localStorage.getItem(LK)).mode === 'lab' && JSON.parse(localStorage.getItem(LK)).gold === 99999 && localStorage.getItem(RK) === keep.run;
    // sair: Mais -> Voltar ao acampamento
    A.cloudAdopt({ t: Date.now() + 1e4, prof: JSON.stringify(A.PROF), run: '' }); await wait(50);
    R.adoptEmptyKeepsLab = A.state.mode === 'lab' && A.state.phase === 'shop' && navVis('#app');
    q('#moreBtn').click(); R.drawerLab = !!q('#labOpp') && !!q('#labCat2') && !!q('#labExit'); q('#labExit').click();
    /* sair apaga só o Laboratório; com uma jornada em andamento na chave dela, volta para ela; sem jornada, para o Acampamento */
    const kr = keep.run ? JSON.parse(keep.run) : null, active = !!(kr && kr.cls && kr.phase !== 'class' && kr.mode !== 'lab');
    R.exit = A.MENU.mode === 'normal' && localStorage.getItem(LK) == null && (active ? A.state.cls === kr.cls && A.state.seed === kr.seed && navVis('#app') : !!q('#campGo') && !A.state.cls);
    // nada mudou no perfil (só eAt, a hora da energia, e preferências de interface)
    const allowed = /^(meta\.eAt|opt(\..*)?|ver|speed|skinSeen|tut)$/;
    R.profDiff = navDiff(P0, JSON.parse(JSON.stringify(A.PROF))).filter(p => !allowed.test(p));
    R.profSame = R.profDiff.length === 0;
    R.noPosts = localStorage.getItem(POST) === post0;
    // o ouro infinito não vaza: jornada normal depois começa com ouro normal
    A.MENU.mode = 'normal'; A.META().energy = 30; A.state.phase = 'class'; A.pickClass('warrior');
    R.noLeak = A.state.mode === 'normal' && A.state.gold < 200 && !/∞/.test(q('#stats').textContent);
  } catch (e) { R.error = String(e && e.stack || e); }
  finally {
    A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
    A.PROF = keep.profObj; A.state = keep.stateObj; A.MENU.mode = keep.mode;
    [[PK, keep.prof], [RK, keep.run], [LK, keep.lab], [TK, keep.ts], [POST, keep.post]].forEach(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); });
    if (off0 == null) localStorage.removeItem(NAV_OFF);
    A.CLOUD.ready = off0 == null ? keep.ready : false;
    if (A.state.cls && A.state.phase !== 'class') { A.showRun(); A.render(); } else A.campScreen();
  }
  R.tsSame = localStorage.getItem(TK) === keep.ts;
  R.pass = !R.error && R.tsSame && ['noEnergyLab', 'noEnergyGoesLab', 'start', 'goldInf', 'noCoach', 'buyFree', 'catKnownOnly', 'catRefusesUnknown', 'catPlace', 'oppOpen', 'bubbleTapStrip', 'noCloudRun', 'oppSet', 'loseKeeps', 'backToShop',
    'winNoCount', 'savedLab', 'resumeLab', 'adoptLab', 'reloadKeepsLab', 'adoptEmptyKeepsLab', 'drawerLab', 'exit', 'profSame', 'noPosts', 'noLeak'].every(k => R[k] === true) && !R.catAudit.length && !R.oppAudit.length;
  return R;
};
//   await navCodexNew() -> descobertas do Codex: o Codex antigo (de antes da versão) não vira novidade; uma descoberta nova numa jornada normal
//                          ganha o selo NOVO!, a bolinha com número em ☰ Mais e no atalho Mais do Acampamento; tocar paga +2 rubis uma vez;
//                          recarregar o perfil não paga de novo; o Laboratório não cria descobertas. No fim devolve tudo.
window.navCodexNew = async () => {
  const A = window.__alforje, R = {}, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], PK = 'alforje-prof6', RK = 'alforje-run6', TK = 'alforje-ts';
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), ts: localStorage.getItem(TK), mode: A.MENU.mode,
    profObj: JSON.parse(JSON.stringify(A.PROF)), stateObj: JSON.parse(JSON.stringify(A.state)), ready: A.CLOUD.ready };
  const off0 = localStorage.getItem(NAV_OFF); navOffline(true);
  R.audit = [];
  try {
    // 1) perfil de antes da versão (sem registro de descobertas) com Codex: nada vira novidade
    const old = JSON.parse(JSON.stringify(A.PROF)); if (old.meta) delete old.meta.dsc;
    old.codex = { items: { sword: { seen: 3, bought: 1, merged: 0, forged: 0, wins: 1 }, shield: { seen: 1, bought: 0, merged: 0, forged: 0, wins: 0 } }, foes: { rat: { met: 1, beat: 1 } }, recipes: { heroblade: 1 } };
    localStorage.setItem(PK, JSON.stringify(old)); A.loadProf();
    const d = A.PROF.meta.dsc; R.oldNotNew = A.discN().total === 0 && d.i.sword === 0 && !('shield' in d.i) && d.f.rat === 0 && d.r.heroblade === 0;
    A.campScreen(); R.noDotCamp = !q('#cMore .k-dot') || q('#cMore .k-dot').textContent === '!';
    // 2) Laboratório não descobre nada
    A.MENU.mode = 'lab'; A.state.phase = 'class'; A.state.cls = null; A.pickClass('warrior'); for (let i = 0; i < 4; i++) A.reroll();
    R.labNoDisc = A.discN().total === 0 && Object.keys(A.PROF.codex.items).length === 2;
    // 3) jornada normal: ver na loja não é novidade (v1.4, ID 3); comprar é, e conta ao lutar
    A.MENU.mode = 'normal'; A.META().energy = 30; A.state.phase = 'class'; A.state.cls = null; A.pickClass('warrior');
    const offers = new Set(A.state.shop.filter(o => o && !o.pet).map(o => o.key).filter(k => k !== 'sword' && k !== 'shield'));
    R.seenNotNew = offers.size > 0 && A.discN().total === 0;
    A.state.gold = 999; A.state.shop.forEach((o, i) => { if (o && !o.pet && offers.has(o.key)) A.buy(i); });
    A.fight(true); A.skip(); A.finish(); A.closeOverlay();
    const N = A.discN(); R.found = R.seenNotNew && N.i === offers.size && N.total === N.i + N.f;
    // 4) alertas: atalho Mais do Acampamento e Codex em ☰ Mais, com número
    A.state = JSON.parse(JSON.stringify(keep.stateObj)); A.state.phase = 'class'; A.state.cls = null; A.campScreen();
    R.dotCamp = !!q('#cMore .k-dot') && q('#cMore .k-dot').textContent === String(N.total);
    q('#cMore').click(); R.dotMore = !!q('#codexBtn .k-dot') && q('#codexBtn .k-dot').textContent === String(N.total);
    q('#codexBtn').click(); const cells = qa('#mpage .ccell.nw');
    R.badges = cells.length === N.i && cells.every(c => /NOVO!/.test(c.textContent)) && !qa('#mpage .ccell.nw').some(c => c.dataset.disc === 'i:sword');
    R.oldNoBadge = !qa('[data-disc]').some(b => /sword|shield/.test(b.dataset.disc));
    R.tabDot = !!q('[data-codex="items"] .k-dot');
    R.audit = window.alforjeAudit ? window.alforjeAudit() : ['sem auditoria'];
    // 5) tocar: +2 rubis, uma vez
    const key = cells[0].dataset.disc.split(':')[1], r0 = A.PROF.meta.ruby; cells[0].click();
    R.paid = A.PROF.meta.ruby === r0 + 2 && A.PROF.meta.dsc.i[key] === 2 && !q(`[data-disc="i:${key}"]`) && A.discN().total === N.total - 1;
    const again = A.discClaim('i', key); R.paidOnce = again === null && A.PROF.meta.ruby === r0 + 2;
    // 6) recarregar o perfil salvo não paga de novo nem devolve o selo
    A.loadProf(); A.codexScreen('items');
    R.reloadNoRegrant = A.PROF.meta.ruby === r0 + 2 && A.PROF.meta.dsc.i[key] === 2 && !q(`[data-disc="i:${key}"]`);
  } catch (e) { R.error = String(e && e.stack || e); }
  finally {
    A.adStop(); A.closeOverlay(); clearTimeout(A.CLOUD.timer); A.CLOUD.dirty = false;
    A.PROF = keep.profObj; A.state = keep.stateObj; A.MENU.mode = keep.mode;
    [[PK, keep.prof], [RK, keep.run], [TK, keep.ts]].forEach(([k, v]) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); });
    if (off0 == null) localStorage.removeItem(NAV_OFF);
    A.CLOUD.ready = off0 == null ? keep.ready : false;
    if (A.state.cls && A.state.phase !== 'class') { A.showRun(); A.render(); } else A.campScreen();
  }
  R.tsSame = localStorage.getItem(TK) === keep.ts;
  R.pass = !R.error && R.tsSame && ['oldNotNew', 'noDotCamp', 'labNoDisc', 'seenNotNew', 'found', 'dotCamp', 'dotMore', 'badges', 'oldNoBadge', 'tabDot', 'paid', 'paidOnce', 'reloadNoRegrant'].every(k => R[k] === true) && !R.audit.length;
  return R;
};
//   await navLoteA()  -> v1.4 Lote A, regressões que dependem da página (cada uma falha na v8.4, d97418d):
//                        ID 1 derrota fantasma; IDs 5/6 arrasto + Desfazer/Trocar/Pular loja com outro dedo; ID 7 aviso inteiro abaixo do placar;
//                        ID 13 Laboratório com bônus da conta e chave própria; ID 15 sem "Lutar já?" no tutorial, Laboratório enxuto;
//                        ID 17 balão (1º toque completa, 2º fecha); ID 19 JORNADA sem energia e heróis bloqueados; IDs 3/11 Coletar todos;
//                        ID 10 textos das linhas; ID 14 Juros Compostos e Altar. Sem nuvem; no fim devolve perfil, jornada e chaves.
window.navLoteA = async () => {
  const A = window.__alforje, D = window.AlforjeData, R = {}, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const K = navKeep(), LK = 'alforje-lab6', lab0 = localStorage.getItem(LK);
  navOffline(true);
  const errs = []; const onErr = e => errs.push(String(e.message || e.error)); window.addEventListener('error', onErr);
  /* opts: pickClass sem agendar o tutorial guiado (o teste do tutorial só precisa de PROF.tut = 0) */
  const start = (mode, cls, opts) => { A.closeOverlay(); A.MENU.mode = mode; A.state.phase = 'class'; A.state.cls = null; if (mode === 'daily') { for (const c of D.CLASSKEYS) { A.pickClass(c); if (A.state.cls) break; } } else A.pickClass(cls || 'warrior', opts); A.MENU.mode = 'normal'; };
  const pe = (type, el, x, y, id) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', isPrimary: id === 5, clientX: x, clientY: y, button: 0 }));
  const mid = el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  const stuck = () => !!q('.ghost') || document.body.classList.contains('is-dragging');
  // cada bloco é independente: um erro (função que não existe numa versão antiga) vira falha daquele bloco e os outros seguem
  R.errors = []; const sect = async fn => { try { await fn(); } catch (e) { R.errors.push(String(e && e.message || e)); try { A.closeOverlay(); if (A.state.phase === 'battle') { A.skip(); A.finish(); A.closeOverlay(); } } catch (x) {} } };
  try {
    A.PROF.tut = 1; A.META().energy = 99;
    // ===== ID 17: balão do Mascate — 1º toque completa o texto, 2º fecha =====
    await sect(async () => {
      start('normal'); A.sayMerchant(true, 'hammer'); const b = q('#mline');
      const typing = !b.hidden && q('#mline .tw').textContent.length < q('#mline .twf').textContent.length - 14;
      const [bx, by] = mid(b); b.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: bx, clientY: by }));
      const after1 = !b.hidden && q('#mline .tw').textContent.length >= q('#mline .twf').textContent.length - 14;
      b.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: bx, clientY: by }));
      R.id17 = typing ? after1 && b.hidden : 'sem máquina de escrever (modo calmo)';
      A.closeOverlay();
    });
    // ===== ID 1: o fechamento atrasado da luta anterior não encerra a luta seguinte =====
    await sect(async () => {
      start('daily'); A.state.noAsk = true; const it0 = A.state.items.find(i => D.ITEMS[i.key].type === 'weapon');
      A.state.items = [Object.assign({}, it0, { key: 'dagger', w: 1, h: 1, tier: 1 })]; A.render();
      A.fight(true); A.skip(); await wait(250); A.finish(); const p1 = (A.state.proof || []).length;
      A.closeOverlay(); A.state.queue = []; A.state.phase = 'shop'; A.render();
      const L = A.state.lives, W = A.state.wins; A.fight(true); await wait(900);
      R.id1 = A.state.phase === 'battle' && !!A.B && !A.B.done && A.state.lives === L && A.state.wins === W && (A.state.proof || []).length === p1;
      A.skip(); A.finish(); A.closeOverlay();
    });
    // ===== IDs 5 e 6: arrasto + comando com outro dedo =====
    await sect(async () => {
      start('normal'); A.state.gold = 99; A.state.round = 1;
      A.state.items = A.state.items.filter(i => D.ITEMS[i.key].type === 'weapon').slice(0, 1).map(i => Object.assign(i, { x: 0, y: 0, where: 'bag' }));
      const fill = () => { A.state.shop = ['sword', 'dagger', 'shield', 'bomb', 'torch'].map(k => ({ key: k, tier: 1 })); A.render(); };
      // (a) Desfazer: o item arrastado deixa de existir
      fill(); A.buy(1); const nid = A.state.items[A.state.items.length - 1].id; A.render();
      let el = q(`[data-drag][data-id="${nid}"]`), [x, y] = mid(el); errs.length = 0;
      pe('pointerdown', el, x, y, 5); pe('pointermove', document, x, y - 30, 5); pe('pointermove', document, x, y - 60, 5);
      const dragging = stuck(); A.undo(); pe('pointermove', document, x, y - 80, 5); pe('pointerup', document, x, y - 80, 5);
      const other = q('#bag [data-drag][data-src="own"]'), [ox, oy] = mid(other); pe('pointerdown', other, ox, oy, 7); pe('pointerup', document, ox, oy, 7);
      R.id5undo = dragging && !errs.length && !stuck() && !!A.state.sel;
      R.id5undoErr = errs.slice(); A.state.sel = null; A.render();
      // (b) Trocar: a oferta arrastada some; soltar não compra a oferta nova
      fill(); const g0 = A.state.gold, n0 = A.state.items.length; el = q('[data-drag][data-src="shop"][data-idx="0"]'); [x, y] = mid(el); errs.length = 0;
      pe('pointerdown', el, x, y, 5); pe('pointermove', document, x, y - 30, 5);
      A.reroll(); const cost = g0 - A.state.gold;
      const bag = q('#bag').getBoundingClientRect(), c = bag.width / A.state.bag.cols, tx = bag.left + (A.state.bag.cols - 2) * c + c, ty = bag.top + (A.state.bag.rows - 2) * c + 2 * c + 34;
      pe('pointermove', document, tx, ty, 5); pe('pointerup', document, tx, ty, 5);
      R.id6reroll = !errs.length && !stuck() && A.state.items.length === n0 && A.state.gold === g0 - cost;
      // (c) Pular loja (gaveta) durante o arrasto
      fill(); A.state.skipOffer = 'ouro'; el = q('[data-drag][data-src="shop"][data-idx="1"]'); [x, y] = mid(el); errs.length = 0;
      pe('pointerdown', el, x, y, 5); pe('pointermove', document, x, y - 30, 5); pe('pointermove', document, x, y - 60, 5);
      A.skipShop(); q('#cfOk').click(); pe('pointermove', document, x, y - 90, 5); pe('pointerup', document, x, y - 90, 5);
      R.id6skip = !errs.length && !stuck() && A.state.shop.every(o => o === null);
      R.id6Err = errs.slice();
    });
    // ===== ID 7: aviso com o nome inteiro, abaixo do placar VS =====
    await sect(async () => {
      start('normal'); A.state.gold = 99; A.state.shop = [{ key: 'spikemirror', tier: 2 }, null, null, null, null]; A.render(); A.buy(0); await wait(60);
      const t = q('#toast'), s = t.querySelector('span'), tb = t.getBoundingClientRect(), vb = q('#vs').getBoundingClientRect();
      R.id7 = !t.hidden && /Espelho de Espinhos/.test(s.textContent) && s.scrollHeight <= s.clientHeight + 1 && tb.top >= vb.bottom && tb.left >= 15 && tb.right <= innerWidth - 15;
    });
    // ===== ID 14: Juros Compostos sobe o teto; o Altar melhora o melhor item por 5 de vida máxima =====
    await sect(async () => {
      start('normal'); A.state.asc = 0; A.state.gold = 100; A.state.bless = []; const base = A.interest(); A.state.bless = ['compostos'];
      R.id14juros = A.interest() === base + 1 && /teto de juros \+1/.test(D.BLESS.compostos.desc);
      const id = A.state.nid; A.state.items = [{ id: id, key: 'dagger', tier: 1, x: 0, y: 0, w: 1, h: 1, where: 'bag' }, { id: id + 1, key: 'sword', tier: 2, x: 1, y: 0, w: 1, h: 2, where: 'bag' }, { id: id + 2, key: 'whet', tier: 1, x: 2, y: 0, w: 1, h: 1, where: 'bag' }];
      A.state.nid = id + 3; A.state.maxHpMod = 0; A.state.event = 'altar'; A.eventChoose(true); A.closeOverlay();
      R.id14altar = A.state.items.find(i => i.id === id + 1).tier === 3 && A.state.items.find(i => i.id === id).tier === 1 && A.state.items.find(i => i.id === id + 2).tier === 1 && A.state.maxHpMod === -5;
    });
    // ===== ID 13: Laboratório com os bônus da conta, numa chave própria que não sobrescreve a jornada =====
    await sect(async () => {
      start('normal'); const runRaw = localStorage.getItem('alforje-run6'), runGold = JSON.parse(runRaw).gold;
      const m = A.META(); m.gear.weapon = 11; m.gear.armor = 11; m.pets.raven = 6; m.petOn = 'raven';
      A.MENU.mode = 'lab'; A.state.phase = 'class'; A.state.cls = null; A.pickClass('warrior'); A.MENU.mode = 'normal';
      const pm0 = window.AlforjeMeta.permFor(m, 0);
      R.id13perm = A.state.mode === 'lab' && !!A.state.perm && A.state.perm.dmgPct === pm0.dmgPct && A.state.perm.block === pm0.block && pm0.dmgPct > 0 && !!A.state.pets[0] && A.state.pets[0].key === 'raven';
      A.labOppApply({ stop: 3, v: 0, mods: [], asc: 10 }); const pm10 = window.AlforjeMeta.permFor(m, 10);
      R.id13asc = A.state.perm.dmgPct === pm10.dmgPct && pm10.dmgPct < pm0.dmgPct;
      A.labPlace('sword', 2);
      R.id13key = localStorage.getItem('alforje-run6') === runRaw && JSON.parse(localStorage.getItem(LK) || '{}').mode === 'lab';
      // ID 15: o "Mais" do Laboratório só com Desfazer, Catálogo, Adversário, Opções e Sair
      q('#moreBtn').click(); const ids = qa('#moreList button').map(b => b.id).sort().join();
      R.id15more = ids === ['labCat2', 'labExit', 'labOpp', 'optBtn', 'undo2'].sort().join(); R.id15moreIds = ids; q('#labExit').click();
      R.id13exit = !localStorage.getItem(LK) && A.state.mode === 'normal' && A.state.gold === runGold && A.state.cls === 'warrior' && navVis('#app');
      m.gear.weapon = 1; m.gear.armor = 1; delete m.pets.raven; m.petOn = null;
    });
    // ===== ID 15: sem "Lutar já?" durante o tutorial; descrição do Laboratório curta =====
    await sect(async () => {
      A.PROF.tut = 0; start('normal', 'warrior', {}); A.state.noAsk = false; A.PROF.noAsk = 0; A.state.gold = 99; A.render(); A.fight();
      R.id15tut = A.state.phase === 'battle' && !/Lutar já/.test(q('#overlay').textContent || '');
      if (A.state.phase === 'battle') { A.skip(); A.finish(); } A.closeOverlay(); A.PROF.tut = 1;
      A.classScreen(); q('[data-mode="lab"]').click(); const txt = q('#mpage .minfo').textContent.trim();
      R.id15desc = txt.split(/[.!?](?:\s|$)/).filter(s => s && s.trim()).length <= 2 && txt.split(/\s+/).length <= 25;
    });
    // ===== ID 19: JORNADA sem energia; heróis bloqueados dizem como liberar =====
    await sect(async () => {
      A.state.phase = 'class'; A.state.cls = null; const m = A.META(); m.energy = 4; m.eAt = Date.now(); A.campScreen();
      const g = q('#campGo'); R.id19noen = g.classList.contains('noen') && /faltam/.test(g.textContent); g.click();
      R.id19opens = /Sem energia/.test(q('#overlay').textContent) && !q('#goBtn'); A.closeOverlay(); m.energy = 99;
      A.campScreen(); R.id19full = !q('#campGo').classList.contains('noen');
      const P = A.PROF, keep = [P.best, P.totalWins, P.journeys]; P.best = 0; P.totalWins = 0; P.journeys = 0; A.MENU.mode = 'normal'; A.classScreen();
      const locked = qa('#mpage .hc.lock'); R.id19lock = locked.length > 0 && locked.every(c => /Libera/.test(c.textContent));
      R.id19audit = window.alforjeAudit ? window.alforjeAudit() : ['sem auditoria'];
      [P.best, P.totalWins, P.journeys] = keep;
    });
    // ===== ID 10: os textos descrevem as três linhas de hoje =====
    await sect(async () => {
      A.moreScreen(); q('#howBtn').click(); const how = q('#mpage').textContent;
      R.id10 = !/linhas verdes/i.test(how) && /dourada/.test(how) && /azul/.test(how) && /roxa/.test(how);
    });
    // ===== IDs 3 e 11: novidade só pelo esforço; "Coletar todos" até o limite do dia =====
    await sect(async () => {
      A.state.phase = 'class'; A.state.cls = null; const m = A.META(), C = A.PROF.codex, ks = Object.keys(D.ITEMS).filter(k => !C.items[k]).slice(0, 13);
      const seenOnly = Object.keys(D.ITEMS).filter(k => !C.items[k] && !ks.includes(k))[0]; C.items[seenOnly] = { seen: 4, bought: 0, merged: 0, forged: 0, wins: 0 };
      for (const k of ks) C.items[k] = { seen: 1, bought: 1, merged: 0, forged: 0, wins: 0 };
      m.dscN = 0; A.META(); const r0 = m.ruby; A.codexScreen('items');
      R.id3seen = !q(`[data-disc="i:${seenOnly}"]`) && !!q(`[data-disc="i:${ks[0]}"]`);
      const btn = q('#discAll'); R.id11btn = !!btn && /\+20/.test(btn.textContent);
      R.id11audit = window.alforjeAudit ? window.alforjeAudit() : ['sem auditoria'];
      if (btn) btn.click();
      R.id11 = m.ruby === r0 + 20 && qa('#mpage [data-disc]').length === 3 && !q('#discAll') && /Limite de hoje/.test(q('#mpage').textContent);
    });
  } catch (e) { R.error = String(e && e.stack || e); }
  finally {
    window.removeEventListener('error', onErr);
    try { if (A.state.phase === 'battle') { A.skip(); A.finish(); } } catch (e) {}
    if (lab0 == null) localStorage.removeItem(LK); else localStorage.setItem(LK, lab0);
    navPut(K, true);
  }
  const keys = ['id1', 'id5undo', 'id6reroll', 'id6skip', 'id7', 'id14juros', 'id14altar', 'id13perm', 'id13asc', 'id13key', 'id15more', 'id13exit', 'id15tut', 'id15desc', 'id19noen', 'id19opens', 'id19full', 'id19lock', 'id10', 'id3seen', 'id11btn', 'id11'];
  R.fail = keys.filter(k => R[k] !== true);
  R.pass = !R.error && !R.fail.length && (R.id17 === true || typeof R.id17 === 'string') && !(R.id11audit || []).length && !(R.id19audit || []).length;
  return R;
};
//   await auditLoteA() -> alforjeAudit() nas telas que o Lote A mexeu (Acampamento com e sem energia, escolha de herói com bloqueios e no Laboratório,
//                         Codex com "Coletar todos", Pets com todos no máximo, Loja de rubis, Equipar no nível 19 (pedras novas), Como jogar, Novidades, aviso na jornada, "Mais" e ☰ do Laboratório),
//                         em cada modo de interface (normal, texto grande, daltônico, canhoto, economia). Rode em 360x640 e em 375x812. Sem nuvem; devolve tudo no fim.
window.auditLoteA = async () => {
  const A = window.__alforje, D = window.AlforjeData, q = s => document.querySelector(s), out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const K = navKeep(), LK = 'alforje-lab6', lab0 = localStorage.getItem(LK); navOffline(true);
  const start = mode => { A.closeOverlay(); A.MENU.mode = mode; A.state.phase = 'class'; A.state.cls = null; A.pickClass('warrior', {}); A.MENU.mode = 'normal'; };
  const UI = { normal: {}, big: { big: 1 }, cb: { cb: 1 }, left: { left: 1 }, eco: { eco: 1 } };
  const screens = {
    camp: () => { A.closeOverlay(); A.state.phase = 'class'; A.state.cls = null; A.META().energy = 99; A.campScreen(); },
    campSemEnergia: () => { const m = A.META(); m.energy = 3; m.eAt = Date.now(); A.campScreen(); },
    janelaSemEnergia: () => { q('#campGo').click(); },
    heroiBloqueado: () => { A.closeOverlay(); A.META().energy = 99; const P = A.PROF; P.best = 0; P.totalWins = 0; P.journeys = 0; A.MENU.mode = 'normal'; A.classScreen(); },
    heroiLab: () => { A.MENU.mode = 'lab'; A.classScreen(); },
    codexColetar: () => { A.MENU.mode = 'normal'; const m = A.META(), C = A.PROF.codex; for (const k of Object.keys(D.ITEMS).slice(0, 14)) C.items[k] = { seen: 1, bought: 1, merged: 0, forged: 0, wins: 0 }; m.dscN = 0; A.META(); A.codexScreen('items'); },
    codexLimite: () => { A.META().dscN = 10; A.codexScreen('items'); },
    petsMax: () => { const m = A.META(); for (const k of D.PETKEYS) m.pets[k] = 10; m.egg = 1; A.petsScreen(); },
    lojaRubis: () => { A.shopScreen(); },
    equiparCaro: () => { const m = A.META(); for (const k in m.gear) m.gear[k] = 19; m.stone = 3; m.gold = 50; A.equipScreen(); },
    equiparPronto: () => { const m = A.META(); m.stone = 99999; m.gold = 99999; A.equipScreen(); },
    comoJogar: () => { A.moreScreen(); q('#howBtn').click(); },
    novidades: () => { A.moreScreen(); q('#newsBtn').click(); },
    avisoJornada: () => { start('normal'); A.state.gold = 99; A.state.shop = [{ key: 'spikemirror', tier: 2 }, { key: 'sword', tier: 1 }, null, null, null]; A.render(); A.buy(0); },
    labMais: () => { start('lab'); q('#moreBtn').click(); },
    labMenu: () => { q('#dclose') && q('#dclose').click(); q('#helpBtn').click(); },
  };
  try {
    for (const u in UI) {
      for (const k of ['big', 'cb', 'left', 'eco']) A.setOpt(k, UI[u][k] || 0);
      for (const s in screens) { try { screens[s](); await wait(80); const r = window.alforjeAudit(); if (r.length) out[u + ':' + s] = r; } catch (e) { out[u + ':' + s] = ['erro: ' + e.message]; } }
      A.closeOverlay();
    }
  } finally {
    try { if (A.state.mode === 'lab') localStorage.removeItem(LK); } catch (e) {}
    if (lab0 == null) localStorage.removeItem(LK); else localStorage.setItem(LK, lab0);
    navPut(K, true); A.applyOpts();
  }
  return { size: innerWidth + 'x' + innerHeight, problems: out, pass: !Object.keys(out).length };
};
