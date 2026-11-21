// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// SHROOM-Visions evaluates hallucinated spans in image descriptions. The official standings list Cor+Lbl first.
// Model identities come from the organizers' Table 2 and the teams' system papers at https://aclanthology.org/volumes/2026.uncertainlp-main/.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/Helsinki-NLP/shroom/main/2026.md';
const languages = { EN: 'English', FR: 'French', IT: 'Italian', ZH: 'Chinese' };
const systems: Record<string, string[]> = {
  'TÜRKSAT': ['Gemini 3.5 Flash'], 'vroom-vroom': ['Gemma 4', 'Mistral-Small', 'Qwen3-VL', 'Qwen3.6'],
  dynamos: ['Qwen2.5-VL 7B', 'Qwen2.5-VL 32B'], champ: ['Qwen 3.5 27B'],
  'eye-be-am': ['Qwen3.5-VL 4B', 'Qwen3.5-VL-397B'], SmurfCat: ['Qwen3-VL-8B-Instruct'],
  'Bit-by-bit': ['Qwen2.5-VL-7B-Instruct', 'InternVL3.5-8B'], caml: ['Qwen3.5-4B'],
  Sckwoky: ['Gemma-4-12B-it'], HalluVision: ['Qwen2.5-VL-3B-Instruct'], 'CPS Lab': ['Qwen3-VL-8B-Instruct'],
  SIT: ['SpanCalib-VLM'], L1cache: ['MycoGate-VL'], WINNAR749: ['Qwen2.5-VL-3B-Instruct'],
  DSR: ['XLM-RoBERTa', 'SigLIP'], Scalar_Nitk: ['mDeBERTa', 'SigLIP'],
  USP: ['XLM-RoBERTa-large', 'Qwen2-VL-2B-Instruct'],
};
const board: Leaderboard = {
  benchmark: 'shroom-visions-2026', feed, url: 'https://helsinki-nlp.github.io/shroom/2026.html#final-leaderboard',
  terms: 'Organizers publish the standings under the GitHub Terms of Service, https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  aliases: { 'Qwen3.5-VL 4B': 'qwen3-5-4b', 'Qwen3.5-VL-397B': 'qwen3-5-397b-a17b' },
  parts: languages, harnesses: 'system',
  stats: {
    ENCor: {name: 'English correlation', unit: 'score', better: 'higher'}, ENIoU: {name: 'English IoU', unit: 'score', better: 'higher'},
    FRCor: {name: 'French correlation', unit: 'score', better: 'higher'}, FRIoU: {name: 'French IoU', unit: 'score', better: 'higher'},
    ITCor: {name: 'Italian correlation', unit: 'score', better: 'higher'}, ITIoU: {name: 'Italian IoU', unit: 'score', better: 'higher'},
    ZHCor: {name: 'Chinese correlation', unit: 'score', better: 'higher'}, ZHIoU: {name: 'Chinese IoU', unit: 'score', better: 'higher'},
  },
  headline: 'The organizers report no overall score, so this is the plain mean of labeled correlation across four languages.',
  async fetch() {
    const text = (await fetchText(feed)).split('### Final Leaderboard')[1];
    if (!text) throw new Error('Final standings missing');
    const scores = new Map<string, Record<string, number>>();
    for (const lang of Object.keys(languages)) {
      const section = text.split('##### ' + lang + '\n')[1]?.split(/\n#+ /)[0];
      for (const metric of ['Cor+Lbl', 'Cor', 'IoU']) {
        const line = section?.split('\n').find(line => line.startsWith('| **' + metric + '** |'));
        if (!line) throw new Error('Missing ' + lang + ' ' + metric);
        for (const cell of line.trim().split('|').slice(2, -1)) {
          const match = /^\s*(.+?) \(([\d.]+)\)\s*$/.exec(cell);
          if (!match) throw new Error('Invalid ranking cell: ' + cell);
          const [, team, value] = match;
          const metrics = scores.get(team) ?? {};
          metrics[metric === 'Cor+Lbl' ? lang : lang + metric] = Number(value);
          scores.set(team, metrics);
        }
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [team, models] of Object.entries(systems)) {
      const metrics = scores.get(team);
      if (!metrics || !Object.keys(languages).every(k => Number.isFinite(metrics[k]))) continue;
      rows.push({ model: models[0], models: models.length > 1 ? models : undefined, harness: team,
        submitter: team, score: (metrics.EN + metrics.FR + metrics.IT + metrics.ZH) / 4, metrics });
    }
    return checked(rows, 17);
  },
};
export default board;
