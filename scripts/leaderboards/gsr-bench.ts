// GSR-Bench tests grounded speech reformulation. The paper gives no cross-level total.
// Table 1 lists the GSR-Refine judge score and transcription error. Tables 4 and 5 add summary quality and acoustic reliability.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.41292';
const judges = ['GPT-4o','DeepSeek-v4'];
const dimensions = ['Fidelity','Fluency','Readability'];
const summary = ['Faithfulness','Coverage','Key Information','Conciseness','Fluency'];
const judgeParts = judges.flatMap(judge => dimensions.map(d => judge+' '+d));
const board: Leaderboard = {
  benchmark: 'gsr-bench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2610.41292",
  aliases:{'Qwen-ASR-0.6B':'qwen3-asr-0-6b','Qwen-ASR-1.7B':'qwen3-asr-1-7b'},
  harnesses:'system',
  headline:'The headline is the GSR-Refine LLM-Score in Table 1, on a scale from 1 to 5.',
  parts:{
    ...Object.fromEntries([...judgeParts,...summary.map(k => 'Summarization '+k)].map(name => [name,{name,unit:'score' as const}])),
    cer:{name:'Character error rate',unit:'%',better:'lower'},htr:{name:'Hallucination trigger rate',unit:'%',better:'lower'},
    ahl:{name:'Average hallucination length',unit:'score',better:'lower',note:'Characters per nonempty output.'},
  },
  stats:{totalChars:{name:'Total characters',unit:'count'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.[1] === 'Fidelity' && t[1]?.[7]?.startsWith('LLM-Score') && t[1]?.[8]?.startsWith('CER'));
    const summaries = tables.find(t => t[0]?.[0] === 'Metric' && t[1]?.[0] === 'Faithfulness');
    const stress = tables.find(t => t[0]?.[1]?.startsWith('HTR (%)'));
    if (!main || !summaries || !stress || main[0][4] !== judges[1]) throw new Error('Missing GSR-Bench results');
    const rows: LeaderboardRow[] = main.slice(2).map(r => {
      if (r.length !== 9) throw new Error('Missing GSR-Refine dimension');
      const cascade = r[0].includes('Cascade');
      const model = cascade ? 'TeleASR' : r[0].split(' (')[0].replace('Gemini3.1','Gemini 3.1');
      const metrics:Record<string,number> = {cer:numberCell(r[8])};
      judgeParts.forEach((k,i) => {metrics[k]=numberCell(r[i+1]);});
      const c = summaries[0].indexOf(model);
      if (c > 0) for (const [key,...values] of summaries.slice(1)) metrics['Summarization '+key]=numberCell(values[c-1]);
      const acoustic = stress.slice(1).find(s => s[0].replace('Gemini3.1','Gemini 3.1') === model);
      if (acoustic) {
        metrics.htr=numberCell(acoustic[1]); metrics.ahl=numberCell(acoustic[2]); metrics.totalChars=numberCell(acoustic[3]);
      }
      return {model,score:numberCell(r[7]),metrics,harness:cascade ? 'ASR + LLM cascade' : undefined};
    });
    return checked(rows,11);
  },
};
export default board;
