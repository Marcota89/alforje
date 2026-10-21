# Alforje — Etapa 3: energia, bônus diário, metas do dia e progressão permanente

Data: 2026-10-21. Base: jogo publicado com o visual novo (`main` em 7f01070). Esboços aprovados: `2026-10-21-visual-novo/esboco-telas-etapa3.html` (Acampamento, Bônus diário, Metas do dia, Equipamento).

Marcação: **[decidido]** = combinado com o dono do jogo na conversa; **[minha escolha]** = número ou detalhe que eu defini e que pode ser ajustado sem mudar o desenho.

## Intenção

Como no Overgeared Hero, o jogador deve abrir o jogo todo dia e sempre encontrar algo para pegar (o bônus do dia) e metas renovadas para cumprir **[decidido]**. Entre uma jornada e outra o herói fica mais forte: equipamento, nível e companheiros que não se perdem **[decidido: "seguir mesma ideia" do Overgeared]**. A energia organiza o ritmo de jogo e prepara o terreno para anúncios e compras da etapa 4, sem nunca prender o jogador: quando acaba, há outras formas de ganhar mais **[decidido]**.

## Objetivos

1. Energia que limita o início de jornadas, com recarga no tempo e outras fontes (propaganda, bônus, metas, loja).
2. Bônus diário em calendário de 7 dias.
3. Cinco metas do dia que renovam todo dia, com baús por pontos.
4. Progressão permanente: nível do herói, quatro peças de equipamento que sobem de nível, companheiros guardados que crescem com ração.
5. Moedas permanentes (ouro permanente, rubis) e uma loja simples que gasta rubis.
6. Telas novas no kit visual já publicado, seguindo os esboços aprovados.

## Fora do escopo (não fazer agora)

- Anúncios reais e compras com dinheiro (etapa 4). O botão de propaganda existe e funciona, mas entrega o prêmio sem anúncio **[decidido]**.
- Economia validada no servidor. Energia, moedas e níveis ficam no perfil do aparelho e vão para a nuvem pelo salvamento que já existe; trapaça local (mexer no relógio ou no armazenamento) não é tratada nesta etapa **[minha escolha]**. A etapa 4, que envolve dinheiro, move a economia para o servidor.
- Notificações push, eventos com prazo, passe de temporada, tradução.
- Mudar regras de combate, itens, inimigos ou o Desafio Diário além do que esta página diz.

## Anti-objetivos (seria fracasso mesmo funcionando)

- Energia interromper uma jornada já começada.
- O Desafio Diário ou o Duelo usarem bônus permanentes: o placar e os duelos precisam continuar justos e o servidor continua refazendo as lutas do Diário exatamente como hoje.
- Jogador antigo perder progresso (perfil, codex, conquistas, selos, skins) na atualização.
- Telas novas com visual diferente do kit, ou que quebrem a auditoria de tela (`alforjeAudit()` → `[]`).

## Sistemas

### Energia
- Máximo 30; recarga de +1 a cada 8 minutos enquanto estiver abaixo de 30, contada pelo relógio (também com o jogo fechado) **[decidido na proposta aceita]**.
- Começar uma jornada custa 10 nos modos Normal, Desafios e Seed. O Desafio Diário e o Duelo não custam **[decidido]**. Continuar uma jornada salva, a Sobrevivência e as lutas dentro da jornada não custam.
- Prêmios podem passar do máximo, até 99; a recarga só funciona abaixo de 30 **[minha escolha]**.
- Sem energia: o botão de jornada mostra quanto falta e oferece propaganda, loja e metas.
- Propaganda: +10 de energia, até 3 vezes por dia **[decidido na proposta aceita]**. Agora mostra uma tela curta "Propaganda (em breve)" de 3 segundos e entrega o prêmio **[minha escolha]**.
- Jogador existente começa com 30.

