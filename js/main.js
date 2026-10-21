(function(){
'use strict';
const {TAGS,TAGKEYS,ITEMS,RECIPES,SHOPKEYS,PATNAME,PETS,PETKEYS,PET_CHARGES,TM,TP,TIERS,AWK,tierVar,CLASSES,CLASSKEYS,SUBS,SUBOF,POCKETS,POCKETKEYS,ARCH,MODS,MODPOOL,STOPS,BAGCOST,MAXEXP,MAXCOLS,MAXROWS,CHEST_ROWS,GOAL,SURV_GOAL,LIVES,BLESS,ETIQ,ETIQKEYS,EVENTS,CHALLENGES,ACH,STORY,MERCH}=window.AlforjeData;
const SIM=window.AlforjeSim;
const {hashStr,R,pick,rpick,rshuffle,todayStr,dayIndex,fresh,has,bagDims,chestCols,dims,inWhere,isWeapon,tagsOf,hasTag,occ,canPlace,itemAt,findSpot,K,cellsOf,pocketsOf,patOf,starCells,touches,zoneOk,orthoNeighbors,resonance,fightingWeapons,SUPKEYS,supportLinks,affinity,itemWeight,weightInfo,weaponStats,stopIx,isEliteStop,rollElites,foeDef,foeStats,withState,makePlayer,makeFoe,ghostState,dps,newBattle,stat,estat,rec,lg,hurt,strike,fireTrig,spdOf,step,dayStr,dailyClass,snapOf,verifyDaily,ghostPlausible,MAXFIGHTS}=SIM;
const DIM={"bomb":[137, 160],"acidflask":[96, 160],"frostflask":[112, 160],"alembic":[160, 160],"philostone":[127, 160],"mortar":[151, 160],"smoke":[107, 160],"mandrake":[104, 160],"acidflask":[111, 132],"frostflask":[111, 132],"bomb":[128, 128],"philostone":[128, 128],"mortar":[128, 128],"greatsword":[120, 114],"warhammer":[120, 114],"buckler":[83, 81],"plate":[117, 114],"spikemirror":[122, 114],"scarab":[76, 87],"rebelelixir":[76, 85],"spear_1":[38,160],"spear_2":[62,160],"spear_3":[98,160],"spear_4":[140,147],"hammer_1":[105,160],"hammer_2":[150,160],"hammer_3":[150,145],"hammer_4":[144,158],"whet_1":[157,140],"whet_2":[160,136],"whet_3":[160,122],"whet_4":[160,101],"clover_1":[116,131],"clover_2":[160,140],"clover_3":[160,133],"clover_4":[160,55],"torch_1":[127,154],"torch_2":[128,154],"torch_3":[160,132],"torch_4":[128,127],"venom_1":[111,132],"venom_2":[140,147],"venom_3":[160,138],"venom_4":[160,102],"ring_1":[115,110],"ring_2":[149,151],"ring_3":[160,78],"ring_4":[160,70],"sword":[56,160],"dagger":[133,140],"axe":[157,160],"bow":[90,160],"staff":[45,160],"shield":[125,140],"helm":[126,160],"thorns":[97,110],"potion":[126,140],"feather":[160,160],"purse":[147,152],"mirror":[94,160],"chain":[160,160],"boots":[160,153],"banner":[120,160],"scroll":[152,160],"stoneheart":[160,151],"eye":[130,160],"phoenix":[75,160],"heroblade":[112,160],"infernal":[50,160],"elixir":[86,114],"bastion":[140,160],"viper":[152,160],"galebow":[90,160],"h_warrior":[241,177],"h_rogue":[136,153],"h_paladin":[247,225],"h_pyro":[238,209],"p_salamander":[140,59],"p_raven":[81,76],"p_turtle":[102,70],"p_pixie":[79,65],"e_werewolf":[247,260],"e_merc":[202,260],"e_lavasal":[251,260],"e_skarcher":[224,260],"e_witch":[235,260],"e_troll":[211,260],"e_spider":[260,193],"e_reaper":[161,260],"e_ashmage":[211,260],"e_wyrm":[340,197],"e_gargoyle":[203,260],"e_goblin":[237,260],"e_rat":[260,221],"e_bandit":[216,260],"e_fknight":[250,260],"e_frog":[260,240],"e_boar":[260,205],"e_wolf":[260,190],"e_lich":[212,260],"merchant":[220,147],"shopscene":[900,172],"strip_cellar":[1296,56],"strip_forest":[1296,56],"strip_swamp":[1296,56],"strip_crypt":[1296,56],"strip_volcano":[1296,56],"bg_road":[960,407],"bg_night":[960,407],"bg_castle":[960,407],"iceaxe":[157,160],"icestaff":[45,160],"firedagger":[133,140],"pestspear":[38,160],"flail":[105,160],"frostmail":[97,110],"holyshield":[125,140],"frostgem":[115,110],"holywater":[126,140],"idolfire":[120,160],"idolfrost":[120,160],"idolmetal":[120,160],"idolnature":[120,160],"belt":[160,160],"piggy":[147,152],"ledger":[130,160],"vetring":[149,151],"acorn":[116,131],"soulgem":[160,151],"glacier":[112,160],"judgehammer":[144,158],"p_owl":[81,76],"e_icewolf":[260,190],"e_shaman":[237,260],"e_darkknight":[250,260],"e_icetroll":[211,260],"e_plaguewitch":[235,260],"e_obsidian":[203,260],"dualgrip":[160,140]};

const TIERED=new Set(['spear','hammer','whet','clover','torch','venom','ring']);
const artFile=(key,tier)=>TIERED.has(key)?`${key}_${tier||1}`:key;
const artURL=(key,tier)=>'a/'+artFile(key,tier)+'.webp';
const artDim=(key,tier)=>DIM[artFile(key,tier)]||[64,64];
const IMGS={};
function img(name){if(IMGS[name])return IMGS[name];const i=new Image();i.decoding='async';i.src='a/'+name+'.webp';return IMGS[name]=i;}
const WHITE={};
function whiteOf(name){if(WHITE[name])return WHITE[name];const i=img(name);if(!i.complete||!i.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);return WHITE[name]=c;}
/* small pixel icons (coins, hearts, status) stay as letter-matrix sprites */
const PAL={k:'#1b1420',s:'#8a96a6',S:'#d8e0e6',g:'#e0a83a',y:'#ffe27a',o:'#ee8a2a',r:'#a8302a',R:'#e85a48',v:'#8ad04a',V:'#3f8a2a',b:'#3f6fc6',B:'#9cd2f2'};
const SPR={
heart:[".RR.RR.","RRRRRRR","RRRRRRR",".RRRRR.","..RRR..","...R..."],
coin:[".yyyy.","yyggoy","ygggoy","yggoog",".gggg."],
trophy:["gggggg","gyyggg","gyggog",".gggg.","..gg..",".gggg."],
lockic:[".gggg.","g....g","g....g","gggggg","gyyggg","gggggg"],
flame:[".o...",".oo..","oyo.o","oyyoo","oyyyo",".ooo."],
drop:["..v..",".vv..",".vvv.","vvVvv","vvvvv",".vvv."],
shld:["bbbbb","bBBBb","bBBBb",".bBb.",".bBb.","..b.."]
};
const DIG={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111']};
function hexRGB(h){const n=parseInt(h.slice(1),16);return [n>>16,(n>>8)&255,n&255];}
function shade(h,f){const [r,g,b]=hexRGB(h);const c=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return 'rgb('+c(r)+','+c(g)+','+c(b)+')';}
const cvCache={},urlCache={};
function sprCanvas(name){if(cvCache[name])return cvCache[name];const rows=SPR[name],h=rows.length,w=Math.max(...rows.map(r=>r.length));
 const at=(x,y)=>{if(y<0||y>=h||x<0)return null;const ch=rows[y][x];return !ch||ch==='.'?null:PAL[ch]||null;};
 const c=document.createElement('canvas');c.width=w+2;c.height=h+2;const x=c.getContext('2d');
 for(let y=-1;y<=h;y++)for(let i=-1;i<=w;i++){const col=at(i,y);
  if(col){let f=1;if(!at(i,y-1))f=1.22;else if(!at(i,y+1))f=.74;x.fillStyle=shade(col,f);x.fillRect(i+1,y+1,1,1);}
  else if(at(i-1,y)||at(i+1,y)||at(i,y-1)||at(i,y+1)){x.fillStyle='#0e0a12';x.fillRect(i+1,y+1,1,1);}}
 return cvCache[name]=c;}
function spr(name){return urlCache[name]||(urlCache[name]=sprCanvas(name).toDataURL());}

SPR.flake=["..B..","B.B.B",".BBB.","BBBBB",".BBB.","B.B.B","..B.."];
SPR.star=["..y..",".yyy.","yyyyy",".yyy.","..y.."];



/* ================= PROFILE (codex, ascension, history, achievements) ================= */
const RUNKEY='alforje-run6',PROFKEY='alforje-prof6',VER='7.0';
function freshProf(){return {ver:'',tut:0,best:0,totalWins:0,journeys:0,classWins:{},asc:{},sticker:{},history:[],ach:{},chalDone:{},daily:{},bestSurv:0,codex:{items:{},foes:{},recipes:{}},speed:1,shopMin:0,noAsk:0,miss:null,seals:0,skin:'couro'};}
let PROF=freshProf();
function loadProf(){try{const p=JSON.parse(localStorage.getItem(PROFKEY));if(p&&p.codex)PROF=Object.assign(freshProf(),p);}catch(e){}
 try{const old=+localStorage.getItem('alforje-best')||0;if(old>PROF.best)PROF.best=old;}catch(e){}}
function saveProf(){try{localStorage.setItem(PROFKEY,JSON.stringify(PROF));}catch(e){}markDirty();}
loadProf();
const counts=()=>state&&state.mode!=='seed';
function cx(key){return PROF.codex.items[key]||(PROF.codex.items[key]={seen:0,bought:0,merged:0,forged:0,wins:0});}
function codexSee(key){if(!counts()||!ITEMS[key])return;cx(key).seen++;}
function codexAdd(key,f,n){if(!counts()||!ITEMS[key])return;cx(key)[f]+=n||1;}
function codexFoe(art,beat){if(!counts())return;const f=PROF.codex.foes[art]||(PROF.codex.foes[art]={met:0,beat:0});if(beat)f.beat++;else f.met++;}
const paladinOpen=()=>PROF.best>=5||PROF.totalWins>=10;
const alchOpen=()=>PROF.journeys>=1||PROF.totalWins>=20;
function classOpen(k){return k==='paladin'?paladinOpen():k==='alchemist'?alchOpen():true;}
function ascMax(cls){return PROF.asc[cls]||0;}
let speed=1;try{speed=+localStorage.getItem('alforje-speed')||1;}catch(e){}
let muted=false;try{muted=localStorage.getItem('alforje-mute')==='1';}catch(e){}

/* ================= STATE ================= */
let state=null,B=null,CS=56;
/* toda troca do estado da partida passa por aqui, para o módulo de simulação enxergar o mesmo objeto */
function setState(s){state=s;SIM.setState(s);return s;}
function save(){try{if(state.phase!=='battle'){localStorage.setItem(RUNKEY,JSON.stringify(state));markDirty();}}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem(RUNKEY));if(s&&s.items&&s.bag)return s;}catch(e){}return null;}

const $=s=>document.querySelector(s);
function maxCols(s){s=s||state;const narrow=typeof window!=='undefined'&&window.innerWidth<400;return narrow?Math.max(6,Math.min(MAXCOLS,s.bag.cols)):MAXCOLS;}/* plano mobile: até 6 colunas em telas estreitas */
function canExpand(s){s=s||state;return s.chal!=='small'&&s.bagLvl<MAXEXP&&(s.bag.cols<maxCols(s)||s.bag.rows<MAXROWS);}
window.AlforjeData.hooks.canExpand=canExpand;
const priceMul=()=>state&&state.asc>=7?1.1:1;
const basePrice=(key,tier,pet)=>Math.round((pet?PETS[key].price:ITEMS[key].price)*TP[tier-1]*priceMul());
const sellPrice=(key,tier,pet)=>Math.max(1,Math.floor(basePrice(key,tier,pet)/2));
const offerPrice=o=>o.sale?sellPrice(o.key,o.tier,o.pet):basePrice(o.key,o.tier,o.pet);
const price=basePrice;

function relations(it,links){links=links||supportLinks();const out=[];
 for(const L of links){if(L.s.id===it.id)out.push({o:L.w,kind:'syn'});else if(L.w.id===it.id)out.push({o:L.s,kind:'syn'});
  else if(L.m&&L.m.id===it.id){out.push({o:L.s,kind:'syn'});out.push({o:L.w,kind:'syn'});}
  else if(L.a&&(L.a.id===it.id||L.b.id===it.id)){out.push({o:L.a.id===it.id?L.b:L.a,kind:'syn'});}}
 const d=ITEMS[it.key];
 if(d.bootsHaste&&zoneOk(it))fightingWeapons().forEach(w=>out.push({o:w,kind:'syn'}));
 if(isWeapon(it))inWhere('bag').filter(b=>ITEMS[b.key].bootsHaste&&zoneOk(b)).forEach(b=>out.push({o:b,kind:'syn'}));
 for(const n of orthoNeighbors(it))if(RECIPES.some(r=>(r[0]===it.key&&r[1]===n.key)||(r[1]===it.key&&r[0]===n.key)||(r[3]===n.key&&(r[0]===it.key||r[1]===it.key))||(r[3]===it.key&&(r[0]===n.key||r[1]===n.key))))out.push({o:n,kind:'rcp'});
 const seen=new Set();return out.filter(r=>{const k=r.o.id+r.kind;if(seen.has(k)||r.o.id===it.id)return false;seen.add(k);return true;});}
/* plain-language explanation of every active link (INF-05 "por que sinergiza") */
function whyLines(it){const out=[],links=supportLinks();const VIA={pat:'alcance',tag:'por tipo',mirror:'Espelho',chain:'Correntes'};
 for(const L of links){if(L.w.id===it.id)out.push(`← ${ITEMS[L.s.key].name} (${VIA[L.via]}${L.via==='pat'?': '+PATNAME[patOf(L.s)]:''})`);if(L.s.id===it.id)out.push(`→ ${ITEMS[L.w.key].name} (${VIA[L.via]})`);}
 const pk=pocketsOf(it);for(const p of pk)out.push(`${POCKETS[p].name}: ${POCKETS[p].desc}`);
 return out;}
function readyRecipes(){const used=new Set(),out=[];
 for(const a of inWhere('bag'))for(const b of orthoNeighbors(a)){if(used.has(a.id)||used.has(b.id)||a.noforge||b.noforge)continue;
  const r=RECIPES.find(r=>r[0]===a.key&&r[1]===b.key&&(!r[3]||[...orthoNeighbors(a),...orthoNeighbors(b)].some(c=>c.key===r[3]&&c.id!==a.id&&c.id!==b.id)));
  if(r){used.add(a.id);used.add(b.id);out.push({a,b,res:r[2],tier:Math.max(1,Math.floor((a.tier+b.tier+1)/2))});}}
 return out;}
function interestCap(){let c=3+(has('cofre')?1:0)-(state.asc>=3?1:0);for(const it of inWhere('bag'))if(ITEMS[it.key].intCap)c+=it.tier>=3?2:1;return Math.max(0,c);}
function interest(){return Math.min(interestCap(),Math.floor(state.gold/(has('compostos')?4:5)));}
function piggyGold(it){const d=bagDims();let n=0;for(const [x,y] of [[it.x-1,it.y],[it.x+1,it.y],[it.x,it.y-1],[it.x,it.y+1]])if(x>=0&&y>=0&&x<d.cols&&y<d.rows&&!itemAt('bag',x,y))n++;return n*(it.tier>=3?2:1);}
function itemGold(it){const d=ITEMS[it.key];let g=0;if(d.gold)g+=d.gold*it.tier;if(d.piggy)g+=piggyGold(it);if(g&&pocketsOf(it).includes('fundo'))g+=1;return g;}
function income(){let g=8+Math.min(state.round,8);for(const it of inWhere('bag'))g+=itemGold(it);if(state.chal==='glass')g=Math.round(g*1.5);return g;}

/* ================= SHOP ================= */
const curStop=()=>Math.min(state.wins,9)+1;
/* rarity odds by stop, exposed to the player (LOJ-01, LOJ-05) */
function odds(stop){stop=stop||curStop();let o;
 if(stop<=2)o=[100,0,0,0];else if(stop<=4)o=[80,20,0,0];else if(stop===5)o=[60,32,8,0];else if(stop===6)o=[50,33,15,2];else if(stop<=8)o=[42,34,20,4];else o=[35,35,24,6];
 if(state&&state.asc>=8&&stop<9&&o[3]){o=o.slice();o[2]+=o[3];o[3]=0;}
 if(state&&state.surv)o=[30,35,27,8];return o;}
function rollTier(min){const o=odds(),x=R()*100;let t=x<o[0]?1:x<o[0]+o[1]?2:x<o[0]+o[1]+o[2]?3:4;return Math.max(min||1,t);}
const shopSize=()=>state.chal==='shop3'?3:5+(has('mascate')?1:0);
const lockLimit=()=>2+(has('olho')?1:0)+(state.extraLock||0);
function shopPool(){return SHOPKEYS;}
function petPool(){return PETKEYS.filter(k=>!PETS[k].unlock||PROF.ach[PETS[k].unlock]);}
function rollShop(){const old=state.shop||[];state.shop=[];let petDone=state.chal==='nopets';const N=shopSize();let minT=[];
 if(state.pendingEtiq==='raros')minT=[2,2];if(state.pendingEtiq==='epico')minT=[3];state.pendingEtiq=null;
 for(let i=0;i<N;i++){if(old[i]&&old[i].locked){state.shop.push(old[i]);continue;}
  if(!petDone&&state.round>=2&&R()<.32){petDone=true;state.shop.push({key:rpick(petPool()),tier:rollTier()>2?2:1,pet:1});continue;}
  const o={key:rpick(shopPool()),tier:rollTier(minT.shift())};if(R()<.1)o.sale=1;state.shop.push(o);}
 for(const o of state.shop)if(o&&!o.pet)codexSee(o.key);}
function rerollCost(){if(state.freeReroll||state.etiq.trocas&&state.rerollN===0||has('maoleve')&&state.rerollN===0)return 0;return [1,1,2,2,3][Math.min(state.rerollN,4)]+(state.asc>=4?1:0);}



/* ================= SOUND ================= */
let AC=null;
function sfx(type){if(muted||!VOLFX)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
 const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
 const S={hit:['square',220,90,.05,.08],crit:['sawtooth',440,110,.08,.16],buy:['square',660,990,.05,.1],merge:['triangle',523,1046,.08,.35],
  win:['triangle',392,784,.09,.5],lose:['sawtooth',300,80,.07,.6],heal:['sine',600,900,.05,.15],click:['square',500,500,.03,.04],trig:['triangle',300,1200,.07,.25],drop:['triangle',330,520,.06,.09],bad:['square',160,110,.06,.18],coin:['triangle',1320,1760,.04,.12]}[type];
 if(!S)return;o.type=S[0];o.frequency.setValueAtTime(S[1],t);o.frequency.exponentialRampToValueAtTime(S[2],t+S[4]);
 g.gain.setValueAtTime(S[3]*VOLFX*1.4,t);g.gain.exponentialRampToValueAtTime(.0001,t+S[4]);o.start(t);o.stop(t+S[4]+.02);}

/* ================= ARENA (480×200 canvas, 240×100 logical) ================= */
const cv=$('#cv'),ctx=cv.getContext('2d');
const AW=240,AH=125,GY=116;
/* Backgrounds: the five painted strips from the reference sheet, plus three generated scenes. */
const BGS={cellar:{strip:'strip_cellar',x:0,sky:['#120c10','#2a1e1c'],amb:'dust'},forest:{strip:'strip_forest',x:840,sky:['#0e1a1a','#1e3a30'],amb:'fly'},
 swamp:{strip:'strip_swamp',x:880,sky:['#141a12','#2e3a24'],amb:'bubble'},crypt:{strip:'strip_crypt',x:820,sky:['#0c0e18','#1c2234'],amb:'wisp'},
 volcano:{strip:'strip_volcano',x:860,sky:['#1a0604','#4a1408'],amb:'ember'},road:{full:'bg_road',amb:'dust'},night:{full:'bg_night',amb:'fly'},castle:{full:'bg_castle',amb:'rain'},mine:{full:'bg_mine',amb:'dust'},snow:{full:'bg_snow',amb:'snow'}};
const bgCache={};
function bgFor(name){if(bgCache[name])return bgCache[name];const S=BGS[name];const src=img(S.full||S.strip);if(!src.complete||!src.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=AW*2;c.height=AH*2;const x=c.getContext('2d');
 if(S.full){const sw=src.naturalWidth,sh=src.naturalHeight,r=Math.max(c.width/sw,c.height/sh),w=sw*r,h=sh*r;x.imageSmoothingQuality='high';x.drawImage(src,(c.width-w)/2,c.height-h,w,h);}
 else{const g=x.createLinearGradient(0,0,0,c.height);g.addColorStop(0,S.sky[0]);g.addColorStop(1,S.sky[1]);x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  const sh=src.naturalHeight,scale=(c.height*0.62)/sh,sw=c.width/scale;x.imageSmoothingEnabled=false;
  x.drawImage(src,S.x,0,sw,sh,0,c.height-sh*scale,c.width,sh*scale);}
 const v=x.createRadialGradient(c.width/2,c.height*.55,c.height*.3,c.width/2,c.height*.55,c.width*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=v;x.fillRect(0,0,c.width,c.height);
 return bgCache[name]=c;}
const V={parts:[],projs:[],slashes:[],amb:[],shake:0,hitstop:0,p:{lunge:0,flash:0,dead:0},e:{lunge:0,flash:0,dead:0},biome:null,petBob:[0,0,0]};
const POS={p:{x:66,feet:GY},e:{x:178,feet:GY}};
/* poses dos heróis (folha enviada pelo jogador): [x,y,w,h,larguraDaCélula] na célula; _=[centroX,pés,altura] da pose parada */
const POSE={"warrior": {"idle": [5, 0, 133, 138, 145], "defend": [2, 32, 126, 106, 145], "charge": [0, 30, 125, 107, 148], "attack": [8, 2, 147, 136, 155], "special": [0, 2, 144, 136, 144], "dead": [19, 50, 104, 87, 146], "_": [71.5, 138, 138]}, "rogue": {"idle": [25, 35, 112, 103, 145], "defend": [15, 44, 112, 93, 145], "charge": [13, 39, 116, 98, 148], "attack": [12, 18, 143, 117, 155], "special": [0, 0, 137, 139, 144], "dead": [9, 52, 123, 88, 146], "_": [81.0, 138, 103]}, "pyro": {"idle": [31, 23, 90, 116, 145], "defend": [0, 0, 143, 139, 145], "boom": [0, 2, 148, 137, 148], "attack": [7, 30, 148, 109, 155], "win": [0, 0, 144, 139, 144], "dead": [9, 28, 129, 110, 146], "_": [76.0, 139, 116]}, "paladin": {"idle": [3, 37, 142, 102, 145], "special": [0, 0, 145, 141, 145], "charge": [0, 10, 148, 131, 148], "defend": [0, 3, 155, 138, 155], "dead": [28, 32, 79, 109, 146], "_": [74.0, 139, 102]}};
POSE.alchemist={"idle": [127, 58, 172, 297, 421], "defend": [76, 38, 250, 317, 421], "attack": [67, 59, 297, 296, 422], "boom": [83, 65, 332, 294, 421], "win": [131, 2, 199, 358, 421], "dead": [82, 149, 272, 212, 422], "_": [213.0, 355, 297], "s": 0.2155};
const HS=.55;
function setPose(p,d){if(!POSE[state.cls]||!POSE[state.cls][p])return;V.p.pose=p;V.p.poseT=d;}
function heroPose(){const st=V.p,P=POSE[state.cls];if(!P)return null;
 if(st.dead)return 'dead';
 if(state.phase==='battle'&&B){if(B.done==='win')return P.win?'win':P.special?'special':'idle';
  if(st.pose&&st.poseT>0)return st.pose;if(st.lunge>0)return 'attack';if(B.t<.4&&P.charge)return 'charge';
  if(state.cls==='warrior'&&B.p.hp<B.p.max/2)return 'special';}
 return 'idle';}
function drawPose(pose,cx,feet,alpha,flash,sx,sy){const P=POSE[state.cls],m=P[pose],a=P._,name='hp_'+state.cls+'_'+pose,im=img(name);
 if(!im.complete||!im.naturalWidth)return false;const s=P.s||HS;const W=m[2]*s*(sx||1),H=m[3]*s*(sy||1);
 const x=cx+(m[0]-m[4]/2)*s,y=feet-(a[1]-m[1])*s*(sy||1);
 ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,x,y,W,H);
 if(flash>0){const w=whiteOf(name);if(w){ctx.globalAlpha=Math.min(.85,flash*5)*alpha;ctx.drawImage(w,x,y,W,H);}}ctx.restore();return true;}
function burst(x,y,col,n,spd){if(ECO)n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(spd||40)*(0.4+Math.random());V.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:.5+Math.random()*.3,col,g:90});}}
function ambient(dt){const A=(BGS[V.biome]||{}).amb||'dust';
 while(V.amb.length<26){const p={x:Math.random()*AW,y:Math.random()*GY,t:Math.random()*10};
  if(A==='rain'){p.vx=-20;p.vy=160;p.col='rgba(160,180,220,.45)';p.len=4;}
  else if(A==='ember'){p.vx=(Math.random()-.5)*8;p.vy=-12-Math.random()*14;p.col=Math.random()<.5?'#ff8a3a':'#ffd060';p.y=GY+Math.random()*10;}
  else if(A==='fly'){p.vx=(Math.random()-.5)*10;p.vy=(Math.random()-.5)*10;p.col='#d8f080';p.blink=1;}
  else if(A==='bubble'){p.vx=0;p.vy=-6;p.col='rgba(160,220,140,.6)';p.y=GY+Math.random()*10;}
  else if(A==='snow'){p.vx=-4-Math.random()*6;p.vy=10+Math.random()*10;p.col='rgba(235,245,255,.8)';}
  else if(A==='wisp'){p.vx=(Math.random()-.5)*6;p.vy=-4;p.col='rgba(150,240,220,.7)';p.blink=1;}
  else {p.vx=(Math.random()-.5)*3;p.vy=(Math.random()-.5)*3;p.col='rgba(230,210,180,.35)';}
  V.amb.push(p);}
 for(const p of V.amb){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t+=dt;
  if(p.x<-5)p.x=AW+4;if(p.x>AW+5)p.x=-4;if(p.y<-5||p.y>AH+4){p.y=p.vy>0?-4:(A==='ember'||A==='bubble'?GY+8:AH);p.x=Math.random()*AW;}
  if(p.blink&&Math.sin(p.t*3+p.x)<0)continue;ctx.fillStyle=p.col;
  if(p.len)ctx.fillRect(p.x,p.y,.5,p.len);else ctx.fillRect(p.x,p.y,1,1);}}
