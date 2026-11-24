// VAERS influenza vaccine adverse event extraction evaluates named entity recognition across
// six clinical entity types in vaccine safety reports. This importer reads Table 2 (exact-match
// F1) and Table 3 (relaxed F1) of the AE-GPT PLOS ONE study (PMC10956752) via the open-access
// Europe PMC REST API, converting 0 to 1 F1 proportions to percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10956752/fullTextXML';

const COLUMNS: ReadonlyArray<readonly [string, 'Pretrained' | 'Fine-tuned']> = [
  ['GPT-2', 'Pretrained'],
  ['GPT-2', 'Fine-tuned'],
  ['GPT-3 ada', 'Pretrained'],
  ['GPT-3 ada', 'Fine-tuned'],
  ['GPT-3 babbage', 'Pretrained'],
  ['GPT-3 babbage', 'Fine-tuned'],
  ['GPT-3 curie', 'Pretrained'],
  ['GPT-3 curie', 'Fine-tuned'],
  ['GPT-3 davinci', 'Pretrained'],
  ['GPT-3 davinci', 'Fine-tuned'],
  ['GPT-3.5 (snapshot unspecified)', 'Pretrained'],
  ['GPT-3.5 (snapshot unspecified)', 'Fine-tuned'],
  ['GPT-4 (snapshot unspecified)', 'Pretrained'],
  ['Llama-2-7b-chat', 'Pretrained'],
  ['Llama-2-7b-chat', 'Fine-tuned'],
  ['Llama-2-13b-chat', 'Pretrained'],
  ['Llama-2-13b-chat', 'Fine-tuned'],
];

const ENTITIES: ReadonlyArray<readonly [string, string, string]> = [
  ['investigation', 'investigation', 'Investigation'],
  ['nervous_AE', 'nervousAe', 'Nervous AE'],
  ['other_AE', 'otherAe', 'Other AE'],
  ['procedure', 'procedure', 'Procedure'],
  ['social_circumstance', 'socialCircumstance', 'Social circumstance'],
  ['temporal_expression', 'temporalExpression', 'Temporal expression'],
];

function stripXml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseTableRows(wrap: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const trs = wrap.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const tr of trs) {
    const cells = [...tr.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => stripXml(m[1]));
    if (cells.length !== 18) continue;
    const nums = cells.slice(1).map((c) => Number(c));
    if (nums.every(Number.isFinite)) out.set(cells[0], nums);
  }
  return out;
}

const pct = (v: number) => Number((v * 100).toFixed(1));

const board: Leaderboard = {
  benchmark: 'vaers-influenza-gbs',
  static: 'paper',
  host: 'AE-GPT',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10956752/',
  feed: FEED,
  terms: 'Open-access Europe PMC full-text XML (CC BY 4.0). Scores remain credited to Li et al. (PLOS ONE 2024).',
  headline: 'Headline is exact-match micro-average F1 in percent across six VAERS adverse event entity types from Table 2.',
  aliases: {
    'Llama-2-7b-chat': 'llama-2-7b',
    'Llama-2-13b-chat': 'llama-2-13b',
  },
  parts: Object.fromEntries(
    ENTITIES.map(([, key, name]) => [key, { name, group: 'Entity type (exact F1)', unit: '%' as const, better: 'higher' as const }])
  ),
  stats: {
    relaxedMicroF1: { name: 'Relaxed micro-average F1', unit: '%', better: 'higher' },
    relaxedInvestigation: { name: 'Investigation (relaxed F1)', unit: '%', better: 'higher' },
    relaxedNervousAe: { name: 'Nervous AE (relaxed F1)', unit: '%', better: 'higher' },
    relaxedOtherAe: { name: 'Other AE (relaxed F1)', unit: '%', better: 'higher' },
    relaxedProcedure: { name: 'Procedure (relaxed F1)', unit: '%', better: 'higher' },
    relaxedSocialCircumstance: { name: 'Social circumstance (relaxed F1)', unit: '%', better: 'higher' },
    relaxedTemporalExpression: { name: 'Temporal expression (relaxed F1)', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, {
      headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Europe PMC fetch failed: ${res.status}`);
    const xml = await res.text();
    const wraps = xml.match(/<table-wrap[\s\S]*?<\/table-wrap>/gi) ?? [];
    const exactWrap = wraps.find((w) => /by strict F1/i.test(w));
    const relaxedWrap = wraps.find((w) => /by relaxed F1/i.test(w));
    if (!exactWrap || !relaxedWrap) throw new Error('AE-GPT exact or relaxed F1 table missing in PMC10956752');

    const exact = parseTableRows(exactWrap);
    const relaxed = parseTableRows(relaxedWrap);
    const exactMicro = exact.get('Microaverage');
    const relaxedMicro = relaxed.get('Microaverage');
    if (!exactMicro || !relaxedMicro) throw new Error('AE-GPT Microaverage row missing');

    const relaxedKeys: Record<string, string> = {
      investigation: 'relaxedInvestigation',
      nervous_AE: 'relaxedNervousAe',
      other_AE: 'relaxedOtherAe',
      procedure: 'relaxedProcedure',
      social_circumstance: 'relaxedSocialCircumstance',
      temporal_expression: 'relaxedTemporalExpression',
    };

    const rows: LeaderboardRow[] = COLUMNS.map(([model, setting], idx) => {
      const metrics: Record<string, number> = {
        relaxedMicroF1: pct(relaxedMicro[idx]),
      };
      for (const [rawKey, partKey] of ENTITIES) {
        const ev = exact.get(rawKey)?.[idx];
        const rv = relaxed.get(rawKey)?.[idx];
        if (ev !== undefined) metrics[partKey] = pct(ev);
        if (rv !== undefined) metrics[relaxedKeys[rawKey]] = pct(rv);
      }
      return {
        model,
        setting,
        score: pct(exactMicro[idx]),
        metrics,
      };
    });

    return checked(rows, 17);
  },
};

export default board;
