// AISA-ArabicFC evaluates tool calls in Arabic. Track C ranks all participating systems by their macro score across dialects.
// Three official CSV files give the dialect scores and the separate core and reasoning track rankings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/TuwaiqAcademy/AISA-ArabicFC-Shared-Task/raw/main/results/track_c_dialect.csv";

const board: Leaderboard = {
  benchmark: "aisa-arabicfc-2026",
  url: "https://huggingface.co/spaces/TuwaiqAcademy/AISA-ArabicFC-Shared-Task/tree/main/results",
  feed,
  terms: "The organizers label the Space Apache 2.0. The dialect table covers 21 team systems. The two competition tracks each cover 17. https://huggingface.co/spaces/TuwaiqAcademy/AISA-ArabicFC-Shared-Task Hugging Face robots.txt allows these files.",
  parts: { msa: 'MSA', gulf: 'Gulf', egyptian: 'Egyptian', levantine: 'Levantine', maghrebi: 'Maghrebi',
    core: 'Track A · Core', reasoning: 'Track B · Reasoning' },
  stats: {
    gap: { name: 'Track gap', unit: 'score', better: 'lower', note: 'Difference between the track scores, from 0 to 1.' },
    core_fnacc: { name: 'Core Functionality Accuracy', unit: 'score', better: 'higher', note: 'Core track FNACC score from 0 to 1.' },
    core_argem: { name: 'Core Argument Match', unit: 'score', better: 'higher', note: 'Core track ARGEM score from 0 to 1.' },
    reasoning_fnacc: { name: 'Reasoning Functionality Accuracy', unit: 'score', better: 'higher', note: 'Reasoning track FNACC score from 0 to 1.' },
    reasoning_argem: { name: 'Reasoning Argument Match', unit: 'score', better: 'higher', note: 'Reasoning track ARGEM score from 0 to 1.' },
    reasoning_thinkrate: { name: 'Reasoning think rate', unit: 'score', better: 'higher', note: 'Reasoning track think rate from 0 to 1.' },
  },
  async fetch() {
    const byTeam = new Map<string, LeaderboardRow>();
    function score(row: Record<string, string>, key: string): number {
      if (!row[key]?.trim() || !Number.isFinite(Number(row[key]))) throw new Error('Missing ArabicFC ' + key);
      return Number(row[key]);
    }
    for (const row of parseCsv(await fetchText(feed))) {
      const metrics = Object.fromEntries(['msa', 'gulf', 'egyptian', 'levantine', 'maghrebi', 'gap'].map(k => [k, score(row, k)]));
      if (!row.team || byTeam.has(row.team)) throw new Error('Invalid ArabicFC team');
      byTeam.set(row.team, { model: row.team, submitter: row.team, score: score(row, 'macro'), metrics });
    }
    if (byTeam.size < 21) throw new Error('Missing dialect results');
    for (const [key, file] of [['core', 'track_a_core.csv'], ['reasoning', 'track_b_reasoning.csv']]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const track = parseCsv(await fetchText(new URL(file, feed).href));
      if (track.length < 17) throw new Error('Missing ArabicFC ' + key + ' results');
      for (const row of track) {
        const metrics = byTeam.get(row.team)?.metrics;
        if (!metrics) throw new Error('Missing dialect entry for ' + row.team);
        metrics[key] = score(row, 'overall');
        for (const field of (key === 'core' ? ['fnacc', 'argem'] : ['fnacc', 'argem', 'thinkrate'])) {
          metrics[key + '_' + field] = score(row, field);
        }
      }
    }
    return [...byTeam.values()];
  },
};

export default board;
