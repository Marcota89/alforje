// Teste de navegação do menu com abas (Tarefa 8). Rodar no navegador, com o jogo aberto:
//   eval(await (await fetch('/test/menu-nav-test.js')).text());
//   navA()            -> começa uma jornada (só #app visível)
//   (recarregar a página)
//   await navB()      -> confere: recarregar com jornada mostra só #app; abandonar mostra só #menu com Jogar .on;
//                        cloudAdopt() com jornada ativa volta para #app. Devolve {..., pass:true}.
//   await navC()      -> luta começada, ☰ -> Codex (página do menu) durante a luta; a luta termina: resultado sobre #app, e depois de
//                        "Ir ao mercador" (e das escolhas que vierem) continua só #app. Precisa de uma jornada na loja (rode navA() antes).
//   await navMeta()   -> energia e progressão na jornada: migração do perfil antigo, cobrança de 10, perm, Diário grátis, restauração sem perm, adoção pela nuvem, sem energia.
//   await menuSweep() -> passa por todas as abas, modos e páginas do menu rodando alforjeAudit() (precisa de test/ui-audit.js).
//                        Usa a escolha de herói (estado novo) e no fim devolve a jornada que estava em andamento (não roda durante uma luta).
window.navVis = s => { const e = document.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; };
window.navOne = () => navVis('#menu') !== navVis('#app');
window.navA = () => { const A = window.__alforje; A.state.phase = 'class'; A.pickClass('warrior'); return { app: navVis('#app'), menu: navVis('#menu'), one: navOne() }; };
window.navB = async () => {
  const A = window.__alforje, R = {};
  const menu = document.querySelector('#menu');
  R.reload_onlyApp = !!menu && menu.hidden === true && navVis('#app');
  const snap = { t: Date.now(), prof: JSON.stringify(A.PROF), run: JSON.stringify(A.state) };
  // abandonar: ☰ -> Abandonar -> confirmar
  document.querySelector('#helpBtn').click();
  document.querySelector('#abandon').click();
  document.querySelector('#cfOk').click();
  const jog = document.querySelector('#mtabs [data-nav="jogar"]');
  R.abandon_onlyMenu = navVis('#menu') && !navVis('#app') && !!jog && jog.classList.contains('on') && document.querySelector('#overlay').hidden;
  // cloudAdopt com jornada ativa
  A.cloudAdopt(snap);
  R.adopt_onlyApp = navVis('#app') && !navVis('#menu');
  R.pass = R.reload_onlyApp && R.abandon_onlyMenu && R.adopt_onlyApp;
  return R;
};
window.navC = async () => {
  const A = window.__alforje, q = s => document.querySelector(s), R = {};
  if (!A.state.cls || A.state.phase !== 'shop') return { error: 'precisa de uma jornada na loja' };
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
  R.pass = R.battle && R.menuDuringBattle && R.resultOnApp && R.afterOnlyApp && R.brokeAt === undefined;
  return R;
};
window.menuSweep = async () => {
  const A = window.__alforje, out = {}, q = s => document.querySelector(s), click = s => { const e = q(s); if (!e) throw new Error('sem ' + s); e.click(); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const run = async (name, fn) => { fn(); await wait(120); const r = window.alforjeAudit(); if (!navOne()) r.push('menu e jornada juntos'); out[name] = r; };
  if (A.state.phase === 'battle') return { error: 'luta em andamento' };
  const snap = A.state.cls && A.state.phase !== 'class' ? JSON.stringify(A.state) : null;
  if (snap) A.state.phase = 'class';
  const M = A.MENU, keep = { mode: M.mode, chal: M.chal };
  for (const m of ['normal', 'daily', 'challenge', 'seed', 'duel']) await run('jogar:' + m, () => { A.classScreen(); click(`[data-mode="${m}"]`); });
  await run('jogar:challenge+desafio', () => { click('[data-mode="challenge"]'); const c = q('[data-chal]:not(:disabled)'); if (c) c.click(); });
  await run('jogar:historia+ascensao', () => { click('[data-mode="normal"]'); document.querySelectorAll('#mpage details').forEach(d => d.open = true); });
  for (const t of ['items', 'foes', 'recipes']) await run('codex:' + t, () => { click('[data-nav="codex"]'); click(`[data-codex="${t}"]`); });
  await run('missoes', () => click('[data-nav="missoes"]'));
  await run('placar', () => click('[data-nav="placar"]'));
  await wait(1500); out['placar(carregado)'] = window.alforjeAudit();
  await run('mais', () => click('[data-nav="mais"]'));
  for (const b of ['optBtn', 'achBtn', 'histBtn', 'howBtn', 'newsBtn']) await run('mais:' + b, () => { click('[data-nav="mais"]'); click('#' + b); });
  M.mode = keep.mode; M.chal = keep.chal;
  await run('voltar->jogar', () => { click('[data-nav="mais"]'); click('#back'); });
  out.jogarOn = q('#mtabs [data-nav="jogar"]').classList.contains('on');
  if (snap) { A.state = JSON.parse(snap); A.showRun(); A.render(); out.restored = navVis('#app') && !navVis('#menu'); }
  return out;
};
window.navMeta = async () => {
  const A = window.__alforje, R = {}, PK = 'alforje-prof6', RK = 'alforje-run6', TK = 'alforje-ts';
  const keep = { prof: localStorage.getItem(PK), run: localStorage.getItem(RK), ts: localStorage.getItem(TK), mode: A.MENU.mode };
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
  } finally {
    A.MENU.mode = keep.mode;
    if (keep.prof != null) localStorage.setItem(PK, keep.prof);
    if (keep.run != null) localStorage.setItem(RK, keep.run);
    if (keep.ts != null) localStorage.setItem(TK, keep.ts);
  }
  R.pass = R.migrated && R.normal && R.daily && R.restored && R.adopted && R.noEnergy;
  return R;
};
