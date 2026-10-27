Você vai trabalhar com o **Alforje**, um jogo que já existe e está publicado. Use o resumo abaixo como fonte de verdade sobre o que o jogo é e como ele funciona (versão 8.2). Quando eu pedir algo sobre o jogo, respeite estas regras e números; se precisar supor algo que não está aqui, diga que é suposição.

# O jogo em uma frase
Alforje é um roguelike de mochila em grade para celular (estilo Backpack Battles / Overgeared Hero): você compra itens numa loja, encaixa e funde esses itens dentro de uma mochila em grade, e o herói luta sozinho, em combate automático, contra o inimigo de cada parada da estrada. Tema de fantasia medieval em pixel art, todo em português do Brasil.

# Plataforma e tecnologia
- Web (HTML5 + JavaScript puro, sem frameworks), pensado para celular em pé; publicado no GitHub Pages; pode ser instalado na tela inicial (manifesto e ícone de app).
- Conta de convidado automática (sem cadastro) e salvamento na nuvem via Supabase.
- O combate é determinístico (gerador com semente): a mesma mochila contra o mesmo inimigo dá sempre o mesmo resultado. O placar do Desafio Diário é conferido no servidor, que refaz cada luta da partida.
- Acessibilidade: texto grande, modo daltônico (símbolos de raridade), modo canhoto (layout espelhado), modo econômico (menos animação), escala da interface e movimento reduzido.

# História
O alforje do avô do herói ficou vinte anos pendurado no porão. Algo roeu a alça e subiu cheiro de enxofre: o herói pega a mochila e refaz a viagem do avô até a Montanha Rubra, onde mora o Wyrm Rubro (chefe final). O Mascate Brás, vendedor da loja, comenta as jogadas.

# A jornada (núcleo do jogo)
- Uma jornada tem **10 paradas** (vencer 10 lutas) e o herói tem **5 vidas**. Perder uma luta custa 1 vida e o jogador tenta de novo a mesma parada; sem vidas, a jornada acaba.
- Paradas e biomas: 1 Porão, 2 Floresta, 3 Estrada (elite), 4 Neve, 5 Pântano, 6 Castelo (elite), 7 Mina, 8 Vulcão, 9 Cripta (elite), 10 Wyrm Rubro (chefe). Cada parada sorteia um inimigo entre 1 e 5 variações.
- Depois de vencer as 10, o jogador pode seguir na **Sobrevivência** (rumo ao Norte) até a parada 14, com 3 vidas extras e inimigos cada vez mais fortes.
- Ciclo de cada parada: **loja → organizar a mochila → lutar → recompensa → próxima parada**.

## Ouro e loja
- Começa com 10 de ouro. Renda por rodada: 8 + rodada (até +8), mais itens de ouro na mochila, +2 por vitória, +2 de consolo na 1ª derrota da parada, e **juros** de 1 a cada 5 de ouro guardado (teto 3, ampliável).
- A loja tem 5 ofertas (6 com bênção). Preço = preço do item × raridade (1 / 2,5 / 5 / 9). 10% das ofertas vêm em promoção (preço de venda). A partir da 2ª rodada pode aparecer um companheiro.
- A raridade das ofertas melhora com a parada: paradas 1–2 só Comum; até 35% Comum / 35% Raro / 24% Épico / 6% Lendário no fim.
- Trocar a loja custa 1, 1, 2, 2 e depois 3 por parada. Dá para **reservar** até 2 ofertas para a próxima parada.
- **Vender** devolve metade do preço. **Desfazer** reverte a última compra/venda/movimento.
- **Martelo do Mascate**: 1 vez por parada, paga a diferença de preço e sobe a raridade de um item.
- **Ampliar a mochila**: até 3 vezes (custos 5, 8 e 11), escolhendo crescer em largura ou altura (máximo 7×6).

