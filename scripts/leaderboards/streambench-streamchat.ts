// StreamBench measures accuracy on streaming video questions. Tables 4 and 5 report overall accuracy,
// response delay and six task scores. Table 7 compares memory configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2501.13468';
const board: Leaderboard = {
  benchmark: 'streambench-streamchat', static: 'paper', url: 'https://arxiv.org/abs/2501.13468', feed, terms: PAPER_TERMS,
  stats: {
    'OS score': { name: 'Object search score', unit: 'score', better: 'higher' },
    'LM score': { name: 'Long-term memory search score', unit: 'score', better: 'higher' },
    'SM score': { name: 'Short-term memory search score', unit: 'score', better: 'higher' },
    'CI score': { name: 'Conversational interaction score', unit: 'score', better: 'higher' },
    'KG score': { name: 'Knowledge-based question answering score', unit: 'score', better: 'higher' },
    'SF score': { name: 'Simple factual score', unit: 'score', better: 'higher' },
    quality: { name: 'Semantic correctness score', unit: 'score', better: 'higher' },
    coherence: { name: 'Coherence fluctuation', unit: 'score', better: 'lower' },
    fps: { name: 'Frames per second', unit: 'count', better: 'higher' },
    latency: { name: 'Request processing delay', unit: 'seconds', better: 'lower' },
  },
  aliases: { LongVA:'longva-7b', 'InternLM-XCP2.5':'internlm-xcomposer2-5-7b', 'MiniCMP-v2.6':'minicpm-v-2-6', 'Video-LLaVA':'video-llava-7b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const main = tables.find(t => t[0]?.join('|') === 'Method|FPS|Fr.|Sco.|Acc.|Coh.|RPD');
    const parts = ['OS','LM','SM','CI','KG','SF'];
    const detail = tables.find(t => t[0]?.[2] === 'OS' && t[0]?.at(-1) === 'SF');
    const memory = tables.find(t => t[1]?.[0] === 'M_{l}' && t[0]?.at(-1) === 'Average');
    if (!main || !detail || !memory) throw new Error('Missing StreamBench results');
    board.parts = Object.fromEntries(parts.map(k => [k,k]));
    function taskMetrics(cells: string[]) {
      if (cells.length !== 12) throw new Error('Missing StreamBench task scores');
      return Object.fromEntries(parts.flatMap((k,i) => [[k,numberCell(cells[2*i+1])],[k+' score',numberCell(cells[2*i])]]));
    }
    const rows: LeaderboardRow[] = [];
    for (const [name,fps,frames,quality,accuracy,coherence,delay] of main.slice(1)) {
      if (name === fps || name === 'Human performance') continue;
      const key = name.startsWith('GPT') ? name + '-' + frames : name;
      const row = detail.find(r => r[0] === key);
      if (!row) throw new Error('Missing StreamBench tasks for '+key);
      const own = ['Slow','Base','Fast'].includes(name);
      rows.push({model:own ? 'STREAMCHAT' : name === 'GPT-4o' ? name+' (snapshot unspecified)' : name, setting:own ? name : frames !== '-' ? frames+' frames' : undefined,
        score:numberCell(accuracy), metrics:{...taskMetrics(row.slice(2)), quality:numberCell(quality), coherence:numberCell(coherence),
          ...(fps !== '-' ? {fps:numberCell(fps)} : {}), ...(delay !== '-' ? {latency:numberCell(delay)} : {})}});
    }
    for (const r of memory.slice(2)) {
      if (r.slice(0,3).every(x => x === '✓')) continue;
      rows.push({model:'STREAMCHAT',setting:'Base, memory (long, short, dynamic): '+r.slice(0,3).join(', '),
        score:numberCell(r[16]),metrics:{...taskMetrics(r.slice(3,15)),quality:numberCell(r[15])}});
    }
    if (rows.length < 24) throw new Error('Missing StreamBench configurations');
    return rows;
  },
};
export default board;
