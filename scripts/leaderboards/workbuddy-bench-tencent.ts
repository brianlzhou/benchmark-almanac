// WorkBuddyBench (Tencent). workbuddybench.com draws its leaderboard in the browser from two plain data
// scripts: roster.js (window.WB_ROSTER, the public models, and window.WB_TRACKS, the four tracks) and data.js
// (window.LEADERBOARD_DATA, per track a list of dated score rows). The page's documented rule, repeated
// here: per track take the last row whose notes start "HIGH confidence"; read `scores` for the CodeBuddy
// Code harness and `scores_cc` for Claude Code; prefer the "(think)" value; Avg is the unweighted mean over
// the core tracks the model has (Code, Web, Office; Security is shown but kept out of Avg). Avg (0 to 100)
// is the score and the harness is passed on. Roster members without scores are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const SITE = 'https://workbuddybench.com/';
const HARNESSES = [
  { field: 'scores', name: 'CodeBuddy Code' },
  { field: 'scores_cc', name: 'Claude Code' },
] as const;

interface Member {
  key: string;
  label: string;
  real?: boolean;
  home?: boolean;
}
interface Track {
  name: string;
  preview?: boolean;
}
interface Row {
  notes?: string;
  scores?: Record<string, string>;
  scores_cc?: Record<string, string>;
}

/** The literal assigned to `window.<name> =` in a data script. */
function assigned<T>(js: string, name: string): T {
  const at = js.indexOf(`window.${name} =`);
  if (at < 0) throw new Error(`window.${name} not found`);
  return jsLiteral<T>(js, js.indexOf('=', at) + 1 + js.slice(js.indexOf('=', at) + 1).search(/[[{]/));
}

/** "92.51%(think) / 91.05%(nothink)": the think value, else nothink, else the lone value. */
function pct(v: string | undefined): number | undefined {
  const parts = [...(v ?? '').matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:\((think|nothink)\))?/g)].map((m) => ({ v: Number(m[1]), mode: m[2] ?? '' }));
  return (parts.find((p) => p.mode === 'think') ?? parts.find((p) => p.mode === 'nothink') ?? parts[0])?.v;
}

const board: Leaderboard = {
  benchmark: 'workbuddy-bench-tencent',
  url: `${SITE}index.html`,
  feed: `${SITE}roster.js and ${SITE}data.js (core-track Avg per harness)`,
  terms: 'Static data scripts on workbuddybench.com, which has no robots.txt and publishes no terms of use.',
  aliases: {
    'Hy4 preview': 'tencent-hy4-preview',
    'HY-3': 'tencent-hy3',
  },
  async fetch() {
    const [rosterJs, dataJs] = await Promise.all([fetchText(`${SITE}roster.js`), fetchText(`${SITE}data.js`)]);
    const roster = assigned<Member[]>(rosterJs, 'WB_ROSTER').filter((m) => m.home !== false && m.real);
    const tracks = assigned<Track[]>(rosterJs, 'WB_TRACKS');
    const data = assigned<{ benchmarks: { name: string; rows: Row[] }[] }>(dataJs, 'LEADERBOARD_DATA');
    const current = new Map<string, Row>();
    for (const b of data.benchmarks) {
      const hi = b.rows.filter((r) => typeof r.notes === 'string' && r.notes.trim().startsWith('HIGH confidence'));
      if (hi.length) current.set(b.name, hi[hi.length - 1]);
    }
    const core = tracks.filter((t) => !t.preview && current.has(t.name));
    if (!core.length) throw new Error('no scored WorkBuddyBench tracks');
    const rows: LeaderboardRow[] = [];
    for (const h of HARNESSES) {
      for (const m of roster) {
        const vals = core.map((t) => pct(current.get(t.name)?.[h.field]?.[m.key])).filter((v): v is number => v !== undefined);
        if (!vals.length) continue;
        rows.push({ model: m.label, score: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)), harness: h.name });
      }
    }
    return rows;
  },
};
export default board;
