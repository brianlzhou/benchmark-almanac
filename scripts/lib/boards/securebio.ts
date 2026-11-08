// SecureBio ABC-Bench: adapt the existing screening-evasion hover-text parser for percentage records.
// Each task family has its own plot. Repeated legend traces carry identical rows and are deduplicated.
// The publisher excludes runs marked unreliable because of excessive refusals.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { text } from '../html.ts';

export const ABC_FEED = 'https://securebio.org/benchmarks/details/?benchmark=abc-bench';
export const ABC_TERMS = 'SecureBio allows reference use under its content signals, prohibits AI training, and retains attribution for its public results.';
export const ABC_ALIASES: Record<string, string> = {
  "Gemini 3 Pro (Nov '25 Preview)": 'gemini-3-pro',
  "Gemini 3.1 Pro (Feb 26' Preview)": 'gemini-3-1-pro',
  'Nemotron 3 Super 120B A12B': 'nemotron-3-super',
  'Nemotron 3 Ultra 550B A55B': 'nemotron-3-ultra',
};

export async function abcRows(track: 'fragment-design' | 'liquid-handling-robot'): Promise<LeaderboardRow[]> {
  const source = await fetchText(ABC_FEED);
  const rows = new Map<string, LeaderboardRow>();
  for (const match of source.matchAll(/<script type="application\/json" class="plotly-spec"[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!match[1].includes(`Model performance on ABC-Bench (${track})`)) continue;
    const spec = JSON.parse(match[1]);
    if (spec.layout?.title?.text !== `Model performance on ABC-Bench (${track})`) continue;
    for (const trace of spec.data) for (const hover of trace.hovertext ?? []) {
      if (/Too many refusals/i.test(hover)) continue;
      const label = hover.split(/<br\s*\/?>/i).map(text).find((s: string) => s.trim());
      const accuracy = hover.match(/Accuracy:\s*([\d.]+)%/);
      if (!label || !accuracy) continue;
      let model = label.replace(/\s*\[[^\]]+\]$/, '');
      const setting = label.match(/\[([^\]]+)\]$/)?.[1];
      const harness = / Codex$/.test(model) ? 'Codex' : undefined;
      if (harness) model = model.replace(/ Codex$/, '');
      const ci = hover.match(/Accuracy:\s*[\d.]+%\s*\[([\d.]+)%,\s*([\d.]+)%\]/);
      const refusal = hover.match(/Refusals:\s*([\d.]+)%/);
      const metrics: Record<string, number> = {};
      if (ci) { metrics.ciLow = Number(ci[1]); metrics.ciHigh = Number(ci[2]); }
      if (refusal) metrics.refusalPercent = Number(refusal[1]);
      rows.set(label, { model, score: Number(accuracy[1]), setting, harness, metrics });
    }
  }
  if (!rows.size) throw new Error(`ABC-Bench ${track} results missing`);
  return [...rows.values()];
}
