# Visual novo do Alforje: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar a moldura de todas as telas do Alforje pelo kit visual de RPG casual dos esboços aprovados, sem mudar regras, arte nem simulação.

**Architecture:** o CSS sai do `<style>` gigante de `tools/head.html` e vira arquivos em `css/`, ligados por `tools/build.cjs`. Primeiro o CSS atual é movido intacto para `css/legacy.css`, como rede de segurança. Depois cada tarefa troca uma área por CSS novo (`kit`, `run`, `windows`, `menu`) e apaga as regras antigas daquela área. A última tarefa apaga `legacy.css`. As mudanças de JS ficam em `js/main.js`, nas funções de layout e de montagem de HTML já existentes, mais um "menu com abas" novo.

**Tech Stack:** HTML, CSS e JavaScript puros (sem framework); Node para build e testes; GitHub Pages; fontes Lilita One e Nunito via `@fontsource` no jsDelivr com versão fixa.

**Spec:** `docs/superpowers/specs/2026-10-21-visual-novo-design.md` (esboços em `docs/superpowers/specs/2026-10-21-visual-novo/`).

## Global Constraints

- `js/data.js` e `js/sim.js` não mudam (byte a byte). Se mudassem, a função `alforje-submit` do Supabase precisaria ser publicada de novo.
- `node test/test-sim.cjs` passa ao fim de toda tarefa.
- Celular em pé de 360×640 a 430×932 sem rolagem lateral, texto cortado ou sobreposição; no computador, coluna central de no máximo 480px.
- Paisagem com altura até 500px continua mostrando "Gire o celular" e pausando o jogo.
- Acessibilidade mantida: modo daltônico, canhoto (`body.lefty`), texto grande (`body.big`), escala de interface (`OPT().scale`), modo econômico, rótulos ARIA, mover sem arrastar, foco visível e `prefers-reduced-motion`.
- Cores e componentes exatamente como na tabela "Kit visual" do spec (gradientes, bordas, sombras e as cores de raridade `#9aa6b2`, `#2f9bff`, `#b462ff`, `#ffb020`).
- Nada de arte, logotipo ou ícone do Overgeared Hero.
- Textos de jogo inalterados, exceto os rótulos de navegação novos do menu: "Codex", "Missões", "Jogar", "Placar", "Mais".
- Publicação no GitHub Pages só na última tarefa, com tudo migrado.

## Review Focus

1. **Arrastar e soltar na mochila nova**, inclusive vender soltando na faixa da loja: o alvo de venda precisa aparecer grande e o item arrastado não pode ficar escondido sob o dedo. Teste na Tarefa 4.
2. **Texto grande ligado em 360×640**, com nomes longos ("Gárgula de Obsidiana do Norte", "Medalhão do Tesoureiro"): nada pode cortar nem empurrar botões para fora da tela. Teste na Tarefa 3 e na Tarefa 9.
3. **Recarregar a página no meio de uma jornada, ou adotar o progresso da nuvem:** a tela precisa voltar na casca certa (jornada ou menu), sem as duas ao mesmo tempo. Teste na Tarefa 8.
4. **Modo daltônico:** a raridade continua identificável sem depender só da cor da borda. Teste na Tarefa 4.
5. **Modo canhoto:** as ações da loja e os controles de luta continuam espelhados. Teste na Tarefa 5.

---

## Ferramentas de verificação (usadas em todas as tarefas)

Não há como testar CSS unitariamente. As "falhas" de cada tarefa são verificadas por dois scripts, criados na Tarefa 1:

- `test/static-check.cjs`, em Node: confere os hashes de `js/data.js` e `js/sim.js`, se todos os arquivos de CSS citados no `index.html` existem e, a partir da Tarefa 9, se não restou nada do visual antigo.
- `test/ui-audit.js`, rodado no navegador (pelo console ou pela ferramenta de JavaScript do navegador embutido): devolve a lista de problemas da tela atual e `[]` quando está tudo certo.

Para servir o site localmente: `py -3 -m http.server 8766 -d .` na pasta `alforje-web`, abrindo `http://localhost:8766/` com viewport de celular. Contas de convidado criadas nos testes locais vão para o Supabase de produção e são apagadas na Tarefa 9.

---

### Tarefa 1: rede de segurança e CSS fora do HTML

