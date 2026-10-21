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
 if(s.route!=null&&!Array.isArray(s.route))return 'route';
 if(s.gq!=null&&!isObj(s.gq))return 'gq';
 if(s.pq!=null&&(!Array.isArray(s.pq)||!s.pq.every(Array.isArray)))return 'pq';
 return '';}

/* completa (só) o que falta de campos opcionais com o padrão de fresh(); não troca valores existentes */
function fillRun(s,base){for(const k in base)if(s[k]===undefined)s[k]=base[k];return s;}

/* perfil: campos nulos ou de tipo errado voltam ao padrão (codex, conquistas, histórico...) */
function fixProf(p,base){
 for(const k in base){const d=base[k];
  if(Array.isArray(d)){if(!Array.isArray(p[k]))p[k]=d.slice();}
  else if(isObj(d)){if(!isObj(p[k]))p[k]=JSON.parse(JSON.stringify(d));}
  else if(typeof d==='number'){if(!isNum(p[k]))p[k]=d;}
  else if(typeof d==='string'){if(typeof p[k]!=='string')p[k]=d;}}
 const c=p.codex;for(const k of ['items','foes','recipes'])if(!isObj(c[k]))c[k]={};
 for(const k in c.items)if(!isObj(c.items[k]))delete c.items[k];
 for(const k in c.foes)if(!isObj(c.foes[k]))delete c.foes[k];
 if(p.miss!=null&&!(isObj(p.miss)&&Array.isArray(p.miss.ids)&&isObj(p.miss.p)&&isObj(p.miss.done)))p.miss=null;
 if(p.meta!=null&&!isObj(p.meta))delete p.meta;
 p.history=p.history.filter(isObj);
 return p;}

window.AlforjeSave={runProblem,fillRun,fixProf};
})();
