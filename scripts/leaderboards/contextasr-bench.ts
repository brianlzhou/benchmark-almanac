// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// ContextASR tests transcription under three context settings. Table 2 reports word error rate and
// two named-entity error rates for English and Mandarin speech and dialogue.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2507.05727';
const groups = ['Speech-EN','Dialogue-EN','Speech-ZH','Dialogue-ZH'];
const measures = ['WER','NE-WER','NE-FNR'];
const board: Leaderboard = {
  benchmark:'contextasr-bench', url:feed, feed, static:'paper',
  terms:'Table credited to He Wang and colleagues. https://arxiv.org/abs/2507.05727',
  headline:'The headline averages word error rate across the four language and speech-format combinations.',
  parts:Object.fromEntries(groups.flatMap(g=>measures.map(m=>[g+': '+m,{name:g+': '+m,unit:'%',better:'lower'}]))),
  aliases:{'Whisper-Large-turbo':'whisper-large-v3-turbo','Qwen2-Audio':'qwen2-audio-7b-instruct'},
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t=>t[1]?.join('|')===['Model','Size','Context',...groups].join('|'));
    if (!t || !t[2][3].includes('NE-WER') || !t[3][3].includes('NE-FNR')) throw new Error('Missing ContextASR results');
    const rows: LeaderboardRow[] = [];
    for (const [model,size,context,...cells] of t.slice(4)) {
      if (size===model) continue;
      const values = cells.map(cell=>cell.split(/\s*\\mid\s*/));
      if (values.length!==4 || values.some(v=>v.length!==3)) throw new Error('Unexpected error-rate columns');
      if (values.some(v=>v.includes('-'))) continue;
      const params = size.match(/^([\d.]+)\s*([BM])$/);
      if (!params) throw new Error('Missing model size');
      const metrics:Record<string,number>={};
      groups.forEach((group,i)=>measures.forEach((measure,j)=>{ metrics[group+': '+measure]=numberCell(values[i][j]); }));
      const score = groups.reduce((s,g)=>s+metrics[g+': WER'],0)/groups.length;
      if(context.includes('∗')) metrics.severeHallucinationObserved=1;
      const setting = context==='/'?'No context':context.startsWith('Fine')?'Fine-grained context':'Coarse-grained context';
      rows.push({model,setting,score,metrics,params:Number(params[1])/(params[2]==='M'?1000:1)});
    }
    return checked(rows,24);
  },
};
export default board;