**Files:**
- Create: `css/legacy.css` (o conteúdo atual do `<style>` de `tools/head.html`, sem mudanças)
- Create: `test/static-check.cjs`, `test/ui-audit.js`
- Modify: `tools/head.html` (remove o `<style>…</style>`), `tools/build.cjs` (passa a emitir `<link rel="stylesheet">`)

**Interfaces:**
- Produz: em `tools/build.cjs`, a lista `const STYLES=['css/legacy.css']`, que gera um `<link rel="stylesheet" href="…">` por item, em ordem, dentro do `<head>`. As tarefas seguintes acrescentam arquivos nessa lista.
- Produz: `test/ui-audit.js` define `window.alforjeAudit()`, que devolve um `Array<string>` de problemas.

- [ ] **Passo 1:** criar `test/static-check.cjs` com três verificações, cada uma imprimindo `ok`/`FAIL` e saindo com código 1 se alguma falhar:
  - `sha256(js/data.js)` e `sha256(js/sim.js)` iguais aos valores gravados em `test/static-baseline.json`. O script grava esse arquivo na primeira execução com `--baseline`.
  - Todo `href` de `<link rel="stylesheet">` do `index.html` existe em disco.
  - Com `--final`: `index.html` e `css/*.css` não contêm `Cinzel`, `Alegreya`, `Pixelify`, `framed` nem `plaque`, e `css/legacy.css` não existe.
- [ ] **Passo 2:** rodar `node test/static-check.cjs --baseline` e depois `node test/static-check.cjs`. Esperado: tudo `ok`.
- [ ] **Passo 3:** criar `test/ui-audit.js` com `window.alforjeAudit()`, que verifica:
  - `document.documentElement.scrollWidth > innerWidth` → "rolagem lateral";
  - para cada elemento visível com texto e sem `text-overflow:ellipsis`, `scrollWidth > clientWidth+1` → "texto cortado: <seletor>";
  - todo botão visível com o retângulo fora da janela → "fora da tela: <seletor>";
  - botões visíveis menores que 40×40 → "alvo pequeno: <seletor>".
- [ ] **Passo 4:** mover o `<style>` para `css/legacy.css`, ligar em `STYLES`, rodar `node tools/build.cjs` e servir localmente. No navegador, em 375×812, comparar menu, loja e luta com as capturas atuais do site: devem ser idênticas. Rodar `alforjeAudit()` e anotar os problemas que já existem hoje; eles não contam como regressão.
- [ ] **Passo 5:** `node test/static-check.cjs` e `node test/test-sim.cjs` → `ok` / "tudo certo".
- [ ] **Passo 6:** commit: `refactor: CSS em css/legacy.css e verificações de UI`.

### Tarefa 2: fontes e kit visual

**Files:**
- Create: `css/fonts.css`, `css/kit.css`, `tools/kit-demo.html` (galeria dos componentes, fora do jogo)
- Modify: `tools/build.cjs` (`STYLES=['css/fonts.css','css/kit.css','css/legacy.css']`)

**Interfaces:**
- Produz, em `css/kit.css`, as variáveis de `:root`:
  - fundos `--sky` e `--dusk`;
  - kit `--cream-1`, `--cream-2`, `--ink-brown:#5a2a00`, `--orange:#f08a1c`, `--orange-d:#a5520a`, `--pill-bg:rgba(18,8,38,.78)` e `--pill-edge:#ffd34d`;
  - raridade `--t1:#9aa6b2`, `--t2:#2f9bff`, `--t3:#b462ff` e `--t4:#ffb020`, que substituem as antigas de mesmo nome;
  - fontes `--f-title:'Lilita One'`, `--f-body:'Nunito'` e `--f-num:'Lilita One'`.
- Produz as classes de componente, usadas por todas as tarefas seguintes:
  - `.k-pill`, `.k-pill .plus`;
  - botões `.k-btn` com as variantes `.g` (verde), `.o` (laranja), `.v` (roxo), `.r` (vermelho) e `.ad` (roxo claro);
  - `.k-win` (janela) e `.k-rib` (fita), mais `.k-rib.good` (verde, para vitória) e `.k-rib.bad` (vermelho);
  - `.k-card`, `.k-seg` (segmentos) com `.k-seg > .on`, `.k-dot` (alerta) e `.k-tabs` com `.k-tab`, `.k-tab.mid` e `.k-tab.on`.

