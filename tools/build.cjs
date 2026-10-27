// Monta index.html a partir de tools/head.html (título, estilos e marcação do jogo) e dos scripts em js/.
// Uso: node tools/build.cjs
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(__dirname, 'head.html'), 'utf8')
  .split('\n').filter(l => !l.includes('claude:viewport-fit-sides'));
// as linhas iniciais <title>/<meta>/<link> vão para o <head> (ícones e manifesto só valem lá); o resto é o corpo
let n = 0;
while (n < lines.length && /^\s*(<(title|meta|link)\b|$)/.test(lines[n])) n++;
const headTags = lines.slice(0, n).filter(l => l.trim() && !/name="viewport"/.test(l)).join('');
const head = lines.slice(n).join('\n');

// mesmo reset que a página tinha quando era publicada no claude.ai (o layout conta com ele)
const reset = ':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  + 'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}'
  + 'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';

// Folhas de estilo, em ordem de cascata. Cada tarefa acrescenta seus arquivos aqui.
const STYLES = ['css/fonts.css', 'css/kit.css', 'css/run.css', 'css/windows.css', 'css/menu.css'];
// v1.3: ?v=<versão do jogo> nos arquivos locais, para um main.js novo nunca rodar com um meta.js (ou CSS) velho do cache
const VER = (fs.readFileSync(path.join(root, 'js/main.js'), 'utf8').match(/\bVER='([^']+)'/) || [])[1];
if (!VER) throw new Error('VER não encontrado em js/main.js');
const bust = src => /^[a-z]+:|^\/\//i.test(src) ? src : `${src}?v=${VER}`;
const links = STYLES.map(href => `<link rel="stylesheet" href="${bust(href)}">`).join('');

const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const scripts = ['js/config.js', SUPABASE_JS, 'js/data.js', 'js/sim.js', 'js/meta.js', 'js/save.js', 'js/cloud.js', 'js/main.js']
  .map(src => `<script src="${bust(src)}" charset="utf-8"></script>`).join('\n');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${headTags}<style>${reset}</style>${links}</head><body>
${head}
${scripts}
</body></html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', Buffer.byteLength(html), 'bytes');
