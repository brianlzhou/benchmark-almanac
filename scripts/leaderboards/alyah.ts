// Alyah: whole-benchmark Emirati dialect accuracy, in percent, reported with LightEval. Read the nominal size when the model name gives it.
// Base versus instruction-tuned describes model identity, not a benchmark setting.
// Base entries receive an explicit identity suffix to prevent matching instruction-tuned snapshots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

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
const FEED = "https://huggingface.co/datasets/tiiuae/alyah-emirati-benchmark/resolve/main/README.md";
const board: Leaderboard = {
  benchmark: "alyah", url: "https://huggingface.co/datasets/tiiuae/alyah-emirati-benchmark/resolve/main/README.md", feed: FEED,
  reference: ['LightEval'],
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const boards=all.filter(t=>t[0]?.[0]==="Model"&&t[0]?.[1]==="Accuracy");if(boards.length!==2)throw new Error("Expected base/instruction tables");
    boards.forEach((table,index) => {
      for (const [model,value] of table.slice(1)) {
        const score = num(value);
        if (score === undefined) continue;
        const size = model.match(/(?:^|[-/])(\d+(?:\.\d+)?)b(?:-|$)/i);
        rows.push({model:index === 0 ? model+' (base)' : model, score, harness:'LightEval',
          params:size ? Number(size[1]) : undefined});
      }
    });
    if (!rows.length) throw new Error("No alyah score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