/* Draw an image anchored at its feet with squash & stretch. h = height in logical units. */
function drawImg(src,cx,feet,h,flip,alpha,sx,sy){if(!src||!(src.naturalWidth||src.width))return 0;const iw=src.naturalWidth||src.width,ih=src.naturalHeight||src.height;
 sx=sx||1;sy=sy||1;const H=h*sy,W=h*iw/ih*sx;ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.translate(cx,feet);if(flip)ctx.scale(-1,1);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(src,-W/2,-H,W,H);ctx.restore();return h*iw/ih;}
function digits(n,x,y,col){const s=String(n);ctx.fillStyle='#000';for(let i=0;i<s.length;i++){const g=DIG[s[i]];if(!g)continue;for(let r=0;r<5;r++)for(let c=0;c<3;c++)if(g[r][c]==='1')ctx.fillRect(x+i*4+c+.5,y+r+.5,1,1);}
 ctx.fillStyle=col;for(let i=0;i<s.length;i++){const g=DIG[s[i]];if(!g)continue;for(let r=0;r<5;r++)for(let c=0;c<3;c++)if(g[r][c]==='1')ctx.fillRect(x+i*4+c,y+r,1,1);}return s.length*4;}
function statusIcons(F,cx,top){if(!F)return;const items=[];if(F.block>0)items.push(['shld',F.block,'#9cd2f2']);if(F.burn>0)items.push(['flame',F.burn,'#ffb050']);if(F.poison>0)items.push(['drop',F.poison,'#b8f070']);if(F.frost>0)items.push(['flake',F.frost,'#bfefff']);
 ctx.imageSmoothingEnabled=false;let x=Math.round(cx-items.length*8);for(const [ic,n,col] of items){ctx.drawImage(sprCanvas(ic),x,top);x+=8;x+=digits(Math.min(999,n),x,top+1,col)+3;}}
function fighterDraw(side,t){const f=foeDef(),isP=side==='p',st=V[side];
 const name=isP?'h_'+state.cls:(f.img||'e_'+f.art),C=CLASSES[state.cls]||CLASSES.warrior;
 const h=isP?64:(f.ghost?64:(f.h||46)*1.28*(f.elite?1.12:1));const src=img(name);
 const dir=isP?1:-1;const ph=st.lunge>0?1-st.lunge/.22:0;const sw=st.lunge>0?Math.sin(ph*Math.PI):0;
 const lx=sw*10*dir;let sx=1+sw*.14,sy=1-sw*.1;if(st.flash>0){sx*=1.06;sy*=.93;}
 const breathe=1+Math.sin(t*3+(isP?0:1.3))*.02;sy*=breathe;sx/=breathe;
 const cx=POS[side].x+lx,feet=POS[side].feet;const flip=isP?C.flip:!!f.flipImg;
 ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(POS[side].x,feet,h*.42,3,0,0,Math.PI*2);ctx.fill();
 const alpha=st.dead?Math.max(0,1-st.dead*1.5):1;const hp=isP?heroPose():null;
 if(hp&&drawPose(hp,cx,feet,hp==='dead'?Math.max(.55,1-st.dead*.3):1,st.flash,sx,sy)){}
 else{drawImg(src,cx,feet+(st.dead?st.dead*8:0),h,flip,alpha,sx,sy);
 if(st.flash>0)drawImg(whiteOf(name),cx,feet,h,flip,Math.min(.85,st.flash*5)*alpha,sx,sy);}
 if(!isP&&V.boom>0){const bi=img('hp_pyro_boom');if(bi.complete&&bi.naturalWidth){const k=Math.min(1,(.6-V.boom)/.15),S=.5*(.7+k*.4);ctx.save();ctx.globalAlpha=Math.min(1,V.boom*3);ctx.drawImage(bi,POS.e.x-bi.naturalWidth*S/2,feet-bi.naturalHeight*S*.85,bi.naturalWidth*S,bi.naturalHeight*S);ctx.restore();}}
 if(state.phase==='battle'&&B&&!st.dead)statusIcons(B[side],POS[side].x,feet-h-10);
 if(isP)state.pets.forEach((p,i)=>{if(!p)return;const px=POS.p.x-40-i*17,py=POS.p.feet-(p.key==='raven'||p.key==='pixie'?18+Math.abs(Math.sin(t*3+i))*3:0)-(V.petBob[i]>0?5:0);drawImg(img('p_'+p.key),px,py,p.key==='salamander'?11:16,false);});}
function spawnAtk(ev){const from=ev.s,to=from==='p'?'e':'p',dir=from==='p'?1:-1;
 let sx=POS[from].x+dir*18,sy=POS[from].feet-34,tx=POS[to].x,ty=POS[to].feet-32;
 if(ev.pet!=null){sx=POS.p.x-40-ev.pet*17;sy=POS.p.feet-16;V.petBob[ev.pet]=.2;}
 const fx=ev.fx;
 if(fx==='arrow'||fx==='fire'||fx==='ice'||fx==='peck'||fx==='thrust'){V.projs.push({x:sx,y:sy,tx,ty,t:0,d:fx==='thrust'?.12:.22,fx,crit:ev.crit,to});if(ev.pet==null)V[from].lunge=fx==='thrust'?.22:0;}
 else{if(ev.pet==null)V[from].lunge=.22;setTimeout(()=>impact(to,fx,ev.crit),90);}}
function impact(to,fx,crit){const x=POS[to].x,y=POS[to].feet-32;V[to].flash=.16;
 V.slashes.push({x,y,t:0,fx,dir:to==='e'?1:-1});
 burst(x,y,fx==='fire'?'#ff9a3a':fx==='ice'?'#bfefff':crit?'#ffe27a':'#ffffff',crit?16:8,crit?75:45);if(crit){V.shake=.25;if(speed<4)V.hitstop=.07;}}
function drawFX(dt){
 for(const p of V.projs){p.t+=dt;const k=Math.min(1,p.t/p.d);const x=p.x+(p.tx-p.x)*k,y=p.y+(p.ty-p.y)*k-Math.sin(k*Math.PI)*(p.fx==='arrow'?10:4);
  if(p.fx==='arrow'){ctx.fillStyle='#e8dcc0';ctx.fillRect(x-5,y,8,1);ctx.fillStyle='#d8e0e6';ctx.fillRect(x+(p.tx>p.x?3:-6),y-1,3,3);}
  else if(p.fx==='fire'){ctx.fillStyle='rgba(255,106,32,.7)';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();ctx.fillStyle='#ffd060';ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();if(Math.random()<.6)V.parts.push({x,y,vx:0,vy:-10,life:.3,col:'#ff8a3a',g:0});}
  else if(p.fx==='ice'){ctx.fillStyle='rgba(120,210,255,.7)';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();ctx.fillStyle='#eaffff';ctx.fillRect(x-1,y-3,2,6);ctx.fillRect(x-3,y-1,6,2);if(Math.random()<.5)V.parts.push({x,y,vx:0,vy:6,life:.3,col:'#bfefff',g:0});}
  else if(p.fx==='thrust'){ctx.fillStyle='#d8e0e6';ctx.fillRect(x-8,y,12,2);}
  else{ctx.fillStyle='#2e2640';ctx.fillRect(x-2,y-1,4,3);}
  if(k>=1&&!p.hit){p.hit=1;impact(p.to,p.fx,p.crit);}}
 V.projs=V.projs.filter(p=>!p.hit);
 for(const s of V.slashes){s.t+=dt;const k=s.t/.18;if(k>1)continue;ctx.strokeStyle=s.fx==='fire'?'#ffb050':s.fx==='ice'?'#bfefff':`rgba(255,255,255,${(1-k).toFixed(2)})`;ctx.lineWidth=2;
  if(s.fx==='slash'||s.fx==='claw'){ctx.beginPath();ctx.arc(s.x+4*-s.dir,s.y,13,-1+k*.8,.9+k*.8);ctx.stroke();if(s.fx==='claw')for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(s.x-6+j*5,s.y-9+k*4);ctx.lineTo(s.x-2+j*5,s.y+6+k*4);ctx.stroke();}}
  else if(s.fx==='smash'){ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(s.x-12*k,GY-1,24*k,2);ctx.beginPath();ctx.arc(s.x,s.y,10*k+3,0,7);ctx.stroke();}
  else{ctx.beginPath();ctx.moveTo(s.x-7,s.y);ctx.lineTo(s.x+7,s.y);ctx.moveTo(s.x,s.y-6);ctx.lineTo(s.x,s.y+6);ctx.stroke();}}
 V.slashes=V.slashes.filter(s=>s.t<.2);
 for(const p of V.parts){p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life>0){ctx.fillStyle=p.col;const s=p.life>.3?1.5:1;ctx.fillRect(p.x,p.y,s,s);}}
 V.parts=V.parts.filter(p=>p.life>0);}
function drawFatigue(){if(!(state.phase==='battle'&&B&&B.t>B.ft0))return;const k=Math.min(1,(B.t-B.ft0)/12);
 const g=ctx.createRadialGradient(AW/2,AH/2,AH*.3,AW/2,AH/2,AW*.62);g.addColorStop(0,'rgba(90,0,10,0)');g.addColorStop(1,`rgba(110,0,10,${(.7*k).toFixed(3)})`);ctx.fillStyle=g;ctx.fillRect(0,0,AW,AH);
 if(Math.random()<.5+k)V.parts.push({x:Math.random()*AW,y:AH,vx:(Math.random()-.5)*6,vy:-20-Math.random()*25*k,life:.6+Math.random()*.5,col:Math.random()<.5?'#ff5a2a':'#ffb040',g:0});}
let last=performance.now(),acc=0,raf=0,lastMeter=0,lastDraw=0;
/* canvas fills the arena zone ("cover", feet anchored at the bottom) at device resolution */
const CV={K:2,ox:0,oy:0,dpr:1,w:480,h:250,bK:2,bx:0,by:0};
function sizeCanvas(){const r=cv.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(3,window.devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}const bK=Math.max(w/AW,h/AH);
 /* o placar VS fica fora da arena (#vs): se a arena for baixa, os lutadores encolhem um pouco, o cenário não */
 const hud=0,TOPY=GY-84;
 const K=Math.max(bK*.55,Math.min(bK,(h-hud-3*dpr)/(AH-TOPY)));
 Object.assign(CV,{K,dpr,w,h,ox:(w-AW*K)/2,oy:h-AH*K,bK,bx:(w-AW*bK)/2,by:h-AH*bK});}
const PORTRAIT_ONLY=window.matchMedia?window.matchMedia('(orientation: landscape) and (max-height: 500px)'):{matches:false};
function loop(now){if(ECO&&now-lastDraw<31){raf=requestAnimationFrame(loop);return;}lastDraw=now;let rdt=Math.min(.05,(now-last)/1000);last=now;const t=now/1000;
 const f=foeDef();if(V.biome!==f.biome){V.biome=f.biome;V.amb=[];}
 let frozen=false;if(V.hitstop>0){V.hitstop-=rdt;frozen=true;}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b0705';ctx.fillRect(0,0,cv.width,cv.height);ctx.setTransform(CV.bK,0,0,CV.bK,CV.bx,CV.by);
 const bg=bgFor(V.biome);if(bg){ctx.drawImage(bg,0,0,AW,AH);}else{ctx.fillStyle='#120b07';ctx.fillRect(0,0,AW,AH);}
 ambient(rdt);
 ctx.setTransform(CV.K,0,0,CV.K,CV.ox,CV.oy);ctx.save();if(V.shake>0){V.shake-=rdt;ctx.translate((Math.random()-.5)*3,(Math.random()-.5)*2);}
 if(!frozen){for(const s of ['p','e']){const st=V[s];if(st.lunge>0)st.lunge-=rdt;if(st.flash>0)st.flash-=rdt;if(st.poseT>0)st.poseT-=rdt;}if(V.boom>0)V.boom-=rdt;V.petBob=V.petBob.map(v=>v>0?v-rdt:0);}
 if(state.phase==='battle'&&B&&!frozen){
  if(B.done){if(B.done==='win')V.e.dead+=rdt;else V.p.dead+=rdt;}
  else if(!PORTRAIT_ONLY.matches){acc+=rdt*speed;while(acc>=.05&&!B.done){step(B,.05);acc-=.05;}flushEvents();}}
 if(state.cls)fighterDraw('p',t);fighterDraw('e',t);drawFX(frozen?0:rdt);drawFatigue();
 ctx.restore();
 if(state.phase==='battle'&&B){updateHud();if(now-lastMeter>250){lastMeter=now;renderMeter();}}
 raf=requestAnimationFrame(loop);}

/* ================= HUD & DOM ================= */
/* ================= LAYOUT: tela única em retrato (plano mobile, fase 1) ================= */
const OPT=()=>Object.assign({scale:100,big:0,left:0,tapMove:0,volFx:70,volMus:30,eco:0},PROF.opt||{});
const VSH=46;
let CCS=44,CARD=64,BASEMODE='shop',DRAWER=null;
const csOf=w=>w==='chest'?CCS:CS;
function fit(){const app=$('#app');if(!app)return;const o=OPT();let ui=o.scale/100;
 const W=Math.min(app.clientWidth||innerWidth,480),H=app.clientHeight||innerHeight;
 document.body.classList.toggle('big',!!o.big);document.body.classList.toggle('lefty',!!o.left);
 const n=Math.max(5,(state&&state.shop?state.shop.length:5)||5),cols=bagDims().cols,rows=bagDims().rows;
 const top=48,vs=Math.max(VSH,($('#vs')&&$('#vs').offsetHeight)||0),intent=40,act=60,gaps=6*4,arenaMin=96;
 let cs,card,baseH,arenaH,scroll,aff=40;const ui0=ui;
 /* #aff reserva 40px (alvo de toque) quando a casa da mochila ainda fica >=44; senão cai para 22 (atalho secundário: Mais > Afinidades) */
 for(let pass=0;pass<2;pass++){aff=pass?22:40;ui=ui0;
 for(let tries=0;tries<8;tries++){
  card=Math.floor((W-16-(n-1)*6)/n);scroll=n>5&&card<58;if(scroll)card=Math.floor((W-16-4*6)/5.35);card=Math.min(Math.round(86*ui),card);
  baseH=Math.max(card+30,2*44+28);
  /* arena mínima proporcional à largura (≈0,44×L), sem deixar a célula da mochila abaixo de 46 px */
  const free=H-top-vs-intent-aff-act-baseH-gaps-8,am=Math.max(arenaMin,Math.min(Math.round(W*.44),free-rows*46));
  const availBag=free-am;
  cs=Math.min(Math.round(64*ui),Math.floor((W-24)/cols),Math.floor(availBag/rows));
  if(cs>=44||ui<=.9)break;ui-=.05;}
  if(cs>=44)break;}
 cs=Math.max(40,cs);CS=cs;CARD=card;
 CCS=Math.max(36,Math.min(cs,Math.floor((baseH-28)/CHEST_ROWS),Math.floor((W-24-76)/chestCols())));
 const bagH=rows*cs+8,battle=!!state&&state.phase==='battle',meterMin=150;app.classList.toggle('in-battle',battle);
 /* luta: sem mochila nem faixa da loja; a arena ocupa o espaço e o medidor fica na faixa de baixo */
 arenaH=battle?Math.max(arenaMin,Math.min(Math.round(W*.56),H-top-vs-intent-meterMin-act-gaps)):Math.max(arenaMin,Math.min(Math.round(W/1.92),H-top-vs-intent-bagH-aff-baseH-act-gaps));
 const R=document.documentElement.style;R.setProperty('--cs',cs+'px');R.setProperty('--ccs',CCS+'px');R.setProperty('--card',card+'px');R.setProperty('--baseh',baseH+'px');R.setProperty('--arenah',arenaH+'px');R.setProperty('--bagh',bagH+'px');R.setProperty('--affh',aff+'px');{const af=$('#aff');if(af){if(aff<40)af.dataset.tight='1';else delete af.dataset.tight;}}
 app.classList.toggle('roomy',arenaH>=170);$('#shop').classList.toggle('scroll',!!scroll);
 sizeCanvas();placeSellZone();}
function stats(){const s=$('#stats');if(!state.cls){s.innerHTML='';$('#petsmini').hidden=true;return;}
 const L=state.surv?state.survLives:state.lives,goal=state.surv?SURV_GOAL:GOAL,it=interest();
 s.innerHTML=`<span class="k-pill" title="Parada">P${Math.min(state.wins+1,goal)}${state.asc?`<small>A${state.asc}</small>`:''}</span>
 <span class="k-pill" title="Vitórias"><img src="${spr('trophy')}" alt="">${state.wins}/${goal}</span>
 <span class="k-pill life" aria-label="${L} vidas"><img src="${spr('heart')}" alt="">${L}</span>
 <span class="k-pill gold" title="Ouro e juros da próxima parada"><img src="${spr('coin')}" alt="">${state.gold}${it?`<small>+${it}</small>`:''}</span>`;
 const pm=$('#petsmini');pm.hidden=state.chal==='nopets';
 pm.innerHTML=state.pets.map(p=>p?`<img src="a/p_${p.key}.webp" alt="" style="--tier:${tierVar(p.tier)}">`:'<i></i>').join('');
 pm.setAttribute('aria-label','Companheiros: '+(state.pets.filter(Boolean).map(p=>PETS[p.key].name).join(', ')||'nenhum'));}
function sideHTML(side,name,F,tags){return `<div class="side ${side}"><div class="fname">${name}</div>
 <div class="bar"><i style="width:${Math.max(0,F.hp/F.max*100)}%"></i>${F.block>0?`<b style="width:${Math.min(100,F.block/F.max*100)}%"></b>`:''}
 <div class="hpt">${Math.max(0,Math.ceil(F.hp))}/${F.max}${F.block>0?` · ${F.block} escudo`:''}</div></div><div class="tags">${tags}</div></div>`;}
function foeArsenal(F,f){const L=[];
 for(const w of F.weapons)L.push(`<li><b>${w.label||'Ataque'}</b>: ${w.dmg} de dano a cada ${w.cd}s${w.crit?` · ${Math.round(w.crit*100)}% crít.`:''}${w.burn?` · +${w.burn} queimadura`:''}${w.poison?` · +${w.poison} veneno`:''}${w.frost?` · +${w.frost} Gelo`:''}${w.pierce?' · perfura':''}</li>`);
 if(F.block)L.push(`<li>Começa com <b>${F.block}</b> de escudo</li>`);if(F.reflect)L.push(`<li>Reflete <b>${F.reflect}</b> por golpe recebido</li>`);
 for(const h of F.heals)if(!h.shield)L.push(`<li>${h.label||'Cura'}: <b>${h.amt}</b> a cada ${h.cd}s</li>`);
 for(const m of F.mods||[])L.push(`<li class="mod"><b>${MODS[m].name}</b>: ${MODS[m].desc}. <i>Resposta: ${MODS[m].ans}.</i></li>`);
 if(f.ghost)L.push(`<li class="muted">Fantasma: luta com os itens da mochila copiada; habilidade de classe e gatilhos não agem.</li>`);
 return `<ul class="arsenal">${L.join('')}</ul>`;}
function hudShop(){if(!state.cls){$('#hud').innerHTML='';$('#foeinfo').innerHTML='';return;}const P=makePlayer(),f=foeDef(),F=makeFoe();
 const pt=`<span class="tag dps">DPS ${dps(P).toFixed(1)}</span>`;
 const et=`${f.boss?'<span class="tag elite">Chefe</span>':f.elite?'<span class="tag elite">Elite</span>':''}${f.surv?`<span class="tag elite">Norte ${f.surv}</span>`:''}<span class="tag dps">DPS ${dps(F).toFixed(1)}</span>`;
 $('#hud').innerHTML=sideHTML('p',`${P.name}${state.sub?' <em>· '+SUBOF(state.sub).name+'</em>':''}`,P,pt)+`<div class="mid">próximo<strong>VS</strong></div>`+sideHTML('e',f.name,F,et);
 const rr=readyRecipes(),A=ARCH[f.arch];
 const mods=(f.mods||[]).map(m=>`<span class="modtag">${MODS[m].name}</span>`).join('');
 $('#foeinfo').innerHTML=`<b>${A.label}</b>${mods}<span class="ct">${rr.length?`⚒ ${rr.length} pronta${rr.length>1?'s':''} · `:''}${A.counter}</span><i class="info">ⓘ</i>`;
 $('#foeinfo').setAttribute('aria-label','Intenção do inimigo: '+A.label+'. Toque para ver o arsenal.');}
function hudBattle(){const b=B,f=foeDef();
 $('#hud').innerHTML=sideHTML('p',b.p.name,b.p,'')+`<div class="mid"><strong id="clock">0s</strong></div>`+sideHTML('e',f.name,b.e,(f.mods||[]).map(m=>`<span class="tag elite">${MODS[m].name}</span>`).join(''));
 $('#foeinfo').innerHTML=`<b id="fat">luta</b><span class="ct">Toque na arena para ler os efeitos ativos</span>`;renderMeter();}
function updateHud(){const b=B;
 for(const side of ['p','e']){const F=b[side],el=document.querySelector('.side.'+side);if(!el)continue;
  el.querySelector('.bar i').style.width=Math.max(0,F.hp/F.max*100)+'%';
  const bar=el.querySelector('.bar');let bb=bar.querySelector('b');if(F.block>0){if(!bb){bb=document.createElement('b');bar.appendChild(bb);}bb.style.width=Math.min(100,F.block/F.max*100)+'%';}else if(bb)bb.remove();
  el.querySelector('.hpt').textContent=Math.max(0,Math.ceil(F.hp))+'/'+F.max+(F.block>0?` · ${F.block} escudo`:'');}
 const c=$('#clock');if(c)c.textContent=Math.floor(b.t)+'s';
 const fa=$('#fat');if(fa){const left=Math.ceil(b.ft0-b.t);fa.textContent=b.t>b.ft0?`fadiga ${b.fat+1}/s`:left<=10?`fadiga em ${left}s`:'';}
 for(const w of b.p.weapons){if(w.id==null)continue;const el=document.querySelector(`.item[data-id="${w.id}"] .cdr`);if(el)el.style.setProperty('--cdp',Math.max(0,Math.min(1,1-w.t/w.cd)).toFixed(3));}}
function statusText(){if(!B)return '';const f=F=>{const a=[];if(F.block>0)a.push(`escudo ${F.block}`);if(F.burn>0)a.push(`queimadura ${F.burn}/s`);if(F.poison>0)a.push(`veneno ${F.poison} a cada ${F.pti||2}s`);if(F.frost>0)a.push(`Gelo ${F.frost} (−${Math.round(100-100/(1+.02*F.frost))}% velocidade)`);if(F.purged>0)a.push('purgado');if(F.mult>1)a.push('fúria');return a.join(' · ')||'nenhum efeito';};
 return `${B.p.name}: ${f(B.p)}  |  ${B.e.name}: ${f(B.e)}`;}