- [ ] **Passo 1:** em `css/fonts.css`, declarar `@font-face` de Lilita One 400 e de Nunito 400, 700 e 900 apontando para `https://cdn.jsdelivr.net/npm/@fontsource/<pacote>@<versão-5.x-exata>/files/<pacote>-latin-<peso>-normal.woff2`, mais o subconjunto `latin-ext` para acentos. Fixar a versão exata e confirmar cada URL com `curl -sI` → `200`.
- [ ] **Passo 2:** escrever `css/kit.css` com os valores da tabela "Kit visual" do spec (borda de 3px branca nos botões, sombra sólida de 4px, janela com borda de 4px e cantos de 20px, fita sobreposta 17px acima). Inclui `:focus-visible` com contorno dourado e o bloco `@media (prefers-reduced-motion:reduce)`, que desliga as transições do kit.
- [ ] **Passo 3:** criar `tools/kit-demo.html`, que carrega `../css/fonts.css` e `../css/kit.css` e mostra um exemplo de cada componente e variante. Servir e conferir lado a lado com `esboco-jogo-inteiro.html`: mesmas cores, bordas e sombras.
- [ ] **Passo 4:** rebuild e abrir o jogo: as cores de raridade novas já aparecem e o resto continua antigo. `alforjeAudit()` sem problemas novos; `static-check` e `test-sim` passando.
- [ ] **Passo 5:** commit: `feat(visual): kit de componentes e fontes`.

### Tarefa 3: casca da jornada (topo, placar VS, arena, faixa do inimigo)

**Files:**
- Create: `css/run.css` (entra em `STYLES` antes de `legacy.css` e as regras da área saem de `legacy.css`)
- Modify: `tools/head.html` (o `#hud` sai de dentro de `.stage` e vai para um `<section class="vs k-card" id="vs">` logo acima de `#arena`), `js/main.js`: `stats()` (linha ~290), `sideHTML()`, `hudShop()`, `hudBattle()`, `sizeCanvas()` e `fit()`

**Interfaces:**
- Consome: `.k-pill`, `.k-card`, `.k-dot` e as variáveis da Tarefa 2.
- Produz: `stats()` renderiza pílulas `.k-pill` (parada com Ascensão, vitórias, vidas, ouro com renda em `<small>`). `#hud` fica em `#vs` e não sobrepõe mais o canvas. `fit()` passa a reservar a altura de `#vs` (constante `const VSH=46`) no lugar da sobreposição.

- [ ] **Passo 1:** com o código atual, abrir uma jornada em 360×640 com "texto grande" ligado e confirmar o problema a corrigir: `alforjeAudit()` aponta o placar sobre a arena e nomes cortados.
- [ ] **Passo 2:** mover `#hud` para `#vs` em `head.html`. Em `sizeCanvas()`, deixar de descontar a altura do HUD (`hud=0`), porque os lutadores não ficam mais embaixo dele.
- [ ] **Passo 3:** estilizar em `css/run.css`, como no esboço:
  - pílulas do topo; `#petsmini` e o menu como botões redondos de 44px;
  - placar VS com barras de vida verde e vermelha e escudo em azul;
  - arena com borda branca de 3px e cantos de 14px;
  - `#foeinfo` como pílula escura com o rótulo do arquétipo em laranja.
- [ ] **Passo 4:** em `fit()`, trocar `top=48,intent=44` por `top=48,vs=VSH,intent=36`. Manter a regra de prioridade: casas da mochila com no mínimo 44px antes da arena (`arenaMin` passa de 120 para 96).
- [ ] **Passo 5:** em 360×640, 375×812 e 414×896, com e sem texto grande e com o nome "Gárgula de Obsidiana do Norte" (Sobrevivência): `alforjeAudit()` → `[]` para as áreas desta tarefa e casas da mochila com `--cs` ≥ 44px. `static-check` e `test-sim` passando.
- [ ] **Passo 6:** commit: `feat(visual): topo, placar VS e arena da jornada`.

### Tarefa 4: mochila, baú, loja e venda

**Files:**
- Modify: `css/run.css`, `css/legacy.css` (remover as regras da área), `js/main.js`: `placeSellZone()` (linha ~544), `renderShop()`, `renderGrids()` (só classes, sem lógica)

