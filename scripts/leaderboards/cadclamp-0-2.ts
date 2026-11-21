// CADClamp checks whether generated parts meet their specifications and compares their printability to reference parts.
// The leaderboard JSON gives a mean across seven CAD languages, together with public and held-out scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://christiannhill.github.io/cadclamp/leaderboard.json";
const languages = ['build123d', 'openscad', 'cadquery', 'freecad', 'rhino', 'fusion', 'blender'];
type Main = { model: string; average: number; by_language: Record<string, number>; public: number; heldout: number; baseline: boolean };
type Detail = { model: string; language: string; harness: string; epochs: number; ci95: [number, number] };

const board: Leaderboard = {
  benchmark: "cadclamp-0-2",
  url: "https://christiannhill.github.io/cadclamp/#leaderboard",
  feed,
  terms: "The maker licenses prompts and results under CDLA-Permissive-2.0. The host has no robots.txt.",
  parts: { ...Object.fromEntries(languages.map(l => [l, l])), public: 'Public', heldout: 'Held out' },
  async fetch() {
    const data = await fetchJson<{ versions: { prompt_sets: Record<string, string> }; main: Main[]; rows: Detail[] }>(feed);
    if (!data.versions.prompt_sets['v0.2']?.startsWith('0.2.')) throw new Error('Unexpected CADClamp version');
    const models = data.main.filter(m => !m.baseline);
    if (models.length < 12) throw new Error('Incomplete CADClamp standings');
    return models.map(m => {
      const details = data.rows.filter(r => r.model === m.model);
      const harnesses = new Set(details.map(r => r.harness));
      const epochs = new Set(details.map(r => r.epochs));
      const metrics: Record<string, number> = { ...m.by_language, public: m.public, heldout: m.heldout };
      for (const language of languages) {
        if (!Number.isFinite(metrics[language])) throw new Error('Missing CAD language: ' + language);
        const detail = details.find(r => r.language === language);
        if (!detail?.ci95 || detail.ci95.length !== 2) throw new Error('Missing language interval');
        [metrics[language + 'Low'], metrics[language + 'High']] = detail.ci95;
      }
      if (!m.model || !Number.isFinite(m.average)) throw new Error('Missing CADClamp average');
      return { model: m.model, score: m.average, metrics, harness: harnesses.size === 1 ? [...harnesses][0] : undefined,
        trials: epochs.size === 1 ? [...epochs][0] : undefined };
    });
  },
};
export default board;
