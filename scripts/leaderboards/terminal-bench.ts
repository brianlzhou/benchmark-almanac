// Terminal-Bench 1.0 (terminal-bench-core==0.1.1) evaluates terminal agents on real command-line tasks.
// tbench.ai replaced the 1.0 leaderboard when Terminal-Bench 2.0 launched on 2025-11-07, so this importer reads
// the last Internet Archive snapshot of the 1.0 board (2025-11-05) and its embedded Next.js RSC leaderboard array.
// Accuracy and its standard error are stored as percentages (0 to 100). Multi-model rows keep their full model list.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SNAPSHOT = '20251105134649';
const URL = 'https://www.tbench.ai/';
const FEED = `https://web.archive.org/web/${SNAPSHOT}id_/https://www.tbench.ai/leaderboard`;

interface RawEntry {
  agent?: string;
  model?: string | string[];
  agentOrganization?: string;
  integrationMethod?: string;
  agentUrl?: string;
  date?: string;
  accuracy?: number;
  stderr?: number;
  verified?: boolean;
}

const board: Leaderboard = {
  benchmark: 'terminal-bench',
  url: URL,
  feed: `${FEED} (embedded RSC rows, terminal-bench-core==0.1.1)`,
  terms: 'Public Terminal-Bench 1.0 leaderboard preserved by the Internet Archive. The Terminal-Bench repository is Apache-2.0.',
  harnesses: 'system',
  reference: ['Terminus 1', 'Terminus 2'],
  verified: 'marked verified on the Terminal-Bench board',
  aliases: {
    'Qwen3-235B': 'qwen3-235b-a22b',
    'codex-mini-latest': 'codex-mini-2025-05-16',
  },
  async fetch() {
    const html = await fetchText(FEED);
    if (!html.includes('terminal-bench-core==0.1.1')) throw new Error('Archived Terminal-Bench page is not version 1.0');
    const joined = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g)]
      .map((m) => JSON.parse(`"${m[1]}"`) as string)
      .join('');
    const anchor = joined.indexOf('"agent":"Apex2"');
    if (anchor < 0) throw new Error('Terminal-Bench 1.0 RSC rows missing');
    const start = joined.lastIndexOf('[', anchor);
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let i = start; i < joined.length; i++) {
      const ch = joined[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === '[') depth++;
      else if (ch === ']' && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    if (start < 0 || end < 0) throw new Error('Terminal-Bench 1.0 JSON array bounds not found');
    const entries = JSON.parse(joined.slice(start, end)) as RawEntry[];
    if (entries.length < 55) throw new Error(`Expected at least 55 Terminal-Bench 1.0 rows, got ${entries.length}`);
    const rows: LeaderboardRow[] = [];
    for (const r of entries) {
      if (typeof r.accuracy !== 'number' || !Number.isFinite(r.accuracy)) continue;
      const list = Array.isArray(r.model) ? r.model.map((s) => s.trim()).filter(Boolean) : r.model ? [r.model.trim()] : [];
      if (!list.length) continue;
      const score = Math.round(r.accuracy * 1e4) / 100;
      const metrics: Record<string, number> = {};
      if (typeof r.stderr === 'number' && Number.isFinite(r.stderr)) metrics.stderr = Math.round(r.stderr * 1e4) / 100;
      rows.push({
        model: list[0],
        ...(list.length > 1 ? { models: list } : {}),
        score,
        harness: r.agent?.trim() || undefined,
        agentOrg: r.agentOrganization?.trim() || undefined,
        setting: r.integrationMethod?.trim() || undefined,
        date: /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '') ? r.date : undefined,
        verified: typeof r.verified === 'boolean' ? r.verified : undefined,
        link: r.agentUrl?.startsWith('https://') ? r.agentUrl : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (rows.length < 55) throw new Error(`Parsed only ${rows.length} Terminal-Bench 1.0 rows`);
    return rows;
  },
};
export default board;
