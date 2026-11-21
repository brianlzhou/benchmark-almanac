// NavAI reports word error rate for the Uzbek Speech Corpus in the USC column. The all-architectures README identifies training overlap and single-pass decoding.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/NavAI-pro/uzbek-text-norm/main/LEADERBOARD_ALL.md";


const board: Leaderboard = {
  benchmark: "uzbek-speech-corpus",
  url: "https://github.com/NavAI-pro/uzbek-text-norm/blob/main/LEADERBOARD_ALL.md",
  feed,
  terms: "Read the USC column. The repository includes an MIT license. Retain the model-specific training overlap and decoding notes. https://github.com/NavAI-pro/uzbek-text-norm/blob/main/LICENSE The raw file host serves no robots.txt rules.",
  host:'NavAI',
  async fetch() {
    const source = await fetchText(feed);
    const columns = ["System", "USC"];
    const all = markdownTables(source);
    const table = all.find(t => columns.every(c => t[0]?.includes(c)));
    if (!table) throw new Error("Missing leaderboard columns");
    const records = table.slice(1).map(cells => Object.fromEntries(table[0].map((k,i) => [k,cells[i]])));
    
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const numeric = (key: string) => {
        const text = r[key]?.trim().replace(/[%,$]/g, '');
        if (!text || !Number.isFinite(Number(text))) throw new Error('Invalid ' + key + ' for ' + r["System"]);
        return Number(text);
      };
      const label=r.System;
      const setting=[label.includes('‖')?'Single-pass decoding':undefined,
        label.includes('⚠')?'FLEURS test data in training, USC train-only':undefined,
        label.includes('❓')?'Training data not disclosed':undefined].filter(Boolean).join(' / ');
      const row: LeaderboardRow = { model: label.replace(/[★⚠️❓‖]/gu,'').trim(), setting:setting || undefined, harness:'uzbek_text_norm v0.3.0 (greedy)', score: numeric("USC") };
      if (!row.model || !Number.isFinite(row.score)) throw new Error('Missing model or score');
      rows.push(row);
    }
    if (rows.length < 34) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
