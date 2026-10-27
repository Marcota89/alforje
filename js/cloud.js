/* Alforje: conta de convidado e servidor (Supabase). Tudo aqui falha em silêncio: sem rede, o jogo segue local. */
(function(){
'use strict';
let sb=null,uid=null;
/* v1.4 (rodada 2): hora do servidor = "iat" do token da sessão (o servidor assina na hora em que emite; renova a cada ~1 h).
   O navegador não deixa ler o cabeçalho Date do Supabase (CORS), por isso o token. Um iat antigo só deixa o piso mais baixo, nunca trava ninguém. */
let srvMs=null,srvAt=0;
/* v1.4 (rodada 3): hora fora de [2020-01-01, 8,64e15 ms] é ignorada (token adulterado ou absurdo) */
const SRV_MIN=Date.UTC(2020,0,1),SRV_MAX=8.64e15;
/* v1.4 (revisão final, I-1): relógio monotônico (performance.now, que mudar a data do aparelho não mexe). Sem ele, 0 (fica no iat). */
const mono=()=>{try{return typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():0;}catch(e){return 0;}};
function noteToken(s){try{const p=JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))),t=p.iat*1000;
 if(Number.isFinite(t)&&t>=SRV_MIN&&t<=SRV_MAX&&(srvMs==null||t>srvMs)){srvMs=t;srvAt=mono();}}catch(e){}}
/* iat + o tempo que passou desde que o token chegou (pelo relógio monotônico): nunca passa da hora real do servidor, e a virada do dia
   UTC não espera a renovação do token (~1 h). Aba suspensa só atrasa (fica mais baixa), o que é o lado seguro. */
function serverTime(){return srvMs==null?null:srvMs+Math.max(0,mono()-srvAt);}

async function init(){const C=window.ALFORJE_CONFIG;
 if(!C||!C.url||!C.key||!window.supabase||typeof window.supabase.createClient!=='function')return null;
 sb=window.supabase.createClient(C.url,C.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'alforje-auth'}});
 let {data:{session}}=await sb.auth.getSession();
 /* primeira visita: conta de convidado, sem cadastro; o progresso fica preso a ela neste aparelho */
 if(!session){const r=await sb.auth.signInAnonymously();if(r.error)return null;session=r.data.session;}
 noteToken(session);sb.auth.onAuthStateChange((e,s)=>{if(s)noteToken(s);});
 uid=session&&session.user?session.user.id:null;return uid;}

async function loadSave(){const {data,error}=await sb.from('saves').select('t,v,prof,run').eq('user_id',uid).maybeSingle();if(error)throw error;return data;}
async function pushSave(d){const {error}=await sb.from('saves').upsert(Object.assign({user_id:uid,updated_at:new Date().toISOString()},d));if(error)throw error;}

/* o servidor refaz as lutas antes de gravar; devolve {ok, score} ou {ok:false, why} */
async function submit(kind,payload){const {data,error}=await sb.functions.invoke('alforje-submit',{body:Object.assign({kind},payload)});
 if(error){let why='servidor indisponível',code;try{const b=await error.context.json();if(b&&b.why)why=b.why;if(b&&b.code)code=b.code;}catch(e){}return {ok:false,why,code};}
 return data;}

async function board(day,limit){const {data,error}=await sb.from('board').select('user_id,score,cls,wins').eq('day',day).order('score',{ascending:false}).limit(limit||30);if(error)throw error;return data||[];}
async function ghosts(limit){const {data,error}=await sb.from('ghosts').select('user_id,code,cls,wins,ascension').limit(limit||300);if(error)throw error;return data||[];}
async function names(ids){const out={};if(!ids.length)return out;const {data}=await sb.from('players').select('id,name').in('id',ids);for(const r of data||[])out[r.id]=r.name;return out;}
async function setName(name){name=String(name||'').trim().slice(0,24);if(!name)return false;const {error}=await sb.from('players').upsert({id:uid,name,updated_at:new Date().toISOString()});return !error;}
async function postRun(rec){await sb.from('runs').insert({rec});}

window.AlforjeCloud={init,loadSave,pushSave,submit,board,ghosts,names,setName,postRun,serverTime,get uid(){return uid;}};
})();
