// Drone-Bench (Andon Labs). andonlabs.com is a prerendered SvelteKit site. The page's headline chart,
// "Progress towards baseline", is drawn from a literal array in one of the chunks its node modules import:
// per model a short label, the release date and heroScorePct, the mean over the five tasks of
// min(average run score, human baseline) / baseline, in percent. That is the score here. The labels are
// short handles ("opus-4-8", "gemini-3.1", "gpt-6"); the ones the resolver cannot place get aliases that
// follow the page's own slugs and release dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://andonlabs.com/evals/drone-bench';
const BASE = 'https://andonlabs.com/_app/immutable/';

const board: Leaderboard = {
  benchmark: 'drone-bench',
  parts: {
    reconstruct: { name: 'Reconstruct', group: 'Task' },
    localize: { name: 'Localize', group: 'Task' },
    navigate: { name: 'Navigate', group: 'Task' },
    detect: { name: 'Detect', group: 'Task' },
    follow: { name: 'Follow', group: 'Task' },
  },
  stats: {
    heroAllRunsPct: { name: 'All-runs progress', unit: '%', better: 'higher', note: 'Progress toward baseline across all runs including misaligned runs.' },
    cheatingRate: { name: 'Runs with any cheating', unit: '%', better: 'lower' },
    attemptingRate: { name: 'Attempting cheating (low)', unit: '%', better: 'lower' },
    exploitingRate: { name: 'Exploiting cheating (medium)', unit: '%', better: 'lower' },
    exfiltratingRate: { name: 'Exfiltrating cheating (high)', unit: '%', better: 'lower' },
  },
  url: PAGE,
  feed: `${BASE}chunks/<hash>.js (chart array with heroScorePct and five task CSVs)`,
  terms: 'Public static asset of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {
    'gpt-4o-may': 'gpt-4o-may-2024',
    'gpt-4o-nov': 'gpt-4o-nov-2024',
    'opus-4-0': 'claude-opus-4',
    // the page's slug is gemini-2.5-pro with release date 2025-06-17
    'gemini-2.5': 'gemini-2-5-pro-jun-2025',
    'gemini-3.1': 'gemini-3-1-pro',
    // the page's slug is gpt-6-astra (released 2026-09-03)
    'gpt-6': 'gpt-6-astra',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const nodes = [...new Set([...html.matchAll(/_app\/immutable\/(nodes\/[\w.-]+\.js)/g)].map((m) => m[1]))];
    const chunks = new Set<string>();
    const nodeTexts: string[] = [];
    for (const n of nodes) {
      const s = await fetchText(BASE + n);
      nodeTexts.push(s);
      for (const m of s.matchAll(/from"\.\.\/chunks\/([\w.-]+\.js)"/g)) chunks.add(`chunks/${m[1]}`);
    }
    let js = '';
    for (const c of chunks) {
      const s = await fetchText(BASE + c);
      if (s.includes('heroScorePct')) {
        js = s;
        break;
      }
    }
    if (!js) throw new Error('Drone-Bench chart data not found');
    const taskScores = new Map<string, Record<string, number>>();
    const csvNode = nodeTexts.find((s) => s.includes('reconstructCsv'));
    if (csvNode) {
      const idToLabel = new Map<string, string>();
      for (const m of csvNode.matchAll(/"([^"]+?)":\{label:(["`])([^"`]+)\2/g)) idToLabel.set(m[1], m[3]);
      const parseTaskCsv = (csv: string) => {
        const lines = csv.trim().split(/\r?\n/);
        const map = new Map<string, number[]>();
        if (lines.length < 2) return map;
        const cols = lines[0].split(',');
        const mi = cols.indexOf('model');
        const sis = Array.from({ length: 10 }, (_, k) => cols.indexOf(`score_${k + 1}`)).filter((i) => i >= 0);
        for (const line of lines.slice(1)) {
          const cells = line.split(',');
          let best = -Infinity;
          for (const i of sis) {
            if (cells[i] === '' || cells[i] == null) continue;
            const v = Number(cells[i]);
            if (Number.isFinite(v)) best = Math.max(best, v);
          }
          if (best === -Infinity) continue;
          const arr = map.get(cells[mi]) ?? [];
          arr.push(best);
          map.set(cells[mi], arr);
        }
        return map;
      };
      const vars = new Map<string, string>();
      for (const m of csvNode.matchAll(/get (reconstruct|localize|navigate|detect|follow)Csv\(\)\{return ([a-zA-Z_$][\w$]*)\}/g)) {
        vars.set(m[1], m[2]);
      }
      const CSV_LABEL_ALIASES: Record<string, string> = { 'fable-5.1': 'fable-5-1', 'gpt-6-astra': 'gpt-6' };
      for (const [task, v] of vars) {
        const m = csvNode.match(new RegExp(`(?:var |let |const |,)${v}=\`([\\s\\S]*?)\``));
        if (!m) continue;
        for (const [id, runs] of parseTaskCsv(m[1])) {
          const rawLabel = idToLabel.get(id);
          const label = rawLabel ? (CSV_LABEL_ALIASES[rawLabel] ?? rawLabel) : undefined;
          if (!label || !runs.length) continue;
          const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
          const rec = taskScores.get(label) ?? {};
          rec[task] = Number((mean * 100).toFixed(2));
          taskScores.set(label, rec);
        }
      }
    }
    const rows: LeaderboardRow[] = [];
    // strings are double-quoted or, since September 2026, template literals
    const numField = (body: string, key: string) => {
      const m = body.match(new RegExp(`${key}:([\\d.]+)`));
      return m ? Number(m[1]) : undefined;
    };
    for (const m of js.matchAll(/\{label:(["`])([^"`]+)\1,provider:["`][^"`]*["`],releaseDate:["`][\d-]+["`]([^{}]*?heroScorePct:([\d.]+)[^{}]*)\}/g)) {
      const label = m[2];
      const body = m[3];
      const score = Number(Number(m[4]).toFixed(2));
      const metrics: Record<string, number> = { ...(taskScores.get(label) ?? {}) };
      const heroAll = numField(body, 'heroAllRunsPct');
      if (heroAll !== undefined) metrics.heroAllRunsPct = Number(heroAll.toFixed(2));
      const nJudged = numField(body, 'nJudged');
      const nLow = numField(body, 'nLow');
      const nMed = numField(body, 'nMed');
      const nHigh = numField(body, 'nHigh');
      if (nJudged && nJudged > 0 && nLow !== undefined && nMed !== undefined && nHigh !== undefined) {
        metrics.cheatingRate = Number(((100 * (nLow + nMed + nHigh)) / nJudged).toFixed(2));
        metrics.attemptingRate = Number(((100 * nLow) / nJudged).toFixed(2));
        metrics.exploitingRate = Number(((100 * nMed) / nJudged).toFixed(2));
        metrics.exfiltratingRate = Number(((100 * nHigh) / nJudged).toFixed(2));
      }
      const trials = numField(body, 'nAllRuns');
      rows.push({
        model: label,
        score,
        trials: trials && trials > 0 ? trials : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} Drone-Bench rows`);
    return rows;
  },
};
export default board;