### Bônus diário (calendário de 7 dias)
- Um prêmio por dia (dia em UTC, igual ao Desafio Diário). Perder um dia não zera a sequência: o próximo dia pego é sempre o seguinte do ciclo **[decidido]**. Depois do 7º, volta ao 1º.
- Prêmios: 1) 100 de ouro; 2) +10 de energia; 3) 3 pedras de forja; 4) 5 rações; 5) 20 rubis; 6) 1 ovo de companheiro; 7) baú dourado: 300 de ouro, 5 pedras e 10 rubis **[esboço aprovado; conteúdo do baú é minha escolha]**.
- "Assistir e pegar em dobro": uma vez por dia, dobra o prêmio do dia (o ovo vira 2 ovos) **[decidido no esboço]**.

### Metas do dia
- Cinco metas sorteadas por dia a partir de uma lista, iguais para todos no mesmo dia, renovando à meia-noite UTC, com contagem regressiva **[decidido no esboço]**.
- Cada meta vale 20 pontos; baús em 40, 70 e 100 pontos **[decidido no esboço]**.
- Lista **[minha escolha]**: vença 5 lutas; funda 3 itens; gaste 20 de energia; termine o Desafio Diário; derrote 1 elite ou chefe; forje 1 receita; compre 8 itens na loja; complete 1 jornada (vencendo ou não); pegue o bônus diário; melhore 1 peça de equipamento ou alimente 1 companheiro.
- Baús **[minha escolha]**: 40 → 100 de ouro e 10 de energia; 70 → 2 pedras e 3 rações; 100 → 15 rubis e 10 de energia.
- Botão "IR" leva ao lugar onde a meta se cumpre. As metas semanais e os selos que já existem continuam iguais.
- Lutas do Desafio Diário contam para as metas (só não usam bônus permanentes).

### Moedas e materiais permanentes
- **Ouro permanente** (💰), separado do ouro da loja dentro da jornada. Ganho ao fim de cada jornada: 10 por vitória + 50 se completar as 10, multiplicado pela Ascensão (+5% por nível) **[minha escolha]**.
- **Rubis** (💎): bônus diário, baús das metas, conquistas novas (+5 cada, só para conquistas desbloqueadas a partir desta versão) **[minha escolha]**.
- **Pedras de forja** (🪨): bônus diário, baús, e 1 a cada 3 vitórias numa jornada **[minha escolha]**.
- **Ração** e **ovos**: bônus diário, baús e loja.
- Jornadas do Desafio Diário e do Duelo dão metade do ouro e nenhuma pedra **[minha escolha]**.

### Nível do herói
- Um nível da conta (não por classe): XP = 10 por vitória em qualquer modo; o nível L pede 100×L de XP para subir; máximo 30 **[minha escolha]**.
- Cada nível dá +3 de vida máxima nas jornadas com bônus **[esboço: "nível soma vida"; valor é minha escolha]**.

### Equipamento permanente
- Quatro peças fixas, todas começando no nível 1, máximo 20 **[esboço; limites são minha escolha]**:
  - Arma: +2% de dano por nível acima do 1.
  - Armadura: +3 de escudo inicial por nível acima do 1.
  - Anel: +1% de chance de crítico por nível acima do 1.
  - Bolsa: +1 de ouro da loja no início da jornada por nível acima do 1.
- Melhorar do nível L para L+1 custa L pedras e 50×L de ouro permanente **[minha escolha]**.
- A raridade mostrada na peça acompanha o nível (1–5 Comum, 6–10 Raro, 11–15 Épico, 16–20 Lendário) **[minha escolha, para usar as cores do kit]**.

### Companheiros permanentes
- Os 5 companheiros que já existem (Corvo, Salamandra, Tartaruga, Fada, Coruja) podem ficar guardados na coleção **[decidido]**.
- Ovo: choca na hora um companheiro que o jogador ainda não tem; se já tiver todos, vira 10 rações **[minha escolha]**. Jogador existente começa sem nenhum guardado.
- Nível 1–10; subir do nível L para L+1 custa L+1 rações **[minha escolha]**.
- Um companheiro escolhido ("levar na jornada") entra na primeira vaga de companheiro no início das jornadas com bônus, no nível Comum, com dano, cura, escudo e efeitos +10% por nível acima do 1 **[minha escolha]**. Os companheiros comprados na loja durante a jornada continuam como hoje.

