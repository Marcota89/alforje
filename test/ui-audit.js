// Auditoria de UI no navegador. NÃO é carregado pelo jogo em produção.
// Como usar (no console ou na ferramenta de JavaScript do navegador, com o jogo aberto em viewport em pé, ex. 375x812):
//   const s = document.createElement('script'); s.src = '/test/ui-audit.js'; document.head.appendChild(s);
// ou: eval(await (await fetch('/test/ui-audit.js')).text());
// Depois: window.alforjeAudit()  -> Array<string> de problemas ([] quando está tudo certo).
(function () {
  function sel(el) {
    if (el.id) return '#' + el.id;
    let s = el.tagName.toLowerCase();
    const cls = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(Boolean);
    if (cls.length) s += '.' + cls.slice(0, 2).join('.');
    const p = el.parentElement;
    if (p && p !== document.body) {
      const ps = p.id ? '#' + p.id : p.tagName.toLowerCase() + (typeof p.className === 'string' && p.className.trim() ? '.' + p.className.trim().split(/\s+/)[0] : '');
      s = ps + ' > ' + s;
    }
    return s;
  }
  function visible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false;
    }
    return true;
  }
  function hasOwnText(el) {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  }
  window.alforjeAudit = function () {
    const out = [];
    const add = m => { if (out.indexOf(m) < 0) out.push(m); };
    if (document.documentElement.scrollWidth > innerWidth) add('rolagem lateral');
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;
      if (!visible(el)) return;
      const cs = getComputedStyle(el);
      if (hasOwnText(el) && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
        add('texto cortado: ' + sel(el));
      if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
        const r = el.getBoundingClientRect();
        if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) add('fora da tela: ' + sel(el));
        if (r.width < 40 || r.height < 40) add('alvo pequeno: ' + sel(el));
      }
    });
    return out;
  };
})();
