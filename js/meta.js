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
const GEAR={weapon:{t:'Arma',per:2,perm:'dmgPct'},armor:{t:'Armadura',per:3,perm:'block'},ring:{t:'Anel',per:1,perm:'crit'},bag:{t:'Bolsa',per:1,perm:'gold'}};
const HP_PER_LV=3,PET_LV_STEP=10;
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
function drawGoals(dk){const r=mulberry(hashStr('metas|'+dk)||1),a=GOALKEYS.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,GOAL_COUNT);}
function newGoals(dk){return {ids:drawGoals(dk),p:{},done:[],pts:0,chests:CHESTS.map(()=>false)};}

/* ===== criação, migração e virada do dia ===== */
const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
const isNum=n=>typeof n==='number'&&Number.isFinite(n);
/* o dia da meta só avança (comparação de strings ISO): relógio para trás não reabre nada */
function goalsOk(g){return isObj(g)&&Array.isArray(g.ids)&&g.ids.length&&g.ids.every(id=>GOALS[id])&&isObj(g.p)&&Array.isArray(g.done)&&isNum(g.pts)&&Array.isArray(g.chests)&&g.chests.length===CHESTS.length;}
/* exceção: dia salvo mais de 2 dias à frente do relógio = relógio corrigido. Só o marcador do dia volta para hoje:
   propagandas, compras, prêmios, metas e calendário já usados continuam usados. dayMax guarda o dia mais adiantado já aberto,
   e nada reabre (contadores, metas) até o relógio passar dele; cal.last fica no futuro, então o bônus de hoje continua pego. */
function rollDay(m,now){const dk=dayKey(now),ahead=typeof m.day==='string'&&m.day>dk&&Date.parse(m.day)-Date.parse(dk)>2*DAY_MS;
 if(ahead){if(!(typeof m.dayMax==='string'&&m.dayMax>=m.day))m.dayMax=m.day;m.day=dk;if(!goalsOk(m.goals))m.goals=newGoals(m.day);return m;}
 if(typeof m.day!=='string'||dk>m.day){
  if(typeof m.day==='string'&&typeof m.dayMax==='string'&&dk<=m.dayMax){m.day=dk;if(!goalsOk(m.goals))m.goals=newGoals(m.day);return m;}
  delete m.dayMax;m.day=dk;m.ad={energy:0,double:0,shop:0};m.buys={energy30:0};m.rw={daily:0,duel:0};m.goals=newGoals(m.day);return m;}
 if(!goalsOk(m.goals))m.goals=newGoals(m.day);
 return m;}
/* preenche com o padrão o que faltar numa meta antiga ou parcial */
function backfill(m,prof,now){
 const n0=(k,d)=>{if(!isNum(m[k])||m[k]<0)m[k]=d;};
 n0('energy',ENERGY_MAX);n0('eAt',isNum(now)?now:Date.now());n0('xp',10*(prof.totalWins||0));
 for(const k of ['gold','ruby','stone','food','egg'])n0(k,0);
 if(!isObj(m.gear))m.gear={};
 for(const k in GEAR)if(!isNum(m.gear[k])||m.gear[k]<1)m.gear[k]=1;
 if(!isObj(m.pets))m.pets={};
 if(typeof m.petOn!=='string'||!m.pets[m.petOn])m.petOn=null;
 if(!isObj(m.cal))m.cal={};
 if(typeof m.cal.last!=='string')m.cal.last='';
 if(!isNum(m.cal.idx)||m.cal.idx<0)m.cal.idx=0;
 if(typeof m.day!=='string')m.day='';
 if('dayMax' in m&&typeof m.dayMax!=='string')delete m.dayMax;
 if(!isObj(m.ad))m.ad={};
 for(const k in AD_LIMIT)if(!isNum(m.ad[k]))m.ad[k]=0;
 if(!isObj(m.rw))m.rw={};
 for(const k of ['daily','duel'])if(!isNum(m.rw[k]))m.rw[k]=0;
 if(!isObj(m.buys))m.buys={};
 if(!isNum(m.buys.energy30))m.buys.energy30=0;
 if(!Array.isArray(m.achBase))m.achBase=Object.keys(prof.ach||{});
 if(!isObj(m.achPaid))m.achPaid={};
 if(!m.v)m.v=1;}
function ensureMeta(prof,now){
 if(!prof.meta)prof.meta={v:1,day:''};
 backfill(prof.meta,prof,now);
 return rollDay(prof.meta,now);}

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
function calToday(m,now){rollDay(m,now);const idx=m.cal.idx%CAL.length;return {idx,reward:CAL[idx],claimed:m.cal.last>=dayKey(now)};}
/* double: gasta o contador do dobro aqui dentro; se já usado, paga o bônus simples */
function claimCal(m,now,double){const c=calToday(m,now);if(c.claimed)return null;
 const r=double&&adUse(m,now,'double')?scale(c.reward,2):Object.assign({},c.reward);applyReward(m,r);
 m.cal.last=dayKey(now);m.cal.idx=(c.idx+1)%CAL.length;return r;}

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
 if(!c||g.chests[i]||g.pts<c.at)return null;g.chests[i]=true;applyReward(m,c.reward);return c.reward;}

