// The Open TTS Leaderboard reports average transcription error over the selected datasets and languages.
// Its public Gradio table serves historical results with and without voice cloning.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = 'https://hf-audio-open-tts-leaderboard.hf.space/gradio_api/call/_refresh_leaderboard';
const languages = ["🇬🇧 English", "🇨🇳 Chinese", "🇫🇷 French", "🇪🇸 Spanish", "🇩🇪 German", "🇮🇹 Italian", "🇯🇵 Japanese", "🇰🇷 Korean", "🇷🇺 Russian", "🇭🇰 Cantonese", "🇵🇹 Portuguese", "🇳🇱 Dutch", "🇵🇱 Polish", "🇨🇿 Czech", "🇷🇴 Romanian", "🇬🇷 Greek", "🇫🇮 Finnish", "🇹🇷 Turkish", "🇸🇦 Arabic", "🇮🇳 Hindi", "🇮🇩 Indonesian", "🇹🇭 Thai", "🇻🇳 Vietnamese", "🇮🇷 Persian"];
const datasets = ["Seed-TTS", "CV3-Eval", "MiniMax", "Neyshekar"];
export function ttsRelease(benchmark:string,version:string,langCount:number,datasetCount:number,minimum:number,includeUtmos=false):Leaderboard {
 const board:Leaderboard={benchmark,feed,url:'https://huggingface.co/spaces/hf-audio/open_tts_leaderboard',
   terms:'Hugging Face allows crawling. The Space and source datasets retain their respective licenses.',
   stats:{
     'Average RTFx ⬆️':{name:'Average real-time factor',unit:'speedup',better:'higher'},
     'Average SIM ⬆️':{name:'Average speaker similarity',unit:'score',better:'higher'},
     ...(includeUtmos?{'UTMOS (en) ⬆️':{name:'UTMOS for English',unit:'score',better:'higher'}}:{}),
     cloningModeRank:{name:'Voice cloning rank',unit:'count',better:'lower'},
     languagesScored:{name:'Languages scored',unit:'count'},
   },
   async fetch(){
     const rows:LeaderboardRow[]=[];
     board.parts={};
     for(const clone of [false,true]){
       if(rows.length) await new Promise(resolve=>setTimeout(resolve,1100));
       const res=await fetch(feed,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data:[version,'',35.3,50,languages.slice(0,langCount),datasets.slice(0,datasetCount),clone]}),signal:AbortSignal.timeout(60000)});
       if(!res.ok) throw new Error('TTS table callback failed: '+res.status);
       const {event_id}=await res.json();
       if(!/^[a-f\d]+$/.test(event_id)) throw new Error('Missing TTS event');
       await new Promise(resolve=>setTimeout(resolve,1100));
       const raw=(await fetchText(feed+'/'+event_id)).match(/event: complete\r?\ndata: (.+)/)?.[1];
       if(!raw) throw new Error('Incomplete TTS table callback');
       const valid=raw.replace(/"(?:\\.|[^"\\])*"|\bNaN\b/g, token=>token==='NaN'?'null':token);
       const t=JSON.parse(valid)[0].value as {headers:string[];data:(number|string|null)[][]};
       const get=(label:string)=>{const i=t.headers.indexOf(label);if(i<0) throw new Error('Missing '+label);return i;};
       const score=get('Average WER ⬇️'),model=get('Model'),size=get('Size (B)'),license=get('License'),coverage=get('Coverage');
       for(const r of t.data){
         if(typeof r[score]!=='number' || !r[model]) throw new Error('Missing TTS mean or model');
         const metrics:Record<string,number>={};
         t.headers.forEach((k,i)=>{
           const lang=/ (WER|CER)$/.test(k);
           if(lang) board.parts![k]=k;
           if(typeof r[i]==='number' && ![score,size].includes(i)) metrics[k==='Rank'?'cloningModeRank':k]=r[i] as number;
         });
         metrics.languagesScored=parseInt(String(r[coverage]));
         rows.push({model:text(String(r[model])),score:r[score] as number,setting:clone?'Voice cloning':'Without voice cloning',
           link:String(r[model]).match(/href="([^"]+)"/)?.[1],params:typeof r[size]==='number'?r[size] as number:undefined,
           license:text(String(r[license]??'')),metrics});
       }
     }
     if(rows.length<minimum) throw new Error('Incomplete release tables');
     return rows;
   }
 };
 return board;
}

export default ttsRelease("open-tts-leaderboard-1-0", "08-09-2026", 9, 2, 39);