function iconURL(icon,tier){if(!icon)return null;if(icon.startsWith('pet:'))return 'a/p_'+icon.slice(4)+'.webp';if(ITEMS[icon])return artURL(icon,tier);if(SPR[icon])return spr(icon);return null;}
function meterRows(src){return Object.entries(src).filter(([,s])=>s.dmg+s.blk+s.heal>0).map(([k,s])=>({k,...s})).sort((x,y)=>(y.dmg+y.blk+y.heal)-(x.dmg+x.blk+x.heal));}
/* realce de 300 ms na linha do medidor quando o item (i12) ou companheiro (p0) ataca; guardado porque o medidor é redesenhado a cada 250 ms */
const HIT={};
function hitRow(key){const until=performance.now()+300;HIT[key]=until;const el=document.querySelector(`#meter .mrow[data-key="${key}"]`);if(el){el.classList.add('hit');setTimeout(()=>{if(HIT[key]<=performance.now())el.classList.remove('hit');},310);}}
function meterHTML(b,limit,title){const now=performance.now(),rows=meterRows(b.stats).slice(0,limit);if(!rows.length)return `<h5><span>${title}</span><span>aguardando o primeiro golpe</span></h5>`;
 const mx=Math.max(...rows.map(s=>s.dmg+s.blk+s.heal));
 return `<h5><span>${title}</span><span>dano total ${Math.round(Object.values(b.stats).reduce((a,s)=>a+s.dmg,0))}</span></h5>`+rows.map(s=>{const u=iconURL(s.icon,s.tier);
  return `<div class="mrow${HIT[s.k]>now?' hit':''}" data-key="${s.k}">${u?`<img src="${u}" alt=""${SPR[s.icon]?' class="px"':''}>`:'<i></i>'}<span>${s.label}</span><div class="mbar"><i class="d" style="width:${s.dmg/mx*100}%"></i><i class="b" style="width:${s.blk/mx*100}%"></i><i class="h" style="width:${s.heal/mx*100}%"></i></div><b>${Math.round(s.dmg)}${s.blk?` <em>+${Math.round(s.blk)}</em>`:''}${s.heal?` <u>+${Math.round(s.heal)}</u>`:''}</b></div>`;}).join('');}
function renderMeter(){const m=$('#meter');if(!B||state.phase!=='battle'){m.hidden=true;return;}m.hidden=false;m.innerHTML=meterHTML(B,Math.max(3,Math.min(6,Math.floor((($('#base').clientHeight||150)-48)/28))),'MEDIDOR AO VIVO');}
/* INF-01: per-item table after the fight */
function statTable(src,isPlayer){const rows=Object.values(src).filter(s=>s.dmg+s.blk+s.heal+s.act+s.burn+s.poison+s.frost>0).sort((x,y)=>(y.dmg+y.blk+y.heal)-(x.dmg+x.blk+x.heal));
 if(!rows.length)return '<p class="muted">Nada registrado.</p>';
 return `<table class="st"><thead><tr><th>${isPlayer?'Item':'Ataque'}</th><th title="acionamentos">Ativ.</th><th title="dano · % de críticos">Dano</th><th title="escudo dado / cura">Esc/Cura</th><th>Status</th></tr></thead><tbody>${rows.map(s=>{const u=isPlayer?iconURL(s.icon,s.tier):null;
  const st=[s.burn?`<span class="sb">${s.burn}🔥</span>`:'',s.poison?`<span class="sp">${s.poison}☠</span>`:'',s.frost?`<span class="sf">${s.frost}❄</span>`:'',s.purge?`<span class="sf">${s.purge}✧</span>`:''].join(' ');
  return `<tr><td>${u?`<i class="ri${isPlayer&&s.tier?' t'+s.tier:''}"><img src="${u}" alt=""${SPR[s.icon]?' class="px"':''}></i>`:''}<span>${s.label}</span></td><td>${s.act||'–'}</td><td>${Math.round(s.dmg)||'–'}${s.act&&s.crit?`<small class="cr"> ${Math.round(s.crit/s.act*100)}%c</small>`:''}</td><td>${s.blk?`<em>${Math.round(s.blk)}</em>`:''}${s.blk&&s.heal?'/':''}${s.heal?`<u>${Math.round(s.heal)}</u>`:''}${!s.blk&&!s.heal?'–':''}</td><td>${st||'–'}</td></tr>`;}).join('')}</tbody></table>`;}
function addFloat(side,cls,txt){const fl=$('#floats');if(fl.childElementCount>14)return;const s=document.createElement('span');s.className='float '+cls;s.textContent=txt;
 const lx=POS[side].x+(cls==='banner'?0:(Math.random()-.5)*30),ly=cls==='banner'?60:POS[side].feet-50-Math.random()*20;
 let px=(CV.ox+lx*CV.K)/CV.dpr,py=(CV.oy+ly*CV.K)/CV.dpr;const w=CV.w/CV.dpr;if(cls==='banner')px=Math.min(w*.78,Math.max(w*.22,px));
 s.style.left=px+'px';s.style.top=Math.max(40,py)+'px';fl.appendChild(s);setTimeout(()=>s.remove(),cls==='banner'?1200:900);}
function pulseItem(id,cls){const el=document.querySelector(`.item[data-id="${id}"]`);if(el){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}}
function flushEvents(){let snd=0;
 for(const e of B.ev){
  if(e.k==='atk'){spawnAtk(e);if(e.s==='p'){const hk=e.id!=null?'i'+e.id:e.pet!=null?'p'+e.pet:null;if(hk)hitRow(hk);}
   if(e.pet!=null&&e.s==='p'){const sl=document.querySelector(`.slot[data-pet="${e.pet}"]`);if(sl){sl.classList.remove('fire');void sl.offsetWidth;sl.classList.add('fire');}}
   if(e.s==='p'&&e.pet==null&&state.cls==='alchemist')setPose(e.fx==='fire'?'boom':'attack',.4);
   if(e.s==='p'&&e.pet==null&&e.crit){if(state.cls==='rogue')setPose('special',.45);else if(state.cls==='paladin')setPose('charge',.45);}
   if(snd<2){sfx(e.crit?'crit':'hit');snd++;}}
  else if(e.k==='num'){addFloat(e.s,e.c,e.v);if(e.s==='p'&&e.c==='heal'&&(state.cls==='paladin'||state.cls==='alchemist'))setPose('defend',.5);else if(e.s==='p'&&e.c==='blk'&&/escudo/.test(e.v)&&state.cls!=='pyro')setPose('defend',.4);else if(e.s==='e'&&e.c==='burn'&&/^\+/.test(e.v)&&state.cls==='pyro')setPose('defend',.35);}
  else if(e.k==='banner'){addFloat(e.s,'banner',e.v);sfx('trig');if(e.v==='FÚRIA!')setPose('special',.7);if(e.v==='LUZ SAGRADA')setPose('special',.75);}
  else if(e.k==='trig')pulseItem(e.id,'fire');
  else if(e.k==='mix'){setPose('attack',.3);burst(POS.e.x,POS.e.feet-26,'#9ad84a',10,40);}
  else if(e.k==='boom'){burst(POS.e.x,POS.e.feet-22,'#ff8a3a',30,90);V.shake=.4;V.boom=.6;setPose('defend',.6);}
  else if(e.k==='holy'){burst(POS.p.x,POS.p.feet-26,'#fff2a0',20,50);}
  else if(e.k==='fire'){if(e.pet!=null&&e.s==='p')V.petBob[e.pet]=.2;if(e.id!=null&&e.s==='p')pulseItem(e.id,'fire');}}
 B.ev.length=0;}

/* ----- Item rendering with rarity foil ----- */
function artHTML(key,tier,bw,bh,rot){const url=artURL(key,tier),d=artDim(key,tier),k=Math.min(bw/(rot?d[1]:d[0]),bh/(rot?d[0]:d[1])),w=Math.round(d[0]*k),h=Math.round(d[1]*k);
 const tf=rot?'position:absolute;left:50%;top:50%;max-width:none;transform:translate(-50%,-50%) rotate(90deg);':'',tint=ITEMS[key].tint||'';
 let s=`<img class="art ${tint}" src="${url}" alt="" style="width:${w}px;${tf}" draggable="false">`;
 if(tier>=2&&!TIERED.has(key))s+=`<i class="foil t${tier}" style="width:${w}px;height:${h}px;${tf}-webkit-mask-image:url(${url});mask-image:url(${url})"></i>`;
 if(tier>=4)for(let i=0;i<3;i++)s+=`<i class="twinkle" style="left:${15+((key.length*37+i*29)%70)}%;top:${12+((key.length*13+i*41)%70)}%;animation-delay:${i*.5}s"></i>`;
 return s;}
function tagDots(key){return `<span class="tdots">${tagsOf(key).map(t=>`<i style="background:${TAGS[t].col}" title="${TAGS[t].name}"></i>`).join('')}</span>`;}
function itemHTML(it,extra){const sel=state.sel&&state.sel.id===it.id,d=ITEMS[it.key];const rot=it.w!==d.w,c=csOf(it.where);
 const zoneBad=d.zone&&it.where==='bag'&&!zoneOk(it);const idle=state.chal==='onewep'&&isWeapon(it)&&it.where==='bag'&&!fightingWeapons().includes(it);
 return `<div class="item${sel?' sel':''}${extra||''}" data-drag="1" data-src="own" data-id="${it.id}" tabindex="0" role="button" aria-label="${d.name} ${TIERS[it.tier-1]}" style="--x:${it.x};--y:${it.y};--w:${it.w};--h:${it.h};--tier:${tierVar(it.tier)}">
 <div class="face t${it.tier}">${d.type==='weapon'?'<i class="cdr"></i>':''}${artHTML(it.key,it.tier,(it.w*c-10)*.86,(it.h*c-10)*.86,rot)}<div class="pips">${'<i></i>'.repeat(it.tier)}</div>${tagDots(it.key)}${it.tier>=3?'<span class="awk">✦</span>':''}${it.noforge?'<span class="nf" title="não forjar">⊘</span>':''}${zoneBad||idle?'<i class="zoneoff" title="inativo aqui"></i>':''}</div></div>`;}
let mergedId=null;
function ctr(it){return [(it.x+it.w/2)*CS,(it.y+it.h/2)*CS];}
function drawTethers(rel,from){const svg=document.querySelector('#bag .teth');if(!svg)return;svg.innerHTML='';
 for(const r of rel){if(r.o.where!=='bag')continue;const a=ctr(from),b=ctr(r.o);svg.insertAdjacentHTML('beforeend',`<line class="${r.kind==='rcp'?'rcp':'syn'}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><circle cx="${b[0]}" cy="${b[1]}" r="4" stroke="${r.kind==='rcp'?'#ffd76a':'#8ff09a'}"/>`);}}
function cellsHTML(where){const d=dims(where);let s='';for(let y=0;y<d.rows;y++)for(let x=0;x<d.cols;x++){const p=where==='bag'?state.bag.pockets[K(x,y)]:null;
 s+=`<i class="cell${where==='bag'&&y===0?' top':''}${where==='bag'&&y===d.rows-1?' bottom':''}${p?' pk':''}" style="--x:${x};--y:${y}${p?`;--pk:${POCKETS[p].col}`:''}"></i>`;}return s;}
function affHTML(){const A=affinity(),wi=weightInfo();const parts=TAGKEYS.filter(t=>A.c[t]>0).map(t=>`<span class="aftag${A.lv[t]?' on':''}" style="--c:${TAGS[t].col}">${TAGS[t].name.slice(0,3)} ${A.lv[t]===2?A.c[t]+'✦✦':A.lv[t]?A.c[t]+'✦':A.c[t]}</span>`);
 return `<span class="load${wi.over?' over':''}" title="Carga das armas">⚖ ${wi.w}/${wi.cap}${wi.over?` −${Math.round(wi.over*12)}%`:''}</span>${parts.join('')}${Object.keys(state.bag.pockets).length?'<span class="pkdot">▣ bolsos</span>':''}`;}
function affFull(){const A=affinity();return `<table class="st aff2"><thead><tr><th>Tipo</th><th>Itens</th><th>Com 3</th><th>Com 5</th></tr></thead><tbody>${TAGKEYS.map(t=>`<tr${A.lv[t]?' class="cur"':''}><td><b style="color:${TAGS[t].col}">${TAGS[t].name}</b></td><td>${A.c[t]}</td><td class="wrap">${TAGS[t].t3}</td><td class="wrap">${TAGS[t].t5}</td></tr>`).join('')}</tbody></table>
 ${[...new Set(Object.values(state.bag.pockets))].map(p=>`<p class="pkleg" style="--c:${POCKETS[p].col}">▣ <b>${POCKETS[p].name}</b>: ${POCKETS[p].desc}</p>`).join('')}<p class="muted small">As Flâmulas reforçam todas as armas do tipo delas, em qualquer lugar da mochila.</p>`;}
function renderGrids(){for(const w of ['bag','chest']){const g=$('#'+w),d=dims(w);g.style.setProperty('--cols',d.cols);g.style.setProperty('--rows',d.rows);}
 const rset=new Set();readyRecipes().forEach(r=>{rset.add(r.a.id);rset.add(r.b.id);});
 const selIt=state.sel&&state.sel.id?state.items.find(i=>i.id===state.sel.id):null;const rel=selIt&&selIt.where==='bag'&&state.phase==='shop'?relations(selIt):[];
 const relMap=new Map(rel.map(r=>[r.o.id,r.kind]));
 for(const w of ['bag','chest'])$('#'+w).innerHTML=cellsHTML(w)+inWhere(w).map(it=>itemHTML(it,(it.id===mergedId?' merged':'')+(rset.has(it.id)?' rcpready':'')+(relMap.has(it.id)?(relMap.get(it.id)==='rcp'?' rgl':' syn'):''))).join('');
 $('#bag').insertAdjacentHTML('beforeend','<svg class="teth" aria-hidden="true"></svg>');
 if(selIt&&rel.length)drawTethers(rel,selIt);
 if(mergedId){const el=document.querySelector(`.item[data-id="${mergedId}"]`);if(el)sparks(el);}mergedId=null;
 $('#aff').innerHTML=affHTML();if(DRAWER==='aff')$('#affFull').innerHTML=affFull();}
function sparks(el){const g=el.parentElement;const cx=el.offsetLeft+el.offsetWidth/2,cy=el.offsetTop+el.offsetHeight/2;
 for(let i=0;i<12;i++){const s=document.createElement('i');s.className='spark';const a=i/12*Math.PI*2;s.style.left=cx+'px';s.style.top=cy+'px';s.style.setProperty('--dx',Math.cos(a)*40+'px');s.style.setProperty('--dy',Math.sin(a)*40+'px');if(i%2)s.style.background='#fff';g.appendChild(s);setTimeout(()=>s.remove(),620);}}
function renderPets(){const off=state.chal==='nopets';
 $('#pets').innerHTML=off?'<p class="muted">Desafio Viajante Solitário: sem companheiros.</p>':state.pets.map((p,i)=>{if(!p)return `<button class="slot" data-pet="${i}" aria-label="Espaço de companheiro vazio"></button>`;
 const sel=state.sel&&state.sel.pet===i;return `<button class="slot full${sel?' sel':''}" data-pet="${i}" style="--tier:${tierVar(p.tier)}" aria-label="${PETS[p.key].name} ${TIERS[p.tier-1]}"><img src="a/p_${p.key}.webp" alt=""><span class="pp">${'<i></i>'.repeat(p.tier)}</span>${p.ch?`<span class="ch">${p.ch}</span>`:''}</button>`;}).join('');}
function merchantLine(){const s=state;let pool=MERCH.idle;
 if(s.mood==='legend')pool=MERCH.legend;else if(s.round===1)pool=MERCH.first;else if(s.surv)pool=MERCH.surv;else if(foeDef().boss)pool=MERCH.boss;else if(s.mood==='loss')pool=MERCH.loss;
 else if(s.lives===1)pool=MERCH.lowlife;else if(s.winStreak>=3)pool=MERCH.streak;else if(weightInfo().over)pool=MERCH.over;else if(s.gold<3)pool=MERCH.broke;else if(foeDef().elite)pool=MERCH.elite;
 return pool[(s.round*7+s.gold)%pool.length];}
function oddsLine(){const o=odds();return ['C','R','É','L'].map((n,i)=>o[i]?`${n} ${o[i]}%`:'').filter(Boolean).join(' · ');}
let bubbleT=0,lastSaid='';
function sayMerchant(force){const b=$('#mline');if(!state.cls||state.phase!=='shop'||BASEMODE!=='shop')return;const line=merchantLine();if(!force&&line===lastSaid)return;lastSaid=line;
 b.innerHTML=`<b>Mascate Brás:</b> ${line}`;b.hidden=false;clearTimeout(bubbleT);bubbleT=setTimeout(()=>b.hidden=true,4000);}
function renderShop(){const sh=$('#shop'),base=$('#base');
 const battle=state.phase==='battle',chest=!battle&&BASEMODE==='chest';
 base.dataset.mode=battle?'battle':chest?'chest':'shop';
 sh.hidden=battle||chest;$('#chestwrap').hidden=!chest;if(battle||chest)$('#mline').hidden=true;if(!battle)$('#meter').hidden=true;
 sh.style.setProperty('--n',Math.max(5,state.shop.length));
 sh.innerHTML=state.shop.map((s,i)=>{if(!s)return `<div class="card sold" aria-hidden="true"></div>`;const p=offerPrice(s),sel=state.sel&&state.sel.shop===i;
  const name=s.pet?PETS[s.key].name:ITEMS[s.key].name;
  const src=s.pet?'a/p_'+s.key+'.webp':artURL(s.key,s.tier),tint=s.pet?'':(ITEMS[s.key].tint||'');
  return `<button class="card t${s.tier}${s.pet?' pet':''}${p>state.gold?' poor':''}${sel?' sel':''}" data-drag="1" data-src="shop" data-idx="${i}" aria-label="${name} ${TIERS[s.tier-1]}, ${p} de ouro${s.sale?', em promoção':''}">
  <span class="box">${s.locked?`<img class="lock" src="${spr('lockic')}" alt="reservado">`:''}${s.sale?'<span class="sale">PROMO</span>':''}<img class="art ${tint}" src="${src}" alt="" draggable="false">${s.pet?'':tagDots(s.key)}${shopHint(s)}</span><span class="price k-pill${s.sale?' off':''}"><img src="${spr('coin')}" alt="">${p}</span></button>`;}).join('');
 const nc=inWhere('chest').length;$('#chestHead').innerHTML=`<b>Baú</b> ${nc}/${chestCols()*CHEST_ROWS} · guardados não lutam · solte aqui para guardar`;
 const a=$('#actions');a.dataset.mode=battle?'battle':'shop';
 if(battle){a.innerHTML=`${[1,2,4].map(s=>`<button class="spd k-btn v${speed===s?' on':''}" data-speed="${s}" aria-label="Velocidade ${s}×">${s}×</button>`).join('')}<button class="fightbtn k-btn o" id="skip">Pular ▶▶</button>`;return;}
 const lvl=state.bagLvl,cost=BAGCOST[lvl],rc=rerollCost(),canX=canExpand();
 a.innerHTML=`<button class="abtn k-btn v" id="reroll" ${state.gold<rc?'disabled':''} aria-label="Trocar itens por ${rc} de ouro">↻<small>Trocar</small><i class="k-dot">${rc}</i></button>
 <button class="abtn k-btn v" id="expand" ${!canX||state.gold<cost?'disabled':''} aria-label="${canX?'Ampliar a mochila por '+cost:'Mochila máxima'}">⊞<small>${canX?'Ampliar':'Máx.'}</small>${canX?`<i class="k-dot">${cost}</i>`:''}</button>
 <button class="abtn k-btn v" id="undo" ${state.undo?'':'disabled'} aria-label="Desfazer">↶<small>Desfazer</small></button>
 <button class="abtn k-btn v${chest?' on':''}" id="chestBtn" aria-label="Baú, ${nc} itens">${chest?'▾':'▴'}<small>Baú</small>${nc?`<i class="k-dot n">${nc}</i>`:''}</button>
 <button class="abtn k-btn v${state.skipOffer?' ping':''}" id="moreBtn" aria-label="Mais opções">⋯<small>Mais</small></button>
 <button class="fightbtn k-btn r" id="fight">LUTAR!</button>`;}
function render(){if(state.phase!=='battle'&&BASEMODE==='battle')BASEMODE='shop';fit();stats();renderPets();renderGrids();renderShop();if(state.phase==='battle')hudBattle();else hudShop();sizeCanvas();renderPop();renderSheet();renderDrawer();if(SNAP!=null){flashItem(SNAP);SNAP=null;}if(COACH.step>=0)coachTick();}
/* ================= INFO SHEET ================= */
function recipeLines(key){return RECIPES.filter(r=>r[0]===key||r[1]===key||r[2]===key||r[3]===key).map(r=>r[2]===key?`Forjado de ${ITEMS[r[0]].name} + ${ITEMS[r[1]].name}${r[3]?` (com ${ITEMS[r[3]].name} encostado)`:''}`
 :r[3]===key?`Catalisador: encostado em ${ITEMS[r[0]].name} + ${ITEMS[r[1]].name}, permite forjar <b>${PROF.codex.recipes[r[2]]?ITEMS[r[2]].name:'???'}</b> (não é consumido)`
 :`Receita: encoste ${ITEMS[r[0]].name} e ${ITEMS[r[1]].name}${r[3]?` e um ${ITEMS[r[3]].name} junto`:''} e vença para forjar <b>${PROF.codex.recipes[r[2]]?ITEMS[r[2]].name:'???'}</b>`);}
function describe(key,tier,it){const d=ITEMS[key],m=TM[tier-1],L=[];const inBag=it&&it.where==='bag';
 if(tagsOf(key).length)L.push(`Tipo: ${tagsOf(key).map(t=>`<span style="color:${TAGS[t].col}">${TAGS[t].name}</span>`).join(', ')}`);
 if(d.type==='weapon'){const s=weaponStats(inBag?it:{key,tier,where:'x',x:-9,y:-9,w:d.w,h:d.h,id:-1});
  L.push(`Dano <b>${s.dmg}</b>${s.bD?` <span class="bonus">(+${s.bD} bônus)</span>`:''} a cada <b>${s.cd}s</b>${s.haste?` <span class="bonus">(−${Math.round(s.haste*100)}%)</span>`:''}${s.slow>1?` <span class="warn">(+${Math.round((s.slow-1)*100)}% sobrecarga)</span>`:''}`);
  if(s.crit)L.push(`Crítico ${Math.round(s.crit*100)}%${s.bC?` <span class="bonus">(+${Math.round(s.bC*100)}%)</span>`:''}`);
  if(s.burn)L.push(`Aplica <b>${s.burn}</b> de queimadura${s.bB?` <span class="bonus">(+${s.bB})</span>`:''}`);
  if(s.poison)L.push(`Aplica <b>${s.poison}</b> de veneno${s.bP?` <span class="bonus">(+${s.bP})</span>`:''}`);
  if(s.frost)L.push(`Aplica <b>${s.frost}</b> de Gelo${s.bF?` <span class="bonus">(+${s.bF})</span>`:''} (cada Gelo: inimigo −2% de velocidade, até 25)`);
  if(s.purge)L.push(`Purga <b>${s.purge}</b>: remove ${6*s.purge} de escudo, desliga o reflexo por 2s e corta a cura do inimigo pela metade por 3s`);
  if(s.life)L.push(`<span class="bonus">Rouba ${Math.round(s.life*100)}% do dano como vida</span>`);
  if(s.pierce)L.push('Perfura: ignora escudo');if(s.stun)L.push(`${Math.round(s.stun*100)}% de chance de atordoar`);
  L.push(`Peso <b>${inBag?itemWeight(it):d.wt||1}</b> na carga${inBag&&itemWeight(it)<(d.wt||1)?` <span class="bonus">(base ${d.wt||1})</span>`:''}${inBag&&it.y===0?' · <span class="bonus">fileira do topo: primeiro golpe 0,2s mais cedo</span>':''}`);}
 if(d.block)L.push(`Começa a luta com <b>${Math.round(d.block*m)}</b> de escudo`);
 if(d.hp)L.push(`+<b>${Math.round(d.hp*m)}</b> de vida máxima${d.zone==='top'?' · <span class="bonus">×1,5 na fileira do TOPO</span>':''}`);
 if(d.reflect)L.push(`Reflete <b>${Math.round(d.reflect*m)}</b> de dano a cada golpe recebido`);
 if(d.chill)L.push(`Quem bate em você recebe <b>${tier}</b> de Gelo`);
 if(d.heal)L.push(`Cura <b>${Math.round((d.heal+(d.grows&&it?it.grow||0:0))*m)}</b> a cada ${d.healCd}s${d.grows?` · <span class="bonus">cresce +1 a cada vitória na mochila (agora +${it&&it.grow||0}, máx. 8)</span>`:''}`);
 const pat=d.pat?PATNAME[tier>=3&&(d.pat==='orto'||d.pat==='diag')?'ring':d.pat]:null,who=d.tagSup?`Todas as armas de ${TAGS[d.tagSup].name} da mochila`:`Armas nos ${pat}`;
 if(d.adjDmg)L.push(`${who}: +<b>${Math.round(d.adjDmg*m)}</b> de dano`);
 if(d.adjCrit)L.push(`${who}: +<b>${Math.round(d.adjCrit*tier*100)}%</b> de crítico`);
 if(d.adjBurn)L.push(`${who}: +<b>${tier}</b> de queimadura`);
 if(d.adjPoison)L.push(`${who}: +<b>${tier}</b> de veneno (ignora escudo, não diminui)`);
 if(d.adjFrost)L.push(`${who}: +<b>${tier}</b> de Gelo`);
 if(d.adjPurge)L.push(`${who}: ganham Purga <b>${tier}</b>`);
 if(d.adjLife)L.push(`${who}: roubam <b>${Math.round(d.adjLife*tier*100)}%</b> do dano como vida`);
 if(d.adjHaste)L.push(`${d.tagSup?who:'Armas na '+pat}: atacam <b>${Math.round(d.adjHaste*tier*100)}%</b> mais rápido`);
 if(d.geo==='mirror')L.push(`Copia o apoio à <b>esquerda</b> para a arma à <b>direita</b> (${Math.round((1+.5*(tier-1))*100)}% do bônus)`);
 if(d.geo==='chain')L.push(`Com 2 ou mais na mochila: apoios encostados numa Corrente afetam as armas encostadas em outra Corrente`);
 if(d.bootsHaste)L.push(`Na fileira do <b>FUNDO</b>: todas as armas atacam <b>${Math.round(d.bootsHaste*tier*100)}%</b> mais rápido`);
 if(d.wtRed)L.push(`Reduz a carga total em <b>${tier}</b>`);
 if(d.dual)L.push(`Com exatamente <b>2 armas</b> na mochila: cada uma pesa 1 a menos${tier>=3?' e ganha +10% de crítico':''}`);
 if(d.veteran)L.push(`Todas as armas: +<b>${(Math.min(state&&state.wins||0,10)*.5*tier).toFixed(1).replace('.0','')}</b> de dano (+${(.5*tier).toString().replace('.',',')} por vitória nesta jornada, até 10)`);
 if(d.trig==='start')L.push(`Gatilho · início do combate: aplica <b>${Math.round(d.burnStart*m)}</b> de queimadura`);
 if(d.trig==='shieldBreak')L.push(`Gatilho · ao perder todo o escudo: ganha <b>${Math.round(d.blockTrig*m)}</b> de escudo`);
 if(d.trig==='crit5')L.push(`Gatilho · a cada 5 críticos: tiro de <b>${Math.round(d.shot*m)}</b> que ignora escudo`);
 if(d.trig==='below50')L.push(`Gatilho · ao cair abaixo de 50% de vida: cura <b>${Math.round(d.healTrig*m)}</b>`);
 if(d.trig==='souls')L.push(`Gatilho · início do combate: escudo = <b>${d.soulBlk}</b> × vitórias que ela presenciou na mochila (agora ${it&&it.souls||0}, máx. ${30*tier})`);
 if(d.gold)L.push(`+<b>${d.gold*tier}</b> de ouro por rodada (na mochila)`);
 if(d.piggy)L.push(`+<b>${tier>=3?2:1}</b> de ouro por rodada para cada espaço <b>vazio</b> nos lados${it&&inBag?` (agora +${piggyGold(it)})`:''}`);
 if(d.intCap)L.push(`Teto de juros +<b>${tier>=3?2:1}</b> (na mochila)`);
 if(it&&inBag&&d.zone&&!zoneOk(it))L.push(`<span class="warn">Fora da zona: este item está inativo aqui.</span>`);
 const aw=AWK[d.type];if(aw){if(tier>=3)L.push(`<span class="awkl">✦ Despertar Épico · ${aw[0]}</span>`);if(tier>=4)L.push(`<span class="awkl">✦ Despertar Lendário · ${aw[1]}</span>`);if(tier<3)L.push(`<span style="color:var(--muted)">No Épico desperta: ${aw[0]}</span>`);}
 L.push(...recipeLines(key));
 if(it&&inBag){const w=whyLines(it);if(w.length)L.push(`<span class="why"><b>Por que sinergiza:</b><br>${w.join('<br>')}</span>`);}
 if(tier<4)L.push(`Junte com outro ${d.name} ${TIERS[tier-1]} para virar ${TIERS[tier]}`);
 if(it&&it.where==='chest')L.push(`<span style="color:var(--muted)">No baú este item não luta.</span>`);
 return L;}