/* ===== nível do herói ===== */
function levelOf(xp){let lv=1,rem=Math.max(0,xp|0);while(lv<LV_MAX&&rem>=100*lv){rem-=100*lv;lv++;}
 return lv>=LV_MAX?{lv,into:0,need:0}:{lv,into:rem,need:100*lv};}
function addXp(m,n){const a=levelOf(m.xp).lv;m.xp+=Math.max(0,n|0);return levelOf(m.xp).lv-a;}

/* ===== equipamento ===== */
const gearCost=L=>({stone:L,gold:50*L});
const gearTier=L=>L<=5?1:L<=10?2:L<=15?3:4;
function upgradeGear(m,slot){if(!GEAR[slot])return false;const L=m.gear[slot];if(L>=GEAR_MAX)return false;
 const c=gearCost(L);if(m.stone<c.stone||m.gold<c.gold)return false;
 m.stone-=c.stone;m.gold-=c.gold;m.gear[slot]=L+1;return true;}

/* ===== companheiros ===== */
const feedCost=L=>L+1;
function feedPet(m,key){const L=m.pets[key];if(!L||L>=PET_MAX)return false;const c=feedCost(L);if(m.food<c)return false;m.food-=c;m.pets[key]=L+1;return true;}
/* gasta 1 ovo (sem ovo: null); choca um companheiro que falta, ou 10 rações se já tiver todos */
function hatch(m,rnd){if(m.egg<1)return null;
 const miss=PETKEYS.filter(k=>!m.pets[k]);
 if(!miss.length){if(m.food>=CAP)return null;m.egg--;addRes(m,'food',HATCH_FOOD);return 'food';}
 m.egg--;
 const k=miss[Math.min(miss.length-1,Math.floor(rnd()*miss.length))];m.pets[k]=1;return k;}
function setPetOn(m,key){m.petOn=key&&m.pets[key]?key:null;}

/* ===== bônus guardados na partida ===== */
function permOf(m){const lv=levelOf(m.xp).lv,g=m.gear,p=m.petOn&&m.pets[m.petOn]?{key:m.petOn,mul:(PET_LV_STEP+m.pets[m.petOn]-1)/PET_LV_STEP}:null;
 return {hp:HP_PER_LV*(lv-1),block:GEAR.armor.per*(g.armor-1),dmgPct:GEAR.weapon.per*(g.weapon-1)/100,crit:GEAR.ring.per*(g.ring-1)/100,gold:GEAR.bag.per*(g.bag-1),pet:p};}

/* ===== fim de jornada ===== */
function journeyRewards(wins,won,asc,mode){let gold=Math.round((10*wins+(won?50:0))*(1+.05*(asc||0))),stone=Math.floor(wins/3);
 if(mode==='daily'||mode==='duel'){gold=Math.floor(gold/2);stone=0;}
 return {gold,stone,xp:10*wins};}

/* Diário e Duelo pagam prêmio de conta só na 1ª jornada de cada modo por dia UTC */
function rewardOk(m,now,mode){rollDay(m,now);return !(mode==='daily'||mode==='duel')||!(m.rw[mode]>0);}
function markReward(m,now,mode){rollDay(m,now);if(mode==='daily'||mode==='duel')m.rw[mode]=(m.rw[mode]||0)+1;}

/* ===== propaganda, loja, conquistas ===== */
/* devolve false se recusou; senão o que entrou (energia/ouro) ou true (dobro). No limite (99 de energia, 99999 de ouro) recusa sem gastar a vez. */
function adUse(m,now,kind){rollDay(m,now);if(!(kind in AD_LIMIT)||m.ad[kind]>=AD_LIMIT[kind])return false;
 if(kind==='energy'&&m.energy>=ENERGY_CAP||kind==='shop'&&m.gold>=CAP)return false;
 m.ad[kind]++;if(kind==='energy')return addRes(m,'energy',AD_ENERGY);if(kind==='shop')return addRes(m,'gold',AD_GOLD);return true;}
function buy(m,now,offer){rollDay(m,now);const o=SHOP[offer];if(!o||m.ruby<o.ruby)return false;
 if((m[o.kind]||0)+o.n>(o.kind==='energy'?ENERGY_CAP:CAP))return false;
 if(o.limit&&(m.buys[offer]||0)>=o.limit)return false;
 m.ruby-=o.ruby;addRes(m,o.kind,o.n);if(o.limit)m.buys[offer]=(m.buys[offer]||0)+1;return true;}
function achRuby(m,achKeys){let n=0;
 for(const k of achKeys)if(!m.achBase.includes(k)&&!m.achPaid[k]){m.achPaid[k]=1;n++;}
 return n?addRes(m,'ruby',n*ACH_RUBY):0;}

window.AlforjeMeta={ENERGY_MAX,REGEN_MS,JOURNEY_COST,ENERGY_CAP,CAP,CAL,CHESTS,GOALS,GEAR,LV_MAX,GEAR_MAX,PET_MAX,SHOP,AD_LIMIT,
 dayKey,ensureMeta,tickEnergy,nextEnergyIn,spendEnergy,addRes,applyReward,calToday,claimCal,goalsToday,goalEvent,claimChest,
 levelOf,addXp,gearCost,gearTier,upgradeGear,feedCost,feedPet,hatch,setPetOn,permOf,journeyRewards,rewardOk,markReward,adUse,buy,achRuby};
})();