**Interfaces:**
- Consome: `--t1`…`--t4`, `.k-card`, `.k-pill`.
- Produz: `placeSellZone()` posiciona `#sellzone` sobre o retângulo de `#base` (a faixa da loja), ocupando toda a largura dele, em vez do canto da arena.

- [ ] **Passo 1:** escrever o teste de venda (Review Focus 1). Em 360×640, arrastar um item da mochila para a faixa da loja e ler `document.querySelector('#sellzone').getBoundingClientRect()` durante o arrasto. Esperado: altura ≥ 56px, largura ≥ 80% de `#base`, e o item vendido (ouro aumenta). Com o código atual, a área fica no canto da arena e a verificação de largura falha.
- [ ] **Passo 2:** implementar o novo `placeSellZone()` e o estilo do `#sellzone` (vermelho do botão de perigo, texto "Vender" e o valor).
- [ ] **Passo 3:** estilizar a mochila num cartão creme, com casas claras, item com borda na cor da raridade, linhas de sinergia, carga e afinidades em pílulas. As 6 peles (`body[data-skin]`) passam a mudar o fundo do cartão, a cor das casas e a borda, com uma combinação clara por pele. A loja fica com ofertas em caixas brancas com borda de raridade, preço em pílula, reserva e promoção visíveis. O baú usa o mesmo estilo da mochila.
- [ ] **Passo 4:** no modo daltônico (Review Focus 4), mostrar a raridade também por uma marca de forma no canto do item: nenhuma, 1, 2 ou 3 pontos, reaproveitando `.tdots` se já existir. Verificar Comum, Raro, Épico e Lendário lado a lado em escala de cinza (filtro `grayscale(1)` no `body`): os quatro precisam ser distinguíveis.
- [ ] **Passo 5:** confirmar que arrastar, girar, fundir, vender e "tocar e depois tocar" funcionam em 360 e 414 de largura. `alforjeAudit()` → `[]`; `static-check` e `test-sim` passando.
- [ ] **Passo 6:** commit: `feat(visual): mochila, loja e venda pela faixa da loja`.

### Tarefa 5: barra de ações e tela de luta sem mochila

**Files:**
- Modify: `css/run.css`, `css/legacy.css` (remover a área), `js/main.js`: `fit()`, `render()`, `renderMeter()`/`meterHTML()`, `flushEvents()` (realce de item), e a montagem da barra de ações (procurar `#actions`)

**Interfaces:**
- Produz: com `state.phase==='battle'`, `#app` recebe a classe `in-battle`. Nela, `#bagzone` fica oculto, a arena cresce para ocupar o espaço e `#base` mostra o medidor. `fit()` tem um ramo próprio para a luta: `arenaH = min(round(W*0.56), H - top - VSH - intent - meterMin - act - gaps)`, com `meterMin=150`.
- Produz: cada linha do medidor recebe `data-key` igual a `w.key` (por exemplo `i12` ou `p0`). Quando `flushEvents()` encontra `{k:'atk', s:'p', id, pet}`, aplica `.hit` por 300ms na linha correspondente, no lugar do realce do item na mochila.

- [ ] **Passo 1:** teste (o que deve falhar antes): durante uma luta em 375×812, `getComputedStyle(document.querySelector('#bagzone')).display` deve ser `'none'` e a altura da arena maior que na loja. Hoje dá `'flex'`.
- [ ] **Passo 2:** implementar a classe `in-battle`, aplicada em `render()` e removida quando a luta termina, e o ramo de luta do `fit()`. Chamar `sizeCanvas()` na troca para o canvas redimensionar.
- [ ] **Passo 3:** estilizar:
  - barra de ações: botões roxos com rótulo e `.k-dot`, e "LUTAR!" vermelho maior;
  - controles de luta: 1×, 2× e 4× roxos, o ativo em laranja, e "PULAR" laranja;
  - medidor em cartão creme;
  - números de dano grandes com contorno (crítico dourado, cura verde, escudo azul).
- [ ] **Passo 4:** implementar `data-key` nas linhas do medidor e o realce `.hit` (fundo dourado claro, desligado sob `prefers-reduced-motion`).
- [ ] **Passo 5:** modo canhoto (Review Focus 5): com `OPT().left`, as ações e os controles de luta continuam espelhados (`body.lefty`). Ao fim da luta, a mochila volta e `--cs` volta ao valor da loja.
- [ ] **Passo 6:** `alforjeAudit()` → `[]` na loja e na luta, nos três tamanhos; `static-check` e `test-sim` passando.
- [ ] **Passo 7:** commit: `feat(visual): ações da loja e luta com arena grande`.

