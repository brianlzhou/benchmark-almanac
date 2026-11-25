// CulturalBench: Hard average accuracy, the official app’s initial display.
// The app sets display_leaderboard("CulturalBench_Hard", "average") as its default.
// Regional diagnostics and the Easy view do not become independent rows.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const BASE = "https://huggingface.co/spaces/kellycyy/CulturalBench/raw/main/data";
const FEED = `${BASE}/CulturalBench_Hard_average.csv`;
const REGION_FEED = `${BASE}/CulturalBench_Hard_per_continent.csv`;
const EASY_FEED = `${BASE}/CulturalBench_Easy_average.csv`;

const REGIONS = [
  ['northAmerica', 'North America'],
  ['southAmerica', 'South America'],
  ['eastEurope', 'East Europe'],
  ['southEurope', 'South Europe'],
  ['westEurope', 'West Europe'],
  ['africa', 'Africa'],
  ['middleEastWestAsia', 'Middle East/ West Asia'],
  ['southAsia', 'South Asia'],
  ['southeastAsia', 'Southeast Asia'],
  ['eastAsia', 'East Asia'],
  ['oceania', 'Oceania'],
] as const;

const board: Leaderboard = {
  benchmark: "culturalbench",
  parts: {
    northAmerica: { name: 'North America', group: 'Region' },
    southAmerica: { name: 'South America', group: 'Region' },
    eastEurope: { name: 'East Europe', group: 'Region' },
    southEurope: { name: 'South Europe', group: 'Region' },
    westEurope: { name: 'West Europe', group: 'Region' },
    africa: { name: 'Africa', group: 'Region' },
    middleEastWestAsia: { name: 'Middle East and West Asia', group: 'Region' },
    southAsia: { name: 'South Asia', group: 'Region' },
    southeastAsia: { name: 'Southeast Asia', group: 'Region' },
    eastAsia: { name: 'East Asia', group: 'Region' },
    oceania: { name: 'Oceania', group: 'Region' },
  },
  stats: {
    easy: { name: 'Easy accuracy', unit: '%', better: 'higher' },
  },
  url: "https://huggingface.co/spaces/kellycyy/CulturalBench/raw/main/data/CulturalBench_Hard_average.csv",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const [rows, regionRows, easyRows] = await Promise.all([
      fetchText(FEED).then(parseCsv),
      fetchText(REGION_FEED).then(parseCsv),
      fetchText(EASY_FEED).then(parseCsv),
    ]);
    if (!rows.length) throw new Error('CulturalBench CSV empty');
    const byRegion = new Map<string, Record<string, number>>();
    for (const r of regionRows) {
      const m = (r.Models ?? r.model ?? '').trim();
      if (!m) continue;
      const trimmed: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) trimmed[k.trim()] = v;
      const vals: Record<string, number> = {};
      for (const [key, header] of REGIONS) {
        const v = Number(trimmed[header]);
        if (trimmed[header] && Number.isFinite(v)) vals[key] = v;
      }
      if (Object.keys(vals).length) byRegion.set(m, vals);
    }
    const easyByModel = new Map<string, number>();
    for (const r of easyRows) {
      const m = (r.model ?? '').trim();
      const v = Number(r.accuracy);
      if (m && r.accuracy && Number.isFinite(v)) easyByModel.set(m, Number(v.toFixed(2)));
    }
    return rows.map((r) => {
      const m = r.model.trim();
      const metrics: Record<string, number> = { ...(byRegion.get(m) ?? {}) };
      const easy = easyByModel.get(m);
      if (easy !== undefined) metrics.easy = easy;
      return {
        model: r.model,
        score: Number(r.accuracy),
        metrics: Object.keys(metrics).length ? metrics : undefined,
      };
    });
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  if (/^(gpt35turbo|gpt4o)$/i.test(r.model)) return {...r, model: r.model + ' (snapshot unspecified)'};
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