function describePet(key,tier,p){const P=PETS[key],m=TM[tier-1],L=[P.desc+'.'];
 if(P.dmg)L.push(`Ataca com <b>${Math.round(P.dmg*m)}</b> de dano a cada ${P.cd}s, ${Math.round(P.crit*100)}% de crítico`);
 if(P.burn)L.push(`Aplica <b>${Math.round(P.burn*m)}</b> de queimadura a cada ${P.cd}s`);
 if(P.frost)L.push(`Aplica <b>${Math.round(P.frost*m)}</b> de Gelo a cada ${P.cd}s`);
 if(P.block)L.push(`+<b>${Math.round(P.block*m)}</b> de escudo no início e +${Math.round(P.tick*m)} a cada ${P.cd}s`);
 if(P.heal)L.push(`Cura <b>${Math.round(P.heal*m)}</b> a cada ${P.cd}s`);
 L.push(`<span class="bonus">Habilidade na loja · ${P.act}: ${P.actDesc}.</span> ${p?`Cargas: <b>${p.ch||0}/${PET_CHARGES}</b> nesta jornada.`:`${PET_CHARGES} cargas por jornada.`}`);
 L.push('Companheiros não pesam na carga.');
 if(tier<4)L.push(`Compre outro ${P.name} ${TIERS[tier-1]} para evoluir`);return L;}
function hammerCost(it){if(state.freeHammer)return 0;return basePrice(it.key,it.tier+1)-basePrice(it.key,it.tier);}
function renderSheet(){const sh=$('#sheet');const s=state.sel;if(!s||!state.selMore||state.phase==='class'||!$('#overlay').hidden){sh.hidden=true;return;}
 let key,tier,it=null,pet=false,src,name,po=null;
 if(s.shop!=null){const o=state.shop[s.shop];if(!o){state.sel=null;sh.hidden=true;return;}key=o.key;tier=o.tier;pet=!!o.pet;}
 else if(s.pet!=null){po=state.pets[s.pet];if(!po){state.sel=null;sh.hidden=true;return;}key=po.key;tier=po.tier;pet=true;}
 else{it=state.items.find(i=>i.id===s.id);if(!it){state.sel=null;sh.hidden=true;return;}key=it.key;tier=it.tier;}
 src=pet?'a/p_'+key+'.webp':artURL(key,tier);name=pet?PETS[key].name:ITEMS[key].name;
 const lines=pet?describePet(key,tier,po):describe(key,tier,it);
 sh.hidden=false;$('#pop').hidden=true;
 sh.innerHTML=`<div class="in k-win" style="--tier:${tierVar(tier)}"><h3 class="k-rib">${name}</h3>
 <div class="sbody"><div class="shead"><span class="ic k-card"><img src="${src}" alt="" class="${pet?'':(ITEMS[key].tint||'')}"></span><span class="tiername">${TIERS[tier-1]}${pet?' · companheiro':` · ${ITEMS[key].w}×${ITEMS[key].h}`}</span></div>
 <ul>${lines.map(l=>`<li>${l}</li>`).join('')}</ul></div>
 ${it&&state.phase==='shop'?`<div class="row">${it.tier<4?`<button class="k-btn o" id="hammer" ${state.hammerUsed||state.gold<hammerCost(it)?'disabled':''}>Martelo · ${hammerCost(it)}</button>`:''}${RECIPES.some(r=>r[0]===key||r[1]===key)?`<button class="k-btn v" id="noforge">${it.noforge?'Liberar forja':'Não forjar'}</button>`:''}</div>`:''}
 <div class="row"><button class="k-btn v" id="lessBtn">Voltar</button><button class="k-btn g" id="close">Fechar</button></div></div>`;}
/* Popover (plano, fase 2): ficha curta ACIMA do objeto tocado, nunca cobrindo-o */
function popAnchor(){const s=state.sel;if(!s)return null;if(s.shop!=null)return document.querySelector(`.card[data-idx="${s.shop}"]`);
 if(s.pet!=null)return DRAWER==='pets'?document.querySelector(`.slot[data-pet="${s.pet}"]`):$('#petsmini');return document.querySelector(`.item[data-id="${s.id}"]`);}
function popLines(key,tier,it,pet,po){const L=pet?describePet(key,tier,po):describe(key,tier,it);const strip=t=>t.replace(/<[^>]+>/g,'');
 return L.filter(l=>!/^Tipo:/.test(strip(l))&&!/^Junte com/.test(strip(l))).slice(0,2);}
function renderPop(){const p=$('#pop');const s=state.sel;
 if(!s||state.selMore||state.phase==='class'||!$('#overlay').hidden||(drag&&drag.started)){p.hidden=true;return;}
 const anc=popAnchor();if(!anc){p.hidden=true;return;}
 let key,tier,it=null,pet=false,po=null,btns='',sub='';
 if(s.shop!=null){const o=state.shop[s.shop];if(!o){state.sel=null;p.hidden=true;return;}key=o.key;tier=o.tier;pet=!!o.pet;const pr=offerPrice(o),lk=state.shop.filter(x=>x&&x.locked).length;
  btns=state.phase==='shop'?`<button class="k-btn g" id="buy" ${pr>state.gold?'disabled':''}>Comprar · ${pr}</button><button class="k-btn v" id="lockBtn" ${!o.locked&&lk>=lockLimit()?'disabled':''}>${o.locked?'Liberar':`Reservar ${lk}/${lockLimit()}`}</button>`:'';}
 else if(s.pet!=null){po=state.pets[s.pet];if(!po){state.sel=null;p.hidden=true;return;}key=po.key;tier=po.tier;pet=true;
  btns=state.phase==='shop'?`<button class="k-btn o" id="petAct" ${po.ch>0?'':'disabled'}>${PETS[key].act} (${po.ch||0})</button><button class="k-btn v" id="sellPet">Vender · ${sellPrice(key,tier,true)}</button>`:'';}
 else{it=state.items.find(i=>i.id===s.id);if(!it){state.sel=null;p.hidden=true;return;}key=it.key;tier=it.tier;const hc=it.tier<4?hammerCost(it):0;
  btns=state.phase==='shop'?`${it.w!==it.h?'<button class="k-btn v" id="rot">⟳ Girar</button>':''}<button class="k-btn v" id="sell">Vender · ${sellPrice(key,tier)}</button>`:'';
  sub=it.where==='chest'?' · no Baú':'';}
 const name=pet?PETS[key].name:ITEMS[key].name,lines=popLines(key,tier,it,pet,po);
 p.innerHTML=`<i class="arrow"></i><div class="ph"><b>${name}</b><span>${TIERS[tier-1]}${sub}${pet?'':' '+tagDots(key)}</span></div><ul>${lines.map(l=>`<li>${l}</li>`).join('')}</ul><div class="pb">${btns}<button class="k-btn v" id="moreInfo" aria-label="Mais detalhes">Mais</button></div>`;
 p.style.setProperty('--tier',tierVar(tier));p.hidden=false;placePop(p,anc);const mb=$('#mline');if(mb)mb.hidden=true;}
function placePop(p,anc){const r=anc.getBoundingClientRect(),W=innerWidth,H=innerHeight,m=8;p.style.left='0px';p.style.top='0px';
 const pw=Math.min(300,W-2*m);p.style.width=pw+'px';const ph=p.offsetHeight;
 let x=Math.max(m,Math.min(W-pw-m,r.left+r.width/2-pw/2)),y=r.top-ph-12,below=false;
 if(y<m+4){y=r.bottom+12;below=true;}if(below&&y+ph>H-m){/* sem espaço acima nem abaixo: ao lado */y=Math.max(m,Math.min(H-ph-m,r.top));x=r.left>W/2?Math.max(m,r.left-pw-12):Math.min(W-pw-m,r.right+12);below=null;}
 p.style.left=x+'px';p.style.top=y+'px';p.dataset.side=below===null?'side':below?'below':'above';
 const ax=Math.max(14,Math.min(pw-14,r.left+r.width/2-x));p.style.setProperty('--ax',ax+'px');}
/* Gavetas não modais (≤ 50% da altura) */
function renderDrawer(){const d=$('#drawer');if(!DRAWER||!state.cls||state.phase==='class'){d.hidden=true;return;}d.hidden=false;
 d.querySelectorAll('.dpane').forEach(x=>x.hidden=x.dataset.pane!==DRAWER);
 $('#dtitle').textContent={pets:'Companheiros',mascate:'Mascate & Forja',aff:'Afinidades e bolsos',more:'Mais'}[DRAWER]||'';
 if(DRAWER==='aff')$('#affFull').innerHTML=affFull();
 if(DRAWER==='mascate')$('#mlineFull').innerHTML=`<b>Mascate Brás:</b> ${merchantLine()}`;
 if(DRAWER==='more')$('#moreList').innerHTML=`${state.skipOffer&&state.phase==='shop'?`<button class="k-btn o" id="skipShop">Pular loja: ${ETIQ[state.skipOffer].name}</button>`:''}
  <button class="k-btn v" data-pane="pets">Companheiros</button><button class="k-btn v" data-pane="mascate">Mascate & Forja</button><button class="k-btn v" data-pane="aff">Afinidades</button>
  <button class="k-btn v" id="recipesBtn">Receitas</button><button class="k-btn v" id="oddsBtn">Chances da loja</button><button class="k-btn v" id="copyBuild">Copiar build</button>
  <button class="k-btn v" id="missBtn">Missões${missionsReady()?' ●':''}</button><button class="k-btn v" id="optBtn">Opções</button><button class="k-btn v" id="helpBtn2">Menu</button>`;}
function openDrawer(p){DRAWER=DRAWER===p?null:p;state.sel=null;state.selMore=false;renderPop();renderSheet();renderDrawer();}
function closeDrawer(){if(!DRAWER)return;DRAWER=null;renderDrawer();}
function placeSellZone(){const z=$('#sellzone'),b=$('#base');if(!z||!b)return;const r=b.getBoundingClientRect();
 z.style.left=r.left+'px';z.style.top=r.top+'px';z.style.width=r.width+'px';z.style.height=r.height+'px';z.style.right='';}

/* ================= ACTIONS ================= */
let toastT=0;function toast(m,long){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,long?3200:1700);}
function snapshot(){state.undo=JSON.stringify(Object.assign({},state,{undo:null,sel:null}));}
function undo(){if(!state.undo)return;const u=JSON.parse(state.undo);setState(u);state.undo=null;sfx('click');toast('Ação desfeita');save();render();}
function mergeInto(target){target.tier++;mergedId=target.id;sfx('merge');state.merges=(state.merges||0)+1;codexAdd(target.key,'merged');mission('merge');
 if(target.tier===4){state.mood='legend';ach('legend');mission('legend');}toast(`Fundido! ${ITEMS[target.key].name} agora é ${TIERS[target.tier-1]}${target.tier===3?' e despertou':''}`);}
const canMerge=()=>state.chal!=='nofuse';
function addItem(key,tier){const twin=canMerge()&&(state.items.find(it=>it.key===key&&it.tier===tier&&it.tier<4&&it.where==='bag')||state.items.find(it=>it.key===key&&it.tier===tier&&it.tier<4));
 if(twin){mergeInto(twin);return true;}const d=ITEMS[key];const sp=findSpot('bag',d.w,d.h)||findSpot('chest',d.w,d.h);if(!sp)return false;
 state.items.push({id:state.nid++,key,tier,...sp});return true;}
function addPet(key,tier){const twin=state.pets.find(p=>p&&p.key===key&&p.tier===tier&&p.tier<4);if(twin){twin.tier++;sfx('merge');toast(`${PETS[key].name} evoluiu para ${TIERS[twin.tier-1]}!`);return true;}
 const i=state.pets.indexOf(null);if(i<0)return false;state.pets[i]={key,tier,ch:PET_CHARGES};return true;}
function buy(i){const o=state.shop[i];if(!o)return;const p=offerPrice(o);if(p>state.gold){toast('Ouro insuficiente');return;}
 snapshot();const ok=o.pet?addPet(o.key,o.tier):addItem(o.key,o.tier);if(!ok){state.undo=null;toast(o.pet?'Sem espaço para companheiros. Venda um.':'Sem espaço na mochila nem no baú');return;}
 state.gold-=p;state.shop[i]=null;if(!o.pet)codexAdd(o.key,'bought');sfx('buy');buzz(10);state.sel=null;save();render();sayMerchant();toastUndo(`Comprado: ${o.pet?PETS[o.key].name:ITEMS[o.key].name}`);snapNew();}
function sell(id,ok){const it=state.items.find(i=>i.id===id);if(!it)return;
 if(it.tier>=3&&!ok){confirmBox(`Vender ${ITEMS[it.key].name} ${TIERS[it.tier-1]}?`,`Itens Épicos e Lendários não voltam. Você recebe ${sellPrice(it.key,it.tier)} de ouro.`,'Vender',()=>sell(id,true));return;}
 snapshot();const v=sellPrice(it.key,it.tier);state.gold+=v;state.items=state.items.filter(i=>i!==it);sfx('coin');buzz(10);state.sel=null;save();render();sayMerchant();toastUndo(`Vendido por ${v} de ouro`);}
function sellPet(i,ok){const p=state.pets[i];if(!p)return;if(p.tier>=3&&!ok){confirmBox(`Vender ${PETS[p.key].name}?`,`Você recebe ${sellPrice(p.key,p.tier,true)} de ouro.`,'Vender',()=>sellPet(i,true));return;}
 snapshot();const v=sellPrice(p.key,p.tier,true);state.gold+=v;state.pets[i]=null;toast(`Vendido por ${v} de ouro`);state.sel=null;save();render();}
function rotate(id){const it=state.items.find(i=>i.id===id);if(!it)return;if(canPlace(it.where,it.x,it.y,it.h,it.w,it.id)){[it.w,it.h]=[it.h,it.w];sfx('click');save();render();}else toast('Sem espaço para girar aqui');}
function reroll(){const c=rerollCost();if(state.gold<c)return;state.gold-=c;if(state.freeReroll)state.freeReroll=false;else state.rerollN++;state.undo=null;rollShop();sfx('click');state.sel=null;save();render();sayMerchant();}
function hammer(id){const it=state.items.find(i=>i.id===id);if(!it||it.tier>=4||state.hammerUsed)return;const c=hammerCost(it);if(state.gold<c){toast('Ouro insuficiente');return;}
 snapshot();state.gold-=c;state.hammerUsed=true;state.freeHammer=false;it.tier++;mergedId=it.id;sfx('merge');codexAdd(it.key,'merged');if(it.tier===4){state.mood='legend';ach('legend');}
 toast(`Martelo do Mascate: ${ITEMS[it.key].name} agora é ${TIERS[it.tier-1]}`);state.sel=null;save();render();}
/* ITM-06: expansion with shape choice + pocket modifier */
function expandOptions(){const s=state.bag,o=[],pk=rshuffle(POCKETKEYS);
 if(s.cols<maxCols())o.push({dir:'col',pocket:pk[0]});if(s.rows<MAXROWS)o.push({dir:'row',pocket:pk[1]});
 if(o.length===1)o.push({dir:o[0].dir,pocket:pk[2]});return o;}
function expandScreen(free){if(!canExpand()){if(free)nextQueue();return;}
 if(!state.expandOpts)state.expandOpts=expandOptions();const b=state.bag;
 overlay(`<h2>Ampliar a mochila</h2><p class="muted center">Escolha o formato. A nova linha vira um bolso com um efeito.${free?' (De graça.)':` Custa ${BAGCOST[state.bagLvl]} de ouro.`}</p><div class="rewards">
 ${state.expandOpts.map((o,i)=>`<button class="k-card choice" data-exp="${i}" data-free="${free?1:''}"><i class="ico"><span class="shape" style="--c:${o.dir==='col'?b.cols+1:b.cols};--r:${o.dir==='row'?b.rows+1:b.rows};--pk:${POCKETS[o.pocket].col}" data-dir="${o.dir}"></span></i><div><b>${o.dir==='col'?'Mais uma coluna':'Mais uma fileira'} → ${o.dir==='col'?b.cols+1:b.cols}×${o.dir==='row'?b.rows+1:b.rows}</b><span>${POCKETS[o.pocket].name}: ${POCKETS[o.pocket].desc}.</span></div></button>`).join('')}</div>
 ${free?'':'<button class="k-btn v" id="closeOv">Agora não</button>'}`);
 document.querySelectorAll('.shape').forEach(el=>{const c=+el.style.getPropertyValue('--c'),r=+el.style.getPropertyValue('--r'),dir=el.dataset.dir;let h='';for(let y=0;y<r;y++)for(let x=0;x<c;x++)h+=`<i class="${(dir==='col'&&x===c-1)||(dir==='row'&&y===r-1)?'n':''}"></i>`;el.innerHTML=h;el.style.gridTemplateColumns=`repeat(${c},8px)`;});}
function doExpand(i,free){const o=state.expandOpts[i];if(!o)return;if(!free){const c=BAGCOST[state.bagLvl];if(state.gold<c)return;state.gold-=c;}
 const b=state.bag;if(o.dir==='col'){for(let y=0;y<b.rows;y++)b.pockets[K(b.cols,y)]=o.pocket;b.cols++;}else{for(let x=0;x<b.cols;x++)b.pockets[K(x,b.rows)]=o.pocket;b.rows++;}
 state.bagLvl++;mission('expand');state.expandOpts=null;state.undo=null;sfx('merge');toast(`Mochila ${b.cols}×${b.rows} · ${POCKETS[o.pocket].name} · carga +1`);save();
 if(free)nextQueue();else{closeOverlay();render();}}
function petAct(i){const p=state.pets[i];if(!p||!(p.ch>0))return;const k=p.key;
 if(k==='raven'){state.freeReroll=true;toast('Corvo: a próxima troca de itens é grátis');}
 else if(k==='turtle'){state.extraLock=(state.extraLock||0)+1;toast('Tartaruga: pode reservar mais 1 item nesta parada');}
 else if(k==='salamander'){state.freeHammer=true;state.hammerUsed=false;toast('Salamandra: o Martelo está quente e de graça');}
 else if(k==='pixie'){state.gold+=3;toast('Fada: +3 de ouro');}
 else if(k==='owl'){const ix=state.shop.map((o,j)=>o&&!o.locked&&!o.pet?j:-1).filter(j=>j>=0);if(!ix.length){toast('Nada para trocar na loja');return;}const j=rpick(ix);state.shop[j]={key:rpick(shopPool()),tier:rollTier(2)};codexSee(state.shop[j].key);toast('Coruja: achou algo melhor na loja');}
 p.ch--;state.undo=null;sfx('trig');save();render();}
function skipShop(){const e=state.skipOffer;if(!e)return;confirmBox('Pular a loja desta parada?',`Os itens à venda somem e você ganha a ${ETIQ[e].name}: ${ETIQ[e].desc}.`,'Pular loja',()=>{
 state.shop=state.shop.map(()=>null);if(e==='ouro')state.gold+=8;else if(e==='trocas')state.etiq.trocas=true;else state.pendingEtiq=e;state.skipOffer=null;state.undo=null;sfx('trig');toast(ETIQ[e].name+' guardada');save();render();});}

/* ================= BATTLE FLOW ================= */
function fight(force){if(!makePlayer().weapons.some(w=>!w.nodmg)){toast('Coloque ao menos uma arma na mochila');return;}
 const cheap=state.shop.filter(Boolean).map(offerPrice);
 if(!force&&!state.noAsk&&!PROF.noAsk&&cheap.length&&Math.min(...cheap)<=state.gold){
  overlay(`<h2>Lutar já?</h2><p class="center">Você ainda tem <b>${state.gold}</b> de ouro e há itens que cabem no bolso. Guardar rende juros (+${interest()} agora).</p>
  <label class="chk"><input type="checkbox" id="noAskChk"> Não perguntar de novo</label><div class="two"><button class="btn primary" id="fightGo">Lutar assim mesmo</button><button class="btn" id="closeOv">Voltar à loja</button></div>`);return;}
 if(state.gold>=30)ach('rich');if(state.pets.filter(Boolean).length===3&&state.chal!=='nopets')ach('pets3');
 state.sel=null;state.undo=null;state.mood='';
 if(state.mode==='daily')state.pfPending=snapOf(state);/* prova do placar: a mochila exatamente como entrou nesta luta */
 state.phase='battle';B=newBattle();acc=0;V.p.dead=0;V.e.dead=0;V.parts=[];V.projs=[];
 const f=foeDef();if(f.art)codexFoe(f.art,false);closeOverlay();state.sel=null;state.selMore=false;if(typeof DRAWER!=='undefined'&&DRAWER)closeDrawer();BASEMODE='shop';render();}
let finishing=false;
function skip(){let g=0;while(!B.done&&g++<20000)step(B,.05);if(!B.done)B.done='lose';B.ev.length=0;}
setInterval(()=>{if(state&&state.phase==='battle'&&B&&B.done&&!finishing){finishing=true;setTimeout(()=>{finishing=false;finish();},700);}},100);
function forge(){const done=[];for(const r of readyRecipes()){const a=r.a;a.tier=r.tier;a.key=r.res;state.items=state.items.filter(i=>i!==r.b);done.push(`${ITEMS[r.a.key].name} (${TIERS[a.tier-1]})`);
 if(counts()){PROF.codex.recipes[r.res]=1;codexAdd(r.res,'forged');codexSee(r.res);}state.stats.forged.push(r.res);mission('forge');}
 if(done.length){achRetro();}return done;}