### Tarefa 6: janelas, gaveta, ficha, aviso, tutorial, abertura

**Files:**
- Create: `css/windows.css`
- Modify: `css/legacy.css` (remover a área), `js/main.js`: `overlay()` (linha ~893), `confirmBox()`, `toast()`, `openDrawer()`/`renderDrawer()`, `renderPop()`, `renderSheet()`

**Interfaces:**
- Produz: `overlay(html, opts)` monta `<div class="modal k-win" role="dialog" aria-modal="true">`. Se o `html` começar com `<h2 class="bad">` ou `<h2>`, esse título vira a fita: `.k-rib.bad` (vermelha) para derrota ou fim de jornada perdida, `.k-rib.good` (verde) para vitória e `.k-rib` padrão para o resto. Não muda nenhuma chamada existente.
- Produz: a gaveta (`#drawer`), a ficha (`#pop`), a ficha completa (`#sheet`) e a confirmação usam `.k-win`/`.k-card` e os botões do kit. O aviso (`#toast`) vira pílula, o tutorial (`#coach .cbub`) vira balão creme, e a abertura (`#splash`) e o "Gire o celular" (`#rotmsg`) usam o fundo `--sky`.

- [ ] **Passo 1:** implementar a conversão do título em fita em `overlay()`. Verificar abrindo `finish()` com vitória e com derrota: fita verde e fita vermelha.
- [ ] **Passo 2:** estilizar as janelas com rolagem interna: o botão principal final continua grudado embaixo (`position:sticky`), o foco fica preso e `aria-modal` continua.
- [ ] **Passo 3:** estilizar gaveta, ficha, ficha completa, aviso, tutorial, abertura e "Gire o celular".
- [ ] **Passo 4:** `alforjeAudit()` → `[]` com cada janela aberta: resultado, gaveta de companheiros, ficha de item, ficha completa, confirmação de venda e tutorial.
- [ ] **Passo 5:** commit: `feat(visual): janelas, gaveta, ficha e avisos`.

### Tarefa 7: conteúdo das janelas da jornada

**Files:**
- Modify: `css/windows.css`, `js/main.js`: `finish()`/`resultTables()`/`statTable()`, `blessScreen()`, `subScreen()`, `eventScreen()`, `expandScreen()`, `endScreen()` (apenas classes e marcação de apresentação; textos e lógica iguais)

**Interfaces:**
- Consome: `overlay()` da Tarefa 6, `.k-card`, `.k-btn`.

- [ ] **Passo 1:** estilizar:
  - escolhas (bênção, subclasse, encruzilhada, ampliar): cartões grandes clicáveis com ícone ou sprite;
  - tabelas de resultado (`table.st`, abas Seus itens, Inimigo e Registro): dentro de cartões, com os ícones dos itens;
  - Forja: em destaque;
  - fim de jornada: pontuação grande e botões do kit (Compartilhar laranja, Voltar verde).
- [ ] **Passo 2:** jogar uma jornada pela API de teste até a encruzilhada e até o fim, incluindo a Sobrevivência e uma bênção:

  ```js
  __alforje.fight(true); __alforje.skip(); __alforje.finish();
  ```

  Em cada janela, `alforjeAudit()` → `[]` nos três tamanhos.
- [ ] **Passo 3:** commit: `feat(visual): janelas de resultado, escolhas e fim de jornada`.

### Tarefa 8: menu com abas e páginas

**Files:**
- Create: `css/menu.css`
- Modify: `tools/head.html` (nova casca `<section class="menu" id="menu" hidden>` com `<header class="mtop" id="mtop">`, `<main class="mpage" id="mpage">` e `<nav class="k-tabs" id="mtabs">`), `js/main.js`: `classScreen()` (linha ~923), `codexScreen()`, `missionsScreen()`, `boardScreen()`, `optionsScreen()`, `achScreen()`, `histScreen()`, `tutScreen()`, `newsScreen()`, `start()`, `resumeView()`, `cloudAdopt()`

