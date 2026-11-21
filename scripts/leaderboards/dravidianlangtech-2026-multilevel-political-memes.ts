// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Teams classify the stance and target of political memes. Tables 6 and 7 rank teams by average macro F1.
// Table 5 identifies the named model components that competed in both languages.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.dravidianlangtech-1.12.pdf';
const teams: Record<string, string[]> = {
  'CUET-2567': ['mBERT', 'ViT (patch16-224)'], Cyberpunk: ['OpenCLIP'], IndiLangTech: ['Gemma 3 4B'],
  Meme_Alchemists: ['MuRIL', 'CLIP ViT-B/32'], Memeocracy: ['XLM-RoBERTa', 'ConvNeXt-Tiny'],
  MindBridge: ['CLIP'], Semantica: ['Qwen2.5-VL-7B'], SJK: ['IndicBERT', 'VGG16'],
};
const board: Leaderboard = {
  benchmark: 'dravidianlangtech-2026-multilevel-political-memes', url: feed, feed, harnesses: 'system',
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  stats: { malayalamStanceF1: { name: 'Malayalam stance F1', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' }, malayalamTargetF1: { name: 'Malayalam target F1', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' }, tamilStanceF1: { name: 'Tamil stance F1', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' }, tamilTargetF1: { name: 'Tamil target F1', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' } },
  parts: { tamil: 'Tamil', malayalam: 'Malayalam' },
  async fetch() {
    const paper = await pdfText(feed);
    const sections = ['Tamil', 'Malayalam'].map(language => {
      const before = paper.split('Results for the ' + language + ' sub-task. Systems ranked')[0];
      const start = before.lastIndexOf('Avg-F1 Rank');
      if (start < 0 || before === paper) throw new Error('Missing ' + language + ' results');
      return before.slice(start).split('\n');
    });
    const rows = Object.entries(teams).map(([team, models]) => {
      const metrics: Record<string, number> = {};
      for (const [i, lang] of ['tamil', 'malayalam'].entries()) {
        const row = sections[i].find(line => line.trim().split(/\s+/)[0] === team);
        const cells = row?.match(/\b[01]\.\d{4}\b/g)?.map(Number);
        if (cells?.length !== 9) throw new Error('Missing score for ' + team + ' in ' + lang);
        metrics[lang] = cells[8];
        metrics[lang + 'StanceF1'] = cells[3];
        metrics[lang + 'TargetF1'] = cells[7];
      }
      return { model: models[0], ...(models.length > 1 ? { models } : {}), submitter: team, harness: team,
        score: (metrics.tamil + metrics.malayalam) / 2, metrics };
    });
    return checked(rows, 8);
  },
};
export default board;