let lastFight=null;
function finish(){if(state.phase!=='battle')return;runFront();BASEMODE='shop';V.p.dead=0;V.e.dead=0;const win=B.done==='win',f=foeDef(),hpLeft=Math.max(0,Math.ceil(B.p.hp)),t=Math.round(B.t);
 sfx(win?'win':'lose');let forged=[];
 lastFight={stats:B.stats,es:B.es,log:B.log.slice(),blocked:B.blocked,t:B.t,foe:f.name,win};
 if(state.pfPending){state.proof=(state.proof||[]).concat([{k:state.pfPending,res:win?'win':'lose'}]).slice(-MAXFIGHTS);state.pfPending=null;}
 if(win){missionWin(f);state.wins++;state.winStreak++;state.lossStreak=0;state.stopLosses=0;forged=forge();state.mood='';
  for(const it of inWhere('bag')){const d=ITEMS[it.key];if(d.trig==='souls')it.souls=(it.souls||0)+1;if(d.grows)it.grow=Math.min(8,(it.grow||0)+1);codexAdd(it.key,'wins');}
  if(f.art)codexFoe(f.art,true);if(counts()){PROF.totalWins++;saveProf();}battleAch(f);}
 else{if(has('bigorna'))forged=forge();if(state.surv)state.survLives--;else state.lives--;state.lossStreak++;state.winStreak=0;state.stopLosses++;state.mood='loss';}
 const report=resultTables();
 // end conditions
 if(!state.surv&&state.wins>=GOAL){recordJourney(true);state.phase='end';save();endScreen(true,report);return;}
 if(state.surv&&state.wins>=SURV_GOAL){recordSurv();state.phase='end';save();endScreen(true,report);return;}
 if(state.surv&&state.survLives<=0){recordSurv();state.phase='end';save();endScreen(false,report);return;}
 if(!state.surv&&state.lives<=0){recordJourney(false);state.phase='end';save();endScreen(false,report);return;}
 const it=interest(),cons=win?0:(state.stopLosses===1?Math.max(0,2-(state.asc>=2?1:0)):0),bonus=win?2:0,base=income(),inc=base+it+cons+bonus;
 if(it>=interestCap()&&it>0)state.intMax=(state.intMax||0)+1;
 state.round++;state.gold+=inc;state.rerollN=0;state.hammerUsed=false;state.extraLock=0;state.freeReroll=false;state.expandOpts=null;rollShop();state.phase='shop';
 state.queue=[];
 if(win){if(f.elite&&!state.surv)state.queue.push('bless');if(state.wins===4&&!state.sub)state.queue.push('sub');if(state.wins===6)state.queue.push('event');
  state.skipOffer=[1,3,7].includes(state.wins)?rpick(ETIQKEYS):null;}
 save();
 const rule=win?'':(state.stopLosses===1?`Revanche: ${f.name} volta igual, sem ficar mais forte. Esta derrota custou 1 vida e paga ${cons} de consolo.`:`Segunda derrota seguida nesta parada: custou 1 vida e não paga consolo.`);
 overlay(`<h2 class="${win?'good':'bad'}">${win?'Vitória!':'Derrota'}</h2>
 <p>${win?`Você derrotou ${f.name} em ${t}s e terminou com ${hpLeft} de vida.`:`${f.name} venceu em ${t}s.`} ${rule}</p>
 ${forged.length?`<div class="k-card fg"><b>⚒ Forja</b>${forged.map(n=>`<span>Nasceu: ${n}</span>`).join('')}</div>`:''}
 ${report}
 <p class="muted">+${inc} de ouro: renda ${base}${it?`, juros ${it}`:''}${bonus?`, prêmio de vitória ${bonus}`:''}${cons?`, consolo ${cons}`:''}. Vidas: ${state.surv?state.survLives:state.lives}. Vitórias: ${state.wins}/${state.surv?SURV_GOAL:GOAL}.</p>
 <button class="k-btn g" id="next">${state.queue.length?{bless:'Escolher Bênção',sub:'Escolher subclasse',event:'Seguir pela estrada'}[state.queue[0]]:'Ir ao mercador'}</button>`);
 render();}
function resultTables(){const L=lastFight;if(!L)return '';
 return `<div class="k-seg rtabs" role="tablist"><button class="on" data-tab="p">Seus itens</button><button data-tab="e">Inimigo</button><button data-tab="log">Registro</button></div>
 <div class="k-card rp" data-p="p">${statTable(L.stats,true)}<p class="muted small">Dano que o seu escudo segurou: <b>${Math.round(L.blocked)}</b>.</p></div>
 <div class="k-card rp" data-p="e" hidden>${statTable(L.es,false)}</div>
 <div class="k-card rp" data-p="log" hidden><pre class="log">${L.log.join('\n').replace(/</g,'&lt;')}</pre><button class="k-btn v sm" id="copyLog">Copiar registro</button></div>`;}
function nextQueue(){runFront();const q=state.queue.shift();state.cur=q||null;save();if(!q){closeOverlay();render();return;}showCur();}
function showCur(){runFront();const q=state.cur;
 if(q==='bless')blessScreen();else if(q==='sub')subScreen();else if(q==='event')eventScreen();else if(q==='expandfree')expandScreen(true);else nextQueue();}
function blessScreen(){if(!state.reward){const silver=state.wins===9;const pool=Object.keys(BLESS).filter(k=>BLESS[k].t===(silver?'p':'b')&&!state.bless.includes(k)&&(!BLESS[k].ok||BLESS[k].ok(state)));state.reward=rshuffle(pool).slice(0,3);save();}
 overlay(`<h2>Bênção ${state.wins===9?'de Prata':'de Bronze'}</h2><p class="muted center">O figurão caiu. Escolha uma Bênção para o resto da jornada.</p><div class="rewards">
 ${state.reward.map(k=>`<button class="k-card choice" data-bless="${k}"><i class="ico"><img src="${spr('star')}" class="px" alt=""></i><div><b>${BLESS[k].name}</b><span>${BLESS[k].desc}</span></div></button>`).join('')}</div>`);}
function takeBless(k){state.bless.push(k);state.reward=null;sfx('merge');
 if(k==='alforje')state.queue.unshift('expandfree');
 if(k==='tesouro'){const key=rpick(SHOPKEYS);if(!addItem(key,3)){state.gold+=basePrice(key,3);toast('Sem espaço: virou ouro');}else toast(`Tesouro: ${ITEMS[key].name} Épico`);}
 if(k==='mascate')while(state.shop.length<shopSize()){const o={key:rpick(shopPool()),tier:rollTier()};state.shop.push(o);}
 if(state.bless.length>=3)ach('bless3');nextQueue();}
function subScreen(){const S=SUBS[state.cls];overlay(`<h2>Subclasse</h2><p class="muted center">Meio do caminho. ${CLASSES[state.cls].name} escolhe um rumo, e o Mascate adianta 6 de ouro para a viagem.</p><div class="rewards">
 ${S.map(s=>`<button class="k-card choice" data-sub="${s.id}"><i class="ico"><img src="a/h_${state.cls}.webp" alt="" style="${CLASSES[state.cls].flip?'transform:scaleX(-1)':''}"></i><div><b>${s.name}</b><span>${s.desc}</span></div></button>`).join('')}</div>`);}
function takeSub(id){state.sub=id;state.gold+=6;sfx('merge');toast(`${SUBOF(id).name} · +6 de ouro`);nextQueue();}
function eventScreen(){if(!state.event){let ks=Object.keys(EVENTS);if(!state.pets.some(Boolean))ks=ks.filter(k=>k!=='andarilho');state.event=rpick(ks);save();}
 const E=EVENTS[state.event];overlay(`<h2>${E.title}</h2><p class="story">${E.text}</p><div class="two"><button class="k-btn o" id="evA" ${state.event==='aposta'&&state.gold<5?'disabled':''}>${E.a}</button><button class="k-btn v" id="evB">${E.b}</button></div>`);}
function eventChoose(a){const e=state.event;state.event=null;
 if(a){if(e==='aposta'){state.gold-=5;if(R()<.5){const key=rpick(SHOPKEYS);if(addItem(key,2))toast(`Cara! ${ITEMS[key].name} Raro é seu`,1);else{state.gold+=basePrice(key,2);toast('Cara! Sem espaço: virou ouro');}}else toast('Coroa. O Mascate guarda as moedas, sorrindo.',1);}
  if(e==='altar'){const c=state.items.filter(i=>i.tier<4);state.maxHpMod=(state.maxHpMod||0)-8;if(c.length){const it=rpick(c);it.tier++;mergedId=it.id;toast(`${ITEMS[it.key].name} subiu para ${TIERS[it.tier-1]} · −8 de vida máxima`,1);}}
  if(e==='andarilho'){let w=-1;state.pets.forEach((p,i)=>{if(p&&(w<0||p.tier<state.pets[w].tier))w=i;});if(w>=0){toast(`${PETS[state.pets[w].key].name} seguiu com o andarilho · +10 de ouro`,1);state.pets[w]=null;state.gold+=10;}}}
 sfx('click');nextQueue();}
function endScreen(won,report){$('#app').classList.remove('in-battle');const surv=state.surv;const canSurv=won&&!surv&&state.mode!=='duel';
 const sc=score();
 overlay(`<h2 class="${won?'good':'bad'}">${surv?(won?'O Norte foi vencido':'Fim da Sobrevivência'):won?'A viagem terminou':'Fim da jornada'}</h2>
 <p class="story">${surv?STORY.surv:won?STORY.win:STORY.lose}</p>
 <p>${won&&!surv?`Vitória com ${state.lives} vida${state.lives>1?'s':''} sobrando, em ${state.round} rodadas.`:`Você chegou a ${state.wins} vitória${state.wins===1?'':'s'}${surv?` (parada ${state.wins} de ${SURV_GOAL})`:` de ${GOAL}`}.`}</p>
 <div class="k-card score"><small>Pontuação:</small><strong>${sc}</strong>${state.asc?`<em>(Ascensão ${state.asc}: +${state.asc*5}%)</em>`:''}</div>
 ${won&&!surv&&state.mode==='normal'&&state.asc<10?`<p class="bonus center">Ascensão ${Math.min(10,state.asc+1)} liberada para ${CLASSES[state.cls].name}.</p>`:''}
 ${state.mode==='seed'?'<p class="muted">Partida com seed manual: não conta para Ascensão, Codex nem conquistas.</p>':''}
 ${report||''}
 <button class="k-btn o" id="shareBtn">📷 Compartilhar imagem do resultado</button>
 <div class="two"><button class="k-btn v" id="copyBuild">Copiar código da build</button>${canSurv?'<button class="k-btn ad" id="goSurv">Continuar: Sobrevivência</button>':''}</div>
 <button class="k-btn g" id="again">Voltar ao início</button>`);}
function startSurvival(){runFront();state.surv=true;state.survLives=3;state.survRoute=[0,1,2,3].map(()=>({s:5+Math.floor(R()*4),v:Math.floor(R()*3)}));
 state.phase='shop';state.round++;state.gold+=income()+interest();state.rerollN=0;state.hammerUsed=false;state.queue=[];state.skipOffer=null;rollShop();save();closeOverlay();toast('Sobrevivência: 3 vidas até a parada 14',1);render();}
function score(){const won=state.wins>=GOAL;return Math.round((state.wins*100+(won?250:0)+(state.surv?(state.wins-GOAL)*150:0)+(state.surv?state.survLives:state.lives)*25)*(1+.05*state.asc));}

/* ================= PROFILE UPDATES ================= */
function ach(id){if(!counts()||PROF.ach[id])return;const a=ACH.find(x=>x[0]===id);if(!a)return;PROF.ach[id]=Date.now();saveProf();setTimeout(()=>toast('🏆 Conquista: '+a[1],1),400);
 if(id==='frostwin')setTimeout(()=>toast('Coruja das Neves liberada na loja',1),2200);}
function achRetro(){if(!counts())return;const r=Object.keys(PROF.codex.recipes);if(r.length>=1)ach('forge1');if(r.length>=6)ach('forge6');if(RECIPES.every(x=>PROF.codex.recipes[x[2]]))ach('forge_all');
 if(Object.values(PROF.codex.items).filter(x=>x.seen||x.bought).length>=40)ach('codex40');if(Object.values(PROF.codex.foes).filter(x=>x.beat).length>=20)ach('foes20');}
function battleAch(f){ach('first_win');const bag=inWhere('bag');if(bag.filter(i=>i.tier>=4).length>=3)ach('legend3');
 const sv=k=>(B.stats[k]&&B.stats[k].dmg)||0;if(sv('burn')>=100)ach('burn100');if(sv('poison')>=100)ach('poison100');
 if(Object.values(B.stats).reduce((a,s)=>a+(s.frost||0),0)>=20)ach('frost20');if(bag.filter(i=>hasTag(i,'gelo')).length>=3)ach('frostwin');
 if(B.combust>=3)ach('combust3');if(B.t<6)ach('fast');if(B.t>40)ach('fatigue_win');if(state.bagLvl>=MAXEXP)ach('full_bag');if(f.ghost)ach('duel');achRetro();}
function recordJourney(won){if(state.recorded)return;state.recorded=true;
 const sc=score(),cls=state.cls;PROF.best=Math.max(PROF.best,state.wins);
 if(counts()&&won){PROF.journeys++;PROF.classWins[cls]=(PROF.classWins[cls]||0)+1;ach('journey');if(CLASSKEYS.every(k=>PROF.classWins[k]))ach('all_classes');
  if(state.lives===state.maxLives)ach('flawless');if(!state.merges)ach('nofuse_win');
  if(state.mode==='normal'){if(state.asc>=ascMax(cls))PROF.asc[cls]=Math.min(10,state.asc+1);PROF.sticker[cls]=Math.max(PROF.sticker[cls]==null?-1:PROF.sticker[cls],state.asc);
   if(state.asc>=1)ach('asc1');if(state.asc>=5)ach('asc5');if(state.asc>=10)ach('asc10');}
  if(state.mode==='challenge'&&state.chal){PROF.chalDone[state.chal]=1;ach('chal1');if(CHALLENGES.every(c=>PROF.chalDone[c.id]))ach('chal_all');}}
 if(state.mode==='daily'){const d=runDay();PROF.daily[d]=Math.max(PROF.daily[d]||0,sc);ach('daily');mission('daily');boardPost(sc);}
 if(won)mission('journey');
 PROF.history.unshift({d:Date.now(),cls,asc:state.asc,mode:state.mode,chal:state.chal,wins:state.wins,lives:state.lives,won,surv:0,seed:state.seed,score:sc,sub:state.sub,
  build:inWhere('bag').map(i=>[i.key,i.tier]),code:buildCode()});PROF.history=PROF.history.slice(0,20);saveProf();
 if(won&&counts())ghostPost();runPost(won);}
function recordSurv(){const h=PROF.history[0];PROF.bestSurv=Math.max(PROF.bestSurv||0,state.wins);if(state.wins>=SURV_GOAL)ach('surv');
 if(h&&state.recorded){h.surv=state.wins;h.score=score();h.build=inWhere('bag').map(i=>[i.key,i.tier]);h.code=buildCode();}
 if(state.mode==='daily'){const d=runDay(),sc=score();PROF.daily[d]=Math.max(PROF.daily[d]||0,sc);boardPost(sc);}saveProf();}
/* data do Diário desta partida (a seed é 'D'+data), mesmo que ela termine depois da meia-noite UTC */
function runDay(){return state&&/^D\d{4}-\d\d-\d\d$/.test(state.seed||'')?state.seed.slice(1):todayStr();}
/* MOD-04: build codes */
function buildCode(s){s=s||state;const o={v:6,c:s.cls,b:[s.bag.cols,s.bag.rows,s.bag.pockets],lv:s.bagLvl,i:s.items.filter(i=>i.where==='bag').map(i=>[i.key,i.tier,i.x,i.y,i.w,i.h]),p:s.pets.map(p=>p?[p.key,p.tier]:0),s:s.sub,bl:s.bless};
 return 'ALF6.'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function parseCode(t){try{t=(t||'').trim();if(!t.startsWith('ALF6.'))return null;const o=JSON.parse(decodeURIComponent(escape(atob(t.slice(5)))));
 if(!o||!CLASSES[o.c]||!Array.isArray(o.i)||!Array.isArray(o.b))return null;o.i=o.i.filter(a=>Array.isArray(a)&&ITEMS[a[0]]&&a[1]>=1&&a[1]<=4);if(!o.i.some(a=>ITEMS[a[0]].type==='weapon'))return null;
 o.p=(o.p||[]).map(p=>p&&PETS[p[0]]?p:0);o.bl=(o.bl||[]).filter(k=>BLESS[k]);
 /* a mochila precisa caber nas regras (encaixe, tamanho, raridades possíveis para uma jornada); Ascensão 10 é o teto mais folgado */
 if(!ghostPlausible(o,10).ok)return null;return o;}catch(e){return null;}}
function copyText(t,msg){const done=()=>toast(msg||'Copiado');try{navigator.clipboard.writeText(t).then(done,()=>fallbackCopy(t,done));}catch(e){fallbackCopy(t,done);}}
function fallbackCopy(t,done){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');done();}catch(e){toast('Não deu para copiar; selecione o texto manualmente');}a.remove();}

/* ================= v6.2: resposta ao toque, áudio, nuvem, placar e missões ================= */
var VOLFX=.7,ECO=false,SNAP=null;
function applyOpts(){const o=OPT();VOLFX=o.volFx/100;ECO=!!o.eco;document.body.classList.toggle('eco',ECO);document.body.classList.toggle('cb',!!o.cb);applyAudio();}
/* ----- resposta ao soltar ----- */
function flashItem(id){requestAnimationFrame(()=>{const el=document.querySelector(`.item[data-id="${id}"]`);if(!el)return;el.classList.remove('snap');void el.offsetWidth;el.classList.add('snap');setTimeout(()=>el.classList.remove('snap'),450);});}
function snapNew(){const it=state.items[state.items.length-1];if(it){SNAP=null;flashItem(it.id);}}
function shakeGrid(w){const g=$('#'+w);if(!g)return;g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake');setTimeout(()=>g.classList.remove('shake'),380);}
function toastUndo(m){const t=$('#toast');t.textContent='';const s=document.createElement('span');s.textContent=m;t.appendChild(s);
 if(state.undo){const b=document.createElement('button');b.id='undoT';b.className='k-btn o tbtn';b.textContent='Desfazer';t.appendChild(b);}
 t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3600);}
function skipEnd(){if(state.phase==='battle'&&B&&B.done)finish();}
/* ----- destaque na loja: fusão possível ou receita com algo que você tem ----- */
function shopHint(s){if(!s||s.pet||!state.cls)return '';const own=state.items;
 if(s.tier<4&&own.some(i=>i.key===s.key&&i.tier===s.tier))return '<span class="hint up" title="Funde com um item seu">⇈</span>';
 if(RECIPES.some(r=>(r[0]===s.key&&own.some(i=>i.key===r[1]))||(r[1]===s.key&&own.some(i=>i.key===r[0]))))return '<span class="hint rc" title="Forma receita com um item seu">⚒</span>';return '';}
/* ----- música ambiente (gerada, sem arquivos) ----- */
var MUS={on:false,armed:false,timer:0,next:0,step:0,gain:null,drones:[],last:4};
const SCALE=[146.8,164.8,174.6,196,220,261.6,293.7,329.6,349.2,392];
function applyAudio(){const v=(OPT().volMus||0)/100;
 if(muted||!v||document.hidden||!MUS.armed||PORTRAIT_ONLY.matches){stopMusic();return;}
 if(!MUS.on)startMusic();if(MUS.gain)MUS.gain.gain.setTargetAtTime(v*.16,AC.currentTime,.3);}
function startMusic(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){return;}
 const g=AC.createGain();g.gain.value=0;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;g.connect(lp);lp.connect(AC.destination);MUS.gain=g;
 MUS.drones=[73.4,110].map((f,i)=>{const o=AC.createOscillator(),og=AC.createGain();o.type='sine';o.frequency.value=f;og.gain.value=i?.18:.28;o.connect(og);og.connect(g);o.start();return {o,og};});
 MUS.on=true;MUS.next=AC.currentTime+.1;MUS.timer=setInterval(musTick,180);g.gain.setTargetAtTime((OPT().volMus/100)*.16,AC.currentTime,.8);}
function stopMusic(){if(!MUS.on)return;clearInterval(MUS.timer);const g=MUS.gain;try{g.gain.setTargetAtTime(0,AC.currentTime,.2);}catch(e){}
 const ds=MUS.drones;setTimeout(()=>{ds.forEach(d=>{try{d.o.stop();}catch(e){}});try{g.disconnect();}catch(e){}},700);MUS.on=false;MUS.drones=[];MUS.gain=null;}
function musTick(){if(!MUS.on||!AC)return;const beat=(state&&state.phase==='battle'?.25:.34);
 while(MUS.next<AC.currentTime+.6){const st=MUS.step++;const bar=Math.floor(st/8);
  if(st%8===0){const root=[73.4,65.4,58.3,65.4][bar%4];MUS.drones[0]&&MUS.drones[0].o.frequency.setTargetAtTime(root,MUS.next,.4);MUS.drones[1]&&MUS.drones[1].o.frequency.setTargetAtTime(root*1.5,MUS.next,.4);}
  if(Math.random()<(st%2?.45:.7)){MUS.last=Math.max(0,Math.min(SCALE.length-1,MUS.last+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)]));pluck(SCALE[MUS.last]*(st%16===0?.5:1),MUS.next);}
  MUS.next+=beat;}}
function pluck(f,t){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(g);g.connect(MUS.gain);o.start(t);o.stop(t+1);}
document.addEventListener('pointerdown',()=>{if(!MUS.armed){MUS.armed=true;applyAudio();}},{capture:true});
document.addEventListener('visibilitychange',()=>{applyAudio();if(document.hidden)cloudFlush();});
if(PORTRAIT_ONLY.addEventListener)PORTRAIT_ONLY.addEventListener('change',applyAudio);
/* ----- progresso na nuvem: conta de convidado no servidor (js/cloud.js) ----- */
var CLOUD={ready:false,uid:null,busy:false,dirty:false,timer:0};
const API=window.AlforjeCloud||null;
function markDirty(){try{localStorage.setItem('alforje-ts',String(Date.now()));}catch(e){}if(!CLOUD.ready)return;CLOUD.dirty=true;clearTimeout(CLOUD.timer);CLOUD.timer=setTimeout(cloudPush,4000);}
function cloudFlush(){if(CLOUD.ready&&CLOUD.dirty){clearTimeout(CLOUD.timer);cloudPush();}}
function runJSON(){try{return state&&state.phase!=='battle'?JSON.stringify(Object.assign({},state,{undo:null,sel:null,selMore:false})):(localStorage.getItem(RUNKEY)||'');}catch(e){return '';}}
async function cloudPush(){if(!CLOUD.ready||CLOUD.busy||!CLOUD.dirty)return;CLOUD.busy=true;CLOUD.dirty=false;
 try{let lt=0;try{lt=+localStorage.getItem('alforje-ts')||Date.now();}catch(e){lt=Date.now();}
  await API.pushSave({t:lt,v:VER,prof:JSON.stringify(PROF),run:runJSON()});}
 catch(e){CLOUD.dirty=true;}
 CLOUD.busy=false;if(CLOUD.dirty&&CLOUD.ready)CLOUD.timer=setTimeout(cloudPush,6000);}
async function cloudInit(){try{if(!API)return;const uid=await API.init();if(!uid)return;CLOUD.uid=uid;
 const d=await API.loadSave();CLOUD.ready=true;
 let lt=0;try{lt=+localStorage.getItem('alforje-ts')||0;}catch(e){}
 const ct=d?(+d.t||0):0;
 if(d&&d.prof&&ct>lt+2000)cloudAdopt(d);else if(lt>ct&&(PROF.totalWins||PROF.history.length||(state&&state.cls))){CLOUD.dirty=true;cloudPush();}
 }catch(e){}}
function cloudAdopt(d){if(state&&state.phase==='battle'){setTimeout(()=>cloudAdopt(d),3000);return;}
 try{const p=JSON.parse(d.prof);if(!p||!p.codex)return;PROF=Object.assign(freshProf(),p);
  let s=null;if(d.run){try{s=JSON.parse(d.run);}catch(e){}}
  if(s&&s.items&&s.bag){if(s.phase==='battle'||s.phase==='result')s.phase='shop';setState(s);}
  try{localStorage.setItem(PROFKEY,d.prof);if(d.run)localStorage.setItem(RUNKEY,d.run);localStorage.setItem('alforje-ts',String(d.t));}catch(e){}
  applyOpts();applySkin();closeOverlay();resumeView();toast('☁ Progresso recuperado da nuvem',1);}catch(e){}}
function resumeView(){if(!state.cls||state.phase==='class'){classScreen();return;}showRun();
 if(state.phase==='end'){render();endScreen(state.surv?state.wins>=SURV_GOAL:state.wins>=GOAL,'');}
 else{render();if(state.cur)showCur();else if(state.queue&&state.queue.length)nextQueue();}}
/* ----- placar do Desafio Diário (compartilhado) ----- */
const dayIxOf=d=>Math.round(Date.parse(d+'T00:00:00Z')/864e5);
const OFFLINE_MSG='Sem conexão com o servidor agora. Seu progresso continua salvo neste aparelho.';
/* o registro leva a prova (a mochila de cada luta); o servidor refaz as lutas e só grava o que confere */
async function boardPost(sc){if(!CLOUD.ready||!sc||state.mode!=='daily')return;
 const d=runDay(),entry={v:2,d,s:sc,cls:state.cls||'',w:state.wins||0,t:Date.now(),pf:state.proof||[]};
 if(!verifyDaily(entry,dayIxOf(d)).ok)return;/* partida sem prova completa (por exemplo, começada antes desta versão): não vai ao placar */
 try{const r=await API.submit('daily',{entry});
  if(r&&r.ok&&!r.kept)toast('🏆 Marca registrada no placar de hoje',1);else if(r&&!r.ok)toast('O placar recusou esta marca: '+r.why,1);}catch(e){}}
