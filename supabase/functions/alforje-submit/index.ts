// Alforje: único caminho de escrita do placar do Diário e dos fantasmas.
// Confere o jogador pelo token, refaz cada luta da prova com o mesmo sim.js do jogo e só então grava.
import "./win.js";
import "./data.js";
import "./sim.js";
import { createClient } from "jsr:@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
const S = (globalThis as any).AlforjeSim;
// deno-lint-ignore no-explicit-any
const D = (globalThis as any).AlforjeData;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_BODY = 250_000;

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

const dayIxOf = (d: string) => Math.round(Date.parse(d + "T00:00:00Z") / 864e5);

// mesmo formato do buildCode do jogo: 'ALF6.' + base64 de JSON em UTF-8
function decodeBuild(code: unknown) {
  if (typeof code !== "string" || !code.startsWith("ALF6.") || code.length > 8000) return null;
  try {
    const bytes = Uint8Array.from(atob(code.slice(5)), (c) => c.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes));
    if (!o || !D.CLASSES[o.c] || !Array.isArray(o.i) || !Array.isArray(o.b)) return null;
    // deno-lint-ignore no-explicit-any
    if (!o.i.some((a: any) => Array.isArray(a) && D.ITEMS[a[0]] && D.ITEMS[a[0]].type === "weapon")) return null;
    return o;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { ok: false, why: "método" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!user) return reply(401, { ok: false, why: "sem conta" });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return reply(413, { ok: false, why: "envio grande demais" });
  let body: { kind?: string; entry?: unknown; code?: unknown; asc?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false, why: "formato" });
  }

  if (body.kind === "daily") {
    // deno-lint-ignore no-explicit-any
    const e = body.entry as any;
    if (!e || typeof e.d !== "string" || !/^\d{4}-\d\d-\d\d$/.test(e.d)) return reply(400, { ok: false, why: "dia" });
    // aceita o Diário de hoje e o de ontem (a partida pode terminar depois da meia-noite UTC)
    const today = Math.floor(Date.now() / 864e5), ix = dayIxOf(e.d);
    if (ix !== today && ix !== today - 1) return reply(422, { ok: false, why: "Diário fora do prazo" });
    // v1.4: o Diário leva a versão do combate em que começou (e.sv). Sem ela, ou com outra, as lutas não conferem com este
    // sim.js: responde 'versao' antes de refazer qualquer luta (o jogo mostra "começou na versão anterior", não "não confere").
    if (e.sv !== S.SIM_VER) return reply(422, { ok: false, why: "versão antiga do jogo", code: "versao" });
    const v = S.verifyDaily(e, ix);
    if (!v.ok) return reply(422, { ok: false, why: v.why });
    const { data: old } = await admin.from("board").select("score").eq("user_id", user.id).eq("day", e.d).maybeSingle();
    if (old && old.score >= v.score) return reply(200, { ok: true, score: old.score, kept: true });
    const { error } = await admin.from("board").upsert({
      user_id: user.id, day: e.d, score: v.score, cls: e.cls, wins: e.w, fights: e.pf.length, proof: e.pf,
      verified_at: new Date().toISOString(),
    });
    if (error) return reply(500, { ok: false, why: "não deu para gravar" });
    return reply(200, { ok: true, score: v.score });
  }

  if (body.kind === "ghost") {
    const o = decodeBuild(body.code);
    const asc = Math.max(0, Math.min(10, Number(body.asc) || 0));
    if (!o) return reply(422, { ok: false, why: "código" });
    const p = S.ghostPlausible(o, asc);
    if (!p.ok) return reply(422, { ok: false, why: p.why });
    const { error } = await admin.from("ghosts").upsert({
      user_id: user.id, code: body.code, cls: o.c, wins: D.GOAL, ascension: asc, created_at: new Date().toISOString(),
    });
    if (error) return reply(500, { ok: false, why: "não deu para gravar" });
    return reply(200, { ok: true });
  }

  return reply(400, { ok: false, why: "tipo" });
});
