// HWE Bench V2 ranks CPU designs by held-out iterations per second. The official table on hwebench.com
// (v2.html redirects to ./) gives the geometric mean over six runs per agent, 95% bootstrap rank interval,
// CoreMark iter/s, median Fmax (MHz), and median Area (LUT4).
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "hwe-bench-risc-v-2",
  harnesses: "system",
  url: "https://hwebench.com/",
  feed: "https://hwebench.com/",
  terms: "The author repository uses Apache License 2.0. https://raw.githubusercontent.com/FeSens/auto-arch-tournament/main/LICENSE The project site has no robots.txt.",
  stats: {
    coreMark: { name: 'CoreMark score', unit: 'score', better: 'higher' },
    fmaxMHz: { name: 'Maximum frequency', unit: 'score', better: 'higher' },
    areaLUT4: { name: 'Four-input lookup table area', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(this.url)).find(t => t[0]?.[1]?.text === 'Held-out iter/s');
    if (!table || table[0][5]?.text !== 'Area (LUT4)') throw new Error('Missing hardware ranking');
    const systems = table.slice(1).filter(r => /\((Claude Code|Codex CLI)\)/.test(r[0].text));
    if (systems.length < 6) throw new Error('Missing hardware systems');
    return systems.map(r => {
      const [,model,harness] = r[0].text.match(/^(.+?) \(([^)]+)\)$/)!;
      const score = num(r[1].text);
      const rank = r[2].text.match(/^(\d+)\s+to\s+(\d+)$/);
      if (score === undefined || !rank) throw new Error('Missing hardware score for '+model);
      return {model,harness,score,trials:6,metrics:{rankLow:Number(rank[1]),rankHigh:Number(rank[2]),coreMark:num(r[3].text)!,fmaxMHz:num(r[4].text)!,areaLUT4:num(r[5].text)!}};
    });
  },
};
export default board;
