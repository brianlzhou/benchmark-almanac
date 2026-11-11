// Voice Arena publishes independent language vote pools. Category filters are not separate boards.
// Read only the public site's anonymous Supabase endpoint. Never use a user session or privileged key.
// Public launch flags control the five new languages. Preview and staging rows are excluded.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson } from '../util.ts';
const SITE='https://voicearena.com';
const NEW_LANGUAGES=new Set(['German','French','Indian English','Tagalog','Bahasa']);
interface Entry {language:string;category:string;sub_category:string|null;model:string;creator_key:string;elo:number;ci:number;samples:number;win_rate:number|string;rank:number;range_low:number;range_high:number}
const pause=()=>new Promise(r=>setTimeout(r,1050));
let pending:Promise<{rows:Entry[];live:boolean;latency:string}>|undefined;
async function source(){
  if(pending)return pending;
  pending=(async()=>{
    const html=await fetchText(SITE+'/tts-leaderboard/us-english');
    const path=html.match(/src="(\/assets\/index-[^"/]+\.js)"/)?.[1];
    if(!path)throw new Error('Voice Arena main asset missing');
    await pause();
    const main=await fetchText(SITE+path);
    const origin=main.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
    let anon:string|undefined;
    for(const m of main.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){
      try{if(JSON.parse(Buffer.from(m[0].split('.')[1],'base64url').toString()).role==='anon'){anon=m[0];break;}}catch{}
    }
    if(!origin||!anon)throw new Error('Voice Arena public anonymous configuration missing');
    const headers={apikey:anon,Authorization:'Bearer '+anon};
    const flags=await fetchJson<{value:unknown}[]>(origin+'/rest/v1/site_settings?select=value&key=eq.tts_new_languages_live',{headers});
    const rows:Entry[]=[];
    const fields='language,category,sub_category,rank,range_low,range_high,creator_key,creator,model,elo,ci,win_rate,samples,released';
    for(let offset=0;;offset+=1000){
      await pause();
      const batch=await fetchJson<Entry[]>(origin+'/rest/v1/leaderboard_rows?select='+fields+'&category=eq.All&sub_category=is.null&order=rank.asc&limit=1000&offset='+offset,{headers});
      rows.push(...batch);
      if(batch.length<1000)break;
    }
    const latencyPath=main.match(/"(?:\.\/|assets\/)(Index-[^"/]+\.js)"/)?.[1];
    if(!latencyPath)throw new Error('Voice Arena latency asset missing');
    await pause();
    const latency=await fetchText(SITE+'/assets/'+latencyPath);
    return {rows,live:flags.some(r=>r.value===true),latency};
  })();
  try{return await pending;}catch(e){pending=undefined;throw e;}
}
// Read published summary literals as data, without executing downloaded JavaScript.
// The summaries use the default 1-day window. Other windows are separate numeric metrics.
function latencyMetrics(script:string,row:Entry):Record<string,number>{
  const creators:Record<string,string>={google_deepmind:'google',fish_audio:'fish',smallest_ai:'smallest',speechifyai:'speechify',murf_ai:'murf',microsoft_azure:'azure'};
  const creator=creators[row.creator_key]??row.creator_key;
  const model=row.model.toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
  for(const match of script.matchAll(/\{creatorKey:"([^"]+)",(.*?)\}\}\}/g)){
    if(match[1]!==creator||!match[2].includes('ttfaP50:'))continue;
    const body=match[2], predicate=body.match(/^match:(.*?),ttfaP50:/)?.[1];
    if(predicate){
      const simple=predicate.match(/^[a-z]=>[a-z]\.includes\("([^"]+)"\)(?:&&!([a-z])\.includes\("([^"]+)"\))?$/);
      if(simple){if(!model.includes(simple[1])||(simple[3]&&model.includes(simple[3])))continue;}
      else if(/^\([a-z],[a-z]\)=>[a-z]\.trim\(\)==="Gradium-TTS"\|\|[a-z]\.includes\("default"\)$/.test(predicate)){
        if(row.model.trim()!=='Gradium-TTS'&&!model.includes('default'))continue;
      }else continue; // An unfamiliar source predicate needs explicit review.
    }
    const metrics:Record<string,number>={};
    function read(text:string,prefix:string){
      for(const m of text.matchAll(/\b(ttfa(?:P50|Mean|P75|P95|P99)|gen(?:P50|Mean|P75|P95|P99)|charsPerSecP50):([\d.e+-]+)/g)){
        const value=Number(m[2]);if(Number.isFinite(value))metrics[prefix+m[1]+(m[1].startsWith('chars')?'':'Ms')]=value;
      }
    }
    read(body.split(',byWindow:')[0],'');
    for(const window of body.matchAll(/"(7d|30d)":\{([^}]+)/g))read(window[2],'window'+window[1]+'_');
    return metrics;
  }
  return {};
}
export function voiceArena(language:string,slug:string):Leaderboard{
  return {
    benchmark:'voicearena-'+slug,url:SITE+'/tts-leaderboard/'+slug,feed:SITE+'/tts-leaderboard/'+slug,
    terms:'Public Voice Arena leaderboard and anonymous read API. Site terms apply. The almanac credits and links the source.',
    ...(language==='US English'?{chart:{title:'Quality vs Speed',x:{key:'ttfaP50Ms',label:'Median time to first audio',unit:'ms',better:'lower' as const},y:{key:'score',label:'Elo',better:'higher' as const},note:'Published US English latency summaries use the default 1-day measurement window.'}}:{}),
    async fetch():Promise<LeaderboardRow[]>{
      const data=await source();
      if(NEW_LANGUAGES.has(language)&&!data.live)throw new Error('Voice Arena language is not publicly launched: '+language);
      const rows:LeaderboardRow[]=[];
      for(const r of data.rows){
        if(r.category!=='All'||r.sub_category!==null)continue;
        if(r.language!==language&&!(NEW_LANGUAGES.has(language)&&r.language===language+'__hold'))continue;
        if(!r.model||!Number.isFinite(r.elo)||r.samples<=0)continue;
        const metrics:Record<string,number>={};
        for(const [key,value] of Object.entries({ci:r.ci,votes:r.samples,winRate:Number(r.win_rate),rank:r.rank,rankLow:r.range_low,rankHigh:r.range_high}))if(Number.isFinite(value))metrics[key]=value;
        if(language==='US English')Object.assign(metrics,latencyMetrics(data.latency,r));
        rows.push({model:r.model,score:r.elo,metrics});
      }
      if(!rows.length)throw new Error('Voice Arena public language ratings missing: '+language);
      return rows;
    },
  };
}
