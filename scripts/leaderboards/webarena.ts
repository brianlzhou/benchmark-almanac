// WebArena: the authors’ linked Google Sheet publishes Success Rate (%) for submitted systems.
// Read sizes, system openness and trajectory links from the sheet alongside work and submission month.
// Only run-configuration notes become settings, not citation links or publication comments.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://docs.google.com/spreadsheets/d/1M801lEpBbKSNwP-vDBkC_pF7LdyGU1f_ufZb_NWNBZQ/htmlview/sheet?headers=true&gid=0";
const board: Leaderboard = {
 benchmark: "webarena",
 url: "https://webarena.dev/og/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const sheet = tables(await fetchText(FEED))[0] ?? [];
  const header = sheet.findIndex(r => r.some(c => c.text === 'Success Rate (%)'));
  if (header < 0) throw new Error('WebArena result columns missing');
  const names = sheet[header].map(c => c.text);
  const rows: LeaderboardRow[] = [];
  for (const cells of sheet.slice(header + 1)) {
    const cell = (name: string) => cells[names.indexOf(name)];
    const model = cell('Model')?.text;
    const score = num(cell('Success Rate (%)')?.text);
    if (!model || score === undefined || /human/i.test(model)) continue;
    const work = cell('Work')?.text;
    const note = cell('Note')?.text ?? '';
    const month = cell('a')?.text ?? '';
    const size = cell('Model Size (billion)')?.text ?? '';
    const mark = cell('Open?')?.text;
    const href = cell('Traj')?.html.match(/href="([^"]+)"/)?.[1] ?? cell('Result Source')?.html.match(/href="([^"]+)"/)?.[1];
    const url = href && /^https?:/.test(href) ? new URL(text(href)) : undefined;
    const link = url?.hostname === 'www.google.com' && url.pathname === '/url' ? url.searchParams.get('q') : url?.href;
    rows.push({
      model, score, harness: work && work !== model ? work : undefined,
      setting: /not achievable|different observation representation|Using both API and GUI|High-level plans are derived by human/.test(note) ? note : undefined,
      date: /^\d{2}\/\d{4}$/.test(month) ? month.slice(3) + '-' + month.slice(0, 2) + '-01' : undefined,
      params: /^\d+(?:\.\d+)?$/.test(size) ? Number(size) : undefined,
      metrics: mark === '✔' || mark === '✗' ? {openSystem: Number(mark === '✔')} : undefined,
      link: link && /^https?:\/\//.test(link) ? link : undefined,
    });
  }
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
