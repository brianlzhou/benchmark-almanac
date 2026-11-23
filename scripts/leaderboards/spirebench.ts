// SpireBench measures long-horizon play in Slay the Spire, with the Ironclad at Ascension 20, on ten seeds.
// Table 1 reports mean acts cleared over ten runs for each LLM agent, which the paper states is its primary
// metric, with each act's win rate, the floor reached, thinking per floor and cost. Each model runs at its highest
// reasoning setting, given in parentheses after its name. Only the "LLM agents" section is read: the table also
// holds baseline policies, the Bottled AI symbolic agent and human players.
// LaTeXML renders Table 1 as nested spans, with small tabulars inside some header cells, so the reader flattens
// those first. The first version of this importer never found the table (fixed 2026-11-23).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2610.12596';

/** Table 1's figure, with the tabulars nested inside its cells turned into plain text spans. */
function table1(html: string): string {
  const a = html.indexOf('<figure id="S3.T1"'), b = html.indexOf('</figure>', a);
  if (a < 0 || b < 0) throw new Error('Missing SpireBench Table 1');
  const inCell: boolean[] = [];
  return html.slice(a, b).replace(/<\/?span\b[^>]*>/gi, tag => {
    if (tag.startsWith('</')) { inCell.pop(); return tag; }
    const outer = inCell.at(-1) ?? false;
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    inCell.push(outer || classes.includes('ltx_td'));
    return outer && classes.some(c => c === 'ltx_tabular' || c === 'ltx_tr' || c === 'ltx_td') ? tag.replace(/class="[^"]*"/, 'class="ltx_text"') : tag;
  });
}

export default {
  benchmark: 'spirebench', static: 'paper', url, feed: url, costPer: 'run',
  terms: 'The authors publish Table 1 on arXiv. https://arxiv.org/abs/2610.12596',
  stats: {
    act1WinRate: { name: 'Act 1 win rate', unit: '%', better: 'higher' },
    act2WinRate: { name: 'Act 2 win rate', unit: '%', better: 'higher' },
    act3WinRate: { name: 'Act 3 win rate', unit: '%', better: 'higher' },
    act4WinRate: { name: 'Act 4 win rate', unit: '%', better: 'higher' },
    meanFloor: { name: 'Mean final floor', unit: 'count', better: 'higher' },
    medianFloor: { name: 'Median final floor', unit: 'count', better: 'higher' },
    thinking: { name: 'Thinking per floor', unit: 'thousands', note: 'Thousands of thinking tokens per floor.' },
  },
  async fetch() {
    const table = inlinePaperTables(table1(await paperHtml(url))).find(t => t[1]?.[1] === 'Agent' && t[1]?.[7] === 'Acts cleared');
    if (!table) throw new Error('Missing SpireBench results table');
    const rows: LeaderboardRow[] = [];
    let section = '';
    for (const c of table.slice(2)) {
      // a section heading fills every cell of its row: "LLM agents (thematic reskin)"
      if (c.every(x => x === c[0])) { section = c[0]; continue; }
      if (!section.startsWith('LLM agents')) continue;
      const match = c[1].match(/^(.+?)(?:\s+\(([^)]+)\))?$/)!;
      // † marks a self-hosted model priced at Artificial Analysis's rates and ‡ a peak-rate upper bound, so only
      // costs the authors were billed are kept
      const cost = /^\d+(?:\.\d+)?$/.test(c[13]) ? Number(c[13]) : undefined;
      rows.push({ model: match[1], ...(match[2] ? { setting: match[2] } : {}), score: numberCell(c[7]), trials: numberCell(c[2]), cost,
        metrics: { act1WinRate: numberCell(c[3]), act2WinRate: numberCell(c[4]), act3WinRate: numberCell(c[5]), act4WinRate: numberCell(c[6]),
          meanFloor: numberCell(c[8]), medianFloor: numberCell(c[9]), thinking: numberCell(c[11]) } });
    }
    return checked(rows, 19);
  },
} satisfies Leaderboard;
