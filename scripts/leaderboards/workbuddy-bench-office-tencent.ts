// Tencent scores Office deliverables with rule checks and a model judge. The data and roster scripts provide the latest high-confidence snapshot for each harness.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import suite from './workbuddy-bench-tencent.ts';
type Scores = Record<string,string>;
interface Snapshot {notes: string; scores: Scores; scores_cc?: Scores; score_breakdown: Record<string,Scores>}
interface Resource {model: string; score: number; avgTurns: number; avgInputK: number; avgOutputK: number}
function assignment<T>(js: string, name: string): T {
  const anchor = 'window.' + name + ' =';
  const i = js.indexOf(anchor);
  if (i < 0) throw new Error('Missing ' + name);
  const start = i + anchor.length;
  return jsLiteral<T>(js, start + js.slice(start).search(/[\[{]/));
}

const feed = "https://workbuddybench.com/data.js?v=30";
const board: Leaderboard = {
  benchmark: 'workbuddy-bench-office-tencent',
  url: "https://workbuddybench.com/office.html#leaderboard",
  feed,
  terms: "The site has no robots file. Tencent gives the repository a custom license with a territorial limitation for the European Union. I found no separate grant on the leaderboard. https://github.com/Tencent/workbuddy-bench/blob/main/LICENSE",
  aliases: suite.aliases,
  stats: { avgTurns: { name: 'Average turns', unit: 'count', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' } },
  parts: { rule_checks: 'Rule checks', llm_judge: 'LLM Judge' },
  async fetch() {
    const data = await fetchText(feed);
    const sets = assignment<{benchmarks: {name: string; rows: Snapshot[]}[]}>(data, 'LEADERBOARD_DATA');
    const stats = assignment<{subsets: {Office: Record<string,Resource[]>}}>(data, 'TOKEN_STATS');
    const current = sets.benchmarks.find(b => b.name === 'WorkBuddyBench-Office')?.rows.filter(r => r.notes.trim().startsWith('HIGH confidence')).at(-1);
    if (!current) throw new Error('Missing Office snapshot');
    await new Promise(resolve => setTimeout(resolve, 1050));
    const roster = assignment<{key: string; label: string; type: string}[]>(await fetchText('https://workbuddybench.com/roster.js?v=16'), 'WB_ROSTER');
    const rows = [];
    for (const [code, scores] of [['cbc', current.scores], ['cc', current.scores_cc]] as const) {
      if (!scores) continue;
      for (const m of roster) {
        if (!scores[m.key]) continue;
        const matches = [...scores[m.key].matchAll(/([\d.]+)%\s*(?:\((think|nothink)\))?/g)];
        if (!matches.length) throw new Error('Invalid Office score for ' + m.label);
        for (const match of matches) {
          const score = Number(match[1]), metrics: Record<string, number> = {};
          if (code === 'cbc') for (const [key, values] of Object.entries(current.score_breakdown)) {
            if (values[m.key]) metrics[key] = parseFloat(values[m.key]);
          }
          const resource = stats.subsets.Office[code]?.find(r => r.model.toLowerCase() === m.key.toLowerCase() && r.score === score);
          if (resource) { metrics.avgTurns = resource.avgTurns; metrics.inputTokens = resource.avgInputK * 1000; }
          rows.push({ model: m.label, score, harness: code === 'cbc' ? 'CodeBuddy Code' : 'Claude Code', setting: match[2],
            trials: 3, open: m.type === 'open', tokens: resource ? resource.avgOutputK * 1000 : undefined, metrics });
        }
      }
    }
    if (rows.filter(r => r.harness === 'CodeBuddy Code').length < 15) throw new Error('Incomplete Office standings');
    return rows;
  },
};
export default board;
