// RepoChat Arena (Arena / LMSYS) ranks LLMs on pairwise human preference for answering questions about
// GitHub repositories over 4,857 votes collected from 2024-11-30 to 2025-02-11. This importer reads the
// embedded HTML tables from the official Arena blog post: Table 2 gives overall Arena scores, 95% confidence
// intervals and vote counts, while Tables 4, 5 and 6 give style-controlled, retriever-controlled and
// style-and-retriever-controlled Arena scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ARENA_ALIASES, splitName } from './lmarena-elo.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://news.lmarena.ai/repochat-arena/';

const parseRow = (cells: string[], hasVotes: boolean) => {
  const model = cells[1]?.trim();
  const score = Number(cells[2]);
  const ci = cells[3]?.match(/\+\s*(\d+(?:\.\d+)?)\s*\|\s*-\s*(\d+(?:\.\d+)?)/);
  const plus = ci ? Number(ci[1]) : Number.NaN;
  const minus = ci ? Number(ci[2]) : Number.NaN;
  const votes = hasVotes ? Number(cells[4]?.replace(/,/g, '')) : undefined;
  if (!model || !Number.isFinite(score)) return undefined;
  const low = Number.isFinite(minus) ? score - minus : undefined;
  const high = Number.isFinite(plus) ? score + plus : undefined;
  return { model, score, low, high, votes: votes !== undefined && Number.isFinite(votes) ? votes : undefined };
};

const board: Leaderboard = {
  benchmark: 'repochat-arena',
  url: URL,
  feed: `${URL} (embedded RSC Tables 2, 4, 5 and 6)`,
  terms: 'Public Arena.ai blog post. LMArena leaderboard data is CC BY 4.0.',
  aliases: {
    ...ARENA_ALIASES,
    'GPT 4o (20241120)': 'gpt-4o-nov-2024',
    'GPT 4o mini (20240718)': 'gpt-4o-mini',
    'Gemini 2.0 Flash Exp': 'gemini-2-0-flash-dec-2024',
    'Gemini 1.5 Pro': 'gemini-1-5-pro-sept-2024',
    'LLaMA 3.1 405B Instruct FP8': 'llama-3-1-405b',
  },
  stats: {
    votes: { name: 'Votes', unit: 'count' },
    styleControlled: { name: 'Style-controlled Arena score', unit: 'elo', better: 'higher' },
    retrieverControlled: { name: 'Retriever-controlled Arena score', unit: 'elo', better: 'higher' },
    styleAndRetrieverControlled: { name: 'Style-and-retriever-controlled Arena score', unit: 'elo', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const joined = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g)]
      .map((m) => JSON.parse(`"${m[1]}"`) as string)
      .join('');
    const allTables = tables(joined).filter((t) => t[0]?.some((c) => /Arena Score/i.test(c.text)));
    const main = allTables.find((t) => t.length === 8 && t[0].some((c) => /^Votes$/i.test(c.text)));
    if (!main) throw new Error('RepoChat Arena main leaderboard table (Table 2) not found');
    const secondary = allTables.filter((t) => t.length === 8 && !t[0].some((c) => /^Votes$/i.test(c.text)));
    if (secondary.length < 3) throw new Error(`Expected at least 3 RepoChat secondary tables, found ${secondary.length}`);
    const [styleTbl, retTbl, bothTbl] = secondary;
    const toMap = (t: typeof main) => {
      const m = new Map<string, number>();
      for (const r of t.slice(1)) {
        const parsed = parseRow(r.map((c) => c.text), false);
        if (parsed) m.set(parsed.model, parsed.score);
      }
      return m;
    };
    const styleMap = toMap(styleTbl);
    const retMap = toMap(retTbl);
    const bothMap = toMap(bothTbl);

    const rows: LeaderboardRow[] = [];
    for (const r of main.slice(1)) {
      const parsed = parseRow(r.map((c) => c.text), true);
      if (!parsed) continue;
      const metrics: Record<string, number> = {};
      if (parsed.low !== undefined && parsed.high !== undefined) Object.assign(metrics, { ciLow: parsed.low, ciHigh: parsed.high });
      if (parsed.votes !== undefined) metrics.votes = parsed.votes;
      const sc = styleMap.get(parsed.model);
      const rc = retMap.get(parsed.model);
      const bc = bothMap.get(parsed.model);
      if (sc !== undefined) metrics.styleControlled = sc;
      if (rc !== undefined) metrics.retrieverControlled = rc;
      if (bc !== undefined) metrics.styleAndRetrieverControlled = bc;
      rows.push({
        ...splitName(parsed.model, '2025-02-11'),
        score: parsed.score,
        low: parsed.low,
        high: parsed.high,
        metrics,
      });
    }
    if (rows.length !== 7) throw new Error(`Expected 7 RepoChat Arena rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
