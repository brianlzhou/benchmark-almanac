// BioTIER tests safeguarded model configurations on 398 harmful biology prompts (BioTIER-refuse) and 144 benign
// biology prompts (BioTIER-permit). The source reports no single combined score across both sets.
// The headline is the plain mean of BioTIER-refuse and BioTIER-permit, computed by this importer.
// This importer reads the "biotier-refuse-permit" Plotly chart embedded in SecureBio's benchmarks dashboard
// (securebio.org/benchmarks/details/), keeping both parts, their confidence intervals, evaluation dates,
// open-weight status, parameter counts and the refusal vs. permission scatter chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { SB_ALIASES, SB_PAGE, SB_TERMS, sbCharts, sbFacts } from './hpct-v2-securebio.ts';

// Undated API families do not identify a snapshot, so keep them as unlisted entries.
const identity = (name: string) =>
  /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(
    name,
  )
    ? `${name} (snapshot unspecified)`
    : name;

const board: Leaderboard = {
  benchmark: 'biotier-securebio',
  url: 'https://securebio.org/benchmarks/details/?benchmark=biotier',
  feed: `${SB_PAGE} (plotly-spec "biotier-refuse-permit")`,
  terms: SB_TERMS.replace(/;/g, ','),
  headline: 'SecureBio reports BioTIER-refuse and BioTIER-permit separately, so this is the plain mean of both percentages.',
  aliases: {
    ...SB_ALIASES,
    'Nemotron 3 Super 120B A12B': 'nemotron-3-super',
    'Nemotron 3 Ultra 550B A55B': 'nemotron-3-ultra',
  },
  parts: {
    refuse: { name: 'BioTIER-refuse', unit: '%', better: 'higher', note: 'Share of 398 harmful biology prompts correctly refused.' },
    permit: { name: 'BioTIER-permit', unit: '%', better: 'higher', note: 'Share of 144 benign biology prompts correctly answered.' },
  },
  chart: {
    title: 'Refusal vs. permission on biology requests',
    x: { key: 'permit', label: 'BioTIER-permit', unit: '%', better: 'higher' },
    y: { key: 'refuse', label: 'BioTIER-refuse', unit: '%', better: 'higher' },
    note: 'Refusal rate on 398 harmful biology prompts plotted against permission rate on 144 benign biology prompts.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const out = new Map<string, LeaderboardRow>();
    for (const c of await sbCharts()) {
      if (!/biotier-refuse-permit/.test(c.title)) continue;
      for (const h of c.hovers) {
        const lines = h.split(/<br>/i).map(text).filter(Boolean);
        const rawName = lines[0];
        if (!rawName) continue;
        const m = rawName.match(/^(.*?)\s*(?:\[([^\]]+)\])?$/)!;
        const refuseStr = lines.find((l) => l.startsWith('BioTIER-refuse:'))?.match(/:\s*([\d.]+)%/)?.[1];
        const permitStr = lines.find((l) => l.startsWith('BioTIER-permit:'))?.match(/:\s*([\d.]+)%/)?.[1];
        if (refuseStr === undefined || permitStr === undefined) continue;

        const refuse = Number(refuseStr);
        const permit = Number(permitStr);
        const refuseFacts = sbFacts(lines, 'BioTIER-refuse');
        const permitFacts = sbFacts(lines, 'BioTIER-permit');

        const evaluated = lines.find((l) => l.startsWith('Evaluated:'))?.slice(10).trim();
        const stamp = evaluated ? Date.parse(`${evaluated} UTC`) : NaN;
        const date = Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0, 10) : undefined;

        const metrics: Record<string, number> = { refuse, permit };
        if (refuseFacts.low !== undefined && refuseFacts.high !== undefined) {
          metrics.refuseLow = refuseFacts.low;
          metrics.refuseHigh = refuseFacts.high;
        }
        if (permitFacts.low !== undefined && permitFacts.high !== undefined) {
          metrics.permitLow = permitFacts.low;
          metrics.permitHigh = permitFacts.high;
        }

        const key = rawName;
        if (!out.has(key)) {
          out.set(key, {
            model: identity(m[1].trim()),
            setting: m[2]?.trim().toLowerCase() || undefined,
            score: Math.round((refuse + permit) * 50) / 100,
            ...(date ? { date } : {}),
            open: refuseFacts.open,
            params: refuseFacts.params,
            metrics,
          });
        }
      }
    }
    return checked([...out.values()], 20);
  },
};

export default board;