**Interfaces:**
- Produz:
  - `function page(html: string, tab: 'codex'|'missoes'|'jogar'|'placar'|'mais'): void`: mostra `#menu`, esconde `#app`, coloca o `html` em `#mpage` e marca a aba `.on`.
  - `function showRun(): void`: o inverso.
  - As abas chamam `codexScreen()`, `missionsScreen()`, `classScreen()`, `boardScreen()` e `moreScreen()`. A função nova `moreScreen()` lista botões para Opções, Conquistas, Histórico, Como jogar e Novidades.
- Produz: essas telas passam a chamar `page(...)` em vez de `overlay(...)`. Os botões "Voltar" dentro delas (`backBtn()`) levam à aba Jogar. As janelas que pedem resposta continuam usando `overlay()`.
- Produz: `#mtop` mostra três pílulas: melhor resultado (`PROF.best`), vitórias totais (`PROF.totalWins`) e selos (`PROF.seals`).

- [ ] **Passo 1:** teste do Review Focus 3, que deve falhar antes.
  - Com uma jornada em andamento, recarregar a página: só `#app` visível (`#menu.hidden===true`).
  - Abandonar a jornada: só `#menu` visível, com a aba Jogar `.on`.
  - Chamar `cloudAdopt()` com um progresso que tenha jornada ativa: volta para `#app`.
- [ ] **Passo 2:** implementar `page()`, `showRun()` e `moreScreen()` e ligar as abas. Ajustar `start()`, `resumeView()`, `pickClass()` e `cloudAdopt()` para chamar `showRun()` ou `page()`, conforme a fase.
- [ ] **Passo 3:** reescrever a marcação de `classScreen()` conforme o esboço:
  - fita "ESCOLHA SEU HERÓI";
  - `.k-seg` com Jornada, Diário, Desafios, Seed e Duelo;
  - heróis em cartões 2×2 com rolagem só em `#mpage`, cadeado nos bloqueados, Ascensão (−/+) e kit dentro do cartão;
  - os extras de cada modo (desafios, campo de seed, código de duelo e botão de fantasma, explicação da Ascensão) e a história em cartão recolhível dentro da página;
  - botão verde "COMEÇAR".

  Todos os `data-*` usados pelos cliques existentes continuam.
- [ ] **Passo 4:** estilizar o menu com o fundo `--sky`, a página com rolagem interna e as abas embaixo, com o botão central Jogar.
- [ ] **Passo 5:** passar por cada aba e por cada modo, nos três tamanhos e com texto grande: `alforjeAudit()` → `[]`, e o teste do passo 1 passando.
- [ ] **Passo 6:** commit: `feat(visual): menu com abas e páginas`.

### Tarefa 9: remover o visual antigo, revisar tudo e publicar

**Files:**
- Delete: `css/legacy.css` (e a entrada em `STYLES`)
- Modify: o que faltar em `css/*.css` e `js/main.js` para cobrir regras que ainda dependiam de `legacy.css`

- [ ] **Passo 1:** apagar `legacy.css`, rebuild e rodar `node test/static-check.cjs --final`. Esperado: tudo `ok`, sem `Cinzel`, `Alegreya`, `Pixelify`, `framed` nem `plaque`.
- [ ] **Passo 2:** percorrer tudo em 360×640, 375×812 e 414×896, com `alforjeAudit()` → `[]` em cada tela:
  - menu, com os 5 modos e as 5 abas;
  - uma jornada: loja, luta, resultado, bênção, subclasse, encruzilhada, ampliar, fim e Sobrevivência;
  - todas as janelas.

  Repetir com texto grande, escala de 85%, modo daltônico, modo canhoto e modo econômico.
- [ ] **Passo 3:** a interface não pode ficar abaixo do nível atual: cada botão alcançável por Tab, com foco visível, e as janelas com `role="dialog"` e `aria-modal`.
- [ ] **Passo 4:** `node test/test-sim.cjs` → "tudo certo" e `static-check` → `ok`.
- [ ] **Passo 5:** commit: `feat(visual): remove o visual antigo`.
- [ ] **Passo 6:** apagar no Supabase as contas de convidado criadas pelos testes locais, conferindo os `id` antes de apagar. `git push`, esperar o build do GitHub Pages e conferir no site publicado: login de convidado, salvamento na nuvem, placar e um duelo com fantasma funcionando, com o console sem erros.