## Mochila em grade
- Cada item ocupa um formato (1×1, 1×2, 2×2, 1×3, 2×3…) e pode ser girado. Itens fora da mochila (no **Baú** reserva, 2 fileiras) não lutam.
- **Fusão**: dois itens iguais da mesma raridade viram um da raridade seguinte: Comum → Raro → Épico → Lendário. Poder por raridade: ×1 / ×2,1 / ×4,4 / ×9,2. Raridade 3+ ganha "despertares" (ex.: armas +15% de crítico; Lendárias com 25% de Eco, golpe duplo).
- **Forja** (receitas): ao vencer uma luta, dois itens específicos encostados viram um item novo, herdando a maior raridade. Ex.: Espada Curta + Pedra de Amolar = Lâmina do Herói; Cajado de Brasa + Tocha = Cajado Infernal; Adaga + Frasco de Veneno = Presa da Víbora; Arco Longo + Pena de Grifo = Arco do Vendaval (8 receitas no total).
- **Itens de apoio** dão bônus às armas pela posição: lados, diagonais, lados+diagonais, fileira inteira ou coluna inteira (ex.: Pedra de Amolar +dano nos lados; Trevo +crítico nas diagonais; Pena de Grifo +velocidade na fileira; Tocha +queimadura; Frasco de Veneno +veneno). Flâmulas valem para todas as armas de uma afinidade, em qualquer lugar. Espelho de Prata e Corrente Rúnica transmitem bônus a distância.
- **Zonas e bolsos**: alguns itens rendem mais no topo (Elmo) ou no fundo (Botas). Casas especiais ("bolsos") dão crítico, peso menor, armadura reforçada, velocidade ou ouro.
- **Carga**: cada arma pesa; passar do limite da classe deixa todas as armas mais lentas.
- **Afinidades** (tags): Fogo, Gelo, Veneno, Metal, Sagrado e Natureza. Com 3 e com 5 itens da mesma tag ganha-se bônus (ex.: Fogo +queimadura; Metal +escudo inicial; Sagrado +cura; Natureza +velocidade).
- Há 69 itens: armas (espadas, adagas, machados, arcos, lanças, martelos, cajados, bombas, frascos), armaduras (escudos, elmo, couraças, placas), apoios, gatilhos (disparam no início da luta, ao perder o escudo, a cada 5 críticos ou abaixo de 50% de vida) e itens de ouro.

## Combate automático
- Em tempo real: cada arma ataca no seu próprio tempo de recarga. O herói tem vida e escudo (o escudo absorve dano primeiro).
- Efeitos: crítico, roubo de vida, atordoamento, perfurar (ignora escudo), **queimadura** e **veneno** (dano por segundo; com teto de acúmulo), **Gelo** (deixa o alvo mais lento, até 25), **Purga** (tira escudo, corta cura e desliga reflexo), reflexo/espinhos, curas periódicas.
- **Fadiga** aos 25 s: os dois lados passam a perder vida crescente.
- Arquétipos de inimigo (cada um com uma "resposta" sugerida): Enxame, Brutamontes, Tanque de Espinhos, Assassino Venenoso, Piromante, Regenerador, Gélido e Chefe. Elites e chefe têm modificadores (Fúria, Casca Grossa, Couraça Viva, Sangue Velho, Reforço, Hálito Gélido, Toxina, Escamas Ígneas).

## Heróis (classes)
Cada herói tem vida, carga, formato de mochila, habilidade e 2 kits iniciais. Na 4ª vitória escolhe uma **subclasse**.
- **Guerreiro** (55 de vida, +8 escudo, mochila 5×4) — Fúria: abaixo de metade da vida, +60% de dano. Subclasses: Berserker / Guardião.
- **Ladina** (40 de vida, +15% crítico, críticos 2,5×, mochila 7×3) — o primeiro golpe de cada arma é crítico. Subclasses: Assassina / Envenenadora.
- **Piromante** (45 de vida, +1 em toda queimadura, armas de Fogo não pesam, mochila 4×5) — Combustão: com 10 de queimadura o inimigo explode. Subclasses: Pirotécnico / Cinzeiro.
- **Paladino** (64 de vida, curas +50%) — Luz Sagrada: a cada 8 s, +10 vida e +10 escudo. Subclasses: Cruzado / Inquisidor. Desbloqueia com vitórias.
- **Alquimista** (76 de vida) — Mistura Volátil: cada cura de item também fere o inimigo e aplica veneno. Subclasses: Boticário / Demolidor. Desbloqueia ao completar uma jornada.

## Eventos durante a jornada
- **Bênçãos** ao vencer elites: Bronze nas paradas 3, 8 e 9, Prata na 6 (ex.: +1 vaga na loja, +15 de vida, Primeiro Sangue, Juros Compostos, Tesouro do Figurão).
- **Encruzilhada** (após a 6ª vitória): aposta do Mascate, altar (troca vida máxima por raridade) ou vender um companheiro.
- **Etiquetas**: trocar a loja de uma parada por um bônus futuro (itens Raros garantidos, +8 de ouro, trocas grátis, item Épico).
- **Companheiros na jornada** (até 3): Corvo (bica), Salamandra (queima), Tartaruga (escudo), Fada (cura), Coruja das Neves (gelo). Fundem como itens e têm uma habilidade de loja (troca grátis, martelada grátis, reserva extra, +3 de ouro, oferta melhor).

