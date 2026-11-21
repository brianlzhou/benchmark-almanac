// BEA 2023 ranks submitted teacher-response systems by average rank on BERTScore F1 and DialogRPT. The phase 2 table names each system and team.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "bea-2023-generating-ai-teacher-responses",
  url: "https://sig-edu.org/sharedtask/2023#phase-2-evaluation",
  feed: "https://sig-edu.org/sharedtask/2023#phase-2-evaluation",
  terms: "The rankings list system runs, including two GPT-4 runs. Cambridge licenses the dialogue data for noncommercial research and education. The results page gives no separate license. https://github.com/anaistack/bea-2023-shared-task The site lists a sitemap in robots.txt.",
  // The submissions closed May 5, before the June GPT-4 release.
  aliases: {'GPT-4':'gpt-4-mar-2023'},
  async fetch() {
    const table = tables(await fetchText(this.url)).find(t => t[1]?.[1]?.text === 'System' && t[1]?.at(-1)?.text === 'Rank');
    if (!table || table.length < 12) throw new Error('Missing phase 2 ranking');
    const headers = table[1].slice(3,-1).map(c => c.text);
    return table.slice(2).map(r => {
      const score = num(r.at(-1)?.text);
      if (score === undefined || !r[1].text || headers.length !== 8) throw new Error('Incomplete BEA result');
      const metrics: Record<string,number> = {};
      for (const [i,k] of headers.entries()) {
        const value = num(r[i+3].text);
        if (value === undefined) throw new Error('Missing metric '+k);
        metrics[k] = value;
      }
      return { model:r[1].text, submitter:r[2].text, score, metrics, setting:'Submission '+r[0].text };
    });
  },
};
export default board;
