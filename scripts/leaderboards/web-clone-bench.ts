// Web Clone Bench (Plato). The launch post on plato.so is static HTML with two results tables, "Best
// effort" (one row per model) and "All efforts" (every model at every reasoning effort it was run at):
// #, model with the effort in brackets, full (the share of each app's functionality replicated, averaged
// over the nine apps), avg cost and avg time per run, steps. The importer reads "All efforts", the larger
// table: full is the score, the bracketed effort the setting and avg cost the cost. Each model ran in its
// own vendor's coding harness, which the post does not name per row. Avg time ("5h 36m") is kept in seconds
// (`latency`) and steps as `steps`, both per run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://plato.so/research/web-clone-bench/';

const board: Leaderboard = {
  stats: { latency: { name: 'Average time per run', unit: 'seconds', better: 'lower' }, steps: { name: 'Steps', unit: 'count', better: 'lower' } },
  parts: {
    gmail: { name: 'Gmail', group: 'App' },
    figma: { name: 'Figma', group: 'App' },
    sheets: { name: 'Sheets', group: 'App' },
    slack: { name: 'Slack', group: 'App' },
    docusign: { name: 'DocuSign', group: 'App' },
    jira: { name: 'Jira', group: 'App' },
    shopify: { name: 'Shopify', group: 'App' },
    craigslist: { name: 'Craigslist', group: 'App' },
    zendesk: { name: 'Zendesk', group: 'App' },
  },
  costPer: 'run',
  chart: {
    title: 'Full score vs. cost per run',
    note: 'Full functionality score across all nine apps against average solver cost per run by reasoning effort, matching the results chart on the Web Clone Bench page.',
    x: { key: 'cost', label: 'Average solver cost per run', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Full score', unit: '%', better: 'higher' },
  },
  benchmark: 'web-clone-bench',
  url: PAGE,
  feed: `${PAGE} (static HTML table "All efforts", full)`,
  aliases: {
    'Muse Wonder 1.0': 'muse-wonder',
  },
  terms: 'Static research post; plato.so robots.txt allows /research/ (it disallows only /research/preview/ and /api/), and the Plato terms do not restrict reading public pages.',
  async fetch(): Promise<LeaderboardRow[]> {
    const allTables = tables(await fetchText(PAGE));
    const t = allTables
      .filter((rows) => rows[0]?.some((c) => c.text === 'full') && rows[0]?.some((c) => c.text === 'avg cost'))
      .sort((a, b) => b.length - a.length)[0];
    if (!t) throw new Error('Web Clone Bench table not found');
    const appTable = allTables
      .filter((rows) => rows[0]?.[0]?.text === 'model' && rows[0]?.at(-1)?.text === 'avg')
      .sort((a, b) => b.length - a.length)[0];
    const appKeys = (appTable?.[0] ?? []).map((c) => (c.attrs['data-name'] ?? '').toLowerCase());
    const byModelSetting = new Map<string, Record<string, number>>();
    for (const r of appTable?.slice(1) ?? []) {
      const label = (r[0]?.text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!label) continue;
      const scores: Record<string, number> = {};
      for (let i = 1; i < r.length - 1; i++) {
        const k = appKeys[i];
        const v = num(r[i]?.text);
        if (k && v !== undefined) scores[k] = v;
      }
      if (Object.keys(scores).length) byModelSetting.set(label, scores);
    }
    const head = t[0].map((c) => c.text);
    const [iModel, iFull, iCost, iTime, iSteps] = ['model', 'full', 'avg cost', 'avg time', 'steps'].map((h) => head.indexOf(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.text ?? '';
      const effort = cell.match(/\s*\[([\w-]+)\]$/);
      const score = num(r[iFull]?.text);
      if (!cell || score === undefined) continue;
      const model = effort ? cell.slice(0, effort.index).trim() : cell;
      const setting = effort?.[1].toLowerCase();
      const metrics: Record<string, number> = { ...(byModelSetting.get([model, setting].filter(Boolean).join(' ').toLowerCase()) ?? {}) };
      // "5h 36m", "48m" or "50s"
      const time = r[iTime]?.text ?? '';
      if (iTime >= 0 && /\d\s*[hms]\b/.test(time)) {
        const part = (u: string) => Number(time.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${u}\\b`))?.[1] ?? 0);
        metrics.latency = part('h') * 3600 + part('m') * 60 + part('s');
      }
      const steps = iSteps >= 0 ? num(r[iSteps]?.text) : undefined;
      if (steps !== undefined) metrics.steps = steps;
      rows.push({
        model,
        score,
        setting,
        cost: num(r[iCost]?.text),
        metrics,
      });
    }
    return rows;
  },
};
export default board;
