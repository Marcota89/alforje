/* Alforje: regras puras da meta-progressão (energia, bônus diário, metas, nível, equipamento, companheiros). Sem DOM, sem localStorage. */
(function(){
'use strict';
const ENERGY_MAX=30,REGEN_MS=480000,JOURNEY_COST=10,ENERGY_CAP=99,CAP=99999,LV_MAX=30,GEAR_MAX=20,PET_MAX=10,DAY_MS=86400000;
const KINDS=['energy','gold','ruby','stone','food','egg'];
/* calendário de 7 dias: perder dia não zera; após o 7º volta ao 1º */
const CAL=[{gold:100},{energy:10},{stone:3},{food:5},{ruby:20},{egg:1},{gold:300,stone:5,ruby:10}];
const CHESTS=[{at:40,reward:{gold:100,energy:10}},{at:70,reward:{stone:2,food:3}},{at:100,reward:{ruby:15,energy:10}}];
const GOAL_PTS=20,GOAL_COUNT=5;
const GOALS={win5:{ev:'win',n:5,t:'Vença 5 lutas'},merge3:{ev:'merge',n:3,t:'Funda 3 itens'},energy20:{ev:'energy',n:20,t:'Gaste 20 de energia'},daily1:{ev:'daily',n:1,t:'Termine o Desafio Diário'},elite1:{ev:'elite',n:1,t:'Derrote 1 elite ou chefe'},forge1:{ev:'forge',n:1,t:'Forje 1 receita'},buy8:{ev:'buy',n:8,t:'Compre 8 itens na loja'},journey1:{ev:'journey',n:1,t:'Complete 1 jornada'},cal1:{ev:'cal',n:1,t:'Pegue o bônus diário'},upgrade1:{ev:'upgrade',n:1,t:'Melhore uma peça ou alimente um companheiro'}};
const GOALKEYS=Object.keys(GOALS);
/* equipamento: bônus por nível acima do 1 */
/* v1.2: Arma +1% de dano, Armadura +2 de escudo, Anel +0,5% de crítico, Bolsa +1 de ouro a cada 2 níveis; herói +1 de vida por nível */
const GEAR={weapon:{t:'Arma',per:1,perm:'dmgPct'},armor:{t:'Armadura',per:2,perm:'block'},ring:{t:'Anel',per:.5,perm:'crit'},bag:{t:'Bolsa',per:.5,perm:'gold'}};
const HP_PER_LV=1,PET_LV_STEP=10;
const gearBonus=(slot,L)=>{const v=GEAR[slot].per*(Math.max(1,L)-1);return slot==='bag'?Math.floor(v):v;};
/* propaganda: limite por dia; loja de rubis */
const AD_LIMIT={energy:3,double:1,shop:1},AD_ENERGY=10,AD_GOLD=50;
const SHOP={energy30:{ruby:15,kind:'energy',n:30,limit:2},stone3:{ruby:10,kind:'stone',n:3},food5:{ruby:10,kind:'food',n:5},egg:{ruby:30,kind:'egg',n:1}};
const ACH_RUBY=5,HATCH_FOOD=10;
const PETKEYS=(window.AlforjeData&&window.AlforjeData.PETKEYS)||[];

function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^h>>>16)>>>0;}
function mulberry(a){return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
/* now não finito (NaN/undefined) vira Date.now() */
const dayKey=now=>new Date(Number.isFinite(now)?now:Date.now()).toISOString().slice(0,10);
const endsIn=now=>DAY_MS-((now%DAY_MS)+DAY_MS)%DAY_MS;
/* sorteio determinístico: depende só da data */
function goalOrder(dk){const r=mulberry(hashStr('metas|'+dk)||1),a=GOALKEYS.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function drawGoals(dk){return goalOrder(dk).slice(0,GOAL_COUNT);}
function newGoals(dk){return {ids:drawGoals(dk),p:{},done:[],pts:0,chests:CHESTS.map(()=>false)};}

/* ===== criação, migração e virada do dia ===== */
const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
const isNum=n=>typeof n==='number'&&Number.isFinite(n);
/* o dia da meta só avança (comparação de strings ISO): relógio para trás não reabre nada */
function goalsOk(g){return isObj(g)&&Array.isArray(g.ids)&&g.ids.length&&g.ids.every(id=>GOALS[id])&&isObj(g.p)&&Array.isArray(g.done)&&isNum(g.pts)&&Array.isArray(g.chests)&&g.chests.length===CHESTS.length;}
/* ===== v1.4: relógio do aparelho =====
   m.day     marcador do dia: anda com o relógio e volta junto se o relógio voltar mais de 2 dias.
   m.dayOpen o dia aberto de verdade cujos contadores valem agora (propagandas, compras, prêmios, metas). O calendário paga 1 vez por dia aberto.
   m.dayMax  trava: nenhum dia até ele reabre (o dia mais adiantado já aberto). Relógio para trás não reabre nada até passar dele.
   m.days    os últimos dias abertos (memória curta: diz quais dias ficaram "lá na frente").
   m.far     [de, até]: os dias abertos lá na frente quando o relógio quebrado foi corrigido. Continuam usados: não reabrem quando o relógio chegar neles.
   m.capOn   dia da última correção de relógio quebrado (no máximo 1 a cada 30 dias reais). */
const DAYS_KEEP=30,CAP_EVERY=30;
const far=(d,dk)=>Date.parse(d)-Date.parse(dk)>14*DAY_MS;
const inFar=(m,dk)=>Array.isArray(m.far)&&dk>=m.far[0]&&dk<=m.far[1];
const dayLocked=(m,dk)=>(typeof m.dayMax==='string'&&dk<=m.dayMax)||inFar(m,dk);
const capOk=(m,dk)=>typeof m.capOn!=='string'||Math.abs(Date.parse(dk)-Date.parse(m.capOn))>=CAP_EVERY*DAY_MS;
/* relógio quebrado: a trava está mais de 14 dias à frente do relógio. A trava NUNCA é apagada: os dias já abertos lá na frente vão para m.far
   (continuam usados) e só os dias entre hoje e eles voltam a abrir normalmente. Uma correção a cada 30 dias reais; fora dela, a trava fica. */
function capFar(m,dk){if(typeof m.dayMax!=='string'||!far(m.dayMax,dk)||!capOk(m,dk))return;
 const ahead=(Array.isArray(m.days)?m.days:[]).filter(d=>d>dk).sort(),lo=ahead.length&&ahead[0]<m.dayMax?ahead[0]:m.dayMax,hi=m.dayMax;
 m.far=Array.isArray(m.far)?[lo<m.far[0]?lo:m.far[0],hi>m.far[1]?hi:m.far[1]]:[lo,hi];
 m.dayMax=dk;m.capOn=dk;}
/* meta impossível: "Melhore uma peça ou alimente um companheiro" vira a próxima meta do sorteio do dia, só para este jogador, quando
   tudo está no máximo ou (v1.4) quando, na hora do sorteio do dia, não há recursos para nenhuma melhoria nem alimentação */
const canUpgradeAny=m=>Object.keys(GEAR).some(k=>(m.gear&&m.gear[k]||1)<GEAR_MAX)||Object.keys(m.pets||{}).some(k=>m.pets[k]>=1&&m.pets[k]<PET_MAX);
const canAffordAny=m=>Object.keys(GEAR).some(k=>{const L=m.gear&&m.gear[k]||1;if(L>=GEAR_MAX)return false;const c=gearCost(L);return m.stone>=c.stone&&m.gold>=c.gold;})||
 Object.keys(m.pets||{}).some(k=>m.pets[k]>=1&&m.pets[k]<PET_MAX&&m.food>=feedCost(m.pets[k]));
function swapGoals(m){const g=m.goals,i=g.ids.indexOf('upgrade1');if(i<0||g.done.includes('upgrade1'))return m;
 const draw=!g.chk;g.chk=1;/* a 1ª vez que este sorteio é visto = o momento do sorteio do dia */
 if(canUpgradeAny(m)&&!(draw&&!(g.p.upgrade1>0)&&!canAffordAny(m)))return m;
 const nx=goalOrder(m.day).find(id=>id!=='upgrade1'&&!g.ids.includes(id));if(nx){g.ids[i]=nx;delete g.p.upgrade1;}return m;}
function rollDay(m,now){swapGoals(rollDay0(m,now));return m;}
function openDay(m,dk){m.day=dk;m.dayOpen=dk;m.dayMax=dk;
 const ds=(Array.isArray(m.days)?m.days:[]).filter(d=>typeof d==='string'&&d!==dk);ds.push(dk);ds.sort();m.days=ds.slice(-DAYS_KEEP);
 if(Array.isArray(m.far)&&m.far[1]<dk)delete m.far;
 m.ad={energy:0,double:0,shop:0};m.buys={energy30:0};m.rw={daily:0,duel:0};m.dscN=0;m.goals=newGoals(dk);}
function rollDay0(m,now){const dk=dayKey(now);
 if(typeof m.day!=='string'||!m.day){openDay(m,dk);return m;}
 /* relógio para trás mais de 2 dias: só o marcador volta; o dia de onde ele veio vira a trava (se ainda não estiver guardado) */
 if(m.day>dk&&Date.parse(m.day)-Date.parse(dk)>2*DAY_MS){if(!inFar(m,m.day)&&!(typeof m.dayMax==='string'&&m.dayMax>=m.day))m.dayMax=m.day;m.day=dk;}
 capFar(m,dk);
 if(dk>m.day){if(!dayLocked(m,dk)){openDay(m,dk);return m;}m.day=dk;}
 if(!goalsOk(m.goals))m.goals=newGoals(m.day);
 return m;}
/* preenche com o padrão o que faltar numa meta antiga ou parcial */
/* v1.4: todo número vira inteiro dentro dos limites (perfil adulterado ou corrompido não dá energia, nível ou bônus fora do jogo) */
const lim=(v,a,b,d)=>isNum(v)?Math.max(a,Math.min(b,Math.floor(v))):d;
const isDay=d=>typeof d==='string'&&/^\d{4}-\d\d-\d\d$/.test(d);
const XP_MAX=1e7;
function backfill(m,prof,now){
 const tw=isNum(prof.totalWins)&&prof.totalWins>0?prof.totalWins:0;
 m.energy=lim(m.energy,0,ENERGY_CAP,ENERGY_MAX);
 if(!isNum(m.eAt))m.eAt=isNum(now)?now:Date.now();
 m.xp=lim(m.xp,0,XP_MAX,lim(10*tw,0,XP_MAX,0));
 for(const k of ['gold','ruby','stone','food','egg'])m[k]=lim(m[k],0,CAP,0);
 if(!isObj(m.gear))m.gear={};
 for(const k in GEAR)m.gear[k]=lim(m.gear[k],1,GEAR_MAX,1);
 if(!isObj(m.pets))m.pets={};
 for(const k in m.pets){const v=lim(m.pets[k],1,PET_MAX,0);if(!v||m.pets[k]<1||(PETKEYS.length&&!PETKEYS.includes(k)))delete m.pets[k];else m.pets[k]=v;}
 if(typeof m.petOn!=='string'||!m.pets[m.petOn])m.petOn=null;
 if(!isObj(m.cal))m.cal={};
 if(typeof m.cal.last!=='string')m.cal.last='';
 m.cal.idx=lim(m.cal.idx,0,CAL.length-1,0);
 if(!isDay(m.day))m.day='';
 if('dayMax' in m&&!isDay(m.dayMax))delete m.dayMax;
 if(!isDay(m.dayOpen))m.dayOpen=isDay(m.dayMax)&&m.dayMax>m.day?m.dayMax:m.day;/* perfil antigo: o dia aberto é o mais adiantado */
 if(!Array.isArray(m.days))m.days=m.dayOpen?[m.dayOpen]:[];
 m.days=m.days.filter(isDay).slice(-DAYS_KEEP);
 if('far' in m&&!(Array.isArray(m.far)&&m.far.length===2&&isDay(m.far[0])&&isDay(m.far[1])&&m.far[0]<=m.far[1]))delete m.far;
 if('capOn' in m&&!isDay(m.capOn))delete m.capOn;
 if(!isObj(m.ad))m.ad={};
 for(const k in AD_LIMIT)m.ad[k]=lim(m.ad[k],0,AD_LIMIT[k],0);
 if(!isObj(m.rw))m.rw={};
 for(const k of ['daily','duel'])m.rw[k]=lim(m.rw[k],0,99,0);
 if(!isObj(m.buys))m.buys={};
 m.buys.energy30=lim(m.buys.energy30,0,SHOP.energy30.limit,0);
 m.dscN=lim(m.dscN,0,DISC_DAY,0);
 if(isObj(m.goals)&&isObj(m.goals.p)){const g=m.goals;for(const id in g.p){if(!GOALS[id]||!isNum(g.p[id]))delete g.p[id];else g.p[id]=lim(g.p[id],0,GOALS[id].n,0);}
  if(isNum(g.pts))g.pts=lim(g.pts,0,GOAL_PTS*GOAL_COUNT,0);}
 if(!Array.isArray(m.achBase))m.achBase=Object.keys(prof.ach||{});
 if(!isObj(m.achPaid))m.achPaid={};
 if(!isObj(m.dsc)||!isObj(m.dsc.i)||!isObj(m.dsc.r)||!isObj(m.dsc.f))m.dsc=discBase(prof.codex);
 if(!m.v)m.v=1;}
function ensureMeta(prof,now){
 if(!prof.meta)prof.meta={v:1,day:''};
 backfill(prof.meta,prof,now);
 discSync(prof.meta,prof.codex);
 return rollDay(prof.meta,now);}

/* ===== v1.3: descobertas do Codex (+2 rubis cada) =====
   m.dsc = {i:itens, r:receitas, f:inimigos}: 0 = já estava no Codex antes desta versão (não paga), 1 = descoberta nova ainda não aberta, 2 = aberta e paga.
   Quem já tinha Codex na migração recebe tudo como 0 (nada retroativo). O resto é derivado do próprio Codex (que o Laboratório, o Seed e o Duelo não tocam),
   então desfazer, recarregar ou o Laboratório não criam nem repetem descobertas: cada chave paga uma vez só. */
/* v1.4: descoberta paga só pelo esforço — item comprado, fundido ou forjado; receita forjada; inimigo vencido. Ver na loja continua
   registrando no Codex, mas não vira novidade. Novidades ainda não abertas que vieram só de ver deixam de valer (as já pagas ficam pagas).
   No máximo DISC_DAY aberturas por dia (o resto espera o dia seguinte). Chaves que o jogo não conhece (item renomeado) somem do registro. */
const DISC_RUBY=2,DISC_DAY=10,DISC_KINDS=['i','r','f'];
const DD=window.AlforjeData||{};
function discValid(){if(!DD.ITEMS||!DD.STOPS)return null;const f=new Set();for(const s of DD.STOPS)for(const v of s.v)f.add(v.art);
 return {i:k=>Object.prototype.hasOwnProperty.call(DD.ITEMS,k),r:k=>Object.prototype.hasOwnProperty.call(DD.ITEMS,k),f:k=>f.has(k)};}
function discKnown(codex){const c=isObj(codex)?codex:{},o={i:[],r:[],f:[]},ok=discValid();
 if(isObj(c.items))for(const k in c.items){const x=c.items[k];if(isObj(x)&&(x.bought>0||x.merged>0||x.forged>0))o.i.push(k);}
 if(isObj(c.recipes))for(const k in c.recipes)if(c.recipes[k])o.r.push(k);
 if(isObj(c.foes))for(const k in c.foes){const x=c.foes[k];if(isObj(x)&&x.beat>0)o.f.push(k);}
 if(ok)for(const t of DISC_KINDS)o[t]=o[t].filter(ok[t]);
 return o;}
function discBase(codex){const k=discKnown(codex),d={i:{},r:{},f:{}};for(const t of DISC_KINDS)for(const x of k[t])d[t][x]=0;return d;}
/* marca como novidade (1) o que entrou no Codex e ainda não está no registro; devolve quantas entraram agora.
   Novidade ainda não aberta que já não vale (só vista, ou chave desconhecida) sai do registro: volta a valer se um dia for comprada. */
function discSync(m,codex){if(!isObj(m.dsc))return 0;const k=discKnown(codex);let n=0;
 for(const t of DISC_KINDS){const s=new Set(k[t]),d=m.dsc[t];
  for(const x in d)if(d[x]!==0&&d[x]!==2&&(d[x]!==1||!s.has(x)))delete d[x];
  for(const x of k[t])if(!(x in d)){d[x]=1;n++;}}
 return n;}
/* novidades ainda não abertas: total e por tipo */
function discNew(m){const o={i:0,r:0,f:0,total:0};if(!isObj(m.dsc))return o;
 for(const t of DISC_KINDS)for(const x in m.dsc[t])if(m.dsc[t][x]===1){o[t]++;o.total++;}
 return o;}
const discIs=(m,kind,key)=>isObj(m.dsc)&&isObj(m.dsc[kind])&&m.dsc[kind][key]===1;
/* quantas novidades ainda dá para abrir hoje */
const discLeft=m=>Math.max(0,DISC_DAY-(isNum(m.dscN)?m.dscN:0));
/* abrir uma novidade: paga DISC_RUBY uma vez (respeita o limite de rubis) e devolve {added,lost}; {limit:true} se o limite do dia acabou; null se não era novidade */
function discClaim(m,kind,key){if(!discIs(m,kind,key))return null;if(!discLeft(m))return {added:0,lost:0,limit:true};
 m.dsc[kind][key]=2;m.dscN=(m.dscN||0)+1;const a=addRes(m,'ruby',DISC_RUBY);return {added:a,lost:DISC_RUBY-a};}
/* "Coletar todos": abre as novidades até o limite do dia; devolve quantas abriu, o que entrou, o que se perdeu e quantas ficaram para amanhã */
function discClaimAll(m){const o={n:0,added:0,lost:0,keys:[]};if(!isObj(m.dsc))return Object.assign(o,{rest:0});
 for(const t of DISC_KINDS)for(const x of Object.keys(m.dsc[t])){if(m.dsc[t][x]!==1||!discLeft(m))continue;const r=discClaim(m,t,x);o.n++;o.added+=r.added;o.lost+=r.lost;o.keys.push(t+':'+x);}
 o.rest=discNew(m).total;return o;}

/* ===== energia ===== */
function tickEnergy(m,now){
 if(now<m.eAt){m.eAt=now;return m.energy;}
 if(m.energy>=ENERGY_MAX){m.eAt=now;return m.energy;}
 const g=Math.floor((now-m.eAt)/REGEN_MS);
 if(g>0){m.energy=Math.min(ENERGY_MAX,m.energy+g);m.eAt=m.energy>=ENERGY_MAX?now:m.eAt+g*REGEN_MS;}
 return m.energy;}
function nextEnergyIn(m,now){tickEnergy(m,now);return m.energy>=ENERGY_MAX?0:Math.max(0,m.eAt+REGEN_MS-now);}
function spendEnergy(m,n,now){tickEnergy(m,now);if(m.energy<n)return false;
 if(m.energy>=ENERGY_MAX)m.eAt=now;m.energy-=n;return true;}

/* ===== recursos ===== */
function addRes(m,kind,n){if(!KINDS.includes(kind)||!(n>0))return 0;
 const cap=kind==='energy'?ENERGY_CAP:CAP,cur=m[kind]||0,add=Math.max(0,Math.min(n,cap-cur));m[kind]=cur+add;return add;}
function applyReward(m,r){const added={},lost={};
 for(const k of KINDS)if(r[k]>0){const a=addRes(m,k,r[k]);added[k]=a;if(a<r[k])lost[k]=r[k]-a;}
 return {added,lost};}
const scale=(r,f)=>{const o={};for(const k in r)o[k]=r[k]*f;return o;};

/* ===== calendário ===== */
/* v1.4: o bônus vale 1 vez por dia aberto (m.dayOpen), não pela data do relógio */
function calToday(m,now){rollDay(m,now);const idx=m.cal.idx%CAL.length;return {idx,reward:CAL[idx],claimed:m.cal.last===m.dayOpen};}
/* double: gasta o contador do dobro aqui dentro; se já usado, paga o bônus simples */
function claimCal(m,now,double){const c=calToday(m,now);if(c.claimed)return null;
 const r=foodSwap(m,double&&adUse(m,now,'double')?scale(c.reward,2):Object.assign({},c.reward));applyReward(m,r);
 m.cal.last=m.dayOpen;m.cal.idx=(c.idx+1)%CAL.length;return r;}

/* ===== metas do dia ===== */
function goalsToday(m,now){rollDay(m,now);const g=m.goals;
 return {ids:g.ids.slice(),p:Object.assign({},g.p),done:g.done.slice(),pts:g.pts,
  chests:CHESTS.map((c,i)=>({at:c.at,reward:c.reward,ready:g.pts>=c.at&&!g.chests[i],claimed:!!g.chests[i]})),endsIn:endsIn(now)};}
function goalEvent(m,now,ev,n){rollDay(m,now);if(n==null)n=1;const g=m.goals,out=[];
 for(const id of g.ids){const d=GOALS[id];if(!d||d.ev!==ev||g.done.includes(id))continue;
  g.p[id]=Math.min(d.n,(g.p[id]||0)+n);
  if(g.p[id]>=d.n){g.done.push(id);g.pts+=GOAL_PTS;out.push(id);}}
 return out;}
function claimChest(m,now,i){rollDay(m,now);const c=CHESTS[i],g=m.goals;
 if(!c||g.chests[i]||g.pts<c.at)return null;g.chests[i]=true;const r=foodSwap(m,c.reward);applyReward(m,r);return r;}

/* ===== nível do herói ===== */
function levelOf(xp){let lv=1,rem=Math.max(0,xp|0);while(lv<LV_MAX&&rem>=100*lv){rem-=100*lv;lv++;}
 return lv>=LV_MAX?{lv,into:0,need:0}:{lv,into:rem,need:100*lv};}
function addXp(m,n){const a=levelOf(m.xp).lv;m.xp+=Math.max(0,n|0);return levelOf(m.xp).lv-a;}

/* ===== equipamento ===== */
/* v1.2: de L para L+1, 25×L² de ouro. v1.4 (ID 8): as pedras também crescem, ⌈L²/3⌉ (1, 2, 3, 6, 9 … 121 no nível 19).
   A spec pedia ⌈L²/6⌉; medido com o agente engajado da rodada 2 (60 dias), sobravam 1.481 pedras. Com ⌈L²/3⌉ e 1 pedra a cada 4 vitórias
   na jornada (antes 3) sobram 99, sem atrasar o equipamento do engajado nem do casual (alvo: < 300). Ver .superpowers/sdd/v1.4-loteA-report.md. */
const gearCost=L=>({stone:Math.ceil(L*L/3),gold:25*L*L});
const gearTier=L=>L<=5?1:L<=10?2:L<=15?3:4;
function upgradeGear(m,slot){if(!GEAR[slot])return false;const L=m.gear[slot];if(L>=GEAR_MAX)return false;
 const c=gearCost(L);if(m.stone<c.stone||m.gold<c.gold)return false;
 m.stone-=c.stone;m.gold-=c.gold;m.gear[slot]=L+1;return true;}

/* ===== companheiros ===== */
const feedCost=L=>L+1;
function feedPet(m,key){const L=m.pets[key];if(!L||L>=PET_MAX)return false;const c=feedCost(L);if(m.food<c)return false;m.food-=c;m.pets[key]=L+1;return true;}
/* v1.4: com todos os companheiros obtidos no nível máximo, a ração não serve para nada: prêmios de ração viram ouro (1 ração = 30 de ouro) */
const FOOD_GOLD=30;
const foodIdle=m=>{const k=Object.keys(m.pets||{}).filter(x=>m.pets[x]>=1);return k.length>0&&k.every(x=>m.pets[x]>=PET_MAX);};
function foodSwap(m,r){if(!r||!(r.food>0)||!foodIdle(m))return r;const o=Object.assign({},r);o.gold=(o.gold||0)+o.food*FOOD_GOLD;delete o.food;return o;}
/* gasta 1 ovo (sem ovo: null); choca um companheiro que falta, ou 10 rações se já tiver todos (300 de ouro se todos estiverem no máximo) */
function hatch(m,rnd){if(m.egg<1)return null;
 const miss=PETKEYS.filter(k=>!m.pets[k]);
 if(!miss.length){if(foodIdle(m)){if(m.gold>=CAP)return null;m.egg--;addRes(m,'gold',HATCH_FOOD*FOOD_GOLD);return 'gold';}
  if(m.food>=CAP)return null;m.egg--;addRes(m,'food',HATCH_FOOD);return 'food';}
 m.egg--;
 const k=miss[Math.min(miss.length-1,Math.floor(rnd()*miss.length))];m.pets[k]=1;return k;}
function setPetOn(m,key){m.petOn=key&&m.pets[key]?key:null;}

/* ===== bônus guardados na partida ===== */
function permOf(m){const lv=levelOf(m.xp).lv,g=m.gear,p=m.petOn&&m.pets[m.petOn]?{key:m.petOn,mul:(PET_LV_STEP+m.pets[m.petOn]-1)/PET_LV_STEP}:null;
 return {hp:HP_PER_LV*(lv-1),block:gearBonus('armor',g.armor),dmgPct:gearBonus('weapon',g.weapon)/100,crit:gearBonus('ring',g.ring)/100,gold:gearBonus('bag',g.bag),pet:p};}

/* v1.2: na jornada, os bônus permanentes valem 100% na Ascensão 0 e caem em linha reta até 30% na Ascensão 10 */
const permScale=asc=>1-.07*Math.max(0,Math.min(10,asc||0));
function permFor(m,asc){const p=permOf(m),f=permScale(asc);
 return {hp:Math.round(p.hp*f),block:Math.round(p.block*f),dmgPct:p.dmgPct*f,crit:p.crit*f,gold:Math.floor(p.gold*f),pet:p.pet?{key:p.pet.key,mul:1+(p.pet.mul-1)*f}:null};}

/* ===== fim de jornada ===== */
function journeyRewards(wins,won,asc,mode){if(mode==='lab')return {gold:0,stone:0,xp:0};wins=lim(wins,0,99,0);asc=lim(asc,0,ASC_MAX,0);let gold=Math.round((10*wins+(won?50:0))*(1+.05*(asc||0))),stone=Math.floor(wins/4);/* v1.4 (ID 8): 1 pedra a cada 4 vitórias (antes 3) */
 if(mode==='daily'||mode==='duel'){gold=Math.floor(gold/2);stone=0;}
 return {gold,stone,xp:10*wins};}

/* Diário e Duelo pagam prêmio de conta só na 1ª jornada de cada modo por dia UTC */
function rewardOk(m,now,mode){rollDay(m,now);if(mode==='lab')return false;return !(mode==='daily'||mode==='duel')||!(m.rw[mode]>0);}
function markReward(m,now,mode){rollDay(m,now);if(mode==='daily'||mode==='duel')m.rw[mode]=(m.rw[mode]||0)+1;}

/* ===== Ascensão e o que conta para o perfil ===== */
/* a próxima Ascensão libera depois de ASC_WINS vitórias de jornada no nível atual (o maior liberado) da classe; vitórias em níveis abaixo não contam */
const ASC_WINS=2,ASC_MAX=10;
function ascWin(prof,cls,asc){if(!isObj(prof.asc))prof.asc={};if(!isObj(prof.ascW))prof.ascW={};const cur=prof.asc[cls]||0;
 if(asc<cur||cur>=ASC_MAX)return false;prof.ascW[cls]=(prof.ascW[cls]||0)+1;
 if(prof.ascW[cls]>=ASC_WINS){prof.asc[cls]=Math.min(ASC_MAX,Math.max(cur,asc)+1);prof.ascW[cls]=0;return true;}return false;}
/* Seed e Duelo não contam para desbloqueios, conquistas, Codex nem "jornada completa" (o Duelo só paga a recompensa de conta do dia).
   v1.3: o Laboratório (sandbox) não conta para nada e não rende nada (nem a recompensa de conta). */
const progressCounts=mode=>mode!=='seed'&&mode!=='duel'&&mode!=='lab';
const isLab=mode=>mode==='lab';

/* ===== propaganda, loja, conquistas ===== */
/* devolve false se recusou; senão o que entrou (energia/ouro) ou true (dobro). No limite (99 de energia, 99999 de ouro) recusa sem gastar a vez. */
function adUse(m,now,kind){rollDay(m,now);if(!(kind in AD_LIMIT)||m.ad[kind]>=AD_LIMIT[kind])return false;
 if(kind==='energy'&&m.energy>=ENERGY_CAP||kind==='shop'&&m.gold>=CAP)return false;
 m.ad[kind]++;if(kind==='energy')return addRes(m,'energy',AD_ENERGY);if(kind==='shop')return addRes(m,'gold',AD_GOLD);return true;}
function buy(m,now,offer){rollDay(m,now);const o=SHOP[offer];if(!o||m.ruby<o.ruby)return false;
 if(o.kind==='food'&&foodIdle(m))return false;/* v1.4: ração sem uso (todos no máximo) não se vende */
 if((m[o.kind]||0)+o.n>(o.kind==='energy'?ENERGY_CAP:CAP))return false;
 if(o.limit&&(m.buys[offer]||0)>=o.limit)return false;
 m.ruby-=o.ruby;addRes(m,o.kind,o.n);if(o.limit)m.buys[offer]=(m.buys[offer]||0)+1;return true;}
function achRuby(m,achKeys){let n=0;
 for(const k of achKeys)if(!m.achBase.includes(k)&&!m.achPaid[k]){m.achPaid[k]=1;n++;}
 return n?addRes(m,'ruby',n*ACH_RUBY):0;}

window.AlforjeMeta={ENERGY_MAX,REGEN_MS,JOURNEY_COST,ENERGY_CAP,CAP,CAL,CHESTS,GOALS,GEAR,LV_MAX,GEAR_MAX,PET_MAX,SHOP,AD_LIMIT,ASC_WINS,HP_PER_LV,
 gearBonus,permScale,permFor,ascWin,progressCounts,isLab,canUpgradeAny,canAffordAny,DISC_RUBY,DISC_DAY,discSync,discNew,discIs,discClaim,discClaimAll,discLeft,
 FOOD_GOLD,foodIdle,
 dayKey,ensureMeta,tickEnergy,nextEnergyIn,spendEnergy,addRes,applyReward,calToday,claimCal,goalsToday,goalEvent,claimChest,
 levelOf,addXp,gearCost,gearTier,upgradeGear,feedCost,feedPet,hatch,setPetOn,permOf,journeyRewards,rewardOk,markReward,adUse,buy,achRuby};
})();
