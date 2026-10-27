/* Alforje: conferência de jornada e perfil salvos (localStorage ou nuvem) antes de usar. Sem DOM, sem localStorage. */
(function(){
'use strict';
const D=window.AlforjeData||{};
const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const isNum=n=>typeof n==='number'&&Number.isFinite(n);
const isInt=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const PHASES=['class','shop','battle','end','result'];
const QUEUE=['bless','sub','event','expandfree'];
const has=(T,k)=>typeof k==='string'&&!!T&&Object.prototype.hasOwnProperty.call(T,k);
const subOk=id=>{for(const k in D.SUBS||{})for(const s of D.SUBS[k])if(s.id===id)return true;return false;};

/* devolve '' se a jornada salva dá para retomar; senão o motivo (para o registro) */
function runProblem(s){
 if(!isObj(s))return 'não é objeto';
 if(!PHASES.includes(s.phase))return 'fase';
 if(!(s.cls===null||has(D.CLASSES,s.cls)))return 'classe';
 if(s.phase!=='class'&&!s.cls)return 'sem classe';
 for(const k of ['gold','round','wins','lives','maxLives','rng','nid','bagLvl'])if(!isNum(s[k]))return k;
 /* v1.4: números que o jogo lê na luta precisam ser finitos (texto ou NaN viravam vida "NaN" e herói imortal) */
 if(s.asc!=null&&!isNum(s.asc))return 'asc';
 if(s.maxHpMod!=null&&!isNum(s.maxHpMod))return 'maxHpMod';
 for(const k of ['survLives','merges','rerollN','stopLosses','lossStreak','winStreak','extraLock'])if(s[k]!=null&&!isNum(s[k]))return k;
 if(s.elites!=null&&(!isObj(s.elites)||!Object.keys(s.elites).every(k=>Array.isArray(s.elites[k])&&s.elites[k].every(v=>v==null||Array.isArray(v)&&v.every(x=>has(D.MODS,x))))))return 'elites';
 if(s.surv&&!Array.isArray(s.survRoute))return 'survRoute';
 const b=s.bag;if(!isObj(b)||!isInt(b.cols,1,20)||!isInt(b.rows,1,20)||!isObj(b.pockets))return 'bag';
 for(const k in b.pockets)if(!has(D.POCKETS,b.pockets[k]))return 'bolso';
 if(!Array.isArray(s.items))return 'items';
 for(const it of s.items)if(!isObj(it)||!has(D.ITEMS,it.key)||!isInt(it.tier,1,4)||(it.where!=='bag'&&it.where!=='chest')||![it.x,it.y,it.w,it.h].every(isNum)||!isNum(it.id))return 'item';
 if(!Array.isArray(s.pets))return 'pets';
 for(const p of s.pets)if(p!==null&&(!isObj(p)||!has(D.PETS,p.key)||!isInt(p.tier,1,4)))return 'pet';
 if(!Array.isArray(s.shop))return 'shop';
 for(const o of s.shop)if(o!==null&&(!isObj(o)||!has(o.pet?D.PETS:D.ITEMS,o.key)||!isInt(o.tier,1,4)))return 'oferta';
 if(!Array.isArray(s.bless)||!s.bless.every(k=>has(D.BLESS,k)))return 'bless';
 if(!isObj(s.etiq))return 'etiq';
 if(s.reward!=null&&(!Array.isArray(s.reward)||!s.reward.every(k=>has(D.BLESS,k))))return 'reward';
 if(s.sub!=null&&!subOk(s.sub))return 'sub';
 if(s.event!=null&&!has(D.EVENTS,s.event))return 'event';
 if(s.queue!=null&&(!Array.isArray(s.queue)||!s.queue.every(q=>QUEUE.includes(q))))return 'queue';
 if(s.cur!=null&&!QUEUE.includes(s.cur))return 'cur';
 if(s.expandOpts!=null&&(!Array.isArray(s.expandOpts)||!s.expandOpts.every(o=>isObj(o)&&(o.dir==='col'||o.dir==='row')&&has(D.POCKETS,o.pocket))))return 'expandOpts';
 if(s.pendingEtiq!=null&&s.pendingEtiq!=='raros'&&s.pendingEtiq!=='epico')return 'pendingEtiq';
 if(s.skipOffer!=null&&!has(D.ETIQ,s.skipOffer))return 'skipOffer';
 if(s.duel!=null&&(!isObj(s.duel)||!has(D.CLASSES,s.duel.c)||!Array.isArray(s.duel.i)||!Array.isArray(s.duel.b)||!s.duel.i.every(a=>Array.isArray(a)&&has(D.ITEMS,a[0]))))return 'duel';
 if(s.perm!=null&&(!isObj(s.perm)||(s.perm.pet!=null&&(!isObj(s.perm.pet)||!has(D.PETS,s.perm.pet.key)))))return 'perm';
 if(isObj(s.perm))for(const k of ['hp','block','dmgPct','crit'])if(s.perm[k]!=null&&!isNum(s.perm[k]))return 'perm';
 for(const p of s.pets)if(p&&p.mul!=null&&!isNum(p.mul))return 'pet';
 if(s.route!=null&&!Array.isArray(s.route))return 'route';
 if(s.gq!=null&&!isObj(s.gq))return 'gq';
 if(s.pq!=null&&(!Array.isArray(s.pq)||!s.pq.every(Array.isArray)))return 'pq';
 return '';}

/* v1.4: limites da jornada salva. Ascensão 0–10, contadores não negativos, bônus de conta no máximo do jogo (equipamento 20 e nível 30
   valem +29 de vida, +38 de escudo, +19% de dano e +9,5% de crítico; o companheiro do equipamento vale até ×1,9) e vida máxima perdida limitada */
const PERM_MAX={hp:29,block:38,dmgPct:.19,crit:.095},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function limitRun(s){s.asc=clamp(Math.floor(isNum(s.asc)?s.asc:0),0,10);
 for(const k of ['gold','round','wins','lives','maxLives','nid','bagLvl','survLives','merges','rerollN','stopLosses','lossStreak','winStreak','extraLock'])if(isNum(s[k])&&s[k]<0)s[k]=0;
 if(isNum(s.maxHpMod))s.maxHpMod=clamp(s.maxHpMod,-60,0);
 if(isObj(s.perm))for(const k in PERM_MAX)if(isNum(s.perm[k]))s.perm[k]=clamp(s.perm[k],0,PERM_MAX[k]);
 if(isObj(s.perm)&&isObj(s.perm.pet)&&s.perm.pet.mul!=null)s.perm.pet.mul=clamp(isNum(s.perm.pet.mul)?s.perm.pet.mul:1,1,1.9);
 if(Array.isArray(s.pets))for(const p of s.pets)if(p&&isNum(p.mul))p.mul=clamp(p.mul,1,1.9);
 return s;}
/* completa (só) o que falta de campos opcionais com o padrão de fresh(); não troca valores existentes (só os limita) */
function fillRun(s,base){for(const k in base)if(s[k]===undefined)s[k]=base[k];return limitRun(s);}

/* perfil: campos nulos ou de tipo errado voltam ao padrão (codex, conquistas, histórico...) */
function fixProf(p,base){
 for(const k in base){const d=base[k];
  if(Array.isArray(d)){if(!Array.isArray(p[k]))p[k]=d.slice();}
  else if(isObj(d)){if(!isObj(p[k]))p[k]=JSON.parse(JSON.stringify(d));}
  else if(typeof d==='number'){if(!isNum(p[k])||p[k]<0)p[k]=d;}
  else if(typeof d==='string'){if(typeof p[k]!=='string')p[k]=d;}}
 const c=p.codex;for(const k of ['items','foes','recipes'])if(!isObj(c[k]))c[k]={};
 for(const k in c.items)if(!isObj(c.items[k]))delete c.items[k];
 for(const k in c.foes)if(!isObj(c.foes[k]))delete c.foes[k];
 if(p.miss!=null&&!(isObj(p.miss)&&Array.isArray(p.miss.ids)&&isObj(p.miss.p)&&isObj(p.miss.done)))p.miss=null;
 if(p.meta!=null&&!isObj(p.meta))delete p.meta;
 /* v1.4: Ascensão por classe 0–10 (inteira), vitórias na Ascensão 0–1; contadores do perfil não negativos */
 for(const f of ['asc','ascW','classWins'])if(p[f]!=null&&!isObj(p[f]))p[f]={};
 for(const k of Object.keys(p.asc||{})){const v=p.asc[k];if(!isNum(v)||!has(D.CLASSES,k))delete p.asc[k];else p.asc[k]=clamp(Math.floor(v),0,10);}
 for(const k of Object.keys(p.ascW||{})){const v=p.ascW[k];if(!isNum(v)||!has(D.CLASSES,k))delete p.ascW[k];else p.ascW[k]=clamp(Math.floor(v),0,1);}
 for(const k of Object.keys(p.classWins||{})){const v=p.classWins[k];if(!isNum(v)||v<0)delete p.classWins[k];}
 p.history=p.history.filter(isObj);
 return p;}

window.AlforjeSave={runProblem,fillRun,limitRun,fixProf};
})();
