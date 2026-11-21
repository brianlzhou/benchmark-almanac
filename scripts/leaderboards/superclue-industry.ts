// SuperCLUE-Industry tests industrial tasks in Chinese. The repository’s overall table gives the total score, with six subtasks in two companion tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/CLUEbenchmark/SuperCLUE-Industry/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "superclue-industry",
  url: "https://github.com/CLUEbenchmark/SuperCLUE-Industry",
  feed: FEED,
  terms: "The repository publishes comparison results. The README does not specify separate reuse terms for these scores. https://github.com/CLUEbenchmark/SuperCLUE-Industry",
  async fetch() {
    const tables = markdownTables(await fetchText(FEED));
    const overall = tables.find(t => t[0][3] === '总分');
    const sections = ['基础能力','应用能力'].map(name => tables.find(t => t[0][3]?.replace(/ /g,'') === name));
    if (!overall || overall.length < 13 || sections.some(t => !t)) throw new Error('Incomplete SuperCLUE-Industry tables');
    this.parts = {};
    return overall.slice(1).map((r): LeaderboardRow => {
      const metrics: Record<string,number> = {};
      for (const table of sections) {
        const cells = table!.slice(1).find(s => s[1] === r[1]);
        if (!cells) throw new Error('Missing industry breakdown for '+r[1]);
        for (let j=3; j<=6; j++) {
          const name = table![0][j].replace(/ /g,'');
          if (!cells[j] || !Number.isFinite(Number(cells[j]))) throw new Error('Missing '+name);
          metrics[name] = Number(cells[j]);
          this.parts![name] = name;
        }
      }
      if (!r[3] || !Number.isFinite(Number(r[3]))) throw new Error('Missing industry total');
      return {model: r[1], score: Number(r[3]), setting: r[6], metrics};
    });
  },
};
export default board;
