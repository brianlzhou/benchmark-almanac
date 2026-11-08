// FinEval: the published Overall Ranking weighted average covers all four textual domains
// described by this benchmark record. Component domains are metrics; zero-shot is the setting.
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
const FEED = "https://raw.githubusercontent.com/SUFE-AIFLM-Lab/FinEval/main/README.md";
const board: Leaderboard = {
  benchmark: "fineval", url: "https://raw.githubusercontent.com/SUFE-AIFLM-Lab/FinEval/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const labels:Record<string,string>={Finance:"academic",FTC:"industry-understanding",FTS:"industry-generation",App:"security",COT:"agent","Financial Academic":"weighted text overall",Limit:"multimodal"};
    for(const t of all){const h=t[0];if(h[0]!=="Model"&&h[0]!=="Rank")continue;
      const ranked=h[0]==="Rank";const setting=ranked&&h[2]==="Total Score"?"financial rigor release":labels[h[2]];if(setting!=="weighted text overall")continue;
      const scoreIndex=ranked?2:h.length-1;const modelIndex=ranked?1:0;
      for(const r of t.slice(1)){const score=num(r[scoreIndex]);if(score===undefined)continue;let model=r[modelIndex];
        if(ranked)model=model.replace(/^(Ant Group|DeepSeek|Alibaba|Zhipu AI|Shanghai AI Lab|OpenAI|Meta AI)\s+/,"");
        const metrics=Object.fromEntries(h.flatMap((name,j)=>{if(j===scoreIndex||j<=modelIndex||name==="Size"||name==="Limit")return [];const n=num(r[j]);return n===undefined?[]:[[name,n]];}));
        rows.push({model,score,setting:"zero-shot",metrics});
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

