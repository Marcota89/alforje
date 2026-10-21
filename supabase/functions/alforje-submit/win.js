// data.js e sim.js foram escritos para o navegador e se registram em `window`; no Deno ele não existe.
globalThis.window = globalThis;
