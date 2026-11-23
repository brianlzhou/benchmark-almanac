// WeightBench (BenchFlow): coding agents set every weight of a fixed network by hand on 21 tasks, with no training and
// no running the network. The page embeds its leaderboard as a table whose rows carry the data in attributes: the
// agent's harness, the score after rulings (data-score), the score before rulings (data-raw), one standard error
// (data-se) and the 21 task scores (data-scores, "Model (harness): Task 58% · Task 68% · …", rounded to whole
// percents). The docs page gives the 95% interval as the score ± 1.96 SE and three trials per agent and task.
// Each row is an agent around a model: Codex, Claude Code, Antigravity CLI or Muse Code. A run in the model maker's own
// agent counts as the model's score, and a run of another lab's model in Claude Code shows as its own entry
// (data/harnesses.json names each agent's maker).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const URL = 'https://www.benchflow.ai/weightbench';

// the page's task names -> metric keys, in the page's order
const TASKS: Record<string, string> = {
  'Fashion-MNIST': 'fashionMnist',
  'Quick, Draw! doodles': 'quickDraw',
  'CIFAR-10': 'cifar10',
  'EuroSAT satellite images': 'eurosat',
  'Spoken command words': 'speechCommands',
  'ECG heartbeats': 'ecg',
  'Phone motion sensors': 'motionSensors',
  'Protein secondary structure': 'proteinStructure',
  'Human splice sites': 'spliceSites',
  'Aqueous solubility': 'solubility',
  'Close-language identification': 'languageId',
  'Python source code': 'pythonCode',
  'Bach chorale melodies': 'bachChorales',
  'Chess positions': 'chess',
  'Connect Four positions': 'connectFour',
  'Forest cover type': 'forestCover',
  'MNIST digits': 'mnist',
  'Character-level English': 'charEnglish',
  'Qwen3.5-0.8B': 'qwen35',
  'BERT-Tiny on GLUE': 'bertTinyGlue',
  'Classic control': 'classicControl',
};

const board: Leaderboard = {
  benchmark: 'weightbench-benchflow',
  url: URL,
  feed: URL,
  terms: 'BenchFlow publishes the leaderboard on a public page, and its site has no robots.txt rules. The tasks and graders are Apache-2.0 on GitHub.',
  harnesses: 'system',
  // the board names Meta's model by its short name
  aliases: { 'Wonder Full 1.0': 'muse-wonder-full' },
  parts: Object.fromEntries(Object.entries(TASKS).map(([name, key]) => [key, { name, group: 'Task' }])),
  stats: {
    beforeRulings: { name: 'Score before rulings', unit: '%', better: 'higher', note: 'The same mean with every trial at its graded score, before trials ruled rule breaks count 0.' },
    ruleBreaks: { name: 'Rule breaks', unit: 'count', better: 'lower', note: 'Trials, of 63, that the reviewers ruled broke the rules by training, fitting, running the network or computing statistics from examples.' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const out: LeaderboardRow[] = [];
    for (const m of html.matchAll(/<tr data-model="([^"]*)"([^>]*)>([\s\S]*?)<\/tr>/g)) {
      const attrs = Object.fromEntries([...m[2].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(a => [a[1], text(a[2])]));
      const model = text(m[3].match(/<b>([\s\S]*?)<\/b>/)?.[1] ?? '');
      const cells = [...m[3].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1]);
      // the rule-break cell is "7<small class="pend">0 pending</small>": the count comes first
      const breaks = Number(text(cells[5]?.replace(/<small[\s\S]*?<\/small>/, '') ?? '').match(/^\d+$/)?.[0] ?? NaN);
      const score = Number(attrs.score), raw = Number(attrs.raw), se = Number(attrs.se);
      if (!model || ![score, raw, se, breaks].every(Number.isFinite)) throw new Error(`WeightBench row changed: ${model || m[1]}`);
      const metrics: Record<string, number> = { beforeRulings: round(raw), ruleBreaks: breaks, stderr: round(se) };
      const list = (attrs.scores ?? '').replace(/^[^:]*:\s*/, '').split(' · ');
      for (const item of list) {
        const t = item.match(/^(.*) (\d+(?:\.\d+)?)%$/);
        if (!t || !TASKS[t[1]]) throw new Error(`WeightBench task scores changed: ${item}`);
        metrics[TASKS[t[1]]] = Number(t[2]);
      }
      if (list.length !== Object.keys(TASKS).length) throw new Error(`WeightBench has ${list.length} task scores for ${model}`);
      out.push({
        model,
        // the site knows agents by name, so the Codex version ("Codex 0.166.0") goes
        harness: attrs.harness?.replace(/\s+v?\d+(?:\.\d+)+$/, ''),
        score: round(score),
        low: round(score - 1.96 * se),
        high: round(score + 1.96 * se),
        trials: 3,
        metrics,
      });
    }
    if (out.length < 16) throw new Error(`WeightBench leaderboard changed: only ${out.length} rows`);
    return out;
  },
};

function round(x: number): number {
  return Math.round(x * 100) / 100;
}

export default board;
