// OOLONG tests aggregation over long texts. The official leaderboard says "Overall is the average of the two scores."
// It averages five synthetic context lengths and three real context lengths, counting unsupported lengths as zero.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://oolongbench.github.io/';
const feed = url + 'leaderboard.js';
const board: Leaderboard = {
  benchmark: 'oolong', url, feed,
  aliases: { 'Olmo-3.1-Instruct-32B':'olmo-3-1-32b-instruct', 'Olmo-3.1-Think-32B':'olmo-3-1-32b-think' },
  terms: 'The OOLONG authors publish the score files and ranking method at https://oolongbench.github.io/.',
  headline: 'The authors average OOLONG-synth and OOLONG-real, with unsupported context lengths counting as zero in each split.',
  async fetch() {
    const js = await fetchText(feed);
    const roster = js.match(/const models = \[([\s\S]*?)\]\.map\(/)?.[1];
    if (!roster || !js.includes('(synth.score + real.score) / 2')) throw new Error('Missing OOLONG ranking definition');
    const tables: {split: string; label: string; lengths: string[]; data: Record<string, string>[]}[] = [];
    const parts: Record<string,BoardPart> = {};
    for (const split of ['synth','real']) {
      const label = 'OOLONG-' + split;
      parts[split] = {name:label, group:'Dataset'};
      const definition = js.match(new RegExp('const ' + split + 'AverageColumns = \\[([^\\]]+)\\]'));
      const lengths = [...(definition?.[1] ?? '').matchAll(/'(\d+)'/g)].map(m=>m[1]);
      if (lengths.length !== (split === 'synth' ? 5 : 3)) throw new Error('Missing leaderboard context lengths');
      await new Promise(resolve=>setTimeout(resolve,1010));
      const data = parseCsv(await fetchText(url+split+'_results.csv'));
      tables.push({split,label,lengths,data});
    }
    const models = [...roster.matchAll(/\['([^']+)', '([^']+)', '(open|closed)'/g)];
    const rows = models.map(([,id,model,access]) => {
      const metrics: Record<string,number> = {};
      for (const {split,label,lengths,data} of tables) {
        const r = data.find((r: Record<string, string>)=>r.model === id);
        if (!r || !lengths.every((k: string)=>Object.hasOwn(r,k))) throw new Error('Missing OOLONG results for ' + id);
        for (const [k,v] of Object.entries(r) as [string, string][]) {
          if (k === 'model' || !v.trim()) continue;
          const n = Number(v);
          if (!/^\d+$/.test(k) || !Number.isFinite(n) || n < 0 || n > 1) throw new Error('Invalid OOLONG score');
          const key = split+k;
          parts[key] = {name:k+' tokens',group:label};
          metrics[key] = 100*n;
        }
        metrics[split] = lengths.reduce((sum: number,k: string)=>sum+(metrics[split+k] ?? 0),0)/lengths.length;
      }
      return {model:id === 'deepseek-r1-0528' ? id : model, open:access === 'open', score:(metrics.synth+metrics.real)/2, metrics};
    });
    board.parts = parts;
    return checked(rows,20);
  },
};
export default board;
