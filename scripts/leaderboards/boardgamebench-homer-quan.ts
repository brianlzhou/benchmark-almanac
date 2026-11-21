// Homer Quan ranks models across seven board games. The README gives the BoardGame Rating Index and game outcomes for local and hosted runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/homerquan/BoardGameBench/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "boardgamebench-homer-quan",
  url: "https://github.com/homerquan/BoardGameBench#benchmark-results",
  feed,
  terms: "The repository uses the MIT License. https://github.com/homerquan/BoardGameBench/blob/main/LICENSE The feed host returns no robots.txt.",
  stats: {
    games: { name: 'Games played', unit: 'count' },
    wins: { name: 'Wins', unit: 'count' },
    losses: { name: 'Losses', unit: 'count' },
    forfeits: { name: 'Forfeits', unit: 'count' },
    raw: { name: 'Raw score', unit: 'score', better: 'higher' },
    normalized: { name: 'Normalized score', unit: 'score', better: 'higher' },
  },
  aliases: {"Muse Glimmer 30B NVFP4 + DFlash on Spark": "muse-glimmer", "Inkling Small (Free)": "inkling-small", "LFM 2.5 2.6B (Free)": "lfm2-5-2-6b", "Nemotron 3 Super (Ollama)": "nemotron-3-super"},
  async fetch() {
    const result = (await fetchText(feed)).split('## Benchmark Results')[1]?.split('## Quick Start')[0];
    if (!result) throw new Error('Missing benchmark results');
    const rows: LeaderboardRow[] = [];
    const sections = result.split('OpenRouter free-tier results');
    for (const [i, section] of sections.entries()) {
      const [table] = markdownTables(section);
      if (table?.[0]?.join('|') !== 'Model|Games|Wins|Losses|Draws|Forfeits|Raw Score|Normalized|BRI') throw new Error('Unexpected results columns');
      for (const [model, games, wins, losses, draws, forfeits, raw, normalized, bri] of table.slice(1)) {
        const metrics = { games: +games, wins: +wins, losses: +losses, draws: +draws, forfeits: +forfeits, raw: parseFloat(raw), normalized: +normalized };
        if (!model || !bri || ![+bri, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid board game result');
        rows.push({ model, score: +bri, setting: i ? 'OpenRouter free tier' : 'Ollama', date: i ? section.match(/\d{4}\.\d{2}\.\d{2}/)?.[0].replaceAll('.', '-') : undefined, metrics });
      }
    }
    if (rows.length < 6) throw new Error('Missing board game models');
    return rows;
  },
};
export default board;
