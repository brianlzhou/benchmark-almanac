// DuelLab GameBench 2 standings score with separate ranked and pending settings. Cost per generated player is retained as its own metric, not cost per game.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://benchmarks.duellab.org/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "duellab-gamebench-2",
  url: "https://benchmarks.duellab.org/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at benchmarks.duellab.org; retain source attribution and follow the upstream terms.",
  aliases: {},
  stats: {
    costPerPlayer: { name: 'Cost per player', unit: 'usd', better: 'lower' },
    strength: { name: 'Strength', unit: 'score', better: 'higher' },
    best: { name: 'Best score', unit: 'score', better: 'higher' },
  },
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      const mi = head.indexOf('Model'), si = head.indexOf('Score') >= 0 ? head.indexOf('Score') : head.indexOf('Score so far');
      if (mi < 0 || si < 0) continue;
      for (const r of t.slice(1)) {
        const score = num(r[si]?.text); if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (const [key, label] of [['costPerPlayer','Cost / player'],['strength','Strength'],['best','Best']]) { const v = num(r[head.indexOf(label)]?.text); if (v !== undefined) metrics[key] = v; }
        const byGame = r[head.indexOf('By game')]?.html.match(/aria-label="Per-game scores: ([^"]+)"/)?.[1] ?? '';
        for (const m of byGame.matchAll(/(GB2-\d+):\s*([\d.]+)/g)) {
          metrics[m[1]] = Number(m[2]);
          (board.parts ??= {})[m[1]] = { name: m[1], group: 'Game' };
        }
        const wdl = r[head.indexOf('W / D / L')]?.text.match(/([\d,]+)\s*\/\s*([\d,]+)\s*\/\s*([\d,]+)/);
        if (wdl) ['wins','draws','losses'].forEach((key, i) => { metrics[key] = Number(wdl[i + 1].replace(/,/g, '')); });
        const coverage = r[head.indexOf('Opponents played')]?.attrs['data-coverage'];
        if (coverage && Number.isFinite(Number(coverage))) metrics.opponentCoverage = Number(coverage) * 100;
        const costText = r[head.indexOf('Cost / player')]?.html ?? '';
        const observed = costText.match(/Based on (\d+) observed generation/);
        const totalCost = costText.match(/total for recorded runs \$([\d.,]+)/i);
        if (observed) metrics.pricedRuns = Number(observed[1]);
        if (totalCost) metrics.totalCost = Number(totalCost[1].replace(/,/g, ''));
        const codegen = r[head.indexOf('Codegen')]?.html.match(/([\d.]+)% worked first try, ([\d.]+)% worked after repair or resend, ([\d.]+)% failed across n=(\d+)/);
        if (codegen) ['firstTry','afterRepair','failed','testedPrograms'].forEach((key, i) => { metrics[key] = Number(codegen[i + 1]); });
        const link = r[mi].html.match(/href="(model-[^"]+)"/)?.[1];
        out.push({link: link ? new URL(link, FEED).href : undefined, model: identity(r[mi].text), score, setting: [head.includes('Score so far') ? 'pending' : 'ranked', r[head.indexOf('Reasoning')]?.text, r[head.indexOf('Why not ranked')]?.text].filter(Boolean).join('; '), metrics});
      }
    }
    if (!out.length) throw new Error('DuelLab standings missing');
    return out;
  },
};
export default board;
