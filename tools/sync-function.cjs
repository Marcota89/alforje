// Copia js/data.js e js/sim.js para a função do servidor (supabase/functions/alforje-submit/), byte a byte.
// O win.js da função é o próprio código-fonte (o calço que cria `window` no Deno): só confere que ele existe.
// Uso:
//   node tools/sync-function.cjs           copia (rode antes de publicar a função)
//   node tools/sync-function.cjs --check   só confere; sai com erro se alguma cópia faltar ou for diferente de js/
// test/static-check.cjs --final faz a mesma conferência.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const FN = 'supabase/functions/alforje-submit';
const COPIES = ['data.js', 'sim.js'];

function diffs() {
  const out = [];
  for (const f of COPIES) {
    const dst = path.join(root, FN, f);
    if (!fs.existsSync(dst)) { out.push(FN + '/' + f + ' não existe'); continue; }
    if (!fs.readFileSync(path.join(root, 'js', f)).equals(fs.readFileSync(dst))) out.push(FN + '/' + f + ' é diferente de js/' + f);
  }
  if (!fs.existsSync(path.join(root, FN, 'win.js'))) out.push(FN + '/win.js não existe');
  return out;
}

if (require.main === module) {
  if (!process.argv.includes('--check')) {
    for (const f of COPIES) fs.copyFileSync(path.join(root, 'js', f), path.join(root, FN, f));
    console.log('copiados para ' + FN + ': ' + COPIES.join(', '));
  }
  const d = diffs();
  d.forEach(x => console.log('FAIL ' + x));
  console.log(d.length ? 'FALHOU' : 'função em dia com js/');
  process.exit(d.length ? 1 : 0);
}
module.exports = { diffs, FN, COPIES };
