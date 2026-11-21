// AgReason evaluates agricultural reasoning across ten question categories.
// The leaderboard converts its embedded overall and category fractions to percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://baskargroup.github.io/Ag_reasoning/";

const board: Leaderboard = {
  benchmark: "agreason",
  url: "https://baskargroup.github.io/Ag_reasoning/#leaderboard-section",
  feed,
  terms: "The project page credits CC BY-SA 4.0 and embeds the score table in its HTML. https://baskargroup.github.io/Ag_reasoning/ Robots.txt allows the project page.",
  aliases: { gpto1: 'o1', 'LLaMA‑4 Maverick': 'llama-4-maverick', 'LLaMA‑4 Scout': 'llama-4-scout' },
  parts: {
    "AbioticHarvestQs": "Abiotic Harvest Qs",
    "PlantSeedHealthQs": "Plant & Seed Health Qs",
    "AbioticSoilQs": "Abiotic Soil Qs",
    "AbioticWeatherQs": "Abiotic Weather Qs",
    "BioticDiseasesQs": "Biotic Diseases Qs",
    "BioticInsectsQs": "Biotic Insects Qs",
    "BioticWeedsQs": "Biotic Weeds Qs",
    "CoverCropQs": "Cover Crop Qs",
    "CropManagementQs": "Crop Management Qs",
    "CropInputsQs": "Crop Inputs Qs"
},
  async fetch() {
    const html = await fetchText(feed);
    const { data } = jsonAfter<{ data: ({ model: string; Overall: number } & Record<string, unknown>)[] }>(html, 'const tableData =');
    if (data.length < 23) throw new Error('Missing AgReason models');
    return data.map(entry => {
      if (!entry.model || !Number.isFinite(entry.Overall)) throw new Error('Invalid AgReason overall score');
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(board.parts!)) {
        const value = entry[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid AgReason category ' + key);
        metrics[key] = value * 100;
      }
      return { model: entry.model.replace(/\s+/g, ' '), score: entry.Overall * 100, metrics };
    });
  },
};

export default board;
