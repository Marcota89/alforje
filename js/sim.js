/* Alforje: geometria da mochila, inimigos e simulação de combate. Sem DOM. */
(function(){
'use strict';
const {TAGS,TAGKEYS,ITEMS,RECIPES,SHOPKEYS,PATNAME,PETS,PETKEYS,PET_CHARGES,TM,TP,TIERS,AWK,tierVar,CLASSES,CLASSKEYS,SUBS,SUBOF,POCKETS,POCKETKEYS,ARCH,MODS,MODPOOL,STOPS,BAGCOST,MAXEXP,MAXCOLS,MAXROWS,CHEST_ROWS,GOAL,SURV_GOAL,LIVES,BLESS,ETIQ,ETIQKEYS,EVENTS,CHALLENGES,ACH,STORY,MERCH}=window.AlforjeData;
let state=null;
let DIFF={hp:1.84,dmg:1.5};
/* ================= SEEDED RNG (MOD-01) ================= */
function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^h>>>16)>>>0;}
function R(){let t=(state.rng=(state.rng+0x6D2B79F5)>>>0);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rpick=a=>a[Math.floor(R()*a.length)];
function rshuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/* o dia do Desafio Diário segue o UTC: a mesma data, seed e classe para todo mundo ao mesmo tempo */
const dayIndex=()=>Math.floor(Date.now()/86400000);
const dayStr=ix=>new Date(ix*86400000).toISOString().slice(0,10);
const todayStr=()=>dayStr(dayIndex());
/* gira pelas cinco classes; no Diário a classe do dia vale mesmo se ainda estiver bloqueada no perfil */
const dailyClass=ix=>CLASSKEYS[(ix==null?dayIndex():ix)%CLASSKEYS.length];
/* cada luta tem o próprio gerador, semeado pela partida e pelo momento dela: a mesma mochila contra o mesmo inimigo dá sempre o mesmo resultado */
function battleSeed(s){return hashStr((s.seed||'')+'|luta|'+s.round+'|'+s.wins+'|'+(s.stopLosses||0))||1;}
function BR(b){let t=(b.rng=(b.rng+0x6D2B79F5)>>>0);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
function fresh(){return {phase:'class',cls:null,kit:0,asc:0,mode:'normal',chal:null,seed:'',rng:1,round:1,wins:0,lives:LIVES,maxLives:LIVES,gold:10,rerollN:0,
 bag:{cols:5,rows:4,pockets:{}},bagLvl:0,items:[],pets:[null,null,null],shop:[],nid:1,sel:null,reward:null,queue:[],route:[],elites:{},lossStreak:0,winStreak:0,stopLosses:0,mood:'first',
 sub:null,bless:[],etiq:{},pendingEtiq:null,skipOffer:null,hammerUsed:false,freeHammer:false,extraLock:0,freeReroll:false,undo:null,noAsk:false,
 surv:false,survLives:0,survRoute:[],duel:null,event:null,maxHpMod:0,merges:0,intMax:0,stats:{forged:[],legend:0},perm:null};}
const has=b=>state.bless.includes(b);
const bagDims=()=>({cols:state.bag.cols,rows:state.bag.rows});
const chestCols=()=>Math.max(5,state.bag.cols);
const dims=w=>w==='bag'?bagDims():{cols:chestCols(),rows:CHEST_ROWS};
const inWhere=w=>state.items.filter(i=>i.where===w);
const isWeapon=it=>ITEMS[it.key].type==='weapon';
const tagsOf=key=>ITEMS[key].tags||[];
const hasTag=(it,t)=>tagsOf(it.key).includes(t);
function occ(where,ex){const d=dims(where),g=[];for(let y=0;y<d.rows;y++)g.push(new Array(d.cols).fill(0));
 for(const it of inWhere(where)){if(it.id===ex)continue;for(let y=it.y;y<it.y+it.h;y++)for(let x=it.x;x<it.x+it.w;x++)if(g[y]&&x<d.cols)g[y][x]=it.id;}return g;}
function canPlace(where,x,y,w,h,ex){const d=dims(where);if(x<0||y<0||x+w>d.cols||y+h>d.rows)return false;const g=occ(where,ex);
 for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(g[j][i])return false;return true;}
function itemAt(where,x,y,ex){return inWhere(where).find(it=>it.id!==ex&&x>=it.x&&x<it.x+it.w&&y>=it.y&&y<it.y+it.h);}
function findSpot(where,w,h){const d=dims(where);for(const [ww,hh] of [[w,h],[h,w]])for(let y=0;y<=d.rows-hh;y++)for(let x=0;x<=d.cols-ww;x++)if(canPlace(where,x,y,ww,hh))return {where,x,y,w:ww,h:hh};return null;}
/* ================= GEOMETRY ================= */
const K=(x,y)=>x+','+y;
function cellsOf(it){const a=[];for(let y=it.y;y<it.y+it.h;y++)for(let x=it.x;x<it.x+it.w;x++)a.push([x,y]);return a;}
function pocketsOf(it){if(it.where!=='bag')return [];const s=new Set();for(const [x,y] of cellsOf(it)){const p=state.bag.pockets[K(x,y)];if(p)s.add(p);}return [...s];}
function patOf(it){const p=ITEMS[it.key].pat||'orto';return it.tier>=3&&(p==='orto'||p==='diag')?'ring':p;}
function starCells(it,pat){pat=pat||patOf(it);const own=new Set(cellsOf(it).map(c=>K(...c))),out=new Set(),d=bagDims();
 const add=(x,y)=>{if(x>=0&&y>=0&&x<d.cols&&y<d.rows&&!own.has(K(x,y)))out.add(K(x,y));};
 if(pat==='orto'||pat==='ring')for(const [x,y] of cellsOf(it)){add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1);}
 if(pat==='diag'||pat==='ring'){add(it.x-1,it.y-1);add(it.x+it.w,it.y-1);add(it.x-1,it.y+it.h);add(it.x+it.w,it.y+it.h);}
 if(pat==='row')for(let y=it.y;y<it.y+it.h;y++)for(let x=0;x<d.cols;x++)add(x,y);
 if(pat==='col')for(let x=it.x;x<it.x+it.w;x++)for(let y=0;y<d.rows;y++)add(x,y);
 return out;}
function touches(it,set){return cellsOf(it).some(c=>set.has(K(...c)));}
function zoneOk(it){const z=ITEMS[it.key].zone;if(!z||it.where!=='bag')return it.where==='bag';const d=bagDims();return z==='top'?it.y===0:it.y+it.h===d.rows;}
function orthoNeighbors(it){const s=starCells(it,'orto');return inWhere('bag').filter(o=>o.id!==it.id&&touches(o,s));}
const resonance=s=>s.tier>=4?1.5:1;
/* which items actually fight (challenge "Lâmina Única": only the first weapon) */
function fightingWeapons(){const w=inWhere('bag').filter(isWeapon);if(state.chal==='onewep'){w.sort((a,b)=>a.y-b.y||a.x-b.x);return w.slice(0,1);}return w;}
const SUPKEYS=['adjDmg','adjCrit','adjBurn','adjHaste','adjPoison','adjLife','adjFrost','adjPurge'];
function supportLinks(){const bag=inWhere('bag'),links=[];
 const sups=bag.filter(s=>{const d=ITEMS[s.key];return (d.pat||d.tagSup)&&SUPKEYS.some(k=>d[k]);});
 const weps=fightingWeapons();
 for(const s of sups){const d=ITEMS[s.key];
  if(d.tagSup){for(const w of weps)if(hasTag(w,d.tagSup))links.push({s,w,f:resonance(s),via:'tag'});continue;}
  const st=starCells(s);for(const w of weps)if(touches(w,st))links.push({s,w,f:resonance(s),via:'pat'});}
 for(const m of bag.filter(i=>i.key==='mirror')){const L=itemAt('bag',m.x-1,m.y),Rr=itemAt('bag',m.x+m.w,m.y);
  if(L&&Rr&&sups.includes(L)&&weps.includes(Rr))links.push({s:L,w:Rr,f:(1+.5*(m.tier-1))*resonance(L),via:'mirror',m});}
 const chains=bag.filter(i=>i.key==='chain');
 if(chains.length>=2){const seen=new Set();for(const a of chains)for(const b of chains){if(a===b)continue;const f=1+.25*(Math.min(a.tier,b.tier)-1);
  for(const s of orthoNeighbors(a).filter(x=>sups.includes(x)))for(const w of orthoNeighbors(b).filter(x=>weps.includes(x))){const k=s.id+'>'+w.id;if(seen.has(k))continue;seen.add(k);links.push({s,w,f:f*resonance(s),via:'chain',a,b});}}}
 if(state.chal==='onewep')links.forEach(L=>L.f*=1.5);
 return links;}
/* Afinidades por tag (ITM-01) */
function affinity(){const c={};for(const t of TAGKEYS)c[t]=0;for(const it of inWhere('bag'))for(const t of tagsOf(it.key))c[t]+=has('dupla')?2:1;
 const lv={};for(const t of TAGKEYS)lv[t]=c[t]>=5?2:c[t]>=3?1:0;return {c,lv};}
function itemWeight(it){const d=ITEMS[it.key];let w=d.wt||1;const C=CLASSES[state.cls]||{};
 if((C.fireFree||has('fole'))&&hasTag(it,'fogo'))w=0;
 if(has('pena'))w-=1;if(pocketsOf(it).includes('leve'))w-=1;
 const weps=fightingWeapons();if(weps.length===2&&weps.includes(it)&&inWhere('bag').some(b=>ITEMS[b.key].dual))w-=1;
 return Math.max(0,w);}
function weightInfo(){const C=CLASSES[state.cls]||CLASSES.warrior;let w=0;for(const it of fightingWeapons())w+=itemWeight(it);
 for(const b of inWhere('bag'))if(ITEMS[b.key].wtRed)w-=ITEMS[b.key].wtRed*b.tier;w=Math.max(0,w);
 let cap=C.cap+state.bagLvl+(has('ombros')?2:0);if(state.chal==='carga3')cap=3;return {w,cap,over:Math.max(0,w-cap)};}
function weaponStats(it,links){const d=ITEMS[it.key],C=CLASSES[state.cls]||CLASSES.warrior,m=TM[it.tier-1];links=links||supportLinks();const A=affinity(),pk=pocketsOf(it);
 let dmg=d.dmg*m,crit=(d.crit||0)+(C.crit||0)+(it.tier>=3?.15:0)+(pk.includes('afiado')?.1:0)+(state.sub==='inquisidor'?.1:0),
  burn=d.burn?Math.round(d.burn*m):0,poison=d.poison?Math.round(d.poison*m):0,frost=d.frost?Math.round(d.frost*m):0,purge=d.purge?Math.round(d.purge*(1+(it.tier-1)*.5)):0,
  bD=0,bC=0,bB=0,bP=0,bF=0,bPu=0,haste=0,life=0;
 for(const L of links){if(L.w.id!==it.id)continue;const s=ITEMS[L.s.key],t=L.s.tier,f=L.f;
  if(s.adjDmg)bD+=s.adjDmg*TM[t-1]*f;if(s.adjCrit)bC+=s.adjCrit*t*f;if(s.adjBurn)bB+=s.adjBurn*t*f;if(s.adjHaste)haste+=s.adjHaste*t*f;if(s.adjPoison)bP+=s.adjPoison*t*f;if(s.adjLife)life+=s.adjLife*t*f;
  if(s.adjFrost)bF+=s.adjFrost*t*f;if(s.adjPurge)bPu+=s.adjPurge*t*f;}
 for(const b of inWhere('bag'))if(ITEMS[b.key].bootsHaste&&zoneOk(b))haste+=ITEMS[b.key].bootsHaste*b.tier*resonance(b);
 for(const b of inWhere('bag'))if(ITEMS[b.key].veteran)bD+=Math.min(state.wins,10)*.5*b.tier;
 if(A.lv.natureza)haste+=A.lv.natureza===2?.14:.06;
 if(pk.includes('veloz'))haste+=.08;
 if(state.sub==='inquisidor'&&hasTag(it,'sagrado'))bPu+=1;
 if(A.lv.metal===2&&hasTag(it,'metal'))dmg*=1.1;
 const weps=fightingWeapons();if(weps.length===2&&weps.includes(it)&&it.tier>=1){const dg=inWhere('bag').find(b=>ITEMS[b.key].dual);if(dg&&dg.tier>=3)bC+=.1;}
 let tb=Math.round(burn+bB);if(tb>0){tb+=C.burnBonus||0;tb+=A.lv.fogo;}
 let tf=Math.round(frost+bF);if(tf>0)tf+=A.lv.gelo;
 haste=Math.min(.5,haste);
 const wi=weightInfo(),slow=1+.12*wi.over;
 const echo=it.tier>=4?.25:(it.tier===3&&has('eco')?.1:0);
 return {dmg:Math.round(dmg+bD),bD:Math.round(bD),crit:Math.min(.9,crit+bC),bC,burn:tb,bB:tb-burn,poison:Math.round(poison+bP),bP:Math.round(bP),frost:tf,bF:tf-frost,purge:Math.round(purge+bPu),
  cd:+(d.cd*(1-haste)*slow).toFixed(2),haste,slow,life:Math.min(.6,life),pierce:!!d.pierce,stun:d.stun?d.stun+.05*(it.tier-1):0,echo,fx:d.fx};}
/* ================= FOES ================= */
const stopIx=()=>Math.min(state.wins,STOPS.length-1);
function isEliteStop(s){return !!STOPS[s].elite||(state.asc>=1&&s===7);}
function rollElites(){state.elites={};for(let s=0;s<STOPS.length;s++){const st=STOPS[s];if(!isEliteStop(s)&&!st.boss)continue;
 state.elites[s]=st.v.map(v=>{const pool=MODPOOL[v.arch]||['furia','casca'];const n=st.boss?(state.asc>=9?2:1):(state.asc>=6?2:1);return rshuffle(pool).slice(0,n);});}}
function foeDef(){
 if(state.surv&&state.wins>=GOAL){const k=state.wins-GOAL,r=state.survRoute[k]||{s:6,v:0},st=STOPS[r.s],v=st.v[r.v%st.v.length];
  return Object.assign({stop:r.s,biome:st.biome,elite:0,boss:0,surv:k+1,mods:[]},v,{name:v.name+' do Norte'});}
 const s=stopIx(),st=STOPS[s],vi=(state.route[s]||0)%st.v.length,v=st.v[vi];
 if(st.boss&&state.duel){const g=state.duel;return {stop:s,biome:st.biome,boss:1,elite:0,arch:'duelo',name:'Fantasma: '+(CLASSES[g.c]||CLASSES.warrior).name,img:'h_'+g.c,flipImg:!(CLASSES[g.c]||{}).flip,h:48,line:'"Esta mochila venceu uma vez. Vai vencer de novo."',mods:[],ghost:1};}
 const mods=(state.elites[s]&&state.elites[s][vi])||[];
 return Object.assign({stop:s,biome:st.biome,elite:isEliteStop(s)&&!st.boss,boss:st.boss,mods},v);}
function foeStats(){const f=foeDef(),st=STOPS[f.stop],A=ARCH[f.arch],el=f.elite?1.15:1,s=f.stop;
 let hpS=1,dS=1;if(f.surv){hpS=STOPS[9].hp/st.hp*Math.pow(1.15,f.surv);dS=STOPS[9].dps/st.dps*Math.pow(1.15,f.surv);}
 const ascHp=state.asc>=10?2.2/1.95:1;
 const HP=Math.round(st.hp*A.hp*el*DIFF.hp*hpS*ascHp),D=st.dps*(f.elite?1.1:1)*DIFF.dmg*dS;
 let atk=[],block=0,reflect=0,heal=null;
 if(f.arch==='bruto')atk=[{dmg:Math.round(D*2.4),cd:2.4,label:'Pancada'}];
 if(f.arch==='enxame')atk=[{dmg:Math.max(1,Math.round(D/2*.9)),cd:.9,crit:s>=3?.2:0,label:'Mordida'},{dmg:Math.max(1,Math.round(D/2*1.1)),cd:1.1,label:'Arranhão'}];
 if(f.arch==='espinhos'){atk=[{dmg:Math.round(D*.8*1.8),cd:1.8,label:'Golpe'}];block=Math.round(HP*.2);reflect=1+Math.floor(s/3);}
 if(f.arch==='veneno')atk=[{dmg:Math.max(1,Math.round(D*.55)),cd:1,poison:1+Math.floor(s/3),crit:.15,label:'Lâmina envenenada'}];
 if(f.arch==='fogo')atk=[{dmg:Math.max(1,Math.round(D*.5*1.5)),cd:1.5,burn:1+Math.floor(s/2),label:'Bola de fogo'}];
 if(f.arch==='regen'){atk=[{dmg:Math.round(D*.85*2),cd:2,label:'Garras'}];heal=[Math.round(HP*.045),3];}
 if(f.arch==='gelo')atk=[{dmg:Math.round(D*.7*1.6),cd:1.6,frost:1+Math.floor(s/3),label:'Sopro gélido'}];
 if(f.arch==='chefe'){atk=[{dmg:Math.round(18*DIFF.dmg),cd:2.2,burn:3,label:'Chama do Wyrm'},{dmg:Math.round(10*DIFF.dmg),cd:1,label:'Cauda'}];block=40;}
 return {def:f,hp:HP,block,reflect,atk,heal};}
/* ================= FIGHTERS ================= */
function withState(s,fn){const keep=state;state=s;try{return fn();}finally{state=keep;}}
function makePlayer(){const C=CLASSES[state.cls]||CLASSES.warrior,A=affinity();const PM=state.perm||null,dm=1+(PM&&PM.dmgPct||0),pcr=PM&&PM.crit||0;let hp=C.hp+(state.maxHpMod||0)+(PM&&PM.hp||0),block=C.block||0,reflect=0,aegis=0,chill=0;
 const weapons=[],heals=[],trig={start:[],shieldBreak:[],crit5:[],below50:[],souls:[]},initBlk=[];
 const links=supportLinks(),fw=fightingWeapons();
 const healMul=(state.cls==='paladin'?1.5:state.sub==='boticario'?1.4:1)*(A.lv.sagrado===2?1.5:A.lv.sagrado===1?1.25:1);
 for(const it of inWhere('bag')){const d=ITEMS[it.key],m=TM[it.tier-1],pk=pocketsOf(it),arm=d.type==='armor'&&pk.includes('acolch')?1.25:1;
  if(d.type==='weapon'&&fw.includes(it)){const s=weaponStats(it,links);const first=s.cd-(it.y===0?.2:0);
   weapons.push({id:it.id,key:'i'+it.id,label:d.name,icon:it.key,tier:it.tier,dmg:Math.round(s.dmg*dm),cd:s.cd,t:Math.max(.2,first),crit:Math.min(.9,s.crit+pcr),burn:Math.round(s.burn*dm),poison:Math.round(s.poison*dm),frost:s.frost,purge:s.purge,life:s.life,pierce:s.pierce,stun:s.stun,echo:s.echo,fx:s.fx,first:true,supports:links.filter(L=>L.w.id===it.id).map(L=>L.s.id)});}
  if(d.block){const b=Math.round(d.block*m*arm);block+=b;initBlk.push(['i'+it.id,d.name,it.key,b,it.tier]);if(it.tier>=4)aegis+=Math.round(b/2);}
  if(d.hp)hp+=Math.round(d.hp*m*arm*(d.zone==='top'&&zoneOk(it)?1.5:1));
  if(d.type==='armor'&&it.tier>=3)hp+=15;
  if(d.reflect)reflect+=Math.round(d.reflect*m);
  if(d.chill)chill+=it.tier;
  if(d.heal){const grow=d.grows?(it.grow||0):0;const amt=Math.round((d.heal+grow)*m*healMul);heals.push({id:it.id,key:'i'+it.id,label:d.name,icon:it.key,tier:it.tier,amt,cd:d.healCd,t:d.healCd});}
  if(d.trig){const f=it.tier>=4?1.5:1,times=it.tier>=3?2:1;let amt=Math.round((d.burnStart||d.blockTrig||d.shot||d.healTrig||0)*m*f);
   if(d.trig==='souls'){amt=Math.min(30*it.tier,Math.round(d.soulBlk*(it.souls||0)*f));}
   trig[d.trig].push({id:it.id,key:'i'+it.id,label:d.name,icon:it.key,tier:it.tier,amt,times:d.trig==='souls'?1:times});}}
 state.pets.forEach((p,i)=>{if(!p||state.chal==='nopets')return;const P=PETS[p.key],m=TM[p.tier-1]*(p.mul||1),k='p'+i,ic='pet:'+p.key;
  if(P.dmg)weapons.push({pet:i,key:k,label:P.name,icon:ic,dmg:Math.round(P.dmg*m*dm),cd:P.cd,t:P.cd,crit:Math.min(.9,(P.crit||0)+pcr),burn:0,poison:0,frost:0,purge:0,life:0,fx:'peck',first:true,supports:[]});
  if(P.burn)weapons.push({pet:i,key:k,label:P.name,icon:ic,dmg:0,cd:P.cd,t:P.cd,crit:0,burn:Math.round(P.burn*m*dm),poison:0,frost:0,life:0,fx:'fire',first:false,nodmg:1,supports:[]});
  if(P.frost)weapons.push({pet:i,key:k,label:P.name,icon:ic,dmg:0,cd:P.cd,t:P.cd,crit:0,burn:0,poison:0,frost:Math.round(P.frost*m),life:0,fx:'ice',first:false,nodmg:1,supports:[]});
  if(P.block){const b=Math.round(P.block*m);block+=b;initBlk.push([k,P.name,ic,b]);heals.push({pet:i,key:k,label:P.name,icon:ic,amt:Math.round(P.tick*m),cd:P.cd,t:P.cd,shield:1});}
  if(P.heal)heals.push({pet:i,key:k,label:P.name,icon:ic,amt:Math.round(P.heal*m*healMul),cd:P.cd,t:P.cd});});
 if(A.lv.metal)block+=A.lv.metal===2?20:8;if(A.lv.sagrado===2)hp+=15;if(has('sangue'))hp+=15;if(has('pedra'))block+=12;
 if(state.sub==='guardiao'){block=Math.round(block*1.25);reflect+=2;}
 if(PM){if(PM.block>0){block+=PM.block;initBlk.push(['perm','Armadura','shield',PM.block,1]);}if(dm!==1){reflect=Math.round(reflect*dm);for(const t of trig.start)t.amt=Math.round(t.amt*dm);for(const t of trig.crit5)t.amt=Math.round(t.amt*dm);}}
 const sub=state.sub;
 return {side:'p',pdm:dm,name:C.name,hp,max:hp,block,reflect,chill,weapons,heals,trig,initBlk,aegis,burn:0,poison:0,frost:0,bt:1,pt:2,pti:2,ft:3,
  critMult:sub==='assassina'?3:C.critMult,mult:1,firstCrit:state.cls==='rogue',firstStrike:has('primeiro'),cls:state.cls,sub,fury:0,holy:sub==='cruzado'?6:8,crits:0,
  hadBlock:block>0,broke:false,low:false,started:false,mods:[],
  startFrost:A.lv.gelo===2?5:0,poisonTick:A.lv.veneno===2?1.2:A.lv.veneno===1?1.6:2,burnDecay:A.lv.fogo===2?2:1,aff:A};}
function makeFoe(){const S=foeStats(),f=S.def;
 if(f.ghost){const g=state.duel,fake=ghostState(g);const G=withState(fake,makePlayer);G.side='e';G.name=f.name;G.cls=null;G.firstCrit=false;G.trig=null;G.mods=[];G.ghost=1;G.weapons.forEach(w=>{w.id=null;w.pet=null;w.supports=[];});G.heals.forEach(h=>{h.id=null;h.pet=null;});return G;}
 const F={side:'e',name:f.name,hp:S.hp,max:S.hp,block:S.block,reflect:S.reflect,critMult:2,mult:1,burn:0,poison:0,frost:0,bt:1,pt:2,pti:2,ft:3,trig:null,mods:f.mods||[],chill:0,
  weapons:S.atk.map((a,i)=>({key:'a'+i,label:a.label,dmg:a.dmg,cd:a.cd,t:a.cd*.7,burn:a.burn||0,poison:a.poison||0,frost:a.frost||0,purge:0,crit:a.crit||0,life:0,fx:a.burn?'fire':a.frost?'ice':(f.claw?'claw':'slash'),supports:[]})),
  heals:S.heal?[{key:'regen',label:'Regeneração',amt:S.heal[0],cd:S.heal[1],t:S.heal[1]}]:[]};
 if(F.mods.includes('casca'))F.block+=Math.round(F.max*.3);
 return F;}
function ghostState(g){const s=fresh();s.cls=g.c;s.bag={cols:g.b[0],rows:g.b[1],pockets:g.b[2]||{}};s.items=g.i.map((a,ix)=>({id:1000+ix,key:a[0],tier:a[1],x:a[2],y:a[3],w:a[4],h:a[5],where:'bag'}));
 s.pets=[0,1,2].map(i=>g.p&&g.p[i]?{key:g.p[i][0],tier:g.p[i][1]}:null);s.sub=g.s||null;s.bless=g.bl||[];s.wins=9;s.bagLvl=g.lv||0;return s;}
function dps(F){return F.weapons.reduce((s,w)=>s+(w.dmg*(1+w.crit*(F.critMult-1))*(1+(w.echo||0))+(w.burn+w.poison)*1.5+(w.frost||0))/w.cd,0);}

/* ================= SIMULATION + per-item stats + log ================= */
function newBattle(){const f=foeDef();const b={t:0,p:makePlayer(),e:makeFoe(),ev:[],done:null,fat:0,rng:battleSeed(state),ft:state.chal==='fat12'?12:25,stats:{},es:{},log:[],blocked:0,combust:0,
  reinforced:false,foeArt:f.img||('e_'+f.art)};
 b.ft0=b.ft;
 for(const [k,l,ic,v,t] of b.p.initBlk)stat(b,k,l,ic,'blk',v,t);
 b.e.pti=b.p.poisonTick;b.e.bdi=b.p.burnDecay;if(b.p.sub==='pirotecnico')b.e.noDecay=true;
 if(b.p.startFrost){b.e.frost+=b.p.startFrost;stat(b,'aff','Afinidade de Gelo','flake','frost',b.p.startFrost);}
 if(b.e.mods.includes('toxina'))b.p.poison+=3;
 lg(b,`Início: ${b.p.name} ${b.p.hp} de vida e ${b.p.block} de escudo contra ${b.e.name} ${b.e.hp} de vida e ${b.e.block} de escudo.`);
 if(b.e.mods.length)lg(b,'Modificadores: '+b.e.mods.map(m=>MODS[m].name).join(', '));
 return b;}
function stat(b,key,label,icon,kind,n,tier){if(!(n>0))return;const s=b.stats[key]||(b.stats[key]={label,icon,tier:tier||1,dmg:0,blk:0,heal:0,act:0,crit:0,burn:0,poison:0,frost:0,purge:0});s[kind]=(s[kind]||0)+n;}
function estat(b,key,label,kind,n){if(!(n>0))return;const s=b.es[key]||(b.es[key]={label,dmg:0,blk:0,heal:0,act:0,crit:0,burn:0,poison:0,frost:0,purge:0});s[kind]=(s[kind]||0)+n;}
function rec(b,side,key,label,icon,kind,n,tier){if(side==='p')stat(b,key,label,icon,kind,n,tier);else estat(b,key,label,kind,n);}
function lg(b,txt){if(b.log.length<700)b.log.push(b.t.toFixed(1).padStart(5,' ')+'s  '+txt);}
function hurt(b,F,n,useBlock){let bl=0;if(useBlock&&F.block>0){bl=Math.min(F.block,n);F.block-=bl;n-=bl;}F.hp-=n;if(F.side==='p'&&b)b.blocked+=bl;return n+bl;}
function strike(b,a,d,w,A,D){let n=w.dmg*A.mult*(w.first&&A.firstStrike?2:1);const crit=(w.first&&A.firstCrit)||BR(b)<w.crit;w.first=false;if(crit)n*=A.critMult;n=Math.round(n);
 const dealt=hurt(b,D,n,!w.pierce);const key=w.key||'x';
 rec(b,a,key,w.label,w.icon,'dmg',dealt,w.tier);rec(b,a,key,w.label,w.icon,'act',1,w.tier);if(crit)rec(b,a,key,w.label,w.icon,'crit',1,w.tier);
 lg(b,`${a==='p'?'':'⟵ '}${w.label||A.name}: ${n}${crit?' CRÍTICO':''}${w.pierce?' (perfura)':''}`);
 b.ev.push({k:'atk',s:a,fx:w.fx,crit,id:w.id,pet:w.pet,sup:w.supports});b.ev.push({k:'num',s:d,c:crit?'crit':'dmg',v:(crit?'CRIT! ':'')+'-'+n});
 if(w.burn){D.burn+=w.burn;rec(b,a,key,w.label,w.icon,'burn',w.burn,w.tier);}
 let pz=w.poison+(A.mods.includes('toxina')&&w.poison?1:0);if(crit&&A.sub==='envenenadora')pz+=2;if(pz){D.poison+=pz;rec(b,a,key,w.label,w.icon,'poison',pz,w.tier);}
 let fr=w.frost||0;if(A.mods.includes('gelo'))fr+=1;if(fr){D.frost=Math.min(25,D.frost+fr);rec(b,a,key,w.label,w.icon,'frost',fr,w.tier);}
 if(w.purge){const pb=Math.min(D.block,6*w.purge);D.block-=pb;D.noRef=2;D.purged=3;rec(b,a,key,w.label,w.icon,'purge',1,w.tier);if(pb||D.reflect||D.heals.length)b.ev.push({k:'num',s:d,c:'blk',v:'Purga'});}
 if(w.life){const g=Math.min(Math.round(n*w.life),A.max-A.hp);if(g>0){A.hp+=g;rec(b,a,key,w.label,w.icon,'heal',g,w.tier);b.ev.push({k:'num',s:a,c:'heal',v:'+'+g});}}
 if(w.stun&&BR(b)<w.stun){D.weapons.forEach(x=>x.t+=0.8);b.ev.push({k:'num',s:d,c:'blk',v:'Atordoado'});lg(b,`${D.name} atordoado`);}
 if(!(D.noRef>0)){let r=D.reflect;if(D.mods.includes('reflexo'))r+=Math.round(dealt*.25);
  if(r>0){hurt(b,A,r,false);rec(b,d,'reflect','Reflexo','thorns','dmg',r);b.ev.push({k:'num',s:a,c:'burn',v:'-'+r});}}
 if(D.chill){A.frost=Math.min(25,A.frost+D.chill);rec(b,d,'chill','Couraça de Gelo','frostmail','frost',D.chill);}
 if(crit&&a==='p'&&A.trig){A.crits++;if(A.crits%5===0)for(const t of A.trig.crit5){for(let r=0;r<t.times;r++){D.hp-=t.amt;stat(b,t.key,t.label,t.icon,'dmg',t.amt,t.tier);stat(b,t.key,t.label,t.icon,'act',1,t.tier);}b.ev.push({k:'banner',s:'e',v:'Olho do Falcão -'+t.amt*t.times});b.ev.push({k:'trig',id:t.id});lg(b,`Olho do Falcão: ${t.amt*t.times} (gatilho, não gera novos gatilhos)`);}}
 return crit;}
/* COM-05: a trigger fires its own effect (possibly 2× when awakened) but never re-triggers other triggers */
function fireTrig(b,list,fn){for(const t of list){for(let r=0;r<t.times;r++){fn(t);stat(b,t.key,t.label,t.icon,'act',1,t.tier);}b.ev.push({k:'trig',id:t.id});}}
const spdOf=F=>{let s=1/(1+.02*F.frost);if(F.mods.includes('furia')&&F.hp<F.max/2)s*=1.4;return s;};
function step(b,dt){const P=b.p,E=b.e;b.t+=dt;
 if(!P.started){P.started=true;fireTrig(b,P.trig.start,t=>{E.burn+=t.amt;stat(b,t.key,t.label,t.icon,'burn',t.amt,t.tier);b.ev.push({k:'num',s:'e',c:'burn',v:'+'+t.amt+' queima'});lg(b,`${t.label}: +${t.amt} de queimadura`);});
  fireTrig(b,P.trig.souls.filter(t=>t.amt>0),t=>{P.block+=t.amt;stat(b,t.key,t.label,t.icon,'blk',t.amt,t.tier);b.ev.push({k:'num',s:'p',c:'blk',v:'+'+t.amt+' almas'});lg(b,`${t.label}: +${t.amt} de escudo`);});}
 if(E.mods.includes('reforco')&&!b.reinforced&&b.t>=8){b.reinforced=true;const add=Math.round(E.max*.25);E.max+=add;E.hp+=add;const w0=E.weapons[0];E.weapons.push({key:'a9',label:'Reforço',dmg:Math.max(1,Math.round(w0.dmg*.35)),cd:.9,t:.9,burn:0,poison:0,frost:0,purge:0,crit:0,life:0,fx:'slash',supports:[]});b.ev.push({k:'banner',s:'e',v:'REFORÇO!'});lg(b,'Reforço chegou: +'+add+' de vida e um ataque rápido');}
 for(const [a,d] of [['p','e'],['e','p']]){const A=b[a],D=b[d];const sp=spdOf(A);
  if(A.noRef>0)A.noRef-=dt;if(A.purged>0)A.purged-=dt;
  for(const w of A.weapons){w.t-=dt*sp;if(w.t>0)continue;w.t+=w.cd;
   if(w.nodmg){if(w.burn){D.burn+=w.burn;rec(b,a,w.key,w.label,w.icon,'burn',w.burn,w.tier);b.ev.push({k:'num',s:d,c:'burn',v:'+'+w.burn+' queima'});}
    if(w.frost){D.frost=Math.min(25,D.frost+w.frost);rec(b,a,w.key,w.label,w.icon,'frost',w.frost,w.tier);b.ev.push({k:'num',s:d,c:'blk',v:'+'+w.frost+' gelo'});}
    rec(b,a,w.key,w.label,w.icon,'act',1,w.tier);b.ev.push({k:'atk',s:a,fx:w.fx,pet:w.pet});continue;}
   strike(b,a,d,w,A,D);if(w.echo&&BR(b)<w.echo){strike(b,a,d,w,A,D);b.ev.push({k:'num',s:a,c:'blk',v:'Eco!'});}}
  for(const h of A.heals){h.t-=dt;if(h.t>0)continue;h.t+=h.cd;rec(b,a,h.key||'regen',h.label,h.icon,'act',1,h.tier);
   if(h.shield){A.block+=h.amt;rec(b,a,h.key,h.label,h.icon,'blk',h.amt,h.tier);b.ev.push({k:'num',s:a,c:'blk',v:'+'+h.amt+' escudo'});}
   else{let amt=h.amt;if(A.mods.includes('regen2')&&A.hp<A.max/2)amt*=2;if(A.purged>0)amt=Math.round(amt/2);const g=Math.min(amt,A.max-A.hp);A.hp+=g;rec(b,a,h.key||'regen',h.label,h.icon,'heal',g,h.tier);if(g>0){b.ev.push({k:'num',s:a,c:'heal',v:'+'+g});lg(b,`${a==='p'?'':'⟵ '}${h.label}: cura ${g}`);}
    if(a==='p'&&A.cls==='alchemist'&&h.id!=null){const dm=A.sub==='demolidor';const n=Math.max(1,Math.round(amt*(dm?1:.6)*(A.pdm||1)));hurt(b,D,n,false);if(dm){D.burn+=2;}else D.poison+=1;stat(b,'skill','Mistura Volátil','drop','dmg',n);stat(b,'skill','Mistura Volátil','drop','act',1);b.ev.push({k:'num',s:d,c:'psn',v:'-'+n+' mistura'});b.ev.push({k:'mix'});}}
   b.ev.push({k:'fire',id:h.id,pet:h.pet,s:a});}
  A.bt-=dt;if(A.bt<=0){A.bt+=1;if(A.burn>0){const n=A.mods.includes('escamas')?Math.ceil(A.burn/2):A.burn;hurt(b,A,n,false);rec(b,d,'burn','Queimadura','flame','dmg',n);b.ev.push({k:'num',s:a,c:'burn',v:'-'+n});lg(b,`Queimadura em ${A.name}: ${n}`);
    if(!A.noDecay){A.bd=(A.bd||0)+1;if(A.bd>=(A.bdi||1)){A.bd=0;A.burn-=1;}}}}
  A.pt-=dt;if(A.pt<=0){A.pt+=A.pti||2;if(A.poison>0){hurt(b,A,A.poison,false);rec(b,d,'poison','Veneno','drop','dmg',A.poison);b.ev.push({k:'num',s:a,c:'psn',v:'-'+A.poison});lg(b,`Veneno em ${A.name}: ${A.poison}`);}}}
 if(P.block>0)P.hadBlock=true;
 if(P.hadBlock&&P.block<=0&&!P.broke){P.broke=true;
  fireTrig(b,P.trig.shieldBreak,t=>{P.block+=t.amt;stat(b,t.key,t.label,t.icon,'blk',t.amt,t.tier);b.ev.push({k:'banner',s:'p',v:'Coração de Pedra +'+t.amt});lg(b,`Coração de Pedra: +${t.amt} de escudo`);});
  if(P.aegis>0){P.block+=P.aegis;stat(b,'aegis','Égide','shield','blk',P.aegis);b.ev.push({k:'banner',s:'p',v:'ÉGIDE +'+P.aegis});lg(b,'Égide: +'+P.aegis+' de escudo');}}
 const furyAt=P.sub==='berserker'?.7:.5;
 if(!P.low&&P.hp<P.max*furyAt&&P.hp>0&&P.cls==='warrior'){P.fury=P.sub==='berserker'?8:6;P.mult=P.sub==='berserker'?1.8:1.6;P.low=true;stat(b,'skill','Fúria','sword','act',1);b.ev.push({k:'banner',s:'p',v:'FÚRIA!'});lg(b,'Fúria!');}
 if(!P.lowT&&P.hp<P.max/2&&P.hp>0){P.lowT=true;
  fireTrig(b,P.trig.below50,t=>{const g=Math.min(t.amt,P.max-P.hp);P.hp+=g;stat(b,t.key,t.label,t.icon,'heal',g,t.tier);b.ev.push({k:'banner',s:'p',v:'Fênix +'+g});b.ev.push({k:'holy',s:'p'});lg(b,'Fênix: cura '+g);});}
 if(P.fury>0){P.fury-=dt;if(P.fury<=0)P.mult=1;}
 const cth=P.sub==='cinzeiro'?7:10;
 if(P.cls==='pyro'&&E.burn>=cth){const n=Math.round((24+state.round)*(P.sub==='cinzeiro'?1.5:1)*(P.pdm||1));E.hp-=n;b.combust++;stat(b,'skill','Combustão','flame','dmg',n);stat(b,'skill','Combustão','flame','act',1);E.burn=Math.floor(E.burn/2);b.ev.push({k:'banner',s:'e',v:'COMBUSTÃO! -'+n});b.ev.push({k:'boom',s:'e'});lg(b,'Combustão: '+n);}
 if(P.cls==='paladin'){P.holy-=dt;if(P.holy<=0){const cr=P.sub==='cruzado';P.holy+=cr?6:8;const amt=cr?7:5;const g=Math.min(amt,P.max-P.hp);P.hp+=g;P.block+=amt;stat(b,'skill','Luz Sagrada','shield','heal',g);stat(b,'skill','Luz Sagrada','shield','blk',amt);stat(b,'skill','Luz Sagrada','shield','act',1);b.ev.push({k:'banner',s:'p',v:'LUZ SAGRADA'});b.ev.push({k:'holy',s:'p'});lg(b,`Luz Sagrada: +${g} vida, +${amt} escudo`);}}
 if(b.t>b.ft){if(b.ft===b.ft0){b.ev.push({k:'banner',s:'p',v:'FADIGA'});lg(b,'Fadiga começou: dano crescente nos dois lados');}b.ft+=1;b.fat+=1;hurt(b,P,b.fat,false);hurt(b,E,b.fat,false);}
 if(E.hp<=0){b.done='win';lg(b,`${E.name} caiu.`);}else if(P.hp<=0){b.done='lose';lg(b,`${P.name} caiu.`);}}
/* ================= REPRODUÇÃO E VALIDAÇÃO (placar do Diário e fantasmas) ================= */
/* retrato de tudo o que decide uma luta, tirado logo antes dela */
function snapOf(s){s=s||state;return {c:s.cls,sub:s.sub||null,bl:(s.bless||[]).slice(),b:[s.bag.cols,s.bag.rows,Object.assign({},s.bag.pockets)],lv:s.bagLvl||0,
 i:s.items.filter(i=>i.where==='bag').map(i=>[i.key,i.tier,i.x,i.y,i.w,i.h,i.souls||0,i.grow||0]),p:s.pets.map(p=>p?[p.key,p.tier]:0),
 hm:s.maxHpMod||0,w:s.wins,r:s.round,a:s.asc||0,ch:s.chal||null,sv:s.surv?1:0,sl:s.stopLosses||0,sr:s.surv&&s.wins>=GOAL?(s.survRoute[s.wins-GOAL]||null):null};}
/* rota e elites que a seed sorteia ao começar (mesma ordem de sorteios de pickClass) */
function seedRoute(seed,asc){const s=fresh();s.seed=seed;s.rng=hashStr(seed)||1;s.asc=asc||0;
 return withState(s,()=>{s.route=STOPS.map(st=>Math.floor(R()*st.v.length));rollElites();return {route:s.route,elites:s.elites};});}
function stateFromSnap(seed,k,rt){const s=fresh();s.seed=seed;s.cls=k.c;s.sub=k.sub||null;s.bless=(k.bl||[]).slice();
 s.bag={cols:k.b[0],rows:k.b[1],pockets:Object.assign({},k.b[2]||{})};s.bagLvl=k.lv||0;
 s.items=k.i.map((a,ix)=>({id:ix+1,key:a[0],tier:a[1],x:a[2],y:a[3],w:a[4],h:a[5],souls:a[6]||0,grow:a[7]||0,where:'bag'}));
 s.pets=[0,1,2].map(i=>k.p&&k.p[i]?{key:k.p[i][0],tier:k.p[i][1]}:null);
 s.maxHpMod=k.hm||0;s.wins=k.w;s.round=k.r;s.asc=k.a||0;s.chal=k.ch||null;s.stopLosses=k.sl||0;s.route=rt.route;s.elites=rt.elites;
 if(k.sv){s.surv=true;s.survRoute=[];s.survRoute[k.w-GOAL]=k.sr;}return s;}
/* roda uma luta inteira sem tela, com o mesmo passo fixo do jogo (0,05 s) */
function simulate(s){return withState(s,()=>{const b=newBattle();let g=0;while(!b.done&&g++<20000)step(b,.05);return {res:b.done||'lose',t:Math.round(b.t*10)/10};});}
const MAXFIGHTS=40;
/* custo em ouro de um item: cada raridade pede dois do nível anterior */
const itemCost=(price,tier)=>price*Math.pow(2,tier-1);
/* teto generoso do valor que cabe na mochila antes da luta da rodada r. Ouro: 10 iniciais + por rodada no máximo
   renda (8 + rodada), juros (8), prêmio (2), consolo (2) e itens de ouro (10); eventos (Etiqueta, Andarilho, subclasse, Fada) só depois da 1ª luta.
   Item em promoção custa metade, então o valor pode chegar a 2× o ouro. Somam-se o kit inicial (25) e até 5 melhorias grátis
   (Salamandra, Altar, Tesouro: 40 cada), liberadas uma por rodada. Barra mochilas impossíveis; não prova cada compra. */
function goldCap(r){let g=10;for(let j=1;j<r;j++)g+=8+Math.min(j,8)+8+2+2+10;if(r>1)g+=8+10+6+9;return 2*g+25+40*Math.min(Math.max(0,r-1),5);}
function buildPlausible(k){const bad=m=>({ok:false,why:m});
 if(!k||!Array.isArray(k.i)||!Array.isArray(k.b))return bad('formato');
 const C=CLASSES[k.c];if(!C)return bad('classe');
 if(!(k.w>=0&&k.w<=SURV_GOAL&&k.r>=k.w+1&&k.r<=MAXFIGHTS+1))return bad('rodada');
 if(k.sub&&(!(SUBS[k.c]||[]).some(x=>x.id===k.sub)||k.w<4))return bad('subclasse');
 const bl=k.bl||[];if(!Array.isArray(bl)||bl.some(x=>!BLESS[x])||new Set(bl).size!==bl.length)return bad('bênção');
 const elites=STOPS.map((st,ix)=>ix).filter(ix=>STOPS[ix].elite||((k.a||0)>=1&&ix===7));
 if(bl.length>elites.filter(ix=>ix<Math.min(k.w,GOAL)).length)return bad('bênçãos demais');
 const lv=k.lv||0,base=k.ch==='small'?[4,4]:C.bag;if(!(lv>=0&&lv<=MAXEXP))return bad('ampliações');
 if(k.b[0]>MAXCOLS||k.b[1]>MAXROWS||k.b[0]<base[0]||k.b[1]<base[1]||k.b[0]+k.b[1]-base[0]-base[1]!==lv)return bad('mochila');
 const g=[];for(let y=0;y<k.b[1];y++)g.push(new Array(k.b[0]).fill(0));let cost=0;
 for(const a of k.i){const d=ITEMS[a[0]];if(!d||!(a[1]>=1&&a[1]<=4))return bad('item');
  if(!((a[4]===d.w&&a[5]===d.h)||(a[4]===d.h&&a[5]===d.w)))return bad('formato do item');
  if(!(a[2]>=0&&a[3]>=0&&a[2]+a[4]<=k.b[0]&&a[3]+a[5]<=k.b[1]))return bad('fora da mochila');
  for(let y=a[3];y<a[3]+a[5];y++)for(let x=a[2];x<a[2]+a[4];x++){if(g[y][x])return bad('itens sobrepostos');g[y][x]=1;}
  if((a[6]||0)>k.w||(a[7]||0)>8)return bad('contadores');
  cost+=itemCost(d.price,a[1]);}
 const pets=k.p||[];if(pets.length>3)return bad('companheiros');
 for(const p of pets){if(!p)continue;if(!PETS[p[0]]||!(p[1]>=1&&p[1]<=4))return bad('companheiro');cost+=itemCost(PETS[p[0]].price,p[1]);}
 if(cost>goldCap(k.r))return bad('mochila cara demais para a rodada');
 return {ok:true,cost};}
/* confere um registro do placar: refaz cada luta da prova e recalcula a pontuação */
function verifyDaily(e,dayIx){const bad=m=>({ok:false,why:m});
 if(!e||e.v!==2||!Array.isArray(e.pf)||!e.pf.length||e.pf.length>MAXFIGHTS)return bad('sem prova');
 const d=dayStr(dayIx);if(e.d!==d)return bad('dia');const cls=dailyClass(dayIx);if(e.cls!==cls)return bad('classe do dia');
 const seed='D'+d,rt=seedRoute(seed,0);
 let wins=0,lives=LIVES,survLives=3,surv=false,sl=0,prevR=0;
 for(let i=0;i<e.pf.length;i++){const f=e.pf[i],k=f&&f.k;if(!k)return bad('luta '+(i+1));
  if(k.c!==cls||k.a||k.ch)return bad('modo');
  if(k.sv&&!surv){if(wins<GOAL)return bad('Norte antes da hora');surv=true;prevR++;}
  if(!!k.sv!==surv)return bad('Norte');
  if(k.r!==prevR+1||k.w!==wins||(k.sl||0)!==sl)return bad('sequência das lutas');
  if(surv){const sr=k.sr;if(!sr||!(sr.s>=5&&sr.s<=8)||!(sr.v>=0&&sr.v<=2))return bad('rota do Norte');}
  const p=buildPlausible(k);if(!p.ok)return bad(p.why);
  const out=simulate(stateFromSnap(seed,k,rt));if(out.res!==f.res)return bad('resultado não confere');
  prevR=k.r;
  if(out.res==='win'){wins++;sl=0;}else{sl++;if(surv)survLives--;else lives--;}
  const over=surv?(wins>=SURV_GOAL||survLives<=0):(wins>=GOAL||lives<=0);
  if(over&&i<e.pf.length-1&&!(wins>=GOAL&&!surv&&e.pf[i+1].k&&e.pf[i+1].k.sv))return bad('lutas depois do fim');
  if(i===e.pf.length-1&&!over)return bad('partida não terminou');}
 const won=wins>=GOAL,sc=Math.round(wins*100+(won?250:0)+(surv?(wins-GOAL)*150:0)+(surv?survLives:lives)*25);
 if(e.s!==sc||e.w!==wins)return bad('pontuação não confere');
 return {ok:true,score:sc};}
/* fantasma: a mochila precisa caber nas regras do jogo para uma jornada completa */
function ghostPlausible(o,asc){if(!o)return {ok:false,why:'código'};
 return buildPlausible({c:o.c,sub:o.s||null,bl:o.bl||[],b:o.b,lv:o.lv||0,i:o.i,p:o.p||[],w:GOAL,r:GOAL+LIVES,a:asc||0,ch:null});}
window.AlforjeSim={setState(s){state=s;return s;},getState(){return state;},setDiff(h,d){DIFF={hp:h,dmg:d};},
 dayStr,dailyClass,battleSeed,BR,snapOf,seedRoute,stateFromSnap,simulate,goldCap,buildPlausible,verifyDaily,ghostPlausible,MAXFIGHTS,hashStr,R,pick,rpick,rshuffle,todayStr,dayIndex,fresh,has,bagDims,chestCols,dims,inWhere,isWeapon,tagsOf,hasTag,occ,canPlace,itemAt,findSpot,K,cellsOf,pocketsOf,patOf,starCells,touches,zoneOk,orthoNeighbors,resonance,fightingWeapons,SUPKEYS,supportLinks,affinity,itemWeight,weightInfo,weaponStats,stopIx,isEliteStop,rollElites,foeDef,foeStats,withState,makePlayer,makeFoe,ghostState,dps,newBattle,stat,estat,rec,lg,hurt,strike,fireTrig,spdOf,step};
})();
