// AraGen: overall 3C3H score from the official results, multiplied by 100.
// Precision is a whole-benchmark configuration. Report both task groups, all dimensions, model metadata and the headline interval.
// The dated Gemini 2.5 Pro preview maps explicitly to the May 2025 snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/inception42/Leaderboards/resolve/main/assets/results/aragen_v3_results.json";
const board: Leaderboard = {
  benchmark: "aragen",
  parts: {
    qa: {name: 'Question Answering (QA)', group: 'Task'},
    safety: {name: 'Safety', group: 'Task'},
    correctness: {name: 'Correctness', group: 'Dimension'},
    completeness: { name: 'Completeness', group: 'Dimension' },
    conciseness: { name: 'Conciseness', group: 'Dimension' },
    helpfulness: { name: 'Helpfulness', group: 'Dimension' },
    honesty: { name: 'Honesty', group: 'Dimension' },
    harmlessness: { name: 'Harmlessness', group: 'Dimension' },
  },
  url: "https://huggingface.co/spaces/inception42/Leaderboards/resolve/main/assets/results/aragen_v3_results.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  stats: {
    totalEntries: { name: 'Total entries', unit: 'count' },
    successfulEntries: { name: 'Successful entries', unit: 'count', better: 'higher' },
    failedEntries: { name: 'Failed entries', unit: 'count', better: 'lower' },
    time: { name: 'Run time', unit: 'seconds', better: 'lower' },
  },
  aliases: {"Mistral-Small-24B-Instruct-2501":"mistral-small-3", "Ministral-8B-Instruct-2410":"ministral-8b", "Mistral-Large-Instruct-2411":"mistral-large-2-nov-2024", "Magistral-Small-2509":"magistral-small-1-2", "Mistral-Small-4-119B-2603":"mistral-small-4", "gemini-2.5-pro-preview-05-06": "gemini-2-5-pro-may-2025", "Llama-3.1-8B-Instruct": "llama-3-1-8b", "Llama-3.1-70B-Instruct": "llama-3-1-70b", "Meta-Llama-3-70B-Instruct": "llama-3-70b", "Meta-Llama-3-8B-Instruct": "llama-3-8b", "Llama-3.2-1B-Instruct": "llama-3-2-1b", "Llama-3.2-3B-Instruct": "llama-3-2-3b"},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any[]>(FEED);
      return d.flatMap(r => {
        const meta = r.Meta;
        const judged = r['claude-sonnet-4-20250514 Scores'];
        const dimensions = judged?.['3C3H Scores'];
        const overall = dimensions?.['3C3H Score'];
        if (!meta || !overall) return [];
        const metrics: Record<string, number> = {};
        for (const [name, stat] of Object.entries(dimensions) as [string, {value: number}][]) {
          if (name !== '3C3H Score' && Number.isFinite(stat.value)) metrics[name.toLowerCase()] = 100 * stat.value;
        }
        for (const [key, name] of [['qa', 'Question Answering (QA)'], ['safety', 'Safety']]) {
          const value = judged['Tasks Scores']?.[name]?.value;
          if (Number.isFinite(value)) metrics[key] = 100 * value;
        }
        for (const [key, column] of Object.entries({
          time: 'Run_Total_Duration_Seconds', totalEntries: 'Total Entries',
          successfulEntries: 'Successful Entries', failedEntries: 'Failed Entries',
        })) {
          if (Number.isFinite(meta[column])) metrics[key] = meta[column];
        }
        return [{
          model: meta['Model Name'].replace(/^[^/]+\//,''), score: overall.value * 100,
          setting: meta.Precision, license: meta.License || undefined,
          params: Number.isFinite(meta.Params) && meta.Params > 0 ? meta.Params : undefined,
          date: meta.Run_End_Time?.slice(0,10),
          low: Number.isFinite(overall.lower) ? 100 * overall.lower : undefined,
          high: Number.isFinite(overall.upper) ? 100 * overall.upper : undefined, metrics,
        }];
      });
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
