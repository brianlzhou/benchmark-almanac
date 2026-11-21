// AutoformBench ranks models by the share of Lean tasks solved with the source present.
// Read the official README table and its linked task-level CSVs for costs, tokens and textbook breakdowns.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import type { LeaderboardRow } from './types.ts';

const url = "https://github.com/facebookresearch/autoformbench#leaderboard";
const feed = "https://raw.githubusercontent.com/facebookresearch/autoformbench/main/README.md";

const tokenKeys: Record<string, string> = {
  input_tokens: 'inputTokens',
  cached_read_tokens: 'cachedTokens',
  output_tokens: 'outputTokens',
};

const board: Leaderboard = {
  benchmark: 'autoformbench', url, feed,
  terms: "The repository lists CC BY-NC 4.0. https://github.com/facebookresearch/autoformbench/blob/main/LICENSE" ,
  async fetch() {
    const md = await fetchText(feed);
    const section = md.split('<!-- leaderboard:start -->')[1]?.split('<!-- leaderboard:end -->')[0];
    const [table] = markdownTables(section ?? '');
    if (table?.[0]?.join('|') !== 'Rank|Model|Solved|Results' || table.length < 10) throw new Error('Incomplete AutoformBench table');
    const links = [...section.matchAll(/\[CSV\]\((leaderboard_data\/[\w.-]+\.csv)\)/g)];
    if (links.length !== table.length-1) throw new Error('Missing task CSV');
    const rows: LeaderboardRow[] = [];
    const parts: Record<string,string> = {};
    for (const [i, [,model,solved]] of table.slice(1).entries()) {
      const match = solved.match(/^(\d+) \/ (\d+) \(([\d.]+)%\)$/);
      if (!match) throw new Error('Invalid Solved cell');
      const link = new URL(links[i][1],feed).href;
      await new Promise(resolve => setTimeout(resolve,1000));
      const tasks = parseCsv(await fetchText(link));
      if (tasks.length !== Number(match[2]) || new Set(tasks.map(t => t.problem_id)).size !== tasks.length ||
          tasks.filter(t => t.passed === 'true').length !== Number(match[1])) throw new Error('CSV disagrees with README for ' + model);
      const sums: Record<string,number> = {};
      const counts = new Map<string,{solved:number;total:number}>();
      for (const t of tasks) {
        if (!t.textbook || !['true','false'].includes(t.passed)) throw new Error('Invalid task in ' + link);
        const count = counts.get(t.textbook) ?? {solved:0,total:0};
        count.total++; count.solved += Number(t.passed === 'true'); counts.set(t.textbook,count);
        for (const key of ['input_tokens','cached_read_tokens','cache_write_tokens','output_tokens','cost_usd','turns','compactions','added_code_loc']) {
          if (!t[key]?.trim() || !Number.isFinite(Number(t[key]))) throw new Error('Invalid ' + key);
          sums[key] = (sums[key] ?? 0) + Number(t[key]);
        }
      }
      const metrics = Object.fromEntries(Object.entries(sums).map(([k,v]) => [tokenKeys[k] ?? k,v/tasks.length]));
      for (const [book,count] of counts) { parts[book] = book; metrics[book] = 100*count.solved/count.total; }
      rows.push({ model, score:Number(match[3]), setting:'source-present', cost:metrics.cost_usd, tokens:metrics.outputTokens, link, metrics });
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
