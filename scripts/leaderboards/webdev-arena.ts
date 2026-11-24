// WebDev Arena (Legacy) ranked models by pairwise human preference on web application generation before Code Arena
// replaced it on 2025-11-12. This importer reads the last Internet Archive snapshot of webdev.lmarena.ai/leaderboard
// (2025-11-10) and preserves Arena Score (Elo), asymmetric 95% confidence bounds, vote counts and licenses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ARENA_ALIASES, splitName } from './lmarena-elo.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const SNAPSHOT = '20251110135151';
const URL = 'https://arena.ai/leaderboard/code/webdev';
const FEED = `https://web.archive.org/web/${SNAPSHOT}id_/https://webdev.lmarena.ai/leaderboard`;

const board: Leaderboard = {
  benchmark: 'webdev-arena',
  url: URL,
  feed: FEED,
  terms: 'Public WebDev Arena leaderboard preserved by the Internet Archive. LMArena leaderboard data is CC BY 4.0.',
  aliases: {
    ...ARENA_ALIASES,
    'Grok-4-0709': 'grok-4',
    'grok-code-fast-1': 'grok-code-fast-1',
    'Grok-3-preview-02-24': 'grok-3',
    'Gemini-2.0-Flash-Thinking-01-21': 'gemini-2-0-flash-thinking-jan-2025',
  },
  stats: {
    votes: { name: 'Votes', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    const table = tables(html).find((t) => t[0]?.some((c) => /Arena Score/i.test(c.text)));
    if (!table || table.length < 50) throw new Error(`Missing WebDev Arena table: ${table?.length ?? 0} rows`);
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const texts = cells.map((c) => c.text.trim());
      if (texts.length < 7) continue;
      const [, rawCell, rawScore, rawCi, rawVotes, , rawLicense] = texts;
      const rawModel = rawCell.replace(/^Grok\s+(?=grok-)/i, '');
      const score = Number(rawScore.replace(/,/g, ''));
      if (!rawModel || !Number.isFinite(score)) continue;
      const ci = rawCi.match(/\+\s*([\d.]+)\s*\/\s*-\s*([\d.]+)/);
      const low = ci ? Number((score - Number(ci[2])).toFixed(2)) : undefined;
      const high = ci ? Number((score + Number(ci[1])).toFixed(2)) : undefined;
      const votes = Number(rawVotes.replace(/,/g, ''));
      const metrics: Record<string, number> = {};
      if (low !== undefined && high !== undefined) Object.assign(metrics, { ciLow: low, ciHigh: high });
      if (Number.isFinite(votes) && votes > 0) metrics.votes = votes;
      const split = splitName(rawModel, '2025-11-10');
      const thinkMatch = split.model.match(/^(Claude Opus 4\.1)\s+(thinking-16k)\s+(\d{8})$/i);
      const model = thinkMatch ? `${thinkMatch[1]} ${thinkMatch[3]}` : split.model;
      const setting = thinkMatch ? thinkMatch[2].toLowerCase() : split.setting;
      rows.push({
        ...split,
        model,
        setting,
        score,
        low,
        high,
        license: rawLicense && rawLicense !== '-' ? rawLicense : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (rows.length < 50) throw new Error(`Parsed only ${rows.length} WebDev Arena rows`);
    return rows;
  },
};
export default board;
