// DISPLACE-M scores speech diarization, recognition, topic identification and summarization on clinical conversations.
// Figure 2 ranks the first track by diarization error rate. Read its SVG text glyphs in horizontal bar order.
// Tables 1 and 2 supply the other track measures for the same closed models. ROUGE and error rates use different scales.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const paper = 'https://arxiv.org/html/2603.02813v3';
const feed = paper+'/track1_res_with_baselines.svg';
const board: Leaderboard = {
  benchmark:'displace-m-2026',url:paper,feed,terms:'The authors publish Figure 2 and Tables 1 and 2 at https://arxiv.org/abs/2603.02813. Source licensing applies.',
  parts:{der:{name:'Speaker diarization',unit:'%',better:'lower'},tcpWer:{name:'Automatic speech recognition (tcpWER)',unit:'%',better:'lower'},
    topicRougeL:{name:'Topic identification (ROUGE-L)',unit:'score',better:'higher'},summaryRougeL:{name:'Dialogue summarization (ROUGE-L)',unit:'score',better:'higher'}},
  stats:{cer:{name:'Character error rate',unit:'%',better:'lower'},wer:{name:'Word error rate',unit:'%',better:'lower'},topicRouge1:{name:'Topic identification (ROUGE-1)',unit:'score',better:'higher'}},
  async fetch() {
    const svg = await paperHtml(feed);
    const labels = [...svg.matchAll(/<use data-text="([^"]+)"[^>]+transform="matrix\(16\.313542,-7\.607129,/g)].map(m=>m[1]).join('');
    if (labels!=='T1T2T3T4T5T6T7T8T9Baseline-1Baseline-2Sarvam AIGemini') throw new Error('Diarization chart labels changed');
    const numbers: {x:number,y:number,value:string}[] = [];
    let priorX = -Infinity;
    for (const [,digit,x,y] of svg.matchAll(/<use data-text="([\d.])"[^>]+matrix\(14,0,0,-14,([\d.]+),([\d.]+)\)/g)) {
      const last = numbers.at(-1);
      if (last && last.y===+y && +x>priorX && +x-priorX<13) last.value += digit;
      else numbers.push({x:+x,y:+y,value:digit});
      priorX = +x;
    }
    numbers.sort((a,b)=>a.x-b.x);
    if (numbers.length!==13 || numbers.some(n=>!/^\d+\.\d{2}$/.test(n.value))) throw new Error('Invalid DER chart');
    const tabs = paperTables(await paperHtml(paper)).map(grid);
    const asr = tabs.find(t=>t[0]?.join('|')==='System|CER (%)|WER (%)|tcpWER(%)');
    const qa = tabs.find(t=>t[1]?.join('|')==='Team|R-1|R-L|Team|R-L');
    if (!asr || !qa) throw new Error('Missing auxiliary track tables');
    const rows:LeaderboardRow[]=[];
    for (const [bar,model,setting,submitter] of [
      [1,'DiariZen large with WavLM','Fine-tuned on Dev-1','T2'],[2,'DiariZen large with WavLM','Fine-tuned on pooled development data','T3'],
      [9,'DiariZen','Zero-shot','Organizers'],[10,'DiariZen','Fine-tuned on development data','Organizers'],
      [11,'Sarvam AI (Saaras v3)',undefined,undefined],[12,'Gemini 2.5 Pro',undefined,undefined],
    ] as const) {
      const score = Number(numbers[bar].value);
      const metrics:Record<string,number>={der:score};
      const speech = asr.find(c=>c[0]===model);
      if (bar>=11 && !speech) throw new Error('Missing ASR row: '+model);
      if (speech) {
        metrics.cer=Number(speech[1]);metrics.wer=Number(speech[2]);
        if (speech[3]!=='–') metrics.tcpWer=Number(speech[3]);
      }
      if (model==='Gemini 2.5 Pro') {
        const result=qa.find(c=>c[0]===model && c[3]===model);
        if (!result) throw new Error('Missing Gemini QA row');
        metrics.topicRouge1=Number(result[1]);metrics.topicRougeL=Number(result[2]);metrics.summaryRougeL=Number(result[4]);
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid track metric');
      rows.push({model,setting,submitter,score,metrics});
    }
    return checked(rows,6);
  },
};
export default board;
