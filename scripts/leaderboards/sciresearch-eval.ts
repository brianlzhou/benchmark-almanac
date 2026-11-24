// SciResearch-Eval (Lawrence Livermore National Laboratory): autonomous thermal physics experiment design.
// Reads the official static HTML leaderboard table (<table id="board">) across 9 models and 21 reasoning settings.
// Live page draws assets/effort.svg: "Coverage on physics-wrong tasks at each reasoning setting, against reasoning tokens (a) and API cost (b)."
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://btwestyo.github.io/sciresearch-eval/';

const r4 = (n: number) => Math.round(n * 10000) / 10000;
const r2 = (n: number) => Math.round(n * 100) / 100;

const board: Leaderboard = {
  benchmark: 'sciresearch-eval',
  url: PAGE,
  feed: PAGE,
  terms: 'Public CC-BY-4.0 benchmark and static GitHub Pages leaderboard published by Lawrence Livermore National Laboratory.',
  chart: {
    title: 'Coverage vs tokens',
    x: { key: 'tokens', label: 'Median output tokens per episode', unit: 'tokens', better: 'lower', log: true },
    y: { key: 'coverage', label: '95% interval coverage', unit: '%', better: 'higher' },
    note: 'Share of true parameter values inside reported 95% confidence intervals against median output tokens per episode across reasoning settings.',
  },
  stats: {
    coverage: {
      name: '95% interval coverage',
      unit: '%',
      note: 'Share of true parameter values inside the model\u2019s reported 95% confidence intervals. Target is 95%, so higher above 95% is not necessarily better.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`SciResearch-Eval page: ${res.status}`);
    const html = await res.text();
    const tableMatch = html.match(/<table[^>]*id=["']?board["']?[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) throw new Error('SciResearch-Eval: leaderboard table not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tableMatch[1].matchAll(/<tr\s+([^>]*data-name=[^>]*)>([\s\S]*?)<\/tr>/gi)) {
      const attrs = tr[1];
      const body = tr[2];
      const getAttr = (name: string) => {
        const m = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
        return m ? m[1] : '';
      };
      const model = getAttr('data-name').trim();
      const score = Number(getAttr('data-score'));
      const cov = Number(getAttr('data-cov'));
      const tok = Number(getAttr('data-tok'));
      const usdRaw = getAttr('data-usd').trim();
      if (!model || !Number.isFinite(score)) continue;

      const tds = [...body.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      // Strip the inline "<span class=badge>default</span>" tag from the setting cell.
      const rawSetting = (tds[2] ?? '')
        .replace(/<span[^>]*class=["']?badge["']?[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const row: LeaderboardRow = {
        model,
        score: r4(score),
      };
      if (rawSetting) row.setting = rawSetting;
      if (Number.isFinite(tok) && tok > 0) row.tokens = Math.round(tok);
      if (usdRaw !== '' && Number.isFinite(Number(usdRaw))) row.cost = r4(Number(usdRaw));
      if (Number.isFinite(cov)) {
        row.metrics = { coverage: r2(cov * 100) };
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('SciResearch-Eval: parsed zero rows');
    return rows;
  },
};

export default board;