### Onde os bônus valem
- Valem: jornadas Normal, Desafios e Seed (e a Sobrevivência que continua delas).
- Não valem: Desafio Diário e Duelo **[decidido]**. Os códigos de build e os fantasmas não carregam bônus permanentes, para o duelo ser justo **[minha escolha]**.
- Técnica: os bônus entram como um campo novo do estado da jornada lido por `makePlayer()` em `js/sim.js`, vazio no Diário e no Duelo. Como o servidor usa uma cópia de `sim.js`, a função `alforje-submit` precisa ser republicada com a cópia nova; o Diário, sem o campo, continua dando exatamente o mesmo resultado.

### Loja (rubis)
- Itens **[minha escolha]**: +30 de energia por 15 rubis (até 2 por dia); 3 pedras por 10; 5 rações por 10; 1 ovo por 30.
- Propaganda grátis uma vez por dia: 50 de ouro **[minha escolha]**.
- Sem compra com dinheiro (etapa 4); o "+" das pílulas de energia e rubis leva à loja.

## Telas (kit visual atual, esboços aprovados)

- **Barra do menu:** as três pílulas passam a ser energia (com tempo para o próximo ponto), ouro permanente e rubis, cada uma com "+" **[esboço]**. Melhor resultado, vitórias e selos vão para o Acampamento.
- **Abas:** Equipar, Pets, Jogar (centro), Diário, Loja **[esboço]**. Diário reúne Bônus diário e Metas do dia em duas partes da mesma página **[minha escolha]**.
- **Acampamento (aba Jogar):** herói escolhido no centro, nível do herói, atalhos à direita com alertas (Bônus, Metas, Placar), energia e "JORNADA ⚡10", botão roxo de propaganda (+10 ⚡, "2/3 hoje") **[esboço]**. "JORNADA" abre a escolha de herói e modo que já existe; ali o botão COMEÇAR mostra o custo (⚡10, ou "grátis" no Diário e no Duelo).
- **Mais:** Codex, Missões semanais, Placar, Conquistas, Histórico, Como jogar, Novidades e Opções ficam num botão "☰" no topo do Acampamento **[minha escolha, porque as 5 abas passam a ser as do esboço]**.
- **Equipar:** quatro peças com cor de raridade e nível, resumo dos bônus (vida, escudo, dano, crítico, ouro), botão MELHORAR com custo **[esboço]**.
- **Pets:** coleção com nível, ração, botões alimentar e "levar na jornada", ovos para chocar.
- **Diário:** calendário 4×2 com o 7º dia em dourado ocupando duas colunas, hoje em verde, pegos com ✔; metas com trilha de baús, progresso, "IR" e contagem **[esboço]**.
- **Loja:** cartões de oferta com preço em rubis.
- **Fim da jornada:** a janela de resultado mostra o que entrou na conta (ouro, pedras, XP, nível novo).
- Alertas vermelhos (`.k-dot`) nas abas e atalhos quando há prêmio a pegar, baú aberto ou melhoria possível.

## Restrições

- Mesmo código-base: HTML5 sem bibliotecas novas, `js/main.js` + CSS do kit, `node tools/build.cjs` gera `index.html`.
- `js/data.js` e `js/sim.js` só mudam no mínimo necessário (tabelas novas em `data.js`; o campo de bônus em `makePlayer()`), com a linha de base de `test/static-check.cjs` atualizada e a função do servidor republicada.
- Perfil antigo migra sem perder nada; tudo novo entra no perfil e vai para a nuvem pelo salvamento existente.
- Dia em UTC, como o Diário.
- Todas as telas novas passam em `alforjeAudit()` (360×640, 375×812, 414×896; texto grande, daltônico, canhoto, econômico) e mantêm foco visível e `aria`.
- `test/test-sim.cjs` continua passando; ganha testes para os bônus e para o Diário sem bônus.

