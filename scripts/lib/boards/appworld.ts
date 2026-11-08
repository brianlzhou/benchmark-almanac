// AppWorld's live feed reports TGC for each complete test split. SGC, interactions and difficulty
// scores are secondary metrics. Model tooltips identify snapshots; method names identify harnesses.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

const FEED = 'https://raw.githubusercontent.com/StonyBrookNLP/appworld-leaderboard/main/experiments/outputs/_leaderboard.json';
type Track = 'test-normal' | 'test-challenge';
type Result = { task_goal_completion: number; scenario_goal_completion: number; interactions: number };
type Entry = { llm: { name: string; tooltip: string }; method: { name: string }; date: string } &
  Partial<Record<'test_normal' | 'test_challenge', Record<string, Result>>>;

export function appworldBoard(track: Track): Leaderboard {
  return {
    benchmark: `appworld-${track}`,
    url: 'https://appworld.dev/appworld/leaderboard', feed: FEED,
    terms: 'The authors publish this public results feed; source licensing and attribution requirements apply.',
    async fetch() {
      const rows: LeaderboardRow[] = [];
      const split = track === 'test-normal' ? 'test_normal' : 'test_challenge';
      for (const r of await fetchJson<Entry[]>(FEED)) {
        const results = r[split], all = results?.all;
        if (!all || !Number.isFinite(all.task_goal_completion)) continue;
        const tip = r.llm.tooltip ?? '';
        let model = /^(?:[\w.-]+\/)?[\w.-]+$/.test(tip) && tip !== 'openai' ? tip : r.llm.name;
        if (/finetuned/i.test(tip)) model = `${r.llm.name} (SynthAPI finetuned)`;
        if (/^(?:gpt[- ]?4o(?:[- ]mini)?|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(model)) model += ' (snapshot unspecified)';
        const metrics: Record<string, number> = {};
        if (Number.isFinite(all.scenario_goal_completion)) metrics.scenarioGoalCompletion = all.scenario_goal_completion;
        if (Number.isFinite(all.interactions)) metrics.interactions = all.interactions;
        for (const [level, v] of Object.entries(results!)) {
          if (level !== 'all' && Number.isFinite(v.task_goal_completion)) metrics[level.replace(/\s+/g, '')] = v.task_goal_completion;
        }
        rows.push({ model, score: all.task_goal_completion, harness: r.method.name, date: r.date, metrics });
      }
      if (!rows.length) throw new Error(`AppWorld ${track}: no TGC rows`);
      return rows;
    },
  };
}
