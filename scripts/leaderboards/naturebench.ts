// NatureBench. frontisai.github.io/NatureBench fills its leaderboard from naturebench-data.js, which sets
// window.NATUREBENCH_DATA to a JSON object: per configuration (model and agent) a score per task, where a
// task score g is the SOTA-normalized gap to the paper's result and each task is valid, invalid or unscored.
// The page (leaderboard-tracks.js) ranks the Full track (90 tasks) by Surpass-SOTA, the share of all 90
// tasks with a valid g above 0.1, and breaks ties by Match-SOTA. That share, as a percent, is the score,
// computed here the same way. Configurations that ran only the 25-task subset are skipped. The agent is the
// harness; a harness name in brackets after the model ("Opus 5 (HELIX)") is dropped from the name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://frontisai.github.io/NatureBench/';
const FEED = `${PAGE}naturebench-data.js`;

type Score = { state: string; value: number | null };
interface Data {
  models?: { id?: string; name?: string; runSource?: { label?: string; url?: string } }[];
  leaderboard: { name: string; configurationId?: string; harness?: string; tracks?: string[]; scores?: Record<string, Score> }[];
  cases: { caseId: string; domain?: string; scores: Record<string, Score> }[];
}

const DOMAINS: [string, string, string][] = [
  ['Protein Biology', 'proteinBiology', 'Protein biology'],
  ['Cellular Omics', 'cellularOmics', 'Cellular omics'],
  ['Biomedical Modeling', 'biomedicalModeling', 'Biomedical modeling'],
  ['Molecular Design', 'molecularDesign', 'Molecular design'],
  ['Physical Modeling', 'physicalModeling', 'Physical modeling'],
  ['Relational Reasoning', 'relationalReasoning', 'Relational reasoning'],
];

const median = (xs: number[]) => {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const board: Leaderboard = {
  benchmark: 'naturebench',
  harnesses: 'system',
  url: `${PAGE}#leaderboard`,
  feed: `${FEED} (Full track, Surpass-SOTA computed as the page does)`,
  terms: 'Static data file on the project site (GitHub Pages, no robots.txt rules); the FrontisAI/NatureBench repository is MIT-licensed.',
  parts: Object.fromEntries(DOMAINS.map(([, k, name]) => [k, { name, unit: '%' as const }])),
  stats: {
    matchSota: { name: 'Match-SOTA', unit: '%', better: 'higher', note: 'Share of the 90 tasks with a valid non-negative score.' },
    medianAll: { name: 'Median g (all)', unit: 'score', better: 'higher', note: 'Median SOTA-normalized gap across all 90 tasks, with invalid or unscored tasks set to -1.' },
    meanAll: { name: 'Mean g (all)', unit: 'score', better: 'higher' },
    medianValid: { name: 'Median g (valid)', unit: 'score', better: 'higher' },
    completionRate: { name: 'Completion rate', unit: '%', better: 'higher' },
    scoreRate: { name: 'Score rate', unit: '%', better: 'higher' },
    invalid: { name: 'Invalid runs', unit: 'count', better: 'lower' },
  },
  aliases: {
    'Opus 5': 'claude-opus-5',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const data = jsonAt<Data>(js, js.indexOf('{'));
    const total = data.cases.length;
    if (total !== 90) throw new Error(`expected 90 Full-track tasks, found ${total}`);
    const byId = new Map((data.models ?? []).filter((m) => m.id).map((m) => [m.id!, m]));
    const byName = new Map((data.models ?? []).filter((m) => m.name).map((m) => [m.name!, m]));
    const domainTotals = new Map<string, number>();
    for (const c of data.cases) if (c.domain) domainTotals.set(c.domain, (domainTotals.get(c.domain) ?? 0) + 1);
    const rows: LeaderboardRow[] = [];
    for (const row of data.leaderboard) {
      if (Array.isArray(row.tracks) && !row.tracks.includes('full')) continue;
      let surpass = 0;
      let match = 0;
      let invalid = 0;
      let scored = 0;
      const validValues: number[] = [];
      const allValues: number[] = [];
      const domainSurpass = new Map<string, number>();
      for (const c of data.cases) {
        const s = row.scores?.[c.caseId] ?? c.scores[row.name];
        if (!s) throw new Error(`no ${row.name} score for ${c.caseId}`);
        if (s.state === 'invalid') invalid++;
        if (s.state !== 'none') scored++;
        const isValid = s.state === 'valid' && Number.isFinite(s.value);
        const v = isValid ? Number(s.value) : -1;
        allValues.push(v);
        if (isValid) {
          validValues.push(v);
          if (v >= 0) match++;
          if (v > 0.1) {
            surpass++;
            if (c.domain) domainSurpass.set(c.domain, (domainSurpass.get(c.domain) ?? 0) + 1);
          }
        }
      }
      const metrics: Record<string, number> = {
        matchSota: Number(((match / total) * 100).toFixed(2)),
        meanAll: Number((allValues.reduce((a, b) => a + b, 0) / total).toFixed(4)),
        completionRate: Number(((validValues.length / total) * 100).toFixed(2)),
        scoreRate: Number(((scored / total) * 100).toFixed(2)),
        invalid,
      };
      const medAll = median(allValues);
      if (medAll !== undefined) metrics.medianAll = Number(medAll.toFixed(4));
      const medValid = median(validValues);
      if (medValid !== undefined) metrics.medianValid = Number(medValid.toFixed(4));
      for (const [label, k] of DOMAINS) {
        const n = domainTotals.get(label) ?? 0;
        if (n > 0) metrics[k] = Number((((domainSurpass.get(label) ?? 0) / n) * 100).toFixed(2));
      }
      const cfg = (row.configurationId ? byId.get(row.configurationId) : undefined) ?? byName.get(row.name);
      const src = cfg?.runSource;
      const submitter = src?.label && src.label !== 'NatureBench run' ? src.label : undefined;
      const link = src?.url && /^https?:\/\//i.test(src.url) ? src.url : undefined;
      const model = row.name.replace(/\s*\([^)]*\)$/, '').trim();
      rows.push({
        model,
        harness: row.harness,
        score: Number(((surpass / total) * 100).toFixed(2)),
        ...(submitter ? { submitter } : {}),
        ...(link ? { link } : {}),
        metrics,
      });
    }
    return rows;
  },
};
export default board;
