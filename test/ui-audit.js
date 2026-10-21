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
  // true se o elemento mora dentro de um ancestral que rola na vertical (alcançável rolando)
  function inVScroller(el) {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const c = getComputedStyle(p);
      if ((c.overflowY === 'auto' || c.overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return true;
    }
    return false;
  }
  // true se o elemento mora dentro de uma faixa de rolagem horizontal intencional (marcada com data-hscroll, ex.: loja com 6+ ofertas),
  // que de fato rola só na horizontal e está inteira na tela. Outros contêineres (janelas, gavetas) não isentam nada.
  function inHScroller(el) {
    const p = el.parentElement && el.parentElement.closest('[data-hscroll]');
    if (!p) return false;
    const c = getComputedStyle(p);
    if (!(c.overflowX === 'auto' || c.overflowX === 'scroll') || p.scrollWidth <= p.clientWidth || p.scrollHeight > p.clientHeight + 1) return false;
    const pr = p.getBoundingClientRect();
    return pr.left >= 0 && pr.right <= innerWidth;
  }
  // true se outra camada cobre o centro do elemento (que não seja ele, descendente ou ancestral)
  function covered(el) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || x >= innerWidth || y < 0 || y >= innerHeight) return false; // fora da tela: não dá para dizer que está coberto
    const t = document.elementFromPoint(x, y);
    if (!t) return false;
    return !(t === el || el.contains(t) || t.contains(el));
  }
  window.alforjeAudit = function () {
    const out = [];
    const add = m => { if (out.indexOf(m) < 0) out.push(m); };
    // animações de entrada (ex.: .modal.win-in parte de opacity:0) ficam paradas no 1º quadro quando a aba está em segundo plano;
    // termina as finitas antes de medir, senão a janela inteira passa como invisível e nada dentro dela é auditado
    if (document.getAnimations) document.getAnimations().forEach(a => { try { if (a.effect && a.effect.getComputedTiming().endTime !== Infinity) a.finish(); } catch (e) {} });
    if (document.documentElement.scrollWidth > innerWidth) add('rolagem lateral');
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;
      if (!visible(el)) return;
      if (covered(el)) return;
      const cs = getComputedStyle(el);
      if (hasOwnText(el) && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
        add('texto cortado: ' + sel(el));
      if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
        const r = el.getBoundingClientRect();
        if (((r.left < 0 || r.right > innerWidth) && !inHScroller(el)) || ((r.top < 0 || r.bottom > innerHeight) && !inVScroller(el))) add('fora da tela: ' + sel(el));
        // #aff apertado (data-tight) é atalho secundário: o mesmo painel abre por Mais > Afinidades com alvo >= 44
        if ((r.width < 40 || r.height < 40) && !el.hasAttribute('data-tight')) add('alvo pequeno: ' + sel(el));
      }
    });
    return out;
  };
})();
