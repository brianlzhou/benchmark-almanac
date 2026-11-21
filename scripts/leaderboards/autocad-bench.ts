// AutoCAD Bench (Markov): computer-use agents turn a dimensioned reference drawing into an editable DWG in AutoCAD,
// through the screen alone. 50 fixed tasks, 21 in 2D and 29 in 3D. A task counts as completed when its evaluator
// score is at least 75. Read from the page's Markdown version: completion overall, by 2D and 3D, and by difficulty.
// Read mouse share, actions per turn and task counts at the published scoring thresholds.
// The page names models with their maker ("OpenAI Sol", "Qwen Qwen3.7"), so the maker word is dropped. Qwen has no
// model called plain Qwen3.7 (it shipped Max, Plus and Flash), so that entry stays unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.markovstudios.com/research/autocad-bench';
const MD = `${PAGE}.md`;
const N = 7;

function table(md: string, head: string): string[][] {
  const lines = md.split('\n');
  const at = lines.findIndex((l) => l.startsWith(head));
  if (at < 0) throw new Error(`AutoCAD Bench: table "${head}" missing`);
  const out: string[][] = [];
  for (const l of lines.slice(at + 2)) {
    if (!l.startsWith('|')) break;
    out.push(l.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return out;
}
// "46.0% 23/50" or "66.7% · 14/21" -> 46
const pct = (s: string) => {
  const m = s.match(/^(-?\d+(?:\.\d+)?)%/);
  if (!m) throw new Error(`AutoCAD Bench: no percentage in "${s}"`);
  return Number(m[1]);
};
const MAKER = /^(OpenAI|Anthropic|Moonshot AI|Qwen|Google|Meta|xAI|DeepSeek|Z\.ai|MiniMax)\s+/;

const board: Leaderboard = {
  benchmark: 'autocad-bench',
  url: PAGE,
  feed: `${MD} (Task completion by model, 2D versus 3D, Where capability holds)`,
  terms: 'robots.txt allows all pages, and the site publishes a Markdown copy of each page for language models and agents. Markov states no data license. Results are credited to Markov.',
  aliases: { Sol: 'gpt-5-6-sol', Terra: 'gpt-5-6-terra', Luna: 'gpt-5-6-luna' },
  parts: {
    d2: { name: '2D drafting', group: 'Modality', note: 'A complete Model Space drawing with geometry, dimensions, leaders, notes, center marks and centerlines. 21 tasks.' },
    d3: { name: '3D modeling', group: 'Modality', note: 'True 3D geometry plus a complete layout sheet with every shown view and annotation. 29 tasks.' },
    basic: { name: 'Basic', group: 'Difficulty', note: '10 tasks.' },
    intermediate: { name: 'Intermediate', group: 'Difficulty', note: '12 tasks.' },
    advanced: { name: 'Advanced', group: 'Difficulty', note: '14 tasks.' },
    project: { name: 'Project', group: 'Difficulty', note: '14 tasks.' },
  },
  async fetch() {
    const md = await fetchText(MD);
    const modality = new Map(table(md, '| Model | 2D | 3D').map((r) => [r[0], r.slice(1).map(pct)]));
    const tier = new Map(table(md, '| Model | Basic').map((r) => [r[0], r.slice(1).map(pct)]));
    const activity = new Map<string,Record<string,number>>();
    for (const [header,key] of [['| Model | Mouse share','mouseShare'], ['| Model | Actions per turn','actionsPerTurn'],
      ['| Model | Score ≥50','tasksAtLeast50']]) {
      for (const [label,value] of table(md,header)) {
        const model=label.split(' · ')[0];
        const metrics=activity.get(model) ?? {};
        const n=parseFloat(value);
        if (Number.isFinite(n)) metrics[key]=n;
        activity.set(model,metrics);
      }
    }
    const rows: LeaderboardRow[] = table(md, '| Model | Completion').map(([m, s]) => {
      const d = modality.get(m), t = tier.get(m);
      if (!d || d.length !== 2 || !t || t.length !== 4) throw new Error(`AutoCAD Bench: ${m} missing from a breakdown table`);
      return {
        model: m.replace(MAKER, ''),
        score: pct(s),
        trials: 1,
        metrics: { ...activity.get(m), ...(/(\d+)\/(\d+)/.test(s) ? {completedTasks:Number(s.match(/(\d+)\//)![1])} : {}), d2: d[0], d3: d[1], basic: t[0], intermediate: t[1], advanced: t[2], project: t[3] },
      };
    });
    if (rows.length < N) throw new Error(`AutoCAD Bench: ${rows.length} models, expected at least ${N}`);
    return rows;
  },
};
export default board;
