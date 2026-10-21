// Teste de navegação do menu com abas (Tarefa 8). Rodar no navegador, com o jogo aberto:
//   eval(await (await fetch('/test/menu-nav-test.js')).text());
//   navA()            -> começa uma jornada (só #app visível)
//   (recarregar a página)
//   await navB()      -> confere: recarregar com jornada mostra só #app; abandonar mostra só #menu com Jogar .on;
//                        cloudAdopt() com jornada ativa volta para #app. Devolve {..., pass:true}.
//   await menuSweep() -> passa por todas as abas, modos e páginas do menu rodando alforjeAudit() (precisa de test/ui-audit.js).
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
window.menuSweep = async () => {
  const A = window.__alforje, out = {}, q = s => document.querySelector(s), click = s => { const e = q(s); if (!e) throw new Error('sem ' + s); e.click(); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const run = async (name, fn) => { fn(); await wait(120); const r = window.alforjeAudit(); if (!navOne()) r.push('menu e jornada juntos'); out[name] = r; };
  if (A.state.cls && A.state.phase !== 'class') { A.state.phase = 'class'; }
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
  return out;
};
