// FAR.AI's AI Security Leaderboard measures the estimated attacker cost to find a universal jailbreak.
// The headline score is the board's cost to break in US dollars, with higher costs indicating stronger safeguards.
// This importer reads the model records embedded in the leaderboard's published JavaScript bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://leaderboard.far.ai/';
const JS = 'https://leaderboard.far.ai/assets/index-B6DSpVcx.js';
const DOMAIN_KEYS = ['Chemical', 'Biological', 'Radiological & Nuclear', 'Explosives', 'Cyber'] as const;
const dateOf = (s: string | null) => {
  if (!s) return undefined;
  const m = s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (20\d\d)$/);
  if (!m) return undefined;
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m[1]) + 1;
  return `${m[2]}-${String(month).padStart(2, '0')}-01`;
};
const value = (s: string) => /14(?:\.2)?k/i.test(s) || /14k/i.test(s) ? 14200 : Number(s.replace(/[^\d.]/g, ''));

const board: Leaderboard = {
  benchmark: 'ai-security-leaderboard-far-ai',
  url: PAGE,
  feed: JS,
  terms: 'FAR.AI publishes the leaderboard for research use and provides no separate data license. Results are credited to FAR.AI.',
  aliases: {
    'Gemini 3.1 Pro': 'gemini-3-1-pro',
    'Claude Fable 5.1': 'claude-fable-5-1',
    'Claude Fable 5': 'claude-fable-5',
    'Grok 4.6': 'grok-4-6',
    'Grok 4.5': 'grok-4-5',
    'GPT-5.6 Sol': 'gpt-5-6-sol',
  },
  parts: Object.fromEntries(DOMAIN_KEYS.map((name) => [name.replace(/[^A-Za-z]+/g, ''), { name, group: 'Domain', unit: 'usd' }])),
  async fetch() {
    const html = await fetchText(PAGE);
    const script = html.match(/<script type="module"[^>]+src="([^"]+)"/)?.[1];
    if (!script) throw new Error('FAR.AI: bundle URL missing from page');
    const bundle = await fetchText(new URL(script, PAGE).href);
    const start = bundle.indexOf('k2=[');
    const end = bundle.indexOf('];function S2', start);
    if (start < 0 || end < 0) throw new Error('FAR.AI: model data missing from bundle');
    const source = bundle.slice(start, end + 1);
    const rows: LeaderboardRow[] = [];
    const re = /\{name:"([^"]+)",supersededBy:(?:"[^"]+"|null),archivedOn:(?:"([^"]+)"|null),logo:[^,]+,testingDate:(?:"([^"]+)"|null),minimalStandardVersion:[^,]+,value:(\d+),cost:"([^"]+)",badgeLabel:"([^"]+)",findings:\{([\s\S]*?)\}\}\}/g;
    for (const m of source.matchAll(re)) {
      const findings = m[6];
      const metrics: Record<string, number> = {};
      for (const domain of DOMAIN_KEYS) {
        const hit = findings.match(new RegExp(`${domain.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}:\\{[^}]*avgCost:"([^\"]+)"`));
        if (hit) metrics[domain.replace(/[^A-Za-z]+/g, '')] = value(hit[1]);
      }
      rows.push({ model: m[1], score: value(m[5]), date: dateOf(m[3]), metrics });
    }
    if (rows.length < 4) throw new Error(`FAR.AI: ${rows.length} models, expected at least 4`);
    return rows;
  },
};
export default board;
