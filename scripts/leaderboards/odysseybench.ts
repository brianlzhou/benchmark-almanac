// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// OdysseyBench tests office application workflows. Tables 4 to 6 report success rates for Plus and Neo.
// We pair the same input-history configuration across both tracks and retain the task breakdowns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2508.09124';
const tracks = ['Plus', 'Neo'];
const columns = ['1-apps', '2-apps', '3-apps', 'overall'];
const board: Leaderboard = {
  benchmark: 'odysseybench', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall success rate, so this is the plain mean of the OdysseyBench+ and OdysseyBench-Neo overall percentages.',
  aliases: { 'DS.-Distill-Qwen-32b': 'deepseek-r1-distill-qwen-32b', 'Qwen-3-32b': 'qwen3-32b' },
  stats: { PlusContextTokens: { name: 'OdysseyBench+ context tokens', unit: 'tokens' }, NeoContextTokens: { name: 'OdysseyBench-Neo context tokens', unit: 'tokens' } },
  parts: Object.fromEntries(tracks.flatMap(track => columns.map((c,i) =>
    [track + i, (track === 'Plus' ? 'OdysseyBench+' : 'OdysseyBench-Neo') + ' ' + c]))),
  async fetch() {
    const html = await paperHtml(feed);
    function table(id: string) {
      const f = html.split('<figure id="S4.T' + id + '"')[1]?.split('</figure>')[0];
      if (!f) throw Error('Missing Table ' + id);
      return flatPaperTables(f).map(grid)[0];
    }
    const main = table('4');
    if (main[1]?.slice(1).join('|') !== [...columns,...columns].join('|')) throw Error('Missing track columns');
    function values(track: string, cells: string[]) {
      if (cells.length !== 4) throw Error('Incomplete track');
      return Object.fromEntries(cells.map((c,i) => [track + i, numberCell(c.replace(/^0\s+(?=\d\.)/, ''))]));
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, ...cells] of main.slice(2)) {
      if (cells.every(c => c === model)) continue;
      const metrics = { ...values('Plus', cells.slice(0,4)), ...values('Neo', cells.slice(4)) };
      rows.push({ model, setting: 'Long-context prompting', metrics, score: (metrics.Plus3 + metrics.Neo3)/2 });
    }
    const configs = new Map<string, Record<string,number>>();
    for (const [i,track] of tracks.entries()) {
      const rag = table(String(5+i));
      if (rag[0].join('|') !== 'Storage|granularity|top-k|tokens|1-apps|2-apps|3-apps|overall') throw Error('Missing retrieval columns');
      for (const [storage, granularity, k, tokens, ...cells] of rag.slice(1)) {
        if (storage === 'Long-context prompting baseline') {
          const baseline = rows.find(r => r.model === 'GPT-4o');
          if (!baseline) throw Error('Missing GPT-4o baseline');
          baseline.metrics![track + 'ContextTokens'] = numberCell(tokens);
          continue;
        }
        const setting = 'Retrieval: ' + storage + ' ' + granularity + ', top ' + k;
        const metrics = configs.get(setting) ?? {};
        Object.assign(metrics, values(track, cells), { [track + 'ContextTokens']: numberCell(tokens) });
        configs.set(setting, metrics);
      }
    }
    for (const [setting, metrics] of configs) {
      if (metrics.Plus3 === undefined || metrics.Neo3 === undefined) continue;
      rows.push({ model: 'GPT-4o', setting, metrics, score: (metrics.Plus3 + metrics.Neo3)/2 });
    }
    return checked(rows, 19);
  },
};
export default board;
