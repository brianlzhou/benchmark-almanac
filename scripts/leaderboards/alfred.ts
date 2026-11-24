// ALFRED: default Unseen Success Rate, multiplied by 100.
// The official board ranks unseen task completion. Seen scores stay metrics. Repeated system submissions keep the latest dated result.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://askforalfred.com/leaderboard/leaderboard.html";
const board: Leaderboard = {
  benchmark: "alfred",
  parts: {
    seenSuccess: { name: 'Seen rooms', group: 'Split' },
  },
  stats: {
    unseenPLWSR: { name: 'Unseen path-length weighted success rate', unit: '%', better: 'higher' },
    seenPLWSR: { name: 'Seen path-length weighted success rate', unit: '%', better: 'higher' },
    unseenGoalCondition: { name: 'Unseen goal-condition success rate', unit: '%', better: 'higher' },
    seenGoalCondition: { name: 'Seen goal-condition success rate', unit: '%', better: 'higher' },
    unseenPLWGoalCondition: { name: 'Unseen path-length weighted goal-condition success rate', unit: '%', better: 'higher' },
    seenPLWGoalCondition: { name: 'Seen path-length weighted goal-condition success rate', unit: '%', better: 'higher' },
  },
  url: "https://askforalfred.com/leaderboard/leaderboard.html",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const page = await fetchText(FEED);
      const csv = page.match(/csvData\s*=\s*\x60([\s\S]*?)\x60/);
      if (!csv) throw new Error('ALFRED CSV missing');
      const columns = {
        seenSuccess: 'Seen Success Rate', seenPLWSR: 'Seen PLWSR', unseenPLWSR: 'Unseen PLWSR',
        seenGoalCondition: 'Seen GC', unseenGoalCondition: 'Unseen GC',
        seenPLWGoalCondition: 'Seen PLW GC Success Rate', unseenPLWGoalCondition: 'Unseen PLW GC Success Rate',
      };
      const latest = new Map<string, LeaderboardRow>();
      for (const r of parseCsv(csv[1])) {
        const date = new Date(r.Created).toISOString().slice(0,10);
        const metrics: Record<string, number> = {};
        for (const [key, column] of Object.entries(columns)) {
          if (r[column]?.trim() && Number.isFinite(Number(r[column]))) metrics[key] = Number(r[column]) * 100;
        }
        const row = {model: r.Submission, score: Number(r['Unseen Success Rate']) * 100,
          date, submitter: r.Affiliation?.trim() || undefined, metrics};
        if (!latest.has(row.model) || date > latest.get(row.model)!.date!) latest.set(row.model, row);
      }
      return [...latest.values()];
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
