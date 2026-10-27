/* Alforje: tabelas de dados (itens, classes, paradas, inimigos, bênçãos, textos). Sem DOM e sem estado. */
(function(){
'use strict';
const D={hooks:{}};
/* ================= DATA ================= */
/* tags: fogo, gelo, veneno, metal, sagrado, natureza */
const TAGS={fogo:{name:'Fogo',col:'#ff8a3a',t3:'+1 em cada queimadura aplicada',t5:'+2 em cada queimadura e ela some pela metade da velocidade'},
 gelo:{name:'Gelo',col:'#8fe3ff',t3:'+1 em cada Gelo aplicado',t5:'+2 em cada Gelo e o inimigo começa com 5 de Gelo'},
 veneno:{name:'Veneno',col:'#9ad84a',t3:'veneno age a cada 1,6s (em vez de 2s)',t5:'veneno age a cada 1,2s'},
 metal:{name:'Metal',col:'#c8d0dc',t3:'+8 de escudo inicial',t5:'+20 de escudo inicial e armas de Metal +10% de dano'},
 sagrado:{name:'Sagrado',col:'#ffe08a',t3:'curas +25%',t5:'curas +50% e +15 de vida máxima'},
 natureza:{name:'Natureza',col:'#7fd07a',t3:'todas as armas 6% mais rápidas',t5:'todas as armas 14% mais rápidas'}};
const TAGKEYS=Object.keys(TAGS);
const ITEMS={
 sword:{name:'Espada Curta',w:1,h:2,price:3,type:'weapon',dmg:4,cd:1.6,crit:.05,wt:2,fx:'slash',tags:['metal']},
 dagger:{name:'Adaga',w:1,h:1,price:3,type:'weapon',dmg:2,cd:.9,crit:.2,wt:1,fx:'stab',tags:['metal']},
 axe:{name:'Machado de Guerra',w:2,h:2,price:6,type:'weapon',dmg:10,cd:2.8,crit:.05,wt:3,fx:'smash',tags:['metal']},
 bow:{name:'Arco Longo',w:1,h:3,price:5,type:'weapon',dmg:6,cd:2.0,crit:.1,wt:2,fx:'arrow',tint:'bowtint',tags:['natureza']},
 staff:{name:'Cajado de Brasa',w:1,h:3,price:5,type:'weapon',dmg:2,cd:1.7,crit:0,burn:2,wt:2,fx:'fire',tags:['fogo']},
 spear:{name:'Lança',w:1,h:3,price:5,type:'weapon',dmg:5,cd:1.8,crit:.05,pierce:1,wt:2,fx:'thrust',tags:['metal']},
 hammer:{name:'Martelo',w:1,h:2,price:5,type:'weapon',dmg:6,cd:2.4,crit:0,stun:.2,wt:2,fx:'smash',tags:['metal','sagrado']},
 iceaxe:{name:'Machado Gélido',w:2,h:2,price:6,type:'weapon',dmg:8,cd:2.6,crit:.05,frost:2,wt:3,fx:'smash',tags:['metal','gelo']},
 icestaff:{name:'Cajado de Geada',w:1,h:3,price:5,type:'weapon',dmg:2,cd:1.6,crit:0,frost:3,wt:2,fx:'ice',tags:['gelo']},
 firedagger:{name:'Adaga Ígnea',w:1,h:1,price:3,type:'weapon',dmg:1,cd:.9,crit:.1,burn:1,wt:1,fx:'stab',tags:['fogo','metal']},
 pestspear:{name:'Lança Pestilenta',w:1,h:3,price:5,type:'weapon',dmg:3,cd:1.9,crit:.05,pierce:1,poison:2,wt:2,fx:'thrust',tags:['veneno','metal']},
 flail:{name:'Mangual Bento',w:1,h:2,price:5,type:'weapon',dmg:5,cd:2.0,crit:.05,purge:1,wt:2,fx:'smash',tags:['metal','sagrado']},
 shield:{name:'Escudo de Carvalho',w:2,h:2,price:4,type:'armor',block:16,tags:['metal']},
 helm:{name:'Elmo de Ferro',w:2,h:1,price:4,type:'armor',hp:15,zone:'top',tags:['metal']},
 thorns:{name:'Cota de Espinhos',w:2,h:2,price:5,type:'armor',hp:14,reflect:2,tags:['natureza']},
 frostmail:{name:'Couraça de Gelo',w:2,h:2,price:5,type:'armor',block:12,chill:1,tags:['gelo','metal']},
 holyshield:{name:'Escudo Bento',w:2,h:2,price:5,type:'armor',block:10,hp:10,tags:['sagrado','metal']},
 potion:{name:'Frasco de Cura',w:1,h:1,price:3,type:'support',heal:5,healCd:4,tags:['sagrado']},
 whet:{name:'Pedra de Amolar',w:1,h:1,price:3,type:'support',pat:'orto',adjDmg:2,tags:['metal']},
 clover:{name:'Trevo de Quatro',w:1,h:1,price:3,type:'support',pat:'diag',adjCrit:.12,tags:['natureza']},
 torch:{name:'Tocha',w:1,h:1,price:2,type:'support',pat:'orto',adjBurn:.9,tags:['fogo']},
 feather:{name:'Pena de Grifo',w:1,h:1,price:3,type:'support',pat:'row',adjHaste:.1,tags:['natureza']},
 venom:{name:'Frasco de Veneno',w:1,h:1,price:3,type:'support',pat:'orto',adjPoison:1,tags:['veneno']},
 ring:{name:'Anel de Sangue',w:1,h:1,price:4,type:'support',pat:'orto',adjLife:.12,tags:[]},
 frostgem:{name:'Cristal de Geada',w:1,h:1,price:3,type:'support',pat:'orto',adjFrost:1,tags:['gelo']},
 holywater:{name:'Água Benta',w:1,h:1,price:3,type:'support',pat:'orto',adjPurge:1,tags:['sagrado']},
 banner:{name:'Estandarte',w:1,h:2,price:4,type:'support',pat:'col',adjDmg:2,adjCrit:.05,tags:['sagrado']},
 idolfire:{name:'Flâmula Ígnea',w:1,h:2,price:4,type:'support',tagSup:'fogo',adjBurn:1,tags:['fogo']},
 idolfrost:{name:'Flâmula Gélida',w:1,h:2,price:4,type:'support',tagSup:'gelo',adjFrost:1,tags:['gelo']},
 idolmetal:{name:'Flâmula de Ferro',w:1,h:2,price:4,type:'support',tagSup:'metal',adjDmg:1.5,tags:['metal']},
 idolnature:{name:'Flâmula Silvestre',w:1,h:2,price:4,type:'support',tagSup:'natureza',adjHaste:.06,tags:['natureza']},
 greatsword:{name:'Espadão',w:2,h:3,price:7,type:'weapon',dmg:15,cd:3.0,crit:.08,wt:3,fx:'slash',tags:['metal']},
 warhammer:{name:'Martelo Pesado',w:2,h:2,price:7,type:'weapon',dmg:11,cd:3.0,crit:0,stun:.3,wt:3,fx:'smash',tags:['metal']},
 buckler:{name:'Broquel',w:1,h:1,price:2,type:'armor',block:7,tags:['metal']},
 plate:{name:'Armadura de Placas',w:2,h:2,price:7,type:'armor',block:18,hp:14,tags:['metal']},
 spikemirror:{name:'Espelho de Espinhos',w:2,h:2,price:7,type:'armor',block:10,reflect:3,tags:['metal','natureza']},
 scarab:{name:'Escaravelho de Ouro',w:1,h:1,price:8,type:'support',gold:2,pat:'orto',adjCrit:.06,tags:['sagrado']},
 rebelelixir:{name:'Elixir Rebelde',w:1,h:2,price:6,type:'support',pat:'orto',heal:4,healCd:4,adjHaste:.06,tags:['natureza']},
 bomb:{name:'Bomba de Fogo',w:1,h:1,price:4,type:'weapon',dmg:6,cd:3.0,crit:0,burn:2,wt:1,fx:'fire',tags:['fogo']},
 acidflask:{name:'Frasco Ácido',w:1,h:1,price:4,type:'weapon',dmg:2,cd:2.0,crit:.05,poison:2,wt:1,fx:'thrust',tags:['veneno']},
 frostflask:{name:'Frasco Gélido',w:1,h:1,price:4,type:'weapon',dmg:2,cd:2.2,crit:0,frost:2,wt:1,fx:'ice',tags:['gelo']},
 philostone:{name:'Pedra Filosofal',w:1,h:1,price:6,type:'support',pat:'orto',adjDmg:1,adjBurn:1,gold:1,tags:['fogo','sagrado']},
 mortar:{name:'Almofariz',w:1,h:1,price:4,type:'support',pat:'orto',heal:3,healCd:3,adjPoison:1,tags:['natureza','veneno']},
 alembic:{name:'Alambique',w:2,h:2,price:6,type:'support',pat:'orto',heal:5,healCd:4,adjHaste:.05,tags:['natureza','fogo']},
 smoke:{name:'Frasco de Fumaça',w:1,h:2,price:5,type:'support',pat:'orto',adjCrit:.08,adjHaste:.04,tags:[]},
 mandrake:{name:'Mandrágora',w:1,h:2,price:5,type:'trigger',trig:'below50',healTrig:14,tags:['natureza']},
 purse:{name:'Bolsa de Moedas',w:1,h:2,price:3,type:'support',gold:2,tags:[]},
 piggy:{name:'Cofre do Mascate',w:1,h:1,price:4,type:'support',piggy:1,tags:[]},
 ledger:{name:'Medalhão do Tesoureiro',w:1,h:1,price:4,type:'support',intCap:1,tags:[]},
 mirror:{name:'Espelho de Prata',w:1,h:1,price:4,type:'support',geo:'mirror',tags:['sagrado']},
 chain:{name:'Corrente Rúnica',w:1,h:1,price:3,type:'support',geo:'chain',tags:['metal']},
 boots:{name:'Botas de Viagem',w:2,h:1,price:4,type:'support',zone:'bottom',bootsHaste:.06,tags:[]},
 belt:{name:'Cinto de Couro',w:2,h:1,price:3,type:'support',wtRed:1,tags:[]},
 dualgrip:{name:'Bainhas Cruzadas',w:1,h:1,price:3,type:'support',dual:1,tags:['metal']},
 vetring:{name:'Anel do Veterano',w:1,h:1,price:5,type:'support',veteran:1,tags:[]},
 acorn:{name:'Bolota Antiga',w:1,h:1,price:3,type:'support',heal:2,healCd:3,grows:1,tags:['natureza']},
 scroll:{name:'Pergaminho de Chamas',w:1,h:1,price:3,type:'trigger',trig:'start',burnStart:5,tags:['fogo']},
 stoneheart:{name:'Coração de Pedra',w:1,h:1,price:4,type:'trigger',trig:'shieldBreak',blockTrig:10,tags:[]},
 eye:{name:'Olho do Falcão',w:1,h:1,price:4,type:'trigger',trig:'crit5',shot:8,tags:['natureza']},
 phoenix:{name:'Brasa da Fênix',w:1,h:2,price:5,type:'trigger',trig:'below50',healTrig:12,tags:['fogo','sagrado']},
 soulgem:{name:'Pedra de Almas',w:1,h:1,price:4,type:'trigger',trig:'souls',soulBlk:3,tags:[]},
 heroblade:{name:'Lâmina do Herói',w:1,h:2,price:8,type:'weapon',dmg:8,cd:1.4,crit:.12,wt:2,recipe:1,fx:'slash',tags:['metal','sagrado']},
 infernal:{name:'Cajado Infernal',w:1,h:3,price:10,type:'weapon',dmg:4,cd:1.5,crit:0,burn:4,wt:2,recipe:1,fx:'fire',tags:['fogo']},
 elixir:{name:'Elixir da Fortuna',w:1,h:1,price:7,type:'support',pat:'orto',heal:8,healCd:3,adjCrit:.08,recipe:1,tags:['sagrado','natureza']},
 bastion:{name:'Bastião Espinhoso',w:2,h:2,price:10,type:'armor',block:22,reflect:3,recipe:1,tags:['metal','natureza']},
 viper:{name:'Presa da Víbora',w:1,h:1,price:6,type:'weapon',dmg:3,cd:.8,crit:.2,poison:2,wt:1,recipe:1,fx:'stab',tags:['veneno','metal']},
 galebow:{name:'Arco do Vendaval',w:1,h:3,price:10,type:'weapon',dmg:8,cd:1.3,crit:.15,wt:2,recipe:1,fx:'arrow',tags:['natureza']},
 glacier:{name:'Lâmina Glacial',w:1,h:2,price:9,type:'weapon',dmg:7,cd:1.5,crit:.1,frost:2,wt:2,recipe:1,fx:'slash',tags:['metal','gelo']},
 judgehammer:{name:'Martelo do Juízo',w:1,h:2,price:10,type:'weapon',dmg:9,cd:2.2,crit:.05,stun:.25,purge:2,wt:2,recipe:1,fx:'smash',tags:['metal','sagrado']}
};
/* [ingrediente A, ingrediente B, resultado, catalisador opcional (encostado, não é consumido)] */
const RECIPES=[['sword','whet','heroblade'],['staff','torch','infernal'],['potion','clover','elixir'],['shield','thorns','bastion'],['dagger','venom','viper'],['bow','feather','galebow'],
 ['sword','frostgem','glacier','whet'],['hammer','holywater','judgehammer','banner']];
const SHOPKEYS=Object.keys(ITEMS).filter(k=>!ITEMS[k].recipe);
const PATNAME={orto:'lados',diag:'diagonais',row:'fileira inteira',col:'coluna inteira',ring:'lados e diagonais'};
const PETS={
 raven:{name:'Corvo',price:5,dmg:3,cd:1.5,crit:.15,desc:'Bica o inimigo',act:'Bico Ágil',actDesc:'1 troca de itens grátis'},
 salamander:{name:'Salamandra',price:5,burn:2,cd:2,desc:'Cospe brasas',act:'Forja Quente',actDesc:'o Martelo do Mascate trabalha mais uma vez, de graça (1× por parada)'},
 turtle:{name:'Tartaruga',price:5,block:8,cd:4,tick:3,desc:'Protege com o casco',act:'Casco-Cofre',actDesc:'reserva mais 1 item nesta parada'},
 pixie:{name:'Fada',price:5,heal:3,cd:2.5,desc:'Cura com pó de fada',act:'Pó de Ouro',actDesc:'+3 de ouro'},
 owl:{name:'Coruja das Neves',price:5,frost:2,cd:2.5,desc:'Sopra geada no inimigo',act:'Vigia',actDesc:'troca 1 oferta da loja por um item Raro ou melhor',unlock:'frostwin'}
};
const PETKEYS=Object.keys(PETS);
const PET_CHARGES=3;
const TM=[1,2.1,4.4,9.2], TP=[1,2.5,5,9], TIERS=['Comum','Raro','Épico','Lendário'];
const AWK={weapon:['Afiada: +15% de crítico','Eco: 25% de chance de golpear duas vezes'],armor:['Firme: +15 de vida máxima','Égide: ao perder todo o escudo, recupera metade do escudo deste item (1×)'],
 support:['Alcance: também afeta as diagonais','Ressonância: bônus ×1,5'],trigger:['Reflexo: o gatilho dispara 2×','Ressonância: efeito ×1,5']};
const tierVar=t=>'var(--t'+t+')';
const CLASSES={
 warrior:{name:'Guerreiro',hp:55,block:8,crit:0,critMult:2,cap:7,flip:true,bag:[5,4],skill:'Fúria',
  kits:[{name:'Escudo e espada',items:[['shield',0,0],['sword',2,0]]},{name:'Machado e elmo',items:[['axe',0,1],['helm',0,0]]}],
  desc:'55 de vida, +8 de escudo, carga 7. Fúria: abaixo de metade da vida, +60% de dano por 6s.'},
 rogue:{name:'Ladina',hp:40,crit:.15,critMult:2.5,cap:6,flip:true,bag:[7,3],skill:'Golpe Sombrio',
  kits:[{name:'Duas adagas',items:[['dagger',0,1],['dagger',2,1],['clover',1,0]]},{name:'Arco e pena',items:[['bow',0,0],['feather',1,0]]}],
  desc:'+15% de crítico, críticos 2,5×, carga 6, mochila larga 7×3. O primeiro golpe de cada arma é crítico.'},
 pyro:{name:'Piromante',hp:45,burnBonus:1,crit:0,critMult:2,cap:5,flip:false,bag:[4,5],skill:'Combustão',fireFree:1,
  kits:[{name:'Cajado e tocha',items:[['staff',0,0],['torch',1,0]]},{name:'Adaga e pergaminho',items:[['firedagger',0,0],['torch',1,0],['scroll',0,1]]}],
  desc:'45 de vida, +1 em toda queimadura, carga 5 (armas de Fogo não pesam), mochila alta 4×5. Com 10 de queimadura, o inimigo explode (16 + rodada).'},
 paladin:{name:'Paladino',hp:68,crit:0,critMult:2,cap:7,flip:true,bag:[5,4],skill:'Luz Sagrada',unlock:1,
  kits:[{name:'Martelo e frasco',items:[['hammer',0,0],['potion',1,0]]},{name:'Mangual e água benta',items:[['flail',0,0],['holywater',1,0]]}],
  desc:'68 de vida, curas +50%, carga 7. A cada 8s, +10 de vida e +10 de escudo. Desbloqueia com 5 vitórias numa jornada ou 10 vitórias no total.'},
 alchemist:{name:'Alquimista',hp:80,crit:0,critMult:2,cap:6,flip:false,bag:[5,4],skill:'Mistura Volátil',unlock:2,
  kits:[{name:'Bomba e frasco',items:[['bomb',0,0],['potion',1,0],['mortar',1,1]]},{name:'Ácido e almofariz',items:[['acidflask',0,0],['mortar',1,0],['frostflask',0,1]]}],
  desc:'80 de vida, carga 6. Mistura Volátil: cada cura de item também atinge o inimigo com 90% do valor, ignorando escudo, e aplica 1 de veneno. Desbloqueia ao completar uma jornada ou com 20 vitórias no total.'}
};
const CLASSKEYS=Object.keys(CLASSES);
const SUBS={
 warrior:[{id:'berserker',name:'Berserker',desc:'A Fúria começa abaixo de 70% da vida, dura 8s e dá +80% de dano.'},{id:'guardiao',name:'Guardião',desc:'Escudo inicial +25% e reflete 2 de dano por golpe recebido.'}],
 rogue:[{id:'assassina',name:'Assassina',desc:'Críticos causam 3× o dano.'},{id:'envenenadora',name:'Envenenadora',desc:'Cada crítico aplica 2 de veneno.'}],
 pyro:[{id:'pirotecnico',name:'Pirotécnico',desc:'A queimadura no inimigo não diminui com o tempo.'},{id:'cinzeiro',name:'Cinzeiro',desc:'Combustão dispara com 7 de queimadura e causa +50% de dano.'}],
 alchemist:[{id:'boticario',name:'Boticário',desc:'Curas de itens +40%.'},{id:'demolidor',name:'Demolidor',desc:'Mistura Volátil causa o valor inteiro da cura e também aplica 2 de queimadura.'}],
 paladin:[{id:'cruzado',name:'Cruzado',desc:'Luz Sagrada a cada 6s, com +12 de vida e +12 de escudo.'},{id:'inquisidor',name:'Inquisidor',desc:'Armas Sagradas ganham Purga 1 e todas as armas +10% de crítico.'}]
};
const SUBOF=id=>{for(const k in SUBS)for(const s of SUBS[k])if(s.id===id)return s;return null;};
const POCKETS={afiado:{name:'Bolso Afiado',short:'crít.',desc:'armas aqui ganham +10% de crítico',col:'#ffd76a'},leve:{name:'Bolso Leve',short:'leve',desc:'armas aqui pesam 1 a menos',col:'#9cd2f2'},
 acolch:{name:'Bolso Acolchoado',short:'armad.',desc:'armaduras aqui rendem +25% de escudo e vida',col:'#c8d0dc'},veloz:{name:'Bolso Veloz',short:'veloz',desc:'armas aqui recarregam 8% mais rápido',col:'#8ff09a'},
 fundo:{name:'Bolso Fundo',short:'ouro',desc:'itens de ouro aqui rendem +1 por rodada',col:'#f2c14e'}};
const POCKETKEYS=Object.keys(POCKETS);
const ARCH={
 bruto:{label:'Brutamontes',counter:'golpes lentos e pesados: escudo e cura resolvem',hp:1.15},
 enxame:{label:'Enxame',counter:'muitos golpes fracos: escudo e reflexo punem',hp:.9},
 espinhos:{label:'Tanque de Espinhos',counter:'reflete cada golpe e tem escudo: prefira golpes fortes, Purga, veneno e queimadura',hp:1},
 veneno:{label:'Assassino Venenoso',counter:'veneno que não some: mate rápido ou cure muito',hp:.85},
 fogo:{label:'Piromante',counter:'queimadura ignora escudo: vida extra e cura',hp:.95},
 regen:{label:'Regenerador',counter:'se cura sem parar: dano em rajada, Purga, veneno e queimadura',hp:1.05},
 gelo:{label:'Gélido',counter:'cada golpe deixa suas armas mais lentas: mate rápido ou aposte em armas pesadas',hp:1},
 chefe:{label:'Chefe',counter:'tudo ao mesmo tempo: chegue com a mochila completa',hp:1},
 duelo:{label:'Fantasma',counter:'a mochila de outro aventureiro, item por item',hp:1}
};
/* elite / boss modifiers (INI-01) */
const MODS={
 furia:{name:'Fúria',desc:'abaixo de 50% de vida ataca 40% mais rápido',ans:'dano em rajada para atravessar a metade rápido'},
 casca:{name:'Casca Grossa',desc:'começa com escudo igual a 30% da vida',ans:'Perfurar, Purga, veneno e queimadura'},
 reflexo:{name:'Couraça Viva',pct:.12,desc:'reflete 12% do dano de cada golpe',ans:'Purga desliga o reflexo; veneno e queimadura não são refletidos'},
 regen2:{name:'Sangue Velho',desc:'a cura dobra abaixo de 50% de vida',ans:'Purga corta a cura pela metade'},
 reforco:{name:'Reforço',desc:'aos 8s chega ajuda: +25% de vida e um ataque rápido a mais',ans:'vença antes dos 8s ou tenha escudo'},
 gelo:{name:'Hálito Gélido',desc:'cada golpe aplica 1 de Gelo em você',ans:'armas pesadas sofrem menos; Purga e cura compram tempo'},
 toxina:{name:'Toxina',desc:'você começa com 3 de veneno e o veneno dele +1',ans:'cura constante e luta curta'},
 escamas:{name:'Escamas Ígneas',desc:'recebe metade do dano de queimadura',ans:'veneno, Gelo e golpes diretos'}
};
const MODPOOL={bruto:['furia','casca'],enxame:['reforco','furia'],espinhos:['reflexo','casca'],veneno:['toxina','furia'],fogo:['escamas','reforco'],regen:['regen2','casca'],gelo:['gelo','furia'],chefe:['furia','casca','gelo']};
/* h = sprite height in arena units */
const STOPS=[
 {biome:'cellar',hp:30,dps:2.2,v:[
  {name:'Rato do Porão',art:'rat',h:30,claw:1,arch:'enxame',line:'Isso aí é comida? Parece comida.'},
  {name:'Aranha da Adega',art:'spider',h:28,claw:1,arch:'veneno',line:'Fiquem à vontade. A teia é por minha conta.'},
  {name:'Mímico',art:'mimic',h:38,claw:1,flipImg:1,arch:'bruto',line:'(o baú boceja, e lá dentro não tem ouro nenhum)'}]},
 {biome:'forest',hp:46,dps:3.4,v:[
  {name:'Goblin Batedor',art:'goblin',h:40,arch:'enxame',line:'Mochila bonita! Vai ficar melhor nas minhas costas.'},
  {name:'Javali Furioso',art:'boar',h:34,claw:1,arch:'bruto',line:'(bufa, raspa o chão e não pede licença)'},
  {name:'Cogumelo Venenoso',art:'mushroom',h:42,claw:1,arch:'veneno',line:'(solta uma nuvem de esporos e fecha a cara)'},
  {name:'Goblin Saqueador',art:'goblin2',h:40,flipImg:1,arch:'enxame',line:'Tudo que brilha é meu. O que não brilha, eu levo também.'}]},
 {biome:'road',hp:75,dps:5.5,elite:1,v:[
  {name:'Bandido da Estrada',art:'bandit',h:48,arch:'veneno',line:'Pedágio, viajante. Aceito ouro, itens ou a sua dignidade.'},
  {name:'Mercenário Cansado',art:'merc',h:48,arch:'espinhos',line:'Não é pessoal. É só o turno da noite.'},
  {name:'Ladrão de Estrada',art:'bandit2',h:48,flipImg:1,arch:'veneno',line:'A lâmina é envenenada. A conversa também.'}]},
 {biome:'snow',hp:86,dps:6.2,v:[
  {name:'Elemental de Gelo',art:'iceelem',h:54,claw:1,arch:'gelo',line:'(estala como lago congelado pisado)'},
  {name:'Lobo Cinzento',art:'wolf',h:32,claw:1,arch:'enxame',line:'(uiva, e a matilha responde de longe)'},
  {name:'Lobisomem',art:'werewolf',h:54,claw:1,arch:'regen',line:'Lua cheia, fome cheia. Coincidência nenhuma.'},
  {name:'Lobo de Gelo',art:'icewolf',h:34,claw:1,arch:'gelo',line:'(o hálito dele congela a grama no caminho)'}]},
 {biome:'swamp',hp:108,dps:7.6,v:[
  {name:'Bruxa do Pântano',art:'witch',h:50,arch:'fogo',line:'Seu avô também passou por aqui. Também tinha pressa.'},
  {name:'Sapo-Rei',art:'frog',h:38,claw:1,arch:'regen',line:'Croac. Beije-me e descubra. Ou não.'},
  {name:'Basilisco',art:'basilisk',h:42,claw:1,flipImg:1,arch:'bruto',line:'Não olhe nos meus olhos. Brincadeira. Olhe, sim.'},
  {name:'Slime Venenoso',art:'slime',h:34,claw:1,arch:'veneno',line:'(borbulha, e um osso velho boia lá dentro)'},
  {name:'Goblin Xamã',art:'shaman',h:42,arch:'fogo',line:'Os espíritos disseram que você vinha. Disseram também que ia perder.'}]},
 {biome:'castle',hp:155,dps:10.2,elite:1,v:[
  {name:'Harpia',art:'harpy',h:50,claw:1,flipImg:1,arch:'enxame',line:'Que bolsa linda. Já é minha, só você não sabe ainda.'},
  {name:'Cavaleiro Caído',art:'fknight',h:54,arch:'espinhos',line:'Jurei proteger este portão. Ninguém disse até quando.'},
  {name:'Arqueiro Fantasma',art:'skarcher',h:52,arch:'veneno',line:'Já errei uma flecha. Uma vez. Em 1132.'},
  {name:'Cavaleiro Sombrio',art:'darkknight',h:54,arch:'bruto',line:'A luz não entra aqui. Você também não deveria.'}]},
 {biome:'mine',hp:160,dps:10,v:[
  {name:'Minotauro',art:'minotaur',h:62,claw:1,flipImg:1,arch:'bruto',line:'Labirinto? Que labirinto? Eu só ando reto.'},
  {name:'Troll da Ponte',art:'troll',h:58,claw:1,arch:'regen',line:'Ponte cobra pedágio. Troll cobra o resto.'},
  {name:'Gárgula',art:'gargoyle',h:50,claw:1,arch:'espinhos',line:'(estala o pescoço de pedra, com calma)'},
  {name:'Troll de Gelo',art:'icetroll',h:58,claw:1,arch:'gelo',line:'Frio? Isto aqui é primavera.'},
  {name:'Golias de Pedra',art:'golem',h:62,claw:1,arch:'bruto',line:'(a montanha acordou, e está de mau humor)'}]},
 {biome:'volcano',hp:195,dps:13,v:[
  {name:'Mago de Cinzas',art:'ashmage',h:52,arch:'fogo',line:'Tudo vira cinza, criança. Eu só adianto o relógio.'},
  {name:'Salamandra Anciã',art:'lavasal',h:44,claw:1,arch:'bruto',line:'(o chão derrete onde ela pisa)'},
  {name:'Cão de Vulcão',art:'hellhound',h:42,claw:1,arch:'fogo',line:'(rosna, e sai fumaça do focinho)'},
  {name:'Bruxa Pestilenta',art:'plaguewitch',h:50,arch:'veneno',line:'Uma gota cura. Duas, nem tanto. Quer adivinhar quantas tem aqui?'}]},
 {biome:'crypt',hp:190,dps:12.7,elite:1,v:[
  {name:'Lich Menor',art:'lich',h:56,arch:'espinhos',line:'Mais um herói. Tenho uma prateleira só para mochilas.'},
  {name:'Ceifador',art:'reaper',h:58,arch:'veneno',line:'Não vim por você. Vim pelo que está na sua mochila.'},
  {name:'Gárgula de Obsidiana',art:'obsidian',h:50,claw:1,arch:'espinhos',line:'(a pedra dela ainda está quente do vulcão)'}]},
 {biome:'volcano',hp:490,dps:20,boss:1,v:[
  {name:'Wyrm Rubro',art:'wyrm',h:70,claw:1,arch:'chefe',line:'O velho também chegou até aqui. Quer ver o que sobrou dele?'}]}
];
const BAGCOST=[5,8,11], MAXEXP=3, MAXCOLS=7, MAXROWS=6, CHEST_ROWS=2, GOAL=10, SURV_GOAL=14, LIVES=5, SILVER_WIN=6;
/* v1.2: força extra dos inimigos por nível de Ascensão, cumulativa: [por nível da A1 à A5, por nível da A6 à A10].
   elite = peso nas elites; elite3 = peso só na elite da parada 3 (v1.4, ID 9); boss = peso no chefe */
const ASC_FOE={hp:[.65,0],dmg:[.06,0],early:.4,elite:.4,elite3:.2,boss:.22,a10:1.05};
/* A6+: elites com 2 modificadores a partir desta parada (índice; 7 = parada 8). As elites das paradas 3 e 6 ficam com 1. */
const ASC_MOD2=7;
/* Bênçãos (EVE-01): b = bronze (elites 3, 8 e 9), p = prata (elite 6, depois da 6ª vitória: SILVER_WIN) */
const BLESS={
 mascate:{t:'b',name:'Mascate Generoso',desc:'+1 vaga na loja.'},
 cofre:{t:'b',name:'Cofre',desc:'Teto de juros +1.'},
 fole:{t:'b',name:'Fole',desc:'Armas de Fogo não pesam na carga.',ok:s=>s.cls!=='pyro'},
 olho:{t:'b',name:'Olho Clínico',desc:'Pode reservar +1 item na loja.'},
 bigorna:{t:'b',name:'Bigorna Portátil',desc:'A Forja também acontece quando você perde.'},
 eco:{t:'b',name:'Eco Antigo',desc:'Armas Épicas ganham 10% de Eco (golpe duplo).'},
 alforje:{t:'b',name:'Alforje Maior',desc:'Amplia a mochila agora, de graça.',ok:s=>D.hooks.canExpand?D.hooks.canExpand(s):true},
 ombros:{t:'b',name:'Ombros Largos',desc:'Limite de carga +2.',ok:s=>s.chal!=='carga3'},
 sangue:{t:'b',name:'Sangue Quente',desc:'+15 de vida máxima.'},
 maoleve:{t:'b',name:'Mão Leve',desc:'A primeira troca de itens de cada parada é grátis.'},
 pedra:{t:'p',name:'Pele de Pedra',desc:'+12 de escudo inicial.'},
 primeiro:{t:'p',name:'Primeiro Sangue',desc:'O primeiro golpe de cada arma causa o dobro de dano.'},
 pena:{t:'p',name:'Leve como Pena',desc:'Todas as armas pesam 1 a menos.',ok:s=>s.chal!=='carga3'},
 compostos:{t:'p',name:'Juros Compostos',gold:20,hp:10,desc:'+20 de ouro agora e +10 de vida máxima. Juros de 1 a cada 4 de ouro (em vez de 5) e teto de juros +1.'},
 tesouro:{t:'p',name:'Tesouro do Figurão',desc:'Ganhe agora um item Épico aleatório.'},
 dupla:{t:'p',name:'Afinidade Dupla',desc:'Cada item conta 2× para as Afinidades.'}
};
/* Etiquetas (EVE-02): trocar a loja de uma parada por um bônus futuro */
const ETIQ={raros:{name:'Etiqueta dos Raros',desc:'a próxima loja garante 2 itens Raros ou melhores'},
 ouro:{name:'Etiqueta da Bolsa',desc:'+8 de ouro agora'},trocas:{name:'Etiqueta do Freguês',desc:'a 1ª troca de itens de cada parada sai de graça até o fim'},
 epico:{name:'Etiqueta Épica',desc:'a próxima loja garante 1 item Épico'}};
const ETIQKEYS=Object.keys(ETIQ);
/* Encruzilhada (EVE-03) */
const EVENTS={
 aposta:{title:'A aposta do Mascate',text:'"Cinco moedas na mesa. Cara, você leva um item Raro. Coroa, eu levo as moedas. Topa?"',a:'Apostar 5 de ouro',b:'Seguir viagem'},
 altar:{title:'Altar na beira da estrada',text:'Uma pedra coberta de runas pede sangue. Dizem que quem oferece sai mais forte.',a:'Oferecer 5 de vida máxima: +1 raridade no seu melhor item',b:'Seguir viagem'},
 andarilho:{title:'O andarilho cansado',text:'"Esse bicho aí parece bom de briga. Pago dez moedas e cuido bem dele."',a:'Vender o companheiro mais fraco por 10',b:'Seguir viagem'}};
const CHALLENGES=[
 {id:'nofuse',name:'Sem Fusão',desc:'Itens iguais não se fundem.'},
 {id:'small',name:'Mochila 4×4',desc:'A mochila é 4×4 e não pode ser ampliada.'},
 {id:'onewep',name:'Lâmina Única',desc:'Só 1 arma luta (a primeira); apoios rendem 1,5×.'},
 {id:'carga3',name:'Carga 3',desc:'O limite de carga é sempre 3.'},
 {id:'shop3',name:'Mercado Pobre',desc:'A loja tem só 3 vagas.'},
 {id:'fat12',name:'Fadiga Precoce',desc:'A fadiga começa aos 12s.'},
 {id:'glass',name:'Coração de Vidro',desc:'Só 1 vida, mas a renda rende +50%.'},
 {id:'nopets',name:'Viajante Solitário',desc:'Sem companheiros.'}];
const ACH=[
 ['first_win','Primeiro sangue','Vença uma luta.'],['journey','Fim da estrada','Complete uma jornada.'],['all_classes','Família inteira','Complete uma jornada com cada classe.'],
 ['flawless','Sem um arranhão','Complete uma jornada sem perder vidas.'],['forge1','Aprendiz de ferreiro','Forje uma receita.'],['forge6','Mestre ferreiro','Forje 6 receitas diferentes.'],
 ['forge_all','Livro completo','Forje todas as receitas.'],['legend','Lendário','Crie um item Lendário.'],['legend3','Tesouro vivo','Vença uma luta com 3 Lendários na mochila.'],
 ['nofuse_win','Purista','Complete uma jornada sem fundir nenhum item.'],['burn100','Incendiário','Cause 100 de dano de queimadura numa luta.'],['poison100','Boticário','Cause 100 de dano de veneno numa luta.'],
 ['frost20','Inverno','Aplique 20 de Gelo numa luta.'],['frostwin','Amigo do frio','Vença uma luta com 3 itens de Gelo (libera a Coruja das Neves).'],['combust3','Pavio curto','Dispare 3 Combustões numa luta.'],
 ['rich','Pão-duro','Comece uma luta com 30 ou mais de ouro guardado.'],['fast','Relâmpago','Vença uma luta em menos de 6s.'],['fatigue_win','Resistente','Vença uma luta depois dos 40s.'],
 ['full_bag','Mochileiro','Vença uma luta com a mochila no tamanho máximo.'],['pets3','Zoológico','Lute com 3 companheiros.'],['bless3','Abençoado','Tenha 3 Bênçãos numa jornada.'],
 ['asc1','Subindo a montanha','Complete a Ascensão 1 com qualquer classe.'],['asc5','Cume nevado','Complete a Ascensão 5 com qualquer classe.'],['asc10','Topo do mundo','Complete a Ascensão 10 com qualquer classe.'],
 ['daily','Diarista','Termine um Desafio Diário.'],['chal1','Desafiante','Complete um Desafio.'],['chal_all','Invicto','Complete todos os Desafios.'],
 ['surv','Sobrevivente','Chegue à parada 14 na Sobrevivência.'],['duel','Duelista','Vença um Duelo.'],['codex40','Colecionador','Descubra 40 itens no Codex.'],['foes20','Caçador','Derrote 20 inimigos diferentes.']];

/* ================= NARRATIVE ================= */
const STORY={
 open:'Por vinte anos o alforje do seu avô ficou pendurado no porão, junto com a promessa de que ele voltaria da Montanha Rubra. Esta noite, algo roeu a alça, e lá de baixo subiu cheiro de enxofre. Você pega a mochila. A viagem que ele começou termina com você.',
 win:'O Wyrm Rubro tomba sobre o próprio tesouro. Entre as moedas, você acha o cantil do seu avô, ainda cheio. A alça do alforje nunca mais será roída. Mas o Mascate Brás já acena da estrada: dizem que há outra montanha, mais ao norte.',
 lose:'O alforje cai aberto na poeira, e os itens se espalham como uma pergunta sem resposta. Alguém, um dia, vai achá-lo pendurado num porão. Talvez você mesmo, amanhã cedo.',
 surv:'Depois do Wyrm, a estrada continua para o norte. Ninguém volta de lá para contar como é. Você vai contar.'
};
const MERCH={
 first:['Primeira viagem? Tudo que é bom cabe numa mochila. O resto cabe num caixão.','Seu avô comprava fiado. Você tem cara de quem paga à vista.'],
 idle:['Arrume bem. Espada solta no fundo da mochila é corte na própria mão.','Pedra de Amolar encostada na espada. Isso não é conselho, é física.','Trevo funciona pelas diagonais. Não me pergunte por quê. Trevo é trevo.','Pena de Grifo sopra a fileira inteira. Ponha suas armas em linha.','Guarde cinco moedas e eu te pago uma de juros. Sou um mascate honesto. Quase.','Três itens do mesmo tipo despertam uma Afinidade. Fogo com fogo, ferro com ferro.','As Flâmulas não ligam para onde estão. Ligam para quem está do lado delas na briga.','Meu Martelo sobe a raridade de qualquer coisa. Uma vez por parada, que ele cansa.'],
 streak:['Três seguidas! Vou aumentar os preços. Brincadeira. Talvez.','Você está pegando o jeito. Seu avô demorou bem mais.'],
 lowlife:['Você está pálido. Um Frasco de Cura nunca matou ninguém.','Última vida? Então nada de economizar. Gaste tudo.'],
 broke:['Bolsa vazia, olhar cheio. Venda alguma coisa, ora.','Sem ouro? O baú está cheio de coisa que não luta.'],
 loss:['Apanhou? Faz parte. O inimigo continua igual, você não precisa.','Volta lá. Ele também está cansado. Mas olha: na segunda derrota aqui eu não pago consolo.'],
 legend:['LENDÁRIO? Deixa eu ver isso de perto. Não vou roubar. Muito.'],
 boss:['O Wyrm está logo ali. Se eu fosse você, levava tudo que coubesse.'],
 elite:['Tem um figurão no caminho. Vencer ele rende uma Bênção.'],
 over:['Mochila pesada demais! Armas demais deixam todas lentas.'],
 surv:['Daqui para o norte eu não vendo fiado. Nem para você.']
};
Object.assign(D,{TAGS,TAGKEYS,ITEMS,RECIPES,SHOPKEYS,PATNAME,PETS,PETKEYS,PET_CHARGES,TM,TP,TIERS,AWK,tierVar,CLASSES,CLASSKEYS,SUBS,SUBOF,POCKETS,POCKETKEYS,ARCH,MODS,MODPOOL,STOPS,BAGCOST,MAXEXP,MAXCOLS,MAXROWS,CHEST_ROWS,GOAL,SURV_GOAL,LIVES,SILVER_WIN,ASC_FOE,ASC_MOD2,BLESS,ETIQ,ETIQKEYS,EVENTS,CHALLENGES,ACH,STORY,MERCH});
window.AlforjeData=Object.freeze(D);
})();
