// FinEval: the published Overall Ranking weighted average covers all four textual domains
// described by this benchmark record. The domain and task tables supply part scores, and Size gives billions of parameters.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, "")));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, "")))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/SUFE-AIFLM-Lab/FinEval/main/README.md";
const finevalParts = Object.fromEntries([
  ['Finance','Finance'], ['Economy','Economy'], ['Accounting','Accounting'], ['Certificate','Certificate'], ['FTC','Financial Text Classification'], ['FSA','Financial Sentiment Analysis'], ['RE','Relation Extraction'], ['FEE','Financial Event Extraction'], ['NEE','Negative Entity Extraction'], ['CEE','Causal Event Extraction'], ['FTS','Financial Text Summarization'], ['FCP','Financial Customer Portrait'], ['MSR','Marketing Scripts Recommendation'], ['IA','Investment Advice'], ['App','Application Security'], ['Cryp','Cryptography'], ['MA','Malware Analysis'], ['MS','Memory Security'], ['NS','Network Security'], ['Pent','Penetration Testing'], ['Reve','Reverse Engineering'], ['Soft','Software Security'], ['Syst','System Security'], ['Vul','Vulnerability'], ['WS','Web Security'], ['COT','Chain of Thought'], ['RAG','Retrieval Augmented Generation'], ['FT','Financial tasks'], ['MC','Multi-turn conversation'], ['MD','Multi-document question and answer'], ['API-I','API invocation'], ['API-R','API retrieval'],
].map(([key, name]) => [key.toLowerCase().replace(/-(.)/g, (_, c) => c.toUpperCase()), { name, group: 'Task' }]));
const board: Leaderboard = {
  benchmark: "fineval", parts: {
  'Financial Academic': { name: 'Financial academic', group: 'Category' },
  'Financial Industry': { name: 'Financial industry', group: 'Category' },
  'Financial Security': { name: 'Financial security', group: 'Category' },
  'Financial Agent': { name: 'Financial agent', group: 'Category' },
  ...finevalParts,
}, url: "https://raw.githubusercontent.com/SUFE-AIFLM-Lab/FinEval/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const groups: Record<string, string> = {
      Finance: 'Financial Academic', FTC: 'Industry Understanding', FTS: 'Industry Generation',
      App: 'Financial Security', COT: 'Financial Agent',
    };
    const details = new Map<string, Record<string, number>>();
    for (const [header, ...entries] of all) {
      const group = groups[header[2]];
      if (header[0] !== 'Model' || !group) continue;
      for (const cells of entries) {
        const model = cells[0].toLowerCase();
        const scores = details.get(model) ?? {};
        for (let i = 2; i < header.length - 1; i++) {
          const name = header[i];
          const key = name.toLowerCase().replace(/-(.)/g, (_, c: string) => c.toUpperCase());
          const value = num(cells[i]);
          if (value === undefined) continue;
          scores[key] = value;
          board.parts![key] = { name, group };
        }
        details.set(model, scores);
      }
    }
    for (const [header, ...entries] of all) {
      if (header[0] !== 'Model' || header.at(-1) !== 'Weighted Average') continue;
      for (const cells of entries) {
        const score = num(cells.at(-1));
        if (score === undefined) continue;
        const model = cells[0];
        const metrics = { ...details.get(model.toLowerCase()) };
        for (let i = 2; i < header.length - 1; i++) {
          const value = num(cells[i]);
          if (value !== undefined) metrics[header[i]] = value;
        }
        rows.push({ model, score, params: num(cells[1]), setting: 'zero-shot', metrics });
      }
    }
    if (!rows.length) throw new Error("No fineval score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
board.aliases = {...board.aliases, ...{"Gemini-2.5-pro-exp-03-25": "gemini-2-5-pro-mar-2025"}};
export default board;

