/* Alforje: conta de convidado e servidor (Supabase). Tudo aqui falha em silêncio: sem rede, o jogo segue local. */
(function(){
'use strict';
let sb=null,uid=null;
/* v1.4 (rodada 2): hora do servidor, lida do cabeçalho Date das respostas que o jogo já pede (nenhuma chamada nova).
   Guarda o ms do servidor e o performance.now() da leitura; serverTime() soma o tempo que passou desde então (não usa o relógio do aparelho). */
let srvMs=null,srvAt=0;
function noteDate(r){try{const h=r&&r.headers&&r.headers.get('date'),t=h?Date.parse(h):NaN;if(Number.isFinite(t)){srvMs=t;srvAt=performance.now();}}catch(e){}return r;}
const timedFetch=(...a)=>fetch(...a).then(noteDate);
function serverTime(){return srvMs==null?null:srvMs+(performance.now()-srvAt);}

async function init(){const C=window.ALFORJE_CONFIG;
 if(!C||!C.url||!C.key||!window.supabase||typeof window.supabase.createClient!=='function')return null;
 sb=window.supabase.createClient(C.url,C.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'alforje-auth'},global:{fetch:timedFetch}});
 let {data:{session}}=await sb.auth.getSession();
 /* primeira visita: conta de convidado, sem cadastro; o progresso fica preso a ela neste aparelho */
 if(!session){const r=await sb.auth.signInAnonymously();if(r.error)return null;session=r.data.session;}
 uid=session&&session.user?session.user.id:null;return uid;}

async function loadSave(){const {data,error}=await sb.from('saves').select('t,v,prof,run').eq('user_id',uid).maybeSingle();if(error)throw error;return data;}
async function pushSave(d){const {error}=await sb.from('saves').upsert(Object.assign({user_id:uid,updated_at:new Date().toISOString()},d));if(error)throw error;}

/* o servidor refaz as lutas antes de gravar; devolve {ok, score} ou {ok:false, why} */
async function submit(kind,payload){const {data,error}=await sb.functions.invoke('alforje-submit',{body:Object.assign({kind},payload)});
 if(error){let why='servidor indisponível';try{const b=await error.context.json();if(b&&b.why)why=b.why;}catch(e){}return {ok:false,why};}
 return data;}

async function board(day,limit){const {data,error}=await sb.from('board').select('user_id,score,cls,wins').eq('day',day).order('score',{ascending:false}).limit(limit||30);if(error)throw error;return data||[];}
async function ghosts(limit){const {data,error}=await sb.from('ghosts').select('user_id,code,cls,wins,ascension').limit(limit||300);if(error)throw error;return data||[];}
async function names(ids){const out={};if(!ids.length)return out;const {data}=await sb.from('players').select('id,name').in('id',ids);for(const r of data||[])out[r.id]=r.name;return out;}
async function setName(name){name=String(name||'').trim().slice(0,24);if(!name)return false;const {error}=await sb.from('players').upsert({id:uid,name,updated_at:new Date().toISOString()});return !error;}
async function postRun(rec){await sb.from('runs').insert({rec});}

window.AlforjeCloud={init,loadSave,pushSave,submit,board,ghosts,names,setName,postRun,serverTime,get uid(){return uid;}};
})();
