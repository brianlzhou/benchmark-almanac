// CyScenarioBench (Irregular) evaluates frontier models on private multi-stage offensive security
// scenarios. Irregular's November 17, 2026 evaluation post compares GPT-6.2 Astra and GPT-6 Astra on the
// same 11-scenario CyScenarioBench version, where both models solved 9 of 11 scenarios at least once.
// Earlier assessments (such as GPT-6 Cyber and GPT-5.6 Sol) ran on prior suite snapshots and are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://www.irregular.com/research/assessing-gpt-6.2-astra-against-offensive-security-benchmarks';

const board: Leaderboard = {
  benchmark: 'cyscenariobench',
  url: FEED,
  feed: FEED,
  static: 'paper',
  terms: 'Public Irregular evaluation report. https://www.irregular.com/research/assessing-gpt-6.2-astra-against-offensive-security-benchmarks',
  headline: 'Average success rate across 11 private multi-stage offensive security scenarios, with both evaluated models solving 9 of 11 scenarios at least once.',
  async fetch(): Promise<LeaderboardRow[]> {
    const plain = text(await fetchText(FEED));
    const match = plain.match(
      /On CyScenarioBench,\s+(GPT-6\.2 Astra)\s+and\s+(GPT-6 Astra)\s+each completed\s+(\d+)\s+of\s+(\d+)\s+long-horizon scenarios at least once\.\s+GPT-6\.2 Astra['’]s average success rate was\s+(\d+(?:\.\d+)?)%,\s+an increase of\s+\d+(?:\.\d+)?\s+percentage points over\s+GPT-6 Astra['’]s\s+(\d+(?:\.\d+)?)%/i,
    );
    if (!match) throw new Error('CyScenarioBench comparison paragraph missing or changed');
    const [, m1, m2, solvedStr, totalStr, s1Str, s2Str] = match;
    const solved = Number(solvedStr);
    const total = Number(totalStr);
    const s1 = Number(s1Str);
    const s2 = Number(s2Str);
    if (![solved, total, s1, s2].every(Number.isFinite) || total !== 11) {
      throw new Error('Invalid CyScenarioBench metrics or task count changed');
    }
    return [
      { model: m1, score: s1, date: '2026-11-17' },
      { model: m2, score: s2, date: '2026-11-17' },
    ];
  },
};

export default board;
