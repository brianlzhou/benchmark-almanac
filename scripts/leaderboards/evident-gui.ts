// EVIDENT evaluates GUI and web agent trajectories for evidence-grounded success on English and Korean tasks.
// The Hugging Face dataset card publishes the paper's Table 2 Overall results alongside each agent's backbone model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://huggingface.co/datasets/KORMo-VL/EVIDENT/raw/main/README.md';

const board: Leaderboard = {
  benchmark: 'evident-gui',
  static: 'paper',
  url: 'https://huggingface.co/datasets/KORMo-VL/EVIDENT',
  feed,
  terms: 'Dataset card in KORMo-VL/EVIDENT on Hugging Face reproducing Table 2 of arXiv:2611.20488.',
  headline: 'The paper reports English and Korean Grounded Success Rate side by side without pooling. The headline is the plain mean of English GSR and Korean GSR.',
  aliases: {
    'gemini-3-flash-preview': 'gemini-3-flash',
    'allenai/MolmoWeb-8B-Native': 'molmoweb-8b',
    'microsoft/Fara-7B': 'fara-7b',
    'ByteDance-Seed/UI-TARS-1.5-7B': 'ui-tars-1-5',
  },
  parts: {
    enGsr: { name: 'English GSR', group: 'Language', note: 'Grounded Success Rate on the 70 English web agent tasks.' },
    koGsr: { name: 'Korean GSR', group: 'Language', note: 'Grounded Success Rate on the 150 Korean web agent tasks.' },
  },
  stats: {
    enTsr: { name: 'English TSR', unit: '%', better: 'higher', note: 'Task Success Rate on English tasks before checking evidence grounding.' },
    enEsr: { name: 'English ESR', unit: '%', better: 'higher', note: 'Evidence Success Rate on English tasks.' },
    koTsr: { name: 'Korean TSR', unit: '%', better: 'higher', note: 'Task Success Rate on Korean tasks before checking evidence grounding.' },
    koEsr: { name: 'Korean ESR', unit: '%', better: 'higher', note: 'Evidence Success Rate on Korean tasks.' },
  },
  async fetch() {
    const md = await fetchText(feed);
    const lines = md.split(/\r?\n/);
    const start = lines.findIndex((l) => /\|\s*Model\s*\|\s*Backbone\s*\|\s*EN TSR\s*\|/i.test(l));
    if (start < 0) throw new Error('Missing EVIDENT overall results table in README');
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(start + 2)) {
      if (!line.trim().startsWith('|')) break;
      const cells = line.split('|').slice(1, -1).map((c) => c.replace(/\*\*/g, '').trim());
      if (cells.length < 8) continue;
      const [agentName, backbone, enTsrS, enEsrS, enGsrS, koTsrS, koEsrS, koGsrS] = cells;
      const enTsr = Number(enTsrS);
      const enEsr = Number(enEsrS);
      const enGsr = Number(enGsrS);
      const koTsr = Number(koTsrS);
      const koEsr = Number(koEsrS);
      const koGsr = Number(koGsrS);
      if (!Number.isFinite(enGsr) || !Number.isFinite(koGsr)) continue;
      const row: LeaderboardRow = {
        model: backbone,
        score: Number(((enGsr + koGsr) / 2).toFixed(2)),
        metrics: { enGsr, koGsr, enTsr, enEsr, koTsr, koEsr },
      };
      if (agentName && agentName !== backbone && /CUA$/.test(agentName)) row.harness = agentName;
      rows.push(row);
    }
    if (rows.length < 6) throw new Error(`Expected at least 6 EVIDENT rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
