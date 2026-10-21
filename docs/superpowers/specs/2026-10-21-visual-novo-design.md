# Alforje: visual novo do jogo inteiro

Data: 2026-10-21 · Projeto: `alforje-web/` (site em https://marcota89.github.io/alforje/)

## Intenção

O dono do jogo quer que o Alforje tenha a aparência de um RPG casual de celular, no estilo do **Overgeared Hero: Merge RPG**: colorido, com botões "gordinhos" com volume, janelas com fita no título, barra de recursos no topo, abas embaixo e alertas vermelhos. Hoje o jogo tem visual medieval de couro escuro (fonte Cinzel, painéis marrons).

Este projeto troca **só a moldura** (cores, tipografia, botões, janelas, organização das telas) em **todas** as telas. É a primeira de duas partes: a etapa seguinte (energia, bônus diário, metas do dia, progressão permanente) vai construir as telas novas em cima deste mesmo kit visual. Por isso o kit precisa nascer reutilizável.

Esboços aprovados pelo dono (abrir no navegador):

- `2026-10-21-visual-novo/esboco-jogo-inteiro.html`: escolha de herói, loja com mochila e luta. **É a referência principal deste projeto.**
- `2026-10-21-visual-novo/esboco-telas-etapa3.html`: Acampamento, Bônus diário, Metas e Equipamento. Referência do mesmo kit; essas telas **não** são feitas aqui.

O dono aprovou esses esboços com "manter desta forma". Nas versões anteriores, ele reclamou de formatação e encaixe ruins: espaços vazios, imagens faltando, elementos que não preenchiam a tela. Encaixe limpo é requisito, não acabamento.

## Objetivos

1. Todas as telas e janelas do jogo no estilo dos esboços, sem sobrar nenhuma no visual antigo.
2. Um kit visual único, com tokens de cor, tipografia e componentes (botão, pílula, janela com fita, cartão, abas, alerta), usado pelas telas atuais e pronto para as telas da etapa 3.
3. Layout em faixas fixas, como nos esboços: barra de recursos no topo, conteúdo que ocupa todo o espaço restante, ações ou abas embaixo. Nada flutuando, nada cortado, nenhum vazio grande.
4. Continuar jogável em celular em pé, de 360×640 até 430×932, e no computador (coluna central, como hoje).

## Não-objetivos

- Não mudar regras, números, balanço, textos de jogo nem fluxo de partida. `js/data.js` e `js/sim.js` **não** são alterados; se fossem, a função `alforje-submit` do servidor teria de ser publicada de novo.
- Não criar energia, bônus diário, metas do dia, equipamento permanente, rubis ou loja de rubis (isso é a etapa 3).
- Não redesenhar a arte de itens, heróis, inimigos e cenários: os sprites `a/*.webp` e o desenho da arena no `<canvas>` continuam.
- Não copiar arte, logotipo, ícones nem marca do Overgeared Hero. A referência é só o estilo.

## Anti-objetivos (seria fracasso mesmo funcionando)

- O jogo terminar com partes nos dois visuais.
- Perder recursos de acessibilidade que já existem: modo daltônico, modo canhoto, texto grande, escala de interface, modo econômico, rótulos ARIA, mover item sem arrastar (toque no item e depois na casa), foco visível e respeito a `prefers-reduced-motion`.
- Texto cortado ou sobreposto em qualquer tela nos tamanhos de celular acima.
- O arrastar e soltar da mochila ficar pior: alvo de toque menor, item escondido pelo dedo, "lixeira" de venda difícil de achar.
- Quebrar o salvamento, a nuvem, o placar ou o duelo.

## Restrições

- JavaScript puro, sem framework. O CSS fica em `tools/head.html`, e `node tools/build.cjs` gera `index.html`. O HTML das telas é montado em `js/main.js` por strings de template e IDs; o CSS novo deve usar as classes e IDs que já existem ou trocá-los junto no `main.js`.
- Publicação por GitHub Pages. Recursos externos só de fontes confiáveis e com versão fixa. Hoje as fontes estão embutidas em base64 no CSS (Cinzel, Alegreya Sans, Pixelify), e podem ser trocadas.
- O jogo pausa em paisagem no celular (mensagem "Gire o celular"). Isso continua.
- `test/test-sim.cjs` tem de continuar passando (garante que a simulação não mudou).

## Kit visual (decidido nos esboços)

**Fundos de tela:** gradiente de céu de dia (`#58b6ff → #9ad8ff → #ffe2a0 → #f2a94f`) nas telas de menu e escolha, e gradiente de entardecer roxo (`#2c1b5e → #55298c → #a8408f`) nas telas dentro da jornada (loja, luta) e nas janelas sobre elas.

**Componentes:**

| Componente | Aparência |
|---|---|
| Pílula de recurso | fundo roxo-escuro translúcido, borda dourada `#ffd34d`, texto branco em negrito, botão verde "+" quando houver como ganhar mais |
| Botão principal | verde `#86f36f → #25a845`, borda branca de 3px, sombra sólida embaixo `#157a2c`, texto branco grosso com sombra |
| Botão de destaque | laranja-dourado `#ffd04a → #f08a1c`, sombra `#a5520a` |
| Botão secundário ou de ação | roxo `#7a5cd6 → #4b2fa0`, sombra `#2c1a66` |
| Botão de perigo (LUTAR, vender) | vermelho `#ff6a4a → #d8282f`, sombra `#8a1020` |
| Botão de propaganda (etapa 3) | roxo claro `#b06bff → #7a35d6` |
| Janela | creme `#fff8e4 → #ffe5ad`, borda laranja `#f08a1c` de 4px, cantos de 20px, sombra sólida `#a5520a`, texto marrom `#5a2a00` |
| Fita de título | vermelho `#ff5a5a → #c81e3a`, borda branca, sobreposta à borda de cima da janela |
| Cartão | mesmo fundo creme da janela, com borda mais fina |
| Abas inferiores | barra roxa `#3a2470 → #1b1036` com linha dourada em cima; botão central redondo e maior (Jogar) |
| Alerta | bolinha vermelha `#ff3b3b` com borda branca e número ou "!" |
| Segmentos (abas de modo) | trilho escuro com o item ativo em laranja-dourado |

**Raridade:** Comum cinza `#9aa6b2`, Raro azul `#2f9bff`, Épico roxo `#b462ff`, Lendário dourado `#ffb020`, como borda dos itens na mochila, na loja e no medidor.

**Números de luta:** dano em branco, crítico em dourado e maior, cura em verde, escudo em azul-claro. Todos com contorno escuro para ler sobre o cenário.

## Telas e o que muda em cada uma

| Tela atual (função em `main.js`) | No visual novo |
|---|---|
| Menu inicial e escolha de herói (`classScreen`) | Como no esboço: fita "ESCOLHA SEU HERÓI", segmentos dos modos (Jornada, Diário, Desafios, Seed, Duelo), heróis em cartões 2×2 com rolagem quando forem mais de 4, cadeado nos bloqueados, Ascensão e kit dentro do cartão, botão verde de começar. A história de abertura vira um cartão recolhível. |
| Barra superior da jornada (`#topbar`, `#stats`) | Pílulas: parada (🏁 1/10), vidas (❤️), ouro com renda da rodada; companheiros e menu como botões redondos |
| Arena e placar VS (`#arena`, `#hud`, `#foeinfo`) | Cartão VS com barras de vida, arena com moldura branca e cantos arredondados; a faixa do tipo de inimigo vira pílula |
| Mochila e baú (`#bag`, `#chest`, `#aff`) | Cartão creme com casas claras, itens com borda da cor da raridade, linhas de sinergia mantidas; carga e afinidades em pílulas abaixo |
| Loja (`renderShop`) | Ofertas como botões quadrados com preço em pílula, reserva (cadeado) e promoção visíveis |
| Ações da loja (`#actions`) | Botões roxos (Trocar, Ampliar, Desfazer, Baú, Mais) com alertas e "LUTAR!" vermelho maior |
| Durante a luta (`renderMeter`, velocidade) | **A mochila some durante a luta** (decisão do dono). A tela fica como no esboço: cartão VS, arena grande (cerca de 210px de altura no celular de 375×812), medidor ao vivo em cartão com os ícones dos itens, e 1×, 2×, 4× e "PULAR" embaixo. O destaque de "item atacou" que hoje acende o item na mochila passa para a linha do item no medidor. A mochila volta quando a luta acaba. |
| Gaveta (`openDrawer`, `#drawer`) e ficha do item (`renderSheet`, `renderPop`) | Janela com fita, mesmo kit |
| Resultado da luta, Forja (`finish`) | Janela com fita "VITÓRIA!" verde ou "DERROTA" vermelha; tabelas em cartões |
| Bênção, subclasse, encruzilhada, ampliar mochila (`blessScreen`, `subScreen`, `eventScreen`, `expandScreen`) | Janela com fita e escolhas em cartões grandes |
| Fim de jornada (`endScreen`) | Janela com fita, pontuação em destaque, botões do kit |
| Placar (`boardScreen`), missões semanais e visuais (`missionsScreen`), Codex (`codexScreen`), conquistas (`achScreen`), histórico (`histScreen`), novidades (`newsScreen`), como jogar (`tutScreen`), opções (`optionsScreen`), confirmação (`confirmBox`) | Janela com fita, listas em cartões, botões do kit |
| Tutorial guiado (`#coach`), aviso flutuante (`toast`), abertura (`#splash`), "Gire o celular" (`#rotmsg`) | Mesmas funções no kit: balão creme do tutorial, aviso em pílula, abertura com o fundo de céu |

**Visuais de mochila desbloqueáveis** (couro, carvalho, geada, brasa, ouro velho, noite): continuam existindo e mudando a aparência do cartão da mochila (cor de fundo, borda e casas), adaptados ao estilo novo.

## Decisões minhas (o dono não opinou; podem ser revistas)

- **Barra superior no menu:** energia, ouro permanente e rubis só existem a partir da etapa 3. Até lá, as pílulas do menu mostram o que já existe (melhor resultado, vitórias totais e selos) e a etapa 3 as troca.
- **Abas inferiores no menu:** os destinos dos esboços (Equipar, Pets, Diário, Loja) são da etapa 3. Até lá, as abas levam ao que já existe: Codex, Missões, Jogar (centro), Placar e **Mais**. A aba Mais reúne Opções, Conquistas, Histórico, Como jogar e Novidades.
- **Aba Jogar:** contém a escolha de modo e de herói. Os extras de cada modo (lista de desafios, campo de seed, código de duelo com o botão de fantasma, explicação da Ascensão) e a história de abertura ficam dentro da área de conteúdo, com rolagem só nessa área; barra de cima e abas ficam fixas.
- **Aba Placar:** mostra sempre o placar do Desafio Diário de hoje, que é o único placar que existe.
- **Páginas e janelas:** os destinos das abas (Codex, Missões, Placar, Mais) são páginas na área de conteúdo, com barra de recursos e abas visíveis. Avisos e escolhas que pedem resposta (resultado da luta, bênção, subclasse, encruzilhada, ampliar, fim de jornada, confirmação) continuam como janela que cobre a tela inteira com fundo escurecido, como o `overlay()` de hoje, mantendo `aria-modal` e o foco preso na janela.
- **Abas na jornada:** dentro da jornada não há abas inferiores. A faixa de baixo é a das ações da loja ou dos controles da luta, como no esboço.
- **Loja em tela pequena (360×640):** quando não couber tudo, o tamanho das casas da mochila tem prioridade (mínimo atual de 44px); a arena da loja pode encolher até cerca de 96px, como no esboço. A área de soltar para **vender** sai da arena e passa para a faixa das ofertas da loja, que vira "Vender" enquanto um item é arrastado, mantendo um alvo grande.
- **Publicação:** desenvolver e testar localmente (servidor local apontando para o mesmo Supabase, com as contas de teste apagadas no fim) e publicar no GitHub Pages **de uma vez**, só quando todas as telas estiverem no visual novo. Não há ambiente de prévia.
- **Tipografia:** uma fonte grossa e arredondada para títulos, números e botões, e uma legível para textos; as duas com acentos do português. O construtor escolhe, embutindo os arquivos ou carregando do Google Fonts com versão fixa. Os esboços usaram Trebuchet só como marcador.
- **Ícones:** os esboços usaram emoji. O construtor pode manter emoji ou trocar por ícones próprios, desde que fiquem iguais em todos os aparelhos.

## Deixado para o construtor

- A ordem de migração das telas e a organização do CSS (variáveis, classes utilitárias).
- Animações de clique e de entrada das janelas, dentro de `prefers-reduced-motion`.
- O ajuste fino de espaçamentos para caber de 360 a 430 de largura, desde que siga o princípio das faixas fixas e não deixe vazios grandes.

## Como saber que terminou

- Nenhuma tela ou janela com o visual antigo, percorrendo: menu, os 5 modos, uma jornada com loja, luta, resultado, bênção, subclasse, encruzilhada, ampliar, fim de jornada, Sobrevivência, e todas as janelas do menu.
- Capturas em 360×640, 375×812 e 414×896 sem texto cortado, sobreposição ou rolagem lateral.
- Arrastar, girar, vender, fundir e o modo "tocar e depois tocar" funcionando como antes.
- Acessibilidade das opções funcionando (daltônico, canhoto, texto grande, escala, econômico).
- `node test/test-sim.cjs` passando, e `js/data.js` e `js/sim.js` sem alteração.
- Salvamento local, nuvem, placar e duelo funcionando no site publicado.