# Modos de jogo
- **Normal** com **Ascensão** 0 a 10 por herói: cada nível deixa os inimigos mais fortes (sobretudo vida) e adiciona regras (ex.: juros menores, trocas mais caras, menos vidas, preços +10%, elites com 2 modificadores). A próxima Ascensão libera após 2 vitórias de jornada no nível atual.
- **Desafios** (8 regras especiais): Sem Fusão, Mochila 4×4, Lâmina Única, Carga 3, Mercado Pobre, Fadiga Precoce, Coração de Vidro (1 vida), Viajante Solitário (sem companheiros).
- **Seed**: escolhe uma semente e todo mundo joga a mesma rota.
- **Desafio Diário**: mesma semente e mesma classe para todos no dia (UTC), sem Ascensão e sem bônus permanentes; placar diário verificado no servidor.
- **Duelo**: enfrentar, no lugar do chefe, a mochila de outro jogador (código de build ou "fantasma" do servidor).

# Meta-progressão (entre jornadas)
- **Energia**: máximo 30, recarrega +1 a cada 8 min; começar uma jornada Normal, Desafio ou Seed custa 10 (Diário e Duelo são grátis); propaganda dá +10 até 3×/dia; prêmios podem levar a energia até 99. Energia nunca interrompe uma jornada em andamento.
- **Moedas e materiais**: ouro permanente, rubis, pedras de forja, ração e ovos.
- **Fim de jornada** paga ouro (10 por vitória + 50 se completar, ×Ascensão), pedras (1 a cada 3 vitórias) e XP (10 por vitória). Diário e Duelo pagam conta só na primeira jornada do dia.
- **Bônus diário**: calendário de 7 dias (100 ouro, +10 energia, 3 pedras, 5 rações, 20 rubis, 1 ovo, baú dourado); perder um dia não zera a sequência; pode dobrar com propaganda 1×/dia.
- **Metas do dia**: 5 metas sorteadas por dia (ex.: vença 5 lutas, funda 3 itens, gaste 20 de energia, termine o Diário, derrote um elite), 20 pontos cada, baús em 40, 70 e 100 pontos. Há também missões semanais (dão selos que liberam visuais de mochila) e 31 conquistas (+5 rubis cada).
- **Nível do herói** (conta): sobe com XP até 30; +1 de vida por nível.
- **Equipamento permanente**: Arma (+1% dano/nível), Armadura (+2 escudo), Anel (+0,5% crítico), Bolsa (+1 ouro inicial a cada 2 níveis); níveis 1–20; subir custa pedras e ouro (25 × nível²). Os bônus valem 100% na Ascensão 0 e caem até 30% na Ascensão 10.
- **Companheiros permanentes**: ovos chocam um dos 5 companheiros; ração sobe o nível (1–10, +10% de efeito por nível); um deles pode ir junto em cada jornada.
- **Loja de rubis**: +30 de energia (15 rubis, 2×/dia), 3 pedras (10), 5 rações (10), 1 ovo (30); mais uma propaganda grátis de +50 de ouro por dia. Ainda não há compras com dinheiro real nem anúncios reais (o botão de propaganda é um placeholder de 3 s).

# Telas e navegação
- Menu com 5 abas: **Equipar**, **Pets**, **Jogar** (Acampamento, no centro), **Prêmios** (bônus diário e metas) e **Loja**.
- No topo: energia (com contagem para o próximo ponto), ouro e rubis.
- **Acampamento**: cenário de entardecer com o herói, nível, atalhos (Bônus, Metas, Placar, ☰ Mais), barra de energia, botão "JORNADA ⚡10" e botão de propaganda.
- **☰ Mais**: Codex (itens, inimigos e receitas descobertos), Missões semanais, Placar, Conquistas, Histórico, Como jogar, Novidades e Opções.
- Durante a jornada: arena com o herói e o inimigo, placar VS com vida e escudo, mochila, loja, baú, barra de ações (Trocar, Ampliar, Desfazer, Baú, Mais, LUTAR!), controles 1×/2×/4× e Pular durante a luta, e medidor de dano ao vivo por item.
- Visual: estilo RPG casual colorido (fontes Lilita One e Nunito), janelas com fita no título, ícones em pixel art para energia, ouro, rubi, pedra, ração, ovo e baús.
