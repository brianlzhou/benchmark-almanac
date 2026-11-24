// AMusE tests audio-visual reasoning about conversations. Tables 3 to 5 report six tasks.
// Dialogue summarization BLEU is the first metric in Table 3.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2512.16250";
const board: Leaderboard = {
  benchmark: "amuse",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2512.16250",
  aliases: { "GPT-4o Mini (snapshot unspecified)": "gpt-4o-mini" },
  headline: "The paper reports several task metrics, so the headline is BLEU for audio-visual dialogue summarization.",
  parts: {
    bleu: { name: "Audio-Visual Dialogue Summarization BLEU", unit: "score" },
    association: { name: "AV Speaker Association accuracy", unit: "%" },
    next: { name: "Next Speaker Prediction accuracy", unit: "%" },
    identification: { name: "Speaker Re-identification accuracy", unit: "%" },
    grounding: { name: "Speaker Temporal Grounding temporal IoU", unit: "%" },
    linking: { name: "Cross-Modal Narrative Linking accuracy", unit: "%" },
  },
  stats: {
    meteor: { name: "METEOR", unit: "score" }, cider: { name: "CIDEr", unit: "score" },
    gpt: { name: "GPT judge", unit: "score" }, offByOne: { name: "Off-by-one accuracy", unit: "%" },
    coherence: { name: "Human-judged coherence", unit: "score" },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const summary = tables.find(t => t[0].includes("Agentic w/ RAFT") && t[1]?.[1]?.startsWith("BLEU"));
    const speaker = tables.find(t => t[0][1]?.startsWith("AV Speaker Association"));
    const temporal = tables.find(t => t[0][1] === "Speaker Temporal Grounding");
    if (!summary || !speaker || !temporal || !speaker[0][9]?.startsWith("Speaker Re-identification") ||
        !temporal[1][13]?.startsWith("Human-Judged Coherence")) throw new Error("Missing AMusE task columns");
    const rows: LeaderboardRow[] = [];
    for (const [model, ...cells] of summary.slice(2)) {
      if (["Human", "Random"].includes(model) || cells[0] === model) continue;
      const a = speaker.find(r => r[0] === model);
      const b = temporal.find(r => r[0] === model);
      if (!a || !b) throw new Error("Missing AMusE model");
      for (let k = 0; k < 4; k++) {
        const setting = summary[0][1 + 4*k];
        if (cells[4*k] === "–") continue;
        const metrics: Record<string, number> = {
          bleu: Number(cells[4*k]), meteor: Number(cells[4*k+1]), cider: Number(cells[4*k+2]),
          association: Number(a[1+k]), next: Number(a[5+k]), identification: Number(a[9+k]),
          grounding: Number(b[1+k]), offByOne: Number(b[5+k]), linking: Number(b[9+k]), coherence: Number(b[13+k]),
        };
        if (cells[4*k+3] !== "–") metrics.gpt = Number(cells[4*k+3]);
        if (!Object.values(metrics).every(Number.isFinite)) throw new Error("Invalid AMusE task score");
        rows.push({ model, setting, score: metrics.bleu, metrics });
      }
    }
    return checked(rows, 33);
  },
};
export default board;