async function boardScreen(){page(`<h2>Placar de hoje</h2><div class="k-card pc"><p class="muted center small">${todayStr()} (UTC) · mesma seed e mesma classe para todos · cada marca é conferida no servidor</p><div id="boardList" class="board"><p class="muted center">Carregando…</p></div><div id="nameBox" class="namebox"></div></div>${backBtn()}`,'placar');
 const el=()=>$('#boardList');
 if(!CLOUD.ready){el().innerHTML=`<p class="muted center">${OFFLINE_MSG} Seu melhor de hoje: <b>${PROF.daily[todayStr()]||0}</b>.</p>`;return;}
 nameEditor();
 try{const rows=await API.board(todayStr(),30);const box=el();if(!box)return;
  if(!rows.length){box.innerHTML='<p class="muted center">Ninguém terminou o Diário hoje ainda. A primeira marca pode ser sua.</p>';return;}
  let ps={};try{ps=await API.names(rows.map(r=>r.user_id));}catch(e){}
  box.textContent='';rows.forEach((r,i)=>{const me=r.user_id===CLOUD.uid,row=document.createElement('div');row.className='brow'+(me?' me':'');
   const pos=document.createElement('b');pos.textContent=(i+1)+'º';const nm=document.createElement('span');nm.textContent=ps[r.user_id]||(me?'Você':'Viajante');
   const info=document.createElement('small');info.textContent=`${CLASSES[r.cls]?CLASSES[r.cls].name:''} · ${r.wins||0} vit.`;const sc=document.createElement('em');sc.textContent=r.score||0;
   row.append(pos,nm,info,sc);box.appendChild(row);});}
 catch(e){const box=el();if(box)box.innerHTML='<p class="muted center">Não deu para carregar o placar agora. Tente de novo em instantes.</p>';}}
/* nome que aparece no placar e no duelo; quem não escolhe aparece como "Viajante" */
async function nameEditor(){const box=$('#nameBox');if(!box)return;let cur='';try{cur=(await API.names([CLOUD.uid]))[CLOUD.uid]||'';}catch(e){}
 box.innerHTML=`<label class="fld">Seu nome no placar <input id="nameIn" maxlength="24" placeholder="Viajante"></label><button class="k-btn v sm" id="nameSave">Salvar nome</button>`;
 const inp=$('#nameIn');inp.value=cur;
 $('#nameSave').addEventListener('click',async()=>{const ok=await API.setName(inp.value);toast(ok?'Nome salvo':'Não deu para salvar o nome agora');if(ok)boardScreen();});}
/* ----- missões semanais e visuais de mochila ----- */
const MPOOL={win8:{t:'Vença 8 lutas',n:8},elite2:{t:'Derrote 2 elites ou chefes',n:2},forge2:{t:'Forje 2 itens',n:2},merge6:{t:'Funda itens 6 vezes',n:6},
 legend:{t:'Crie um item Lendário',n:1},daily:{t:'Termine um Desafio Diário',n:1},journey:{t:'Complete uma jornada',n:1},expand3:{t:'Amplie a mochila 3 vezes',n:3},
 gelo:{t:'Vença uma luta com 3 itens de Gelo na mochila',n:1},fogo:{t:'Vença uma luta com 3 itens de Fogo na mochila',n:1},veneno:{t:'Vença uma luta com 3 itens de Veneno na mochila',n:1},
 sagrado:{t:'Vença uma luta com 3 itens Sagrados na mochila',n:1},pets3:{t:'Vença uma luta com 3 companheiros',n:1},flaw:{t:'Vença 3 lutas seguidas',n:1}};
const MEV={merge:['merge6'],legend:['legend'],expand:['expand3'],forge:['forge2'],daily:['daily'],journey:['journey']};
const SKINS=[['couro','Couro',0],['carvalho','Carvalho',1],['geada','Geada',3],['brasa','Brasa',5],['ouro','Ouro velho',8],['noite','Noite',12]];
function weekKey(){const n=new Date();return Math.floor((Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())/864e5+3)/7);}
function ensureMiss(){const wk=weekKey();if(PROF.miss&&PROF.miss.wk===wk)return PROF.miss;let r=hashStr('semana'+wk)||7;const keys=Object.keys(MPOOL),ids=[];
 while(ids.length<3){r=(r*1103515245+12345)>>>0;const k=keys[r%keys.length];if(!ids.includes(k))ids.push(k);}PROF.miss={wk,ids,p:{},done:{}};return PROF.miss;}
function missionAdd(id){const M=ensureMiss();if(!M.ids.includes(id)||M.done[id])return;M.p[id]=(M.p[id]||0)+1;
 if(M.p[id]>=MPOOL[id].n){M.done[id]=1;PROF.seals=(PROF.seals||0)+1;sfx('win');toast(`Missão cumprida: ${MPOOL[id].t} · +1 selo`,1);
  const sk=SKINS.find(s=>s[2]===PROF.seals);if(sk)setTimeout(()=>toast(`Novo visual de mochila: ${sk[1]}. Escolha em Missões.`,1),3300);}saveProf();}
function mission(type){if(!counts())return;(MEV[type]||[]).forEach(missionAdd);}
function missionWin(f){if(!counts())return;missionAdd('win8');if(f&&(f.elite||f.boss))missionAdd('elite2');const bag=inWhere('bag');
 for(const tg of ['gelo','fogo','veneno','sagrado'])if(bag.filter(i=>hasTag(i,tg)).length>=3)missionAdd(tg);
 if(state.pets.filter(Boolean).length>=3)missionAdd('pets3');if((state.winStreak||0)+1>=3)missionAdd('flaw');}
function missionsReady(){const n=SKINS.filter(s=>s[2]<=(PROF.seals||0)).length;return n>(PROF.skinSeen||1);}
function applySkin(){document.body.dataset.skin=PROF.skin||'couro';}
function missionsScreen(){const M=ensureMiss(),seals=PROF.seals||0;PROF.skinSeen=SKINS.filter(s=>s[2]<=seals).length;saveProf();
 const next=SKINS.find(s=>s[2]>seals);
 page(`<h2>Missões da semana</h2><div class="k-card pc"><p class="muted center small">Renovam toda segunda-feira. Cada missão cumprida dá 1 selo; selos liberam visuais de mochila. Partidas com seed manual não contam.</p>
 <div class="missions">${M.ids.map(id=>{const m=MPOOL[id],p=Math.min(m.n,M.p[id]||0),done=M.done[id];return `<div class="mrow2${done?' done':''}"><b>${done?'✓ ':''}${m.t}</b><div class="mbar"><i style="width:${p/m.n*100}%"></i></div><span>${p}/${m.n}</span></div>`;}).join('')}</div>
 <h4>Selos: ${seals}${next?` · próximo visual com ${next[2]}`:''}</h4>
 <div class="skins">${SKINS.map(([k,n,need])=>{const open=seals>=need;return `<button class="skin${PROF.skin===k?' on':''}" data-skin="${k}" ${open?'':'disabled'} aria-label="Visual ${n}${open?'':', precisa de '+need+' selos'}"><span class="sw" data-sk="${k}"><i></i><i></i><i></i><i></i></span><b>${n}</b><small>${open?(PROF.skin===k?'em uso':'usar'):need+' selos'}</small></button>`;}).join('')}</div></div>
 ${backBtn()}`,'missoes');}

/* ================= v7: partida guiada, duelo automático, imagem de resultado, estatísticas ================= */
/* ----- primeira partida guiada: destaca o próximo passo na própria tela ----- */
var COACH={step:-1,base:0};
const COACH_TXT=[['.card[data-idx]:not(.sold)','Segure um item da loja e arraste até a mochila. Se preferir, toque nele e use Comprar.'],
 ['#fight','Quando estiver pronto, toque em LUTAR. Só o que está na mochila luta.'],
 ['#bag','Toque num item da mochila: a ficha mostra o que ele faz. Itens encostados do jeito certo se ajudam, e as linhas verdes mostram isso.']];
function coachStart(){COACH.step=0;COACH.base=state.items.length;coachTick();}
function coachEnd(){COACH.step=-1;PROF.tut=1;saveProf();const c=$('#coach');if(c)c.hidden=true;}
function coachTick(){const c=$('#coach');if(!c)return;if(COACH.step<0||!state||!state.cls){c.hidden=true;return;}
 if(COACH.step===0&&state.items.length>COACH.base)COACH.step=1;
 if(COACH.step===1&&state.phase==='battle')COACH.step=2;
 if(state.phase!=='shop'||!$('#overlay').hidden||!$('#menu').hidden||(typeof drag!=='undefined'&&drag&&drag.started)){c.hidden=true;return;}
 const [sel,txt]=COACH_TXT[COACH.step];const el=document.querySelector(sel);if(!el){c.hidden=true;return;}
 const r=el.getBoundingClientRect();if(!r.width){c.hidden=true;return;}const pad=6;
 c.hidden=false;const h=c.querySelector('.hole');Object.assign(h.style,{left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(r.height+pad*2)+'px'});
 const b=c.querySelector('.cbub');b.querySelector('p').textContent=txt;b.querySelector('small').textContent=`Passo ${COACH.step+1} de 3`;
 b.querySelector('#coachOk').hidden=COACH.step!==2;
 const bh=b.offsetHeight||120,below=r.top<innerHeight/2;b.style.top=(below?Math.min(innerHeight-bh-8,r.bottom+14):Math.max(8,r.top-bh-14))+'px';
 b.dataset.side=below?'below':'above';b.style.setProperty('--ax',Math.max(22,Math.min(b.offsetWidth-22,r.left+r.width/2-b.getBoundingClientRect().left))+'px');}
setInterval(()=>{if(COACH.step>=0)coachTick();},500);
/* ----- duelo automático: fantasmas de outros jogadores ----- */
async function ghostPost(){if(!CLOUD.ready||state.mode==='duel'||state.mode==='seed')return;
 try{await API.submit('ghost',{code:buildCode(),asc:state.asc||0});}catch(e){}}
async function ghostPick(){if(!CLOUD.ready){toast(OFFLINE_MSG,1);return;}
 try{const L=(await API.ghosts(300)).filter(g=>g.user_id!==CLOUD.uid&&parseCode(g.code));
  if(!L.length){toast('Ainda não há fantasmas de outros jogadores. Vença uma jornada para deixar o seu.',1);return;}
  const g=L[Math.floor(Math.random()*L.length)];let nm='';try{nm=(await API.names([g.user_id]))[g.user_id]||'';}catch(e){}
  MENU.duel=g.code;MENU.ghostName=(nm||'Um viajante')+` · ${CLASSES[g.cls]?CLASSES[g.cls].name:''} · ${g.wins||0} vitórias`;classScreen();}
 catch(e){toast('Não deu para buscar fantasmas agora');}}
/* ----- estatísticas de partidas (para ajustar o balanço) ----- */
async function runPost(won){if(!CLOUD.ready||OPT().stats===0)return;
 try{await API.postRun({v:VER,c:state.cls,sub:state.sub||'',a:state.asc||0,m:state.mode,w:state.wins,won:won?1:0,r:state.round,it:inWhere('bag').map(i=>i.key+':'+i.tier).join(',')});}catch(e){}}
/* ----- imagem de resultado para compartilhar ----- */
function loadImg(src){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});}
async function shareCard(){toast('Montando a imagem…');const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const won=state.surv?state.wins>=SURV_GOAL:state.wins>=GOAL;
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a190d');g.addColorStop(1,'#0b0705');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.strokeStyle='#e2a43c';x.lineWidth=10;x.strokeRect(24,24,W-48,H-48);x.strokeStyle='#6b4428';x.lineWidth=4;x.strokeRect(44,44,W-88,H-88);
 x.textAlign='center';x.fillStyle='#f2c14e';x.font="900 92px Cinzel, Georgia, serif";x.fillText('ALFORJE',W/2,160);
 x.fillStyle=won?'#8ff09a':'#ff9a7a';x.font="700 46px Cinzel, Georgia, serif";x.fillText(won?(state.surv?'O Norte foi vencido':'Jornada vencida!'):'Fim da jornada',W/2,232);
 const por=await loadImg(`a/hp_${state.cls}_idle.webp`)||await loadImg(`a/h_${state.cls}.webp`);
 if(por){const k=Math.min(300/por.height,300/por.width);x.imageSmoothingEnabled=true;x.drawImage(por,150-por.width*k/2+60,270,por.width*k,por.height*k);}
 x.textAlign='left';x.fillStyle='#f4e6c8';x.font="700 44px 'Alegreya Sans', system-ui, sans-serif";
 const lines=[`${CLASSES[state.cls].name}${state.sub&&SUBOF(state.sub)?' · '+SUBOF(state.sub).name:''}`,`${state.wins} vitórias${state.asc?' · Ascensão '+state.asc:''}`,`${score()} pontos`,
  state.mode==='daily'?`Desafio Diário ${todayStr()}`:state.mode==='seed'?`Seed ${state.seed}`:`${state.lives} vida${state.lives===1?'':'s'} sobrando`];
 lines.forEach((l,i)=>{x.fillStyle=i===2?'#f2c14e':'#f4e6c8';x.fillText(l,470,330+i*66);});
 const D=dims('bag'),cs=Math.min(110,Math.floor(900/D.cols),Math.floor(560/D.rows)),gx=(W-D.cols*cs)/2,gy=640;
 for(let yy=0;yy<D.rows;yy++)for(let xx=0;xx<D.cols;xx++){x.fillStyle='#1f130b';x.fillRect(gx+xx*cs+3,gy+yy*cs+3,cs-6,cs-6);x.strokeStyle='#5a3a20';x.lineWidth=3;x.strokeRect(gx+xx*cs+3,gy+yy*cs+3,cs-6,cs-6);}
 const TC=['#c8b89a','#4aa8ff','#b462ff','#ffc23a'];
 for(const it of inWhere('bag')){const im=await loadImg(artURL(it.key,it.tier));const bx=gx+it.x*cs+6,by=gy+it.y*cs+6,bw=it.w*cs-12,bh=it.h*cs-12;
  x.fillStyle='rgba(60,36,20,.85)';x.fillRect(bx,by,bw,bh);x.strokeStyle=TC[it.tier-1];x.lineWidth=5;x.strokeRect(bx,by,bw,bh);
  if(im){const rot=it.w!==ITEMS[it.key].w;x.save();x.translate(bx+bw/2,by+bh/2);if(rot)x.rotate(Math.PI/2);const ww=rot?bh:bw,hh=rot?bw:bh,k=Math.min(ww*.86/im.width,hh*.86/im.height);x.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);x.restore();}}
 x.textAlign='center';x.fillStyle='#b59a76';x.font="500 34px 'Alegreya Sans', system-ui, sans-serif";x.fillText('Monte a sua mochila. Será que você chega mais longe?',W/2,H-80);
 c.toBlob(async blob=>{if(!blob){toast('Não deu para criar a imagem');return;}
  try{const f=new File([blob],'alforje.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Alforje'});return;}}catch(e){}
  const u=URL.createObjectURL(blob);overlay(`<h2>Sua jornada</h2><img src="${u}" alt="Imagem do resultado" style="width:100%;border-radius:6px"><p class="muted center small">Segure a imagem para salvar ou compartilhar.</p><a class="btn gold" download="alforje-${state.cls}-${state.wins}v.png" href="${u}">Baixar imagem</a>${backBtn()}`);},'image/png');}

/* ================= OVERLAYS & SCREENS ================= */
/* A janela: o 1º <h2> vira a fita (.bad vermelha de derrota, .good verde de vitória, padrão para o resto). O foco vai para a janela e fica preso nela. */
let overlayFrom=null;
function overlayScroll(){const o=$('#overlay'),m=o.firstChild;if(m&&m.classList)m.classList.toggle('scrolls',o.scrollHeight>o.clientHeight+1);}/* só rola => botão final grudado com fundo */
const overlayRO=new ResizeObserver(overlayScroll);
function overlay(html){const o=$('#overlay'),was=o.hidden;if(was)overlayFrom=document.activeElement;
 const m=/^\s*<h2(?: class="([^"]*)")?>/.exec(html);if(m)html=html.replace(m[0],`<h2 class="k-rib${m[1]?' '+m[1]:''}" id="dlgT">`);
 o.innerHTML=`<div class="modal k-win${was?' win-in':''}" role="dialog" aria-modal="true"${m?' aria-labelledby="dlgT"':''} tabindex="-1">${html}</div>`;o.hidden=false;$('#sheet').hidden=true;o.scrollTop=0;o.firstChild.focus({preventScroll:true});overlayScroll();overlayRO.disconnect();overlayRO.observe(o.firstChild);}
function closeOverlay(){$('#overlay').hidden=true;if(overlayFrom&&overlayFrom.isConnected&&overlayFrom.focus)overlayFrom.focus({preventScroll:true});overlayFrom=null;}
document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const o=$('#overlay');if(o.hidden)return;const m=o.firstChild;
 const f=[...o.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);
 if(!f.length){e.preventDefault();m.focus();return;}const a=document.activeElement,first=f[0],last=f[f.length-1];
 if(e.shiftKey&&(a===first||a===m||!o.contains(a))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(a===last||!o.contains(a))){e.preventDefault();first.focus();}});
let confirmFn=null;
function confirmBox(title,text,okLabel,fn){confirmFn=fn;overlay(`<h2>${title}</h2><p class="center">${text}</p><div class="two"><button class="k-btn g" id="cfOk">${okLabel}</button><button class="k-btn v" id="cfNo">Cancelar</button></div>`);}
const HOWTO=`<ol class="howto">
 <li><b>Compre</b> arrastando do Mercador para a Mochila (ou toque e use Comprar). Linhas verdes mostram sinergias; douradas, receitas.</li>
 <li><b>Alcance</b>: Pedra, Tocha, Veneno, Anel, Cristal e Água Benta nos lados; Trevo nas diagonais; Pena na fileira; Estandarte na coluna. As <b>Flâmulas</b> afetam todas as armas do tipo delas, em qualquer lugar.</li>
 <li><b>Tipos e Afinidades</b>: cada item tem até 2 tipos (Fogo, Gelo, Veneno, Metal, Sagrado, Natureza). 3 itens do mesmo tipo ativam um bônus; 5 ativam um bônus maior.</li>
 <li><b>Zonas e bolsos</b>: Elmo rende mais no TOPO; Botas só funcionam no FUNDO; armas no topo dão o primeiro golpe 0,2s mais cedo. Ao ampliar, a nova linha vira um bolso com efeito.</li>
 <li><b>Carga</b>: armas pesam. Passar do limite deixa todas 12% mais lentas por ponto. Cinto e Bainhas aliviam.</li>
 <li><b>Funda</b> iguais: Comum → Raro → Épico → Lendário. O <b>Martelo do Mascate</b> sobe 1 raridade por parada, pagando a diferença.</li>
 <li><b>Forje</b>: ingredientes encostados viram item novo ao vencer. Algumas receitas pedem um catalisador encostado, que não é consumido.</li>
 <li><b>Status</b>: queimadura (1s, diminui), veneno (2s, não diminui) e Gelo (−2% de velocidade por ponto) ignoram escudo. Purga quebra escudo, desliga reflexo e corta cura.</li>
 <li><b>Elites</b> (paradas 3, 6, 9) têm um modificador e dão uma <b>Bênção</b>. Na parada 5 você escolhe uma <b>subclasse</b>. Perder custa 1 vida; a revanche é contra o mesmo inimigo, e a 2ª derrota seguida na parada não paga consolo.</li>
 <li><b>Gatilhos</b> disparam o próprio efeito, mas nunca acionam outros gatilhos.</li></ol>`;
function recipeBook(){return `<div class="recipes">${RECIPES.map(r=>{const known=PROF.codex.recipes[r[2]];return `<div><img src="${artURL(r[0])}" alt="">${ITEMS[r[0]].name} + <img src="${artURL(r[1])}" alt="">${ITEMS[r[1]].name}${r[3]?` <span class="cat">(+ <img src="${artURL(r[3])}" alt="">${ITEMS[r[3]].name} encostado)</span>`:''} → <img src="${artURL(r[2])}" alt="" class="${known?'':'sil'}"><b>${known?ITEMS[r[2]].name:'???'}</b></div>`;}).join('')}</div><p class="muted small">Raridade do forjado = média dos dois ingredientes, arredondada para cima. Receitas forjadas ficam reveladas para sempre.</p>`;}
function oddsTable(){const rows=[];for(let s=1;s<=10;s++){const o=odds(s);rows.push(`<tr${s===curStop()?' class="cur"':''}><td>${s}</td>${o.map(v=>`<td>${v?v+'%':'–'}</td>`).join('')}</tr>`);}
 return `<table class="st odds"><thead><tr><th>Parada</th><th style="color:var(--t1)">Comum</th><th style="color:var(--t2)">Raro</th><th style="color:var(--t3)">Épico</th><th style="color:var(--t4)">Lendário</th></tr></thead><tbody>${rows.join('')}</tbody></table>
 <p class="muted small"><b>Loja neutra:</b> nenhuma classe muda as ofertas; o que aparece é sorte, do mesmo jeito para todos. 10% das ofertas vêm em promoção (preço = valor de venda). Trocar custa 1, 1, 2, 2 e depois 3 por parada. Você pode reservar até ${state&&state.cls?lockLimit():2} itens. ${state&&state.asc>=8?'Ascensão 8: Lendários só a partir da parada 9.':''}</p>`;}
const backBtn=()=>`<button class="k-btn v" id="back">Voltar</button>`;
/* Voltar e a aba Jogar: fora da jornada, a escolha de herói; dentro dela, de volta à jornada */
function backTo(){if(!state.cls||state.phase==='class')classScreen();else{closeOverlay();resumeView();}}
function runMenu(){overlay(`<h2>Menu</h2><div class="menu-grid">
 <button class="k-btn v" id="howBtn">Como jogar</button><button class="k-btn v" id="recipesBtn">Receitas</button><button class="k-btn v" id="oddsBtn">Chances da loja</button>
 <button class="k-btn v" id="codexBtn">Codex</button><button class="k-btn v" id="achBtn">Conquistas</button><button class="k-btn v" id="copyBuild">Copiar build</button>
 <button class="k-btn v" id="missBtn">Missões</button><button class="k-btn v" id="optBtn">Opções</button><button class="k-btn v" id="askBtn">${PROF.noAsk?'Confirmar luta: desligado':'Confirmar luta: ligado'}</button></div>
 <p class="muted small">Seed desta jornada: <code>${state.seed}</code>${state.mode==='seed'?' (manual: não conta para progresso)':''}</p>
 <div class="two"><button class="k-btn g" id="closeOv">Voltar ao jogo</button><button class="k-btn v" id="abandon">Abandonar jornada</button></div>`);}