## Regras de construção (respostas da revisão do construtor, todas minha escolha)

1. **Dois aparelhos:** continua valendo o salvamento atual (o lado mais recente substitui o perfil inteiro). Isso permite perder ou repetir prêmios entre aparelhos; aceito até a etapa 4 levar a economia ao servidor.
2. **Cobrança de energia:** no clique em COMEÇAR, quando a jornada é criada. Sem devolução. Abandonar e começar outra cobra de novo; cada nova partida de Seed cobra. Continuar a jornada salva e a Sobrevivência não cobram.
3. **Relógio:** relógio do aparelho, dia em UTC (igual ao Diário). Se o relógio voltar para trás, não há recarga e a marca de tempo é refeita; saltos para a frente recarregam no máximo até 30.
4. **Metas:** as 5 do dia saem de um sorteio com semente na data UTC, sem repetição. O progresso vale só para o dia; na virada, metas e baús não pegos são perdidos (o alerta vermelho avisa antes). Baú se pega com um toque.
5. **Bônus na jornada:** guardados no estado da jornada no momento de COMEÇAR (melhorias no meio não mudam a jornada em andamento). Ficam fora dos códigos de build, fantasmas e prova do Diário. Critério de aceite: um teste fixa os resultados do Diário para um conjunto de sementes antes da mudança e exige os mesmos resultados depois.
6. **Companheiro levado:** ocupa a 1ª das 3 vagas no início; pode ser vendido como qualquer um (só some nesta jornada); o bônus de nível multiplica depois do multiplicador de raridade; fusões seguem a regra de hoje; no desafio sem companheiros ele não entra.
7. **Fórmulas:** dano +% vale para todo dano do jogador (armas, companheiros, queimadura, veneno, espinhos); escudo inicial soma ao escudo de partida; crítico soma à chance atual; ouro da Bolsa soma aos 10 de ouro inicial; vida do nível soma à vida base antes dos outros modificadores.
8. **Jogador antigo:** XP inicial = 10 × vitórias totais já feitas (já começa no nível que mereceu); moedas e materiais começam em 0; energia 30. Rubis por conquista valem só para conquistas que não estavam no perfil no momento da atualização.
9. **Contadores do dia:** propaganda de energia (3), dobro do bônus (1), propaganda da loja (1) e energia comprada (2) são contadores separados, zerados na virada UTC. A tela de propaganda dura 3 segundos, sem fechar antes, e então entrega o prêmio.
10. **Limites:** energia até 99 (o excesso de um prêmio se perde, com aviso); demais moedas e materiais até 99.999.
11. **Menu:** as 5 abas substituem as atuais; a escolha de herói e modo vira página aberta por JORNADA, com Voltar para o Acampamento; o herói do Acampamento é o selecionado. Nada da barra antiga se perde: tudo vai para "☰ Mais", e todas as chamadas que hoje apontam para as abas antigas são reapontadas.
12. **Publicação:** primeiro a função do servidor com a cópia nova de `sim.js` (compatível, porque o Diário nunca leva bônus), depois o site. Versão do jogo passa a 8.0.
13. **Contagem das metas:** lutas do Diário e do Duelo contam; os ganchos ficam em `js/main.js` (onde já existem os eventos de fusão, forja, vitória e elite), sem mexer em `sim.js` para isso.

## O que fica para quem constrói

- Formato exato dos dados no perfil, nomes de funções e em que arquivo CSS cada tela fica (seguindo o padrão das tarefas do visual novo).
- Animações de pegar prêmio e de subir de nível, dentro do kit e respeitando movimento reduzido.
- Textos curtos das telas novas, no tom do jogo.
