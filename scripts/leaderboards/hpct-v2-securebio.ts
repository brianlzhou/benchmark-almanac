// HPCT v2 (Human Pathogen Capabilities Test, revised) on SecureBio's AI Biology Benchmarks dashboard. The
// dashboard is a static Quarto site; its Benchmarks page (securebio.org/benchmarks/details/) embeds each chart
// as a <script type="application/json" class="plotly-spec"> block. The "Model performance on HPCT-v2" chart
// has one point per model, and each point's hover text carries the raw score, "Accuracy: 61.1% [CI] (10
// runs)". That accuracy is the score (the dashboard's trend charts rescale scores between expert level and
// perfect, but the hover text keeps the raw accuracy). Points flagged "Too many refusals for reliable
// scoring" are skipped. A model appears once per grouping trace (by lab,
// country, access), so rows are deduplicated by name. "[high]", "[max]" or "[16k]" after the name is the
// reasoning effort or thinking budget, passed as the setting; "(Nov '25 Preview)" style tags are dropped and
// the dated GPT-4o and Claude 3.5 Sonnet snapshots are aliased.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

export const SB_PAGE = 'https://securebio.org/benchmarks/details/';
export const SB_TERMS =
  'Static SecureBio dashboard page; securebio.org robots.txt allows all agents (content signals: search yes, AI training no) and SecureBio asks that results be cited.';
export const SB_ALIASES: Record<string, string> = {
  "GPT-4o (Aug '24)": 'gpt-4o-aug-2024',
  "GPT-4o (Nov '24)": 'gpt-4o-nov-2024',
  "GPT-4o (May '24)": 'gpt-4o-may-2024',
  "Claude Sonnet 3.5 (Oct '24)": 'claude-3-5-sonnet-october-2024',
  "Claude Sonnet 3.5 (Jun '24)": 'claude-3-5-sonnet',
  "GPT-4.5 (Feb '25 Preview)": 'gpt-4-5',
  'DeepSeek R1 (0528)': 'deepseek-r1-may-2025',
  'Grok 4.20 (Multi-Agent)': 'grok-4-20-multi-agent',
  // the hover gives a June 2025 release
  'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
};

interface Spec {
  data: { hovertext?: string | string[] }[];
  layout?: { title?: string | { text?: string } };
}

/** Every Plotly chart on the page with its title. */
export async function sbCharts(): Promise<{ title: string; hovers: string[] }[]> {
  const html = await fetchText(SB_PAGE);
  const out: { title: string; hovers: string[] }[] = [];
  for (const m of html.matchAll(/<script type="application\/json" class="plotly-spec" data-target="([^"<>]+)">/g)) {
    const start = (m.index ?? 0) + m[0].length;
    const spec = JSON.parse(html.slice(start, html.indexOf('</script>', start))) as Spec;
    const t = spec.layout?.title;
    out.push({
      title: `${m[1]} ${typeof t === 'string' ? t : (t?.text ?? '')}`,
      hovers: spec.data.flatMap((d) => (Array.isArray(d.hovertext) ? d.hovertext : d.hovertext ? [d.hovertext] : [])),
    });
  }
  if (!out.length) throw new Error('no charts found');
  return out;
}

/**
 * Rows from hover texts whose score line starts with `label` (for example "Accuracy" or "ABLE (Full)"), in
 * the charts whose title matches `chart`.
 */
export async function sbRows(chart: RegExp, label: string): Promise<LeaderboardRow[]> {
  const charts = (await sbCharts()).filter((c) => chart.test(c.title));
  if (!charts.length) throw new Error(`no chart matches ${chart}`);
  const seen = new Map<string, LeaderboardRow>();
  for (const c of charts)
    for (const h of c.hovers) {
      const lines = h.split(/<br>/i).map((l) => text(l)).filter(Boolean);
      const score = lines.find((l) => l.startsWith(`${label}:`))?.match(/:\s*(-?[\d.]+)%/)?.[1];
      // the dashboard flags runs where refusals make the score meaningless
      if (!lines[0] || score === undefined || lines.some((l) => /too many refusals/i.test(l))) continue;
      const m = lines[0].match(/^(.*?)\s*(?:\[([^\]]+)\])?$/);
      const full = (m?.[1] ?? lines[0]).trim();
      const tag = full.match(/\s*\(([^)]*)\)$/);
      let setting = m?.[2]?.toLowerCase();
      if (tag && /reasoning/i.test(tag[1])) setting ??= tag[1].toLowerCase();
      const model = SB_ALIASES[full] || !tag ? full : full.slice(0, tag.index).trim();
      if (!seen.has(lines[0])) seen.set(lines[0], { model, score: Number(score), setting });
    }
  return [...seen.values()];
}

const board: Leaderboard = {
  benchmark: 'hpct-v2-securebio',
  url: 'https://securebio.org/benchmarks/',
  feed: `${SB_PAGE} (plotly-spec "Model performance on HPCT-v2", hover Accuracy)`,
  terms: SB_TERMS,
  aliases: SB_ALIASES,
  fetch: () => sbRows(/Model performance on HPCT-v2$/, 'Accuracy'),
};
export default board;