/* ----- menu com abas: barra de cima (#mtop), página com rolagem (#mpage) e abas (#mtabs). A jornada (#app) e o menu nunca aparecem juntos. ----- */
function menuTop(){const p=(i,l,v)=>`<span class="k-pill" role="img" title="${l}" aria-label="${l}: ${v}"><span aria-hidden="true">${i} ${v}</span></span>`;$('#mtop').innerHTML=p('🏆','Melhor resultado',PROF.best)+p('⚔️','Lutas vencidas no total',PROF.totalWins)+p('🎖️','Selos',PROF.seals||0);}
function page(html,tab){const mn=$('#menu'),pg=$('#mpage'),a=document.activeElement,was=mn.hidden;
 const o=$('#overlay');if(!o.hidden){o.hidden=true;overlayFrom=null;}confirmFn=null;if(typeof DRAWER!=='undefined'&&DRAWER)closeDrawer();
 if(state){state.sel=null;state.selMore=false;}['#pop','#sheet','#coach','#mline'].forEach(s=>{const e=$(s);if(e)e.hidden=true;});
 /* foco: o mesmo botão depois de redesenhar (mesmo id ou mesmo data-*) */
 let key=null;if(a&&pg.contains(a)){if(a.id)key='#'+a.id;else{const d=[...a.attributes].find(x=>x.name.startsWith('data-'));if(d)key=`[${d.name}="${CSS.escape(d.value)}"]`;}}
 const m=/^\s*<h2(?: class="([^"]*)")?>([^<]*)/.exec(html),prevT=pg.dataset.t,st=pg.scrollTop;
 if(m)html=html.replace(/^\s*<h2(?: class="([^"]*)")?>/,`<h2 class="k-rib${m[1]?' '+m[1]:''}" id="pgT">`);
 pg.innerHTML=html;pg.dataset.t=tab+'|'+(m?m[2]:'');pg.scrollTop=!was&&prevT===pg.dataset.t?st:0;
 menuTop();document.querySelectorAll('#mtabs [data-nav]').forEach(b=>{const on=b.dataset.nav===tab;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 $('#missDot').hidden=!missionsReady();
 mn.hidden=false;$('#app').hidden=true;
 let f=key&&pg.querySelector(key);if(f&&f.disabled)f=[...f.parentElement.querySelectorAll('button')].find(x=>x!==f&&!x.disabled);/* +/− no limite: o vizinho */
 if(f){f.focus({preventScroll:true});return;}
 const b=document.activeElement;if(!b||b===document.body||!mn.contains(b))pg.focus({preventScroll:true});}
/* janelas e passos da jornada sempre sobre a jornada: se uma luta acabou com uma página do menu aberta, volta para #app */
function runFront(){if(state&&state.cls&&state.phase!=='class'&&!$('#menu').hidden)showRun();}
function showRun(){const mn=$('#menu'),a=document.activeElement;mn.hidden=true;$('#app').hidden=false;$('#mpage').innerHTML='';$('#mpage').dataset.t='';
 if(!a||a===document.body||!a.isConnected||mn.contains(a)){const h=$('#helpBtn');if(h)h.focus({preventScroll:true});}}
function navTab(k){if(k==='codex')codexScreen();else if(k==='missoes')missionsScreen();else if(k==='placar')boardScreen();else if(k==='mais')moreScreen();else backTo();}
function moreScreen(){page(`<h2>Mais</h2><div class="morelist">
 <button class="k-btn v" id="optBtn">Opções</button><button class="k-btn v" id="achBtn">Conquistas ${Object.keys(PROF.ach).length}/${ACH.length}</button><button class="k-btn v" id="histBtn">Histórico</button><button class="k-btn v" id="howBtn">Como jogar</button><button class="k-btn v" id="newsBtn">Novidades</button></div>${backBtn()}`,'mais');}
/* ----- main menu ----- */
let MENU={mode:'normal',asc:{},kit:{},chal:null,seed:'',duel:''};
function chalUnlocked(i){return i<2+(PROF.journeys||0);}
/* herói marcado no menu: no Diário é sempre a classe do dia; senão o último tocado (ou o primeiro liberado) */
const LOCKTXT={paladin:'Paladino: 5 vitórias numa jornada ou 10 no total.',alchemist:'Alquimista: complete uma jornada ou some 20 vitórias.'};
function heroSel(){const M=MENU;if(M.mode==='daily')return dailyClass();if(M.pick&&CLASSES[M.pick])return M.pick;return CLASSKEYS.find(classOpen)||CLASSKEYS[0];}
function classScreen(){if(!state||state.phase!=='class'){setState(fresh());}render();const M=MENU,dayCls=dailyClass(),sel=heroSel();
 const modes=[['normal','Jornada'],['daily','Diário'],['challenge','Desafios'],['seed','Seed'],['duel','Duelo']];
 let info='';
 if(M.mode==='normal')info=`<p class="muted small">A jornada completa: 10 paradas, 5 vidas. Vencer libera o próximo nível de <b>Ascensão</b> daquela classe (+5% de pontuação por nível).</p>`;
 if(M.mode==='daily'){const d=todayStr();info=`<p class="muted small">Mesma seed para todo mundo hoje (${d}), classe do dia: <b>${CLASSES[dayCls].name}</b>, sem Ascensão. O placar é compartilhado com quem abre este jogo. Melhor hoje: <b>${PROF.daily[d]||0}</b>.</p><button class="k-btn v sm" id="boardBtn">Placar de hoje</button>`;}
 if(M.mode==='seed')info=`<label class="fld">Seed <input id="seedIn" value="${(M.seed||'').replace(/"/g,'')}" placeholder="ex.: montanha-rubra" maxlength="40"></label><p class="muted small">Mesma seed, mesma rota e mesmas lojas. Partidas com seed manual não contam para Ascensão, Codex nem conquistas.</p>`;
 if(M.mode==='challenge')info=`<div class="chals">${CHALLENGES.map((c,i)=>{const op=chalUnlocked(i);return `<button class="chal${M.chal===c.id?' on':''}" data-chal="${c.id}" aria-pressed="${M.chal===c.id}" ${op?'':'disabled'}><b>${PROF.chalDone[c.id]?'✓ ':''}${c.name}</b><span>${op?c.desc:'Complete mais jornadas para liberar.'}</span></button>`;}).join('')}</div>`;
 if(M.mode==='duel'){const ok=parseCode(M.duel);info=`<label class="fld">Código da build do oponente<textarea id="duelIn" rows="3" placeholder="ALF6....">${(M.duel||'').replace(/</g,'')}</textarea></label><button class="k-btn v sm" id="ghostBtn">Sortear fantasma de outro jogador</button>${MENU.ghostName&&ok?`<p class="bonus small">Fantasma de ${MENU.ghostName.replace(/</g,'')}</p>`:''}<p class="muted small">${M.duel?(ok?`✓ ${CLASSES[ok.c].name} com ${ok.i.length} itens. Ele substitui o Wyrm na parada 10.`:'<span class="warn">Código inválido.</span>'):'Cole o código que um amigo copiou no fim da jornada dele. O fantasma dessa mochila vira o chefe da parada 10.'}</p>`;}
 const isOpen=k=>classOpen(k)||(M.mode==='daily'&&k===dayCls);
 const dis=k=>!isOpen(k)||(M.mode==='daily'&&k!==dayCls)||(M.mode==='challenge'&&!M.chal)||(M.mode==='duel'&&!parseCode(M.duel));
 const cards=CLASSKEYS.map(k=>{const c=CLASSES[k],open=isOpen(k),st=PROF.sticker[k],am=ascMax(k),asc=Math.min(M.asc[k]||0,am),kit=M.kit[k]||0,kit2=am>=3,on=k===sel;
  return `<div class="k-card hc${on?' sel':''}${open?'':' lock'}"><button class="hpick" data-cls="${k}" aria-pressed="${on}" ${M.mode==='daily'&&k!==dayCls?'disabled':''}><span class="por"><img src="a/h_${k}.webp" alt="" style="${c.flip?'transform:scaleX(-1)':''}">${st!=null&&st>=0?`<span class="sticker" title="Maior Ascensão vencida">A${st}</span>`:''}</span><b>${open?'':'🔒 '}${c.name}${open?'':' · bloqueado'}</b></button>
  ${open&&M.mode==='normal'?`<div class="ascrow"><button class="mini" data-ascm="${k}" ${asc<=0?'disabled':''} aria-label="Diminuir Ascensão">−</button><span>Ascensão <b>${asc}</b>/${am}</span><button class="mini" data-ascp="${k}" ${asc>=am?'disabled':''} aria-label="Aumentar Ascensão">+</button></div>`:''}
  ${open?`<div class="kitrow">${c.kits.map((kt,i)=>`<button class="mini${kit===i?' on':''}" data-kit="${k}:${i}" aria-pressed="${kit===i}" ${i===1&&!kit2?'disabled title="Libera ao alcançar a Ascensão 3"':''}>${i===1&&!kit2?'🔒 ':''}${kt.name}</button>`).join('')}</div>`:''}</div>`;}).join('');
 const C=CLASSES[sel];
 page(`<h2>ESCOLHA SEU HERÓI</h2>
 <details class="k-card fold"><summary>📜 Alforje</summary><p class="story">${STORY.open}</p></details>
 <div class="k-seg modes">${modes.map(([m,l])=>`<button class="${M.mode===m?'on':''}" data-mode="${m}" aria-pressed="${M.mode===m}">${l}</button>`).join('')}</div>
 <div class="k-card minfo">${info}</div>
 <div class="heroes">${cards}</div>
 <div class="k-card hdet"><b>${C.name}</b><span>${C.desc}</span>${!isOpen(sel)&&LOCKTXT[sel]?`<span class="lockt">🔒 ${LOCKTXT[sel]}</span>`:''}${SUBS[sel]?`<span class="subs">Subclasses: ${SUBS[sel].map(s=>s.name).join(' ou ')}</span>`:''}</div>
 ${M.mode==='normal'&&ascMax('warrior')+ascMax('rogue')+ascMax('pyro')+ascMax('paladin')>0?`<details class="k-card fold"><summary>O que cada Ascensão muda</summary>${ASCTXT}</details>`:''}
 <p class="muted small foot">Melhor resultado: ${PROF.best} vitórias${PROF.bestSurv?` · Sobrevivência até a parada ${PROF.bestSurv}`:''} · ${PROF.totalWins} lutas vencidas no total.${paladinOpen()?'':' '+LOCKTXT.paladin}${alchOpen()?'':' '+LOCKTXT.alchemist}</p>
 <button class="k-btn g go" id="goBtn" ${dis(sel)?'disabled':''}>COMEÇAR</button>`,'jogar');}
const ASCTXT=`<ol class="howto"><li>Elite extra na parada 8.</li><li>Consolo de derrota −1.</li><li>Teto de juros −1.</li><li>Trocar itens custa +1.</li><li>4 vidas em vez de 5.</li><li>Elites com 2 modificadores.</li><li>Preços +10%.</li><li>Lendários só a partir da parada 9.</li><li>Chefe com 2 modificadores.</li><li>Inimigos com mais vida (×1,13).</li></ol><p class="muted small">Cumulativo. Vencer a Ascensão N libera N+1 só para aquela classe.</p>`;
function pickClass(k,opts){const M=Object.assign({},MENU,opts||{});
 if(M.mode==='daily'){if(k!==dailyClass())return;}else if(!classOpen(k)&&!opts)return;
 setState(fresh());state.cls=k;state.mode=M.mode;
 if(M.mode==='normal')state.asc=Math.max(0,Math.min(M.asc[k]||0,opts&&opts.asc!=null?10:ascMax(k)));if(opts&&opts.asc!=null)state.asc=opts.asc;
 const seed=M.mode==='daily'?'D'+todayStr():M.mode==='seed'&&M.seed?String(M.seed).trim():Math.random().toString(36).slice(2,10);
 state.seed=seed;state.rng=hashStr(seed)||1;
 if(M.mode==='challenge')state.chal=M.chal;if(M.mode==='duel'){state.duel=parseCode(M.duel);if(!state.duel){state.mode='normal';}}
 state.maxLives=state.chal==='glass'?1:state.asc>=5?4:LIVES;state.lives=state.maxLives;
 const C=CLASSES[k];state.bag={cols:state.chal==='small'?4:C.bag[0],rows:state.chal==='small'?4:C.bag[1],pockets:{}};
 const kit=(M.kit[k]===1&&(ascMax(k)>=3||opts&&opts.kit))?1:0;state.kit=kit;
 for(const [key,x,y] of C.kits[kit].items){const d=ITEMS[key];if(canPlace('bag',x,y,d.w,d.h))state.items.push({id:state.nid++,key,tier:1,x,y,w:d.w,h:d.h,where:'bag'});else{const sp=findSpot('bag',d.w,d.h)||findSpot('chest',d.w,d.h);if(sp)state.items.push({id:state.nid++,key,tier:1,...sp});}}
 state.route=STOPS.map(s=>Math.floor(R()*s.v.length));rollElites();state.phase='shop';rollShop();
 sfx('merge');save();closeOverlay();showRun();render();if(!PROF.tut&&!opts)setTimeout(coachStart,350);}
/* ----- tutorial (INF-05) ----- */
const TUT=[['Toque, segure e arraste','Toque num item ou card para ver a ficha curta acima dele, com Comprar, Girar e Vender. Para mover, segure um instante (ou já arraste): o item fica acima do dedo para você ver onde ele cai. Só o que está na Mochila luta.'],
 ['Gire, funda e venda','Itens compridos giram: toque duas vezes no item ou use o botão ⟳ enquanto arrasta. Dois iguais da mesma raridade se fundem. Para vender, arraste até a placa que aparece no canto da arena. O Baú fica no botão da barra de baixo e aparece sozinho quando você arrasta um item da mochila.'],
 ['Sinergia é posição','Apoios ajudam as armas que tocam do jeito certo: linhas verdes mostram quem ajuda quem. Em “Mais” na ficha, “Por que sinergiza” explica cada ligação. Companheiros, falas do Mascate e opções ficam nas gavetas: o ícone dos companheiros no topo e o botão ⋯ na barra de baixo.']];
function tutScreen(i){page(`<h2>${TUT[i][0]}</h2><p class="story">${TUT[i][1]}</p><div class="dots">${TUT.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div><div class="two"><button class="k-btn g" data-tut="${i+1}">${i<TUT.length-1?'Próximo':'Começar'}</button><button class="k-btn v" data-tut="99">Pular</button></div>`,'mais');}
/* ----- Codex (PRO-02) ----- */
function codexScreen(tab){tab=tab||'items';const C=PROF.codex;let body='';
 if(tab==='items'){const keys=Object.keys(ITEMS);const seen=keys.filter(k=>C.items[k]&&(C.items[k].seen||C.items[k].bought||C.items[k].forged)).length;
  body=`<p class="muted small">${seen}/${keys.length} itens descobertos. Números: comprados · fundidos · vitórias com o item na mochila.</p><div class="cgrid">${keys.map(k=>{const x=C.items[k],known=x&&(x.seen||x.bought||x.forged);
   return `<div class="ccell${known?'':' unk'}"><img src="${artURL(k,1)}" alt="" class="${known?(ITEMS[k].tint||''):'sil'}"><b>${known?ITEMS[k].name:'???'}</b>${known?`<span>${x.bought||0} · ${x.merged||0} · ${x.wins||0}</span>${tagDots(k)}`:''}</div>`;}).join('')}</div>`;}
 if(tab==='foes'){const all=[];STOPS.forEach((s,i)=>s.v.forEach(v=>all.push([v,i])));const beat=all.filter(([v])=>C.foes[v.art]&&C.foes[v.art].beat).length;
  body=`<p class="muted small">${beat}/${all.length} inimigos derrotados.</p><div class="cgrid">${all.map(([v,i])=>{const f=C.foes[v.art];return `<div class="ccell${f?'':' unk'}"><img src="a/e_${v.art}.webp" alt="" class="${f?'':'sil'}"><b>${f?v.name:'???'}</b><span>Parada ${i+1}${f?` · ${ARCH[v.arch].label} · ${f.beat}/${f.met}`:''}</span></div>`;}).join('')}</div>`;}
 if(tab==='recipes')body=recipeBook();
 page(`<h2>Codex</h2><div class="k-seg">${[['items','Itens'],['foes','Inimigos'],['recipes','Receitas']].map(([t,l])=>`<button class="${t===tab?'on':''}" data-codex="${t}" aria-pressed="${t===tab}">${l}</button>`).join('')}</div><div class="k-card pc">${body}</div>${backBtn()}`,'codex');}
function achScreen(){page(`<h2>Conquistas</h2><div class="k-card pc"><p class="muted center">${Object.keys(PROF.ach).length}/${ACH.length}</p><div class="achs">${ACH.map(([id,n,d])=>`<div class="achv${PROF.ach[id]?' on':''}"><b>${PROF.ach[id]?'🏆':'·'} ${n}</b><span>${d}</span></div>`).join('')}</div></div>${backBtn()}`,'mais');}
function histScreen(){const H=PROF.history;page(`<h2>Histórico</h2><div class="k-card pc">${H.length?`<div class="hist">${H.map((h,i)=>`<div class="hrow"><div><b>${CLASSES[h.cls]?CLASSES[h.cls].name:h.cls}${h.sub&&SUBOF(h.sub)?' · '+SUBOF(h.sub).name:''}</b> <span class="${h.won?'bonus':'warn'}">${h.won?'venceu':'caiu'} · ${h.wins} vit.${h.surv?` · norte até ${h.surv}`:''}</span>
 <span class="muted small">${new Date(h.d).toLocaleDateString('pt-BR')} · ${{normal:'Jornada',daily:'Diário',seed:'Seed',challenge:'Desafio',duel:'Duelo'}[h.mode]||''}${h.asc?' · A'+h.asc:''}${h.chal?' · '+(CHALLENGES.find(c=>c.id===h.chal)||{}).name:''} · ${h.score} pts · seed ${h.seed}</span></div>
 <div class="mini-build">${(h.build||[]).slice(0,14).map(([k,t])=>ITEMS[k]?`<img src="${artURL(k,t)}" alt="${ITEMS[k].name}" style="--tier:${tierVar(t)}">`:'').join('')}</div><button class="k-btn v sm" data-hcode="${i}">Copiar código</button></div>`).join('')}</div>`:'<p class="muted center">Nenhuma jornada terminada ainda.</p>'}</div>${backBtn()}`,'mais');}
const NEWS=`<ul class="howto">
 <li><b>Depois da luta</b>: tabela por item (acionamentos, dano, críticos, escudo, cura e status), aba do inimigo e registro completo copiável.</li>
 <li><b>Tipos e Afinidades</b>: 6 tipos, bônus com 3 e 5 itens, e 4 Flâmulas que reforçam um tipo inteiro.</li>
 <li><b>54 itens (46 na loja + 8 forjados)</b>, incluindo Gelo (deixa o inimigo lento), Purga (quebra escudo, reflexo e cura), economia (Cofre, Medalhão) e itens que crescem durante a jornada.</li>
 <li><b>Elites e chefe com modificadores</b> anunciados na loja, e 6 inimigos novos.</li>
 <li><b>Bênçãos</b> após cada elite, <b>subclasse</b> na parada 5, <b>Etiquetas</b> para pular a loja e uma encruzilhada na parada 7.</li>
 <li><b>Loja</b>: chances visíveis, promoções, até 2 reservas, Martelo do Mascate, desfazer, trava “não forjar” e catalisadores.</li>
 <li><b>Mochila</b>: formato próprio por classe, ampliação com escolha de formato e bolsos com efeito; Piromante não carrega peso de armas de Fogo.</li>
 <li><b>Companheiros</b> ganham uma habilidade na loja (3 cargas) e chega a Coruja das Neves.</li>
 <li><b>Ascensão 1–10</b> por classe, Codex, ${ACH.length} conquistas, histórico, Desafio Diário, seed, 8 Desafios, Sobrevivência até a parada 14 e Duelo por código de build.</li>
 <li><b>v7</b>: nova classe <b>Alquimista</b> (Mistura Volátil: curas também ferem o inimigo), heróis com poses de ataque, defesa, habilidade, vitória e derrota, 11 inimigos novos (Mímico, Cogumelo Venenoso, Goblin Saqueador, Ladrão de Estrada, Elemental de Gelo, Basilisco, Slime Venenoso, Harpia, Minotauro, Golias de Pedra e Cão de Vulcão), 15 itens novos, cenários da Mina e do Passo Nevado, primeira partida guiada, duelo automático contra fantasmas de outros jogadores, imagem do resultado para compartilhar e modo daltônico.</li>
 <li><b>v6.2</b>: ficha do item mais curta, aviso com Desfazer após comprar ou vender, encaixe e tremor ao soltar, selos ⇈ (funde) e ⚒ (receita) nos cards da loja, toque para pular o fim da luta, música ambiente e volumes separados, modo economia de bateria, progresso salvo na nuvem da sua conta, placar compartilhado do Diário e Missões semanais com visuais de mochila.</li>
 <li><b>Celular</b>: tudo cabe numa tela só, sem rolar. Loja com cards iguais, ficha curta acima do item, segure para arrastar, venda no canto da arena, Baú na barra de baixo, gavetas de companheiros e do Mascate, e Opções de escala, texto grande, modo canhoto e mover por toque.</li></ul>`;
function newsScreen(){page(`<h2>Novidades · v${VER}</h2><div class="k-card pc">${NEWS}</div><button class="k-btn g" id="newsOk">Entendi</button>`,'mais');}

/* ================= DRAG & DROP (plano mobile: long-press ou movimento inicia; item acima do dedo; venda no canto da arena) ================= */
let drag=null,ghost=null,prev=null,tipEl=null,rotFab=null,lastTap={id:null,t:0},prevMode=null;
const LP_MS=200;
function buzz(ms){try{if(navigator.vibrate)navigator.vibrate(ms||15);}catch(e){}}
function dragInfo(){if(drag.src==='shop'){const o=state.shop[drag.idx];const d=ITEMS[o.key];return {key:o.key,tier:o.tier,w:drag.rot?d.h:d.w,h:drag.rot?d.w:d.h,id:null,o};}
 const it=state.items.find(i=>i.id===drag.id);return {key:it.key,tier:it.tier,w:drag.rot?it.h:it.w,h:drag.rot?it.w:it.h,id:it.id,where:it.where};}
function grip(di){if(drag.touch){drag.gdx=di.w*CS/2;drag.gdy=di.h*CS+34;}else{drag.gdx=di.w*CS/2;drag.gdy=di.h*CS/2;}}
function ghostHTML(n){return `<div class="face t${n.tier}">${artHTML(n.key,n.tier,(n.w*CS-10)*.86,(n.h*CS-10)*.86,n.w!==ITEMS[n.key].w)}<div class="pips">${'<i></i>'.repeat(n.tier)}</div></div>`;}
function startDrag(){if(!drag||drag.started||drag.noDrag)return;clearTimeout(drag.lp);drag.started=true;drag.ox=drag.lx??drag.sx;drag.oy=drag.ly??drag.sy;const di=dragInfo();grip(di);
 state.sel=null;state.selMore=false;$('#pop').hidden=true;$('#sheet').hidden=true;if(DRAWER)closeDrawer();
 ghost=document.createElement('div');ghost.className='ghost';
 ghost.style.cssText+=`;--tier:${tierVar(di.tier)};width:${di.w*CS}px;height:${di.h*CS}px`;ghost.innerHTML=ghostHTML(di);document.body.appendChild(ghost);
 tipEl=document.createElement('div');tipEl.className='tip';tipEl.hidden=true;document.body.appendChild(tipEl);
 if(di.w!==di.h){rotFab=document.createElement('button');rotFab.id='rotfab';rotFab.className='rotfab';rotFab.textContent='⟳ Girar';rotFab.setAttribute('aria-label','Girar o item arrastado');document.body.appendChild(rotFab);}
 drag.el.classList.add('dragging');document.body.classList.add('is-dragging');
 if(drag.src==='own'){const it=state.items.find(i=>i.id===drag.id);const z=$('#sellzone');z.innerHTML=`<b>Vender</b><span><img src="${spr('coin')}" alt="">${sellPrice(it.key,it.tier)}</span>`;z.hidden=false;placeSellZone();
  if(BASEMODE!=='chest'){prevMode=BASEMODE;BASEMODE='chest';renderShop();}}
 buzz(12);}
function dragRotate(){if(!drag||!drag.started)return;const di=dragInfo();if(di.w===di.h)return;drag.rot=!drag.rot;const n=dragInfo();grip(n);
 ghost.style.width=n.w*CS+'px';ghost.style.height=n.h*CS+'px';ghost.innerHTML=ghostHTML(n);drag.lastK='';moveGhost(drag.lx||drag.sx,drag.ly||drag.sy);buzz(8);}
function inRect(el,px,py,pad){if(!el||el.hidden)return false;const r=el.getBoundingClientRect();pad=pad||0;return px>=r.left-pad&&px<r.right+pad&&py>=r.top-pad&&py<r.bottom+pad;}
function target(px,py){const di=dragInfo();
  const ax=px-drag.gdx,ay=py-drag.gdy;
 const sellHit=drag.src==='own'&&(inRect($('#sellzone'),px,py,6)||inRect($('#sellzone'),ax+di.w*CS/2,ay+di.h*CS/2,6));
 for(const where of sellHit&&BASEMODE==='chest'?['chest','sell','bag']:sellHit?['sell','bag','chest']:['bag','chest']){if(where==='sell')return {sell:true};if(where==='chest'&&BASEMODE!=='chest')continue;const g=$('#'+where),r=g.getBoundingClientRect(),c=csOf(where);
  const cxp=ax+di.w*c/2,cyp=ay+di.h*c/2;
  if(cxp>=r.left-c*.3&&cxp<r.right+c*.3&&cyp>=r.top-c*.3&&cyp<r.bottom+c*.3){const D=dims(where);
   const cx=Math.max(0,Math.min(D.cols-di.w,Math.round((ax-r.left)/c))),cy=Math.max(0,Math.min(D.rows-di.h,Math.round((ay-r.top)/c)));
   const under=itemAt(where,Math.floor((cxp-r.left)/c),Math.floor((cyp-r.top)/c),di.id);
   const merge=canMerge()&&under&&under.key===di.key&&under.tier===di.tier&&di.tier<4?under:null;
   return {where,cx,cy,merge,ok:!!merge||canPlace(where,cx,cy,di.w,di.h,di.id),di};}}
 return null;}
function previewRelations(t){const di=t.di;let tmp,saved=null;
 if(di.id!=null){const it=state.items.find(i=>i.id===di.id);saved={where:it.where,x:it.x,y:it.y,w:it.w,h:it.h};Object.assign(it,{where:'bag',x:t.cx,y:t.cy,w:di.w,h:di.h});tmp=it;}
 else{tmp={id:-1,key:di.key,tier:di.tier,where:'bag',x:t.cx,y:t.cy,w:di.w,h:di.h};state.items.push(tmp);}
 const rel=relations(tmp),wi=weightInfo(),zone=ITEMS[di.key].zone?zoneOk(tmp):null,pk=pocketsOf(tmp),A=affinity();
 const effects=[];for(const L of supportLinks()){if(L.s===tmp)effects.push(`<span class="g">→ ${ITEMS[L.w.key].name}</span>`);if(L.w===tmp)effects.push(`<span class="g">← ${ITEMS[L.s.key].name}</span>`);}
 if(di.id!=null)Object.assign(tmp,saved);else state.items.pop();
 return {rel,wi,zone,effects,pk,A};}
function showPreview(t){if(prev){prev.remove();prev=null;}document.querySelectorAll('.item.syn,.item.rgl').forEach(e=>e.classList.remove('syn','rgl'));
 const svg=document.querySelector('#bag .teth');if(svg)svg.innerHTML='';if(tipEl)tipEl.hidden=true;$('#sellzone').classList.toggle('hot',!!(t&&t.sell));document.body.classList.toggle('sell-hot',!!(t&&t.sell));
 if(!t||t.sell)return;prev=document.createElement('div');const c=csOf(t.where);
 if(t.merge){prev.className='preview merge';Object.assign(prev.style,{left:t.merge.x*c+'px',top:t.merge.y*c+'px',width:t.merge.w*c+'px',height:t.merge.h*c+'px'});
  tipEl.innerHTML=`<b>Fundir → ${TIERS[t.merge.tier]}</b>${t.merge.tier+1>=3?`<span class="o">✦ desperta: ${AWK[ITEMS[t.merge.key].type][t.merge.tier+1>=4?1:0]}</span>`:''}`;tipEl.hidden=false;}
 else{prev.className='preview'+(t.ok?'':' bad');Object.assign(prev.style,{left:t.cx*c+'px',top:t.cy*c+'px',width:t.di.w*c+'px',height:t.di.h*c+'px'});
  if(t.ok&&t.where==='bag'){const P=previewRelations(t);
   for(const r of P.rel){const el=document.querySelector(`.item[data-id="${r.o.id}"]`);if(el)el.classList.add(r.kind==='rcp'?'rgl':'syn');}
   drawTethers(P.rel,{x:t.cx,y:t.cy,w:t.di.w,h:t.di.h});
   const lines=[];if(P.effects.length)lines.push(...P.effects.slice(0,3));
   for(const r of P.rel.filter(r=>r.kind==='rcp')){const R2=RECIPES.find(x=>(x[0]===t.di.key&&x[1]===r.o.key)||(x[1]===t.di.key&&x[0]===r.o.key));if(R2)lines.push(`<span class="o">⚒ Forja: ${PROF.codex.recipes[R2[2]]?ITEMS[R2[2]].name:'???'}${R2[3]?' (precisa de '+ITEMS[R2[3]].name+')':''}</span>`);}
   if(P.zone===false)lines.push(`<span class="r">Fora da zona: inativo aqui</span>`);if(P.zone===true)lines.push(`<span class="g">Zona certa: ativo</span>`);
   for(const p of P.pk)lines.push(`<span class="o">${POCKETS[p].name}: ${POCKETS[p].desc}</span>`);
   for(const tg of tagsOf(t.di.key)){const n=P.A.c[tg];if(n===3||n===5)lines.push(`<span class="o">Afinidade de ${TAGS[tg].name} ${n===5?'máxima':'ativa'}</span>`);}
   if(ITEMS[t.di.key].type==='weapon')lines.push(P.wi.over?`<span class="r">Carga ${P.wi.w}/${P.wi.cap}: armas ${P.wi.over*12}% mais lentas</span>`:`<span>Carga ${P.wi.w}/${P.wi.cap}</span>`);
   if(lines.length){tipEl.innerHTML=`<b>${ITEMS[t.di.key].name}</b>`+lines.join('');tipEl.hidden=false;}}}
 $('#'+t.where).appendChild(prev);}
function moveGhost(px,py){ghost.style.transform=`translate(${px-drag.gdx}px,${py-drag.gdy}px)`;drag.mx=Math.max(drag.mx||0,Math.hypot(px-drag.ox,py-drag.oy));
 const k=Math.round(px/8)+'|'+Math.round(py/8)+'|'+drag.rot;if(k!==drag.lastK){drag.lastK=k;showPreview(target(px,py));}
 if(tipEl&&!tipEl.hidden){const r=tipEl.getBoundingClientRect();const gy=py-drag.gdy;let x=px+18,y=gy-r.height-10;if(x+r.width>innerWidth-8)x=px-r.width-18;if(y<8)y=Math.min(innerHeight-r.height-8,py+30);tipEl.style.transform=`translate(${Math.max(8,x)}px,${y}px)`;}}
function endDrag(px,py){
 if((drag.mx||0)<8){render();return;}/* long-press sem mover = cancelar, nunca soltar no lugar errado */
 const t=target(px,py),di=dragInfo();
 if(t&&t.sell){sell(drag.id);return;}
 if(t&&t.ok){
  if(drag.src==='shop'){const p=offerPrice(di.o);if(p>state.gold){toast('Ouro insuficiente');buzz(40);render();return;}snapshot();state.gold-=p;state.shop[drag.idx]=null;codexAdd(di.key,'bought');sfx('buy');
   if(t.merge)mergeInto(t.merge);else state.items.push({id:state.nid++,key:di.key,tier:di.tier,where:t.where,x:t.cx,y:t.cy,w:di.w,h:di.h});sayMerchant();toastUndo(`Comprado: ${ITEMS[di.key].name}`);SNAP=t.merge?null:state.nid-1;}
  else{const it=state.items.find(i=>i.id===drag.id);
   if(t.merge){snapshot();state.items=state.items.filter(i=>i!==it);mergeInto(t.merge);}
   else{Object.assign(it,{where:t.where,x:t.cx,y:t.cy,w:di.w,h:di.h});sfx('drop');SNAP=it.id;}}
  buzz(10);state.sel=null;save();}
 else if(t){toast('Não cabe aí');buzz(40);sfx('bad');shakeGrid(t.where);}
 render();}
function cleanup(){if(ghost)ghost.remove();if(prev)prev.remove();if(tipEl)tipEl.remove();if(rotFab)rotFab.remove();ghost=prev=tipEl=rotFab=null;
 const z=$('#sellzone');z.hidden=true;z.classList.remove('hot');document.body.classList.remove('is-dragging','sell-hot');if(drag&&drag.el)drag.el.classList.remove('dragging');
 if(drag)clearTimeout(drag.lp);if(prevMode!==null){BASEMODE=prevMode;prevMode=null;}}
function tap(src,el){if(src==='shop'){const i=+el.dataset.idx;state.sel=state.sel&&state.sel.shop===i?null:{shop:i};}
 else{const id=+el.dataset.id,now=performance.now();
  if(lastTap.id===id&&now-lastTap.t<330&&state.phase==='shop'){lastTap={id:null,t:0};state.sel=null;rotate(id);return;}
  lastTap={id,t:now};state.sel=state.sel&&state.sel.id===id?null:{id};}
 state.selMore=false;renderPets();renderGrids();renderShop();renderPop();renderSheet();}
/* WCAG 2.5.7: mover sem arrastar — toque no item (ou card) e depois na casa de destino */
function gridTap(g,e){if(!OPT().tapMove||state.phase!=='shop'||!state.sel)return false;const where=g.id,c=csOf(where),r=g.getBoundingClientRect(),D=dims(where);
 const gx=Math.floor((e.clientX-r.left)/c),gy=Math.floor((e.clientY-r.top)/c);if(gx<0||gy<0||gx>=D.cols||gy>=D.rows)return false;
 if(state.sel.id!=null){const it=state.items.find(i=>i.id===state.sel.id);if(!it)return false;const x=Math.min(gx,D.cols-it.w),y=Math.min(gy,D.rows-it.h);
  if(canPlace(where,x,y,it.w,it.h,it.id)){Object.assign(it,{where,x,y});sfx('click');buzz(10);state.sel=null;save();render();return true;}toast('Não cabe aí');return true;}
 if(state.sel.shop!=null){const o=state.shop[state.sel.shop];if(!o||o.pet)return false;const d=ITEMS[o.key],x=Math.min(gx,D.cols-d.w),y=Math.min(gy,D.rows-d.h),p=offerPrice(o);
  if(p>state.gold){toast('Ouro insuficiente');return true;}if(!canPlace(where,x,y,d.w,d.h)){toast('Não cabe aí');return true;}
  snapshot();state.gold-=p;state.shop[state.sel.shop]=null;codexAdd(o.key,'bought');state.items.push({id:state.nid++,key:o.key,tier:o.tier,where,x,y,w:d.w,h:d.h});sfx('buy');buzz(10);SNAP=state.nid-1;state.sel=null;save();render();sayMerchant();toastUndo(`Comprado: ${ITEMS[o.key].name}`);return true;}
 return false;}

document.addEventListener('pointerdown',e=>{
 if(state&&state.phase==='battle'&&B&&B.done&&!e.target.closest('#overlay')){skipEnd();return;}
 if(e.target.closest('#rotfab')){e.preventDefault();e.stopPropagation();dragRotate();return;}
 if(state&&state.sel&&!e.target.closest('#pop,#sheet,[data-drag],.slot,#petsmini,#overlay,#drawer,.grid')){state.sel=null;state.selMore=false;renderPop();renderSheet();renderGrids();renderShop();renderPets();}
 if(DRAWER&&!e.target.closest('#drawer,#moreBtn,#petsmini,#overlay,#pop,#sheet,[data-pane],#chestBtn'))closeDrawer();
 if(e.button>0||drag)return;const el=e.target.closest('[data-drag]');if(!el)return;
 const r=el.getBoundingClientRect();drag={el,pid:e.pointerId,touch:e.pointerType==='touch'||e.pointerType==='pen',src:el.dataset.src,id:el.dataset.id?+el.dataset.id:null,idx:el.dataset.idx!=null?+el.dataset.idx:null,sx:e.clientX,sy:e.clientY,gdx:e.clientX-r.left,gdy:e.clientY-r.top,started:false,rot:false};
 if(drag.src==='shop'){const o=state.shop[drag.idx];if(!o){drag=null;return;}if(o.pet)drag.noDrag=true;}
 if(state.phase!=='shop')drag.noDrag=true;
 if(!drag.noDrag)drag.lp=setTimeout(()=>{if(drag&&!drag.started){startDrag();moveGhost(drag.lx??drag.sx,drag.ly??drag.sy);}},LP_MS);
 if(!(drag.src==='shop'&&$('#shop').classList.contains('scroll')))e.preventDefault();});
document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pid)return;drag.lx=e.clientX;drag.ly=e.clientY;
 if(!drag.started){if(drag.noDrag)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(Math.hypot(dx,dy)<7)return;
  if(drag.src==='shop'&&$('#shop').classList.contains('scroll')&&Math.abs(dx)>Math.abs(dy)){clearTimeout(drag.lp);drag=null;return;}/* rolagem horizontal da fileira */
  startDrag();}
 e.preventDefault();moveGhost(e.clientX,e.clientY);},{passive:false});
