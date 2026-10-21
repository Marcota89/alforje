// Verificações estáticas do Alforje (sem navegador).
// Uso:
//   node test/static-check.cjs --baseline   grava test/static-baseline.json (hashes de js/data.js e js/sim.js)
//   node test/static-check.cjs              confere hashes e os CSS citados no index.html
//   node test/static-check.cjs --final      além disso, confere que o visual antigo sumiu (Tarefa 9)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const read = f => fs.readFileSync(path.join(root, f));
const sha = f => crypto.createHash('sha256').update(read(f)).digest('hex');
const GUARDED = ['js/data.js', 'js/sim.js'];
const baselineFile = path.join(__dirname, 'static-baseline.json');

let failed = false;
const report = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failed = true; };

if (args.includes('--baseline')) {
  const b = {};
  GUARDED.forEach(f => { b[f] = sha(f); });
  fs.writeFileSync(baselineFile, JSON.stringify(b, null, 2) + '\n');
  console.log('baseline gravado:', b);
}

// 1. hashes de data.js e sim.js
if (!fs.existsSync(baselineFile)) {
  report(false, 'test/static-baseline.json não existe (rode com --baseline)');
} else {
  const b = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  GUARDED.forEach(f => report(b[f] === sha(f), 'hash de ' + f));
}

// 2. todo <link rel="stylesheet"> do index.html existe em disco
const index = read('index.html').toString('utf8');
const hrefs = [];
(index.match(/<link\b[^>]*>/gi) || []).forEach(tag => {
  if (!/rel=["']?stylesheet/i.test(tag)) return;
  const m = tag.match(/href=["']([^"']+)["']/i);
  if (m) hrefs.push(m[1]);
});
report(hrefs.length > 0, 'index.html liga ' + hrefs.length + ' folha(s) de estilo');
hrefs.forEach(h => {
  const local = !/^[a-z]+:|^\/\//i.test(h);
  report(!local || fs.existsSync(path.join(root, h.split(/[?#]/)[0])), 'existe ' + h);
});

// 3. --final: nada do visual antigo
if (args.includes('--final')) {
  const banned = ['Cinzel', 'Alegreya', 'Pixelify', 'framed', 'plaque'];
  const files = ['index.html', 'js/main.js', 'tools/head.html'];
  const cssDir = path.join(root, 'css');
  if (fs.existsSync(cssDir)) fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).forEach(f => files.push('css/' + f));
  files.forEach(f => {
    const text = read(f).toString('utf8');
    // index.html e css/*.css: qualquer ocorrência. main.js e head.html: só as classes framed/plaque.
    const words = (f === 'js/main.js' || f === 'tools/head.html') ? ['framed', 'plaque'] : banned;
    const hit = words.filter(w => text.includes(w));
    report(hit.length === 0, f + ' sem ' + words.join('/') + (hit.length ? ' (achou: ' + hit.join(', ') + ')' : ''));
  });
  report(!fs.existsSync(path.join(root, 'css/legacy.css')), 'css/legacy.css removido');
}

console.log(failed ? 'FALHOU' : 'tudo ok');
process.exit(failed ? 1 : 0);
