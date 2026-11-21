// Lech Mazur ranks models by the average movement toward the persuader's assigned side. The README reports persuasion strength and susceptibility in two tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/persuasion/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "persuasion-lech-mazur",
  url: "https://github.com/lechmazur/persuasion",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/persuasion. I could not verify reuse terms. The raw file host has no robots.txt.",
  async fetch() {
    const all = markdownTables(await fetchText(feed));
    const scores = all.find(t => t[0]?.[2] === 'Average Persuasion Strength');
    const targets = all.find(t => t[0]?.[2] === 'Target Susceptibility');
    if (!scores || scores.length < 16 || !targets) throw new Error('Missing persuasion tables');
    return scores.slice(1).map(([, label, value]) => {
      const other = targets.find(r => r[1] === label)?.[2];
      const setting = label.match(/ \(([^)]+reasoning|Reasoning)\)$/i)?.[1];
      if (!label || !value || !other || ![value, other].every(v => Number.isFinite(Number(v)))) throw new Error('Incomplete persuasion row');
      return { model: setting ? label.slice(0, -(setting.length + 3)) : label, setting, score: Number(value), metrics: { susceptibility: Number(other) } };
    });
  },
};

export default board;