document.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pid)return;const d=drag;clearTimeout(d.lp);
 if(!d.started){cleanup();drag=null;tap(d.src,d.el);return;}endDrag(e.clientX,e.clientY);cleanup();drag=null;render();});
document.addEventListener('touchmove',e=>{if(drag&&drag.started)e.preventDefault();},{passive:false});
document.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.pid){cleanup();drag=null;render();}});
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-drag],.grid'))e.preventDefault();});
document.addEventListener('keydown',e=>{
 if((e.key==='r'||e.key==='R')&&drag&&drag.started)dragRotate();
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.item')){e.preventDefault();tap('own',e.target);}
 if(e.key==='Escape'){if(state.sel){state.sel=null;state.selMore=false;render();}else if(DRAWER)closeDrawer();}});
$('#cv').addEventListener('click',()=>{if(state.phase==='battle'&&B)toast(statusText(),1);});
/* ----- Opções (plano, fase 3) ----- */
function setOpt(k,v){PROF.opt=Object.assign(OPT(),{[k]:v});saveProf();applyOpts();render();}
function optionsScreen(){const o=OPT();page(`<h2>Opções</h2><div class="k-card pc">
 <label class="fld">Escala da interface: <b id="scaleV">${o.scale}%</b><input type="range" id="optScale" min="90" max="120" step="5" value="${o.scale}"></label>
 <label class="chk"><input type="checkbox" id="optBig" ${o.big?'checked':''}> Texto grande</label>
 <label class="chk"><input type="checkbox" id="optLeft" ${o.left?'checked':''}> Modo canhoto (barra de ações e venda espelhadas)</label>
 <label class="chk"><input type="checkbox" id="optTap" ${o.tapMove?'checked':''}> Mover por toque: toque no item e depois na casa de destino</label>
 <label class="chk"><input type="checkbox" id="optAsk" ${PROF.noAsk?'':'checked'}> Perguntar antes de lutar com ouro sobrando</label>
 <label class="chk"><input type="checkbox" id="optMute" ${muted?'':'checked'}> Som</label>
 <label class="fld">Efeitos: <b id="fxV">${o.volFx}%</b><input type="range" id="optFx" min="0" max="100" step="5" value="${o.volFx}"></label>
 <label class="fld">Música ambiente: <b id="musV">${o.volMus}%</b><input type="range" id="optMus" min="0" max="100" step="5" value="${o.volMus}"></label>
 <label class="chk"><input type="checkbox" id="optCb" ${o.cb?'checked':''}> Modo daltônico (símbolo de raridade nos cards: ● Comum, ◆ Raro, ▲ Épico, ★ Lendário)</label>
 <label class="chk"><input type="checkbox" id="optStats" ${o.stats===0?'':'checked'}> Enviar estatísticas das partidas (classe, itens e resultado, sem nome) para ajustar o balanço</label>
 <label class="chk"><input type="checkbox" id="optEco" ${o.eco?'checked':''}> Economia de bateria (30 quadros por segundo, menos partículas e animações)</label>
 <p class="muted small">${CLOUD.ready?'☁ Progresso guardado no servidor, na sua conta de convidado deste aparelho. Limpar os dados do navegador apaga o acesso a ela.':'Progresso salvo só neste aparelho (sem conexão com o servidor).'}</p>
 <p class="muted small">Se a escala não couber nesta tela, o jogo usa a maior que couber. O jogo é feito para o celular em pé.</p></div>${backBtn()}`,'mais');}

document.addEventListener('input',e=>{const id=e.target.id;if(id==='seedIn')MENU.seed=e.target.value;if(id==='duelIn'){MENU.duel=e.target.value;MENU.ghostName='';}
 if(id==='optScale'){$('#scaleV').textContent=e.target.value+'%';setOpt('scale',+e.target.value);}
 if(id==='optFx'){$('#fxV').textContent=e.target.value+'%';setOpt('volFx',+e.target.value);sfx('click');}
 if(id==='optMus'){$('#musV').textContent=e.target.value+'%';setOpt('volMus',+e.target.value);}});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='duelIn')classScreen();
 if(id==='optBig')setOpt('big',e.target.checked?1:0);if(id==='optLeft')setOpt('left',e.target.checked?1:0);if(id==='optTap')setOpt('tapMove',e.target.checked?1:0);if(id==='optEco')setOpt('eco',e.target.checked?1:0);if(id==='optCb')setOpt('cb',e.target.checked?1:0);if(id==='optStats')setOpt('stats',e.target.checked?1:0);
 if(id==='optAsk'){PROF.noAsk=e.target.checked?0:1;saveProf();}if(id==='optMute'){muted=!e.target.checked;try{localStorage.setItem('alforje-mute',muted?'1':'0');}catch(_){}applyAudio();}});
document.addEventListener('click',e=>{
 const g=e.target.closest('#bag,#chest');if(g&&!e.target.closest('.item')&&gridTap(g,e))return;
 if(e.target.closest('#mline')){$('#mline').hidden=true;return;}
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.pet!=null&&t.matches('.slot')){const i=+t.dataset.pet;if(state.pets[i]){state.sel=state.sel&&state.sel.pet===i?null:{pet:i};state.selMore=false;renderPets();renderPop();renderSheet();}return;}
 if(t.dataset.pane){DRAWER=t.dataset.pane;state.sel=null;renderPop();renderDrawer();return;}
 const id=t.id;
 if(id==='fight')fight();else if(id==='fightGo'){const c=$('#noAskChk');if(c&&c.checked){PROF.noAsk=1;saveProf();}fight(true);}
 else if(id==='reroll')reroll();else if(id==='expand')expandScreen(false);else if(id==='skip')skip();
 else if(id==='chestBtn'){BASEMODE=BASEMODE==='chest'?'shop':'chest';state.sel=null;renderShop();renderPop();}
 else if(id==='moreBtn')openDrawer('more');else if(id==='petsmini')openDrawer('pets');else if(id==='dclose')closeDrawer();
 else if(id==='foeinfo'){if(state.phase==='battle'&&B)toast(statusText(),1);else if(state.cls){const f=foeDef(),F=makeFoe(),A=ARCH[f.arch],rr=readyRecipes();overlay(`<h2>${f.name}</h2><p class="center"><b>${A.label}</b>${f.elite?' · Elite':''}${f.boss?' · Chefe':''}</p><p class="story">${f.line}</p><p>${A.counter}.</p>${rr.length?`<p class="bonus">⚒ ${rr.length} receita${rr.length>1?'s':''} pronta${rr.length>1?'s':''} para forjar ao vencer.</p>`:''}<h4>Arsenal</h4>${foeArsenal(F,f)}<button class="btn primary" id="closeOv">Voltar à loja</button>`);}}
 else if(id==='moreInfo'){state.selMore=true;renderPop();renderSheet();}else if(id==='lessBtn'){state.selMore=false;renderSheet();renderPop();}
 else if(t.dataset.exp!=null)doExpand(+t.dataset.exp,!!t.dataset.free);
 else if(t.dataset.speed){speed=+t.dataset.speed;try{localStorage.setItem('alforje-speed',speed);}catch(_){}renderShop();}
 else if(id==='buy')buy(state.sel.shop);else if(id==='sell')sell(state.sel.id);else if(id==='rot')rotate(state.sel.id);
 else if(id==='hammer')hammer(state.sel.id);else if(id==='noforge'){const it=state.items.find(i=>i.id===state.sel.id);if(it){it.noforge=!it.noforge;toast(it.noforge?'Este item não será forjado':'Forja liberada');save();render();}}
 else if(id==='sellPet')sellPet(state.sel.pet);else if(id==='petAct')petAct(state.sel.pet);
 else if(id==='lockBtn'){const o=state.shop[state.sel.shop];if(!o.locked&&state.shop.filter(x=>x&&x.locked).length>=lockLimit()){toast('Limite de reservas atingido');return;}o.locked=!o.locked;toast(o.locked?'Reservado para a próxima parada':'Reserva liberada');save();renderShop();renderPop();}
 else if(id==='close'){state.sel=null;state.selMore=false;render();}
 else if(id==='undo')undo();else if(id==='skipShop'){closeDrawer();skipShop();}
 else if(id==='recipesBtn')overlay(`<h2>Receitas</h2>${recipeBook()}${backBtn()}`);
 else if(id==='oddsBtn')overlay(`<h2>Chances da loja</h2>${oddsTable()}${backBtn()}`);
 else if(id==='undoT'){$('#toast').hidden=true;undo();}
 else if(id==='missBtn'){closeDrawer();missionsScreen();}else if(t.dataset.skin){PROF.skin=t.dataset.skin;saveProf();applySkin();missionsScreen();}
 else if(id==='boardBtn')boardScreen();
 else if(id==='ghostBtn')ghostPick();else if(id==='shareBtn')shareCard();else if(id==='coachOk'||id==='coachSkip')coachEnd();
 else if(id==='optBtn')optionsScreen();else if(id==='helpBtn2'){closeDrawer();runMenu();}
 else if(t.dataset.cls){MENU.pick=t.dataset.cls;classScreen();}else if(id==='goBtn')pickClass(heroSel());
 else if(t.dataset.nav)navTab(t.dataset.nav);
 else if(t.dataset.mode){MENU.mode=t.dataset.mode;classScreen();}
 else if(t.dataset.chal){MENU.chal=t.dataset.chal;classScreen();}
 else if(t.dataset.ascm){MENU.asc[t.dataset.ascm]=Math.max(0,(MENU.asc[t.dataset.ascm]||0)-1);classScreen();}
 else if(t.dataset.ascp){const k=t.dataset.ascp;MENU.asc[k]=Math.min(ascMax(k),(MENU.asc[k]||0)+1);classScreen();}
 else if(t.dataset.kit){const [k,i]=t.dataset.kit.split(':');MENU.kit[k]=+i;classScreen();}
 else if(t.dataset.tut!=null){const i=+t.dataset.tut;if(i>=TUT.length){PROF.tut=1;saveProf();backTo();sayMerchant(true);}else tutScreen(i);}
 else if(t.dataset.codex)codexScreen(t.dataset.codex);
 else if(t.dataset.bless)takeBless(t.dataset.bless);else if(t.dataset.sub)takeSub(t.dataset.sub);
 else if(id==='evA')eventChoose(true);else if(id==='evB')eventChoose(false);
 else if(t.dataset.tab){const box=t.closest('.modal');box.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x===t));box.querySelectorAll('[data-p]').forEach(p=>p.hidden=p.dataset.p!==t.dataset.tab);}
 else if(id==='copyLog'&&lastFight)copyText(lastFight.log.join('\n'),'Registro copiado');
 else if(id==='copyBuild')copyText(buildCode(),'Código da build copiado');
 else if(t.dataset.hcode!=null){const h=PROF.history[+t.dataset.hcode];if(h)copyText(h.code,'Código copiado');}
 else if(id==='next')nextQueue();
 else if(id==='goSurv')startSurvival();
 else if(id==='again'){setState(fresh());save();classScreen();}
 else if(id==='cfOk'){const f=confirmFn;confirmFn=null;closeOverlay();if(f)f();}else if(id==='cfNo'){confirmFn=null;closeOverlay();render();}
 else if(id==='closeOv'){closeOverlay();render();}
 else if(id==='back')backTo();
 else if(id==='helpBtn'){if(state.cls&&state.phase!=='class')runMenu();else classScreen();}
 else if(id==='howBtn')page(`<h2>Como jogar</h2><div class="k-card pc">${HOWTO}<h4>Afinidades</h4><ul class="howto">${TAGKEYS.map(k=>`<li><b style="color:${TAGS[k].col}">${TAGS[k].name}</b>: 3 → ${TAGS[k].t3}; 5 → ${TAGS[k].t5}.</li>`).join('')}</ul><h4>Gestos</h4><ul class="howto"><li><b>Toque</b> num item ou card: ficha curta acima dele, com os botões.</li><li><b>Segure</b> (ou arraste) para mover; o item fica acima do dedo. Toque duas vezes num item para girar, ou use ⟳ enquanto arrasta.</li><li><b>Vender</b>: arraste até a placa que aparece no canto da arena.</li><li><b>Baú</b>: botão na barra de baixo; ao arrastar um item da mochila, o Baú aparece no lugar da loja.</li><li>Prefere sem arrastar? Ligue <b>Mover por toque</b> em Opções.</li></ul></div>${backBtn()}`,'mais');
 else if(id==='codexBtn')codexScreen();else if(id==='achBtn')achScreen();else if(id==='histBtn')histScreen();else if(id==='newsBtn')newsScreen();
 else if(id==='newsOk'){PROF.ver=VER;saveProf();backTo();}
 else if(id==='askBtn'){PROF.noAsk=PROF.noAsk?0:1;saveProf();runMenu();}
 else if(id==='abandon')confirmBox('Abandonar esta jornada?','Ela não conta no histórico nem no progresso.','Abandonar',()=>{setState(fresh());save();classScreen();});});
window.addEventListener('resize',()=>{if(!drag)render();});

/* ================= BOOT ================= */
['h_warrior','h_rogue','h_pyro','h_paladin','p_raven','p_salamander','p_turtle','p_pixie','p_owl'].forEach(img);
STOPS.forEach(s=>s.v.forEach(v=>img('e_'+v.art)));for(const c in POSE)for(const p in POSE[c])if(p!=='_'&&p!=='s')img('hp_'+c+'_'+p);Object.values(BGS).forEach(b=>img(b.full||b.strip));
window.__alforje={setDiff(h,d){SIM.setDiff(h,d);},get state(){return state;},set state(s){setState(s);},get PROF(){return PROF;},set PROF(p){PROF=p;},MENU,page,showRun,cloudAdopt,classScreen,buy,fight,skip,finish,render,newBattle,step,makePlayer,makeFoe,readyRecipes,forge,addItem,addPet,rollShop,
 expandScreen,doExpand,income,interest,pickClass,supportLinks,weaponStats,relations,weightInfo,foeDef,takeBless,takeSub,eventChoose,nextQueue,buildCode,parseCode,startSurvival,reroll,hammer,petAct,undo,affinity,score,boardPost,boardScreen,mission,missionWin,get CLOUD(){return CLOUD;},
 get B(){return B;},set B(b){B=b;}};
function hideSplash(){const s=$('#splash');if(!s||s.dataset.gone)return;s.dataset.gone=1;setTimeout(()=>{s.classList.add('out');setTimeout(()=>s.remove(),500);},450);}
function start(data){applyOpts();applySkin();setTimeout(cloudInit,0);setState((data&&data.state)||load()||fresh());
 if(!state.bag||!state.items){setState(fresh());}
 const h=location.hash.match(/seed=([^&]+)/);if(h){MENU.mode='seed';MENU.seed=decodeURIComponent(h[1]);}
 if(state.phase==='battle'||state.phase==='result')state.phase='shop';
 achRetro();
 if(state.phase==='class'||!state.cls){classScreen();if(PROF.ver!==VER&&(PROF.totalWins||PROF.history.length||localStorage.getItem('alforje-run4')))newsScreen();else if(PROF.ver!==VER){PROF.ver=VER;saveProf();}}
 else resumeView();
 cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);hideSplash();}
try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({state:Object.assign({},state,{phase:state.phase==='battle'?'shop':state.phase})}));}catch(e){}
if(window.claude&&window.claude.hot&&window.claude.hot.ready)window.claude.hot.ready(start);else start(window.claude&&window.claude.hot&&window.claude.hot.data||{});

})();
