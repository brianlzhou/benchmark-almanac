// SLURP measures intent recognition and entity prediction in spoken requests.
// Table 7 gives joint scenario and action accuracy. Table 8 gives the separate entity metrics.
// Each setting identifies the speech recognizer supplying the NLU model's transcripts.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2020.emnlp-main.588.pdf';
export default {
  benchmark: 'slurp', static: 'paper', url: 'https://aclanthology.org/2020.emnlp-main.588/', feed,
  terms: 'The ACL Anthology publishes the authors’ paper. https://aclanthology.org/2020.emnlp-main.588/',
  headline: 'The headline is joint scenario and action accuracy on spoken requests.',
  parts: Object.fromEntries(['Scenario accuracy', 'Action accuracy', 'Word F1', 'Character F1', 'SLU F1', 'Entity F1']
    .map((name, i) => ({ key: ['scenario', 'action', 'wordF1', 'charF1', 'sluF1', 'entityF1'][i], name, unit: '%' as const }))
    .map(({ key, ...part }) => [key, part])),
  async fetch() {
    const paper = await pdfText(feed);
    const intents = paper.match(/Scenario\s+Action\s+Scen Act([\s\S]*?)Table 7: System accuracy/)?.[1];
    const entities = paper.match(/Word-\s+Char-\s+SLU-\s+F1([\s\S]*?)Table 8: System performance/)?.[1];
    if (!intents || !entities) throw new Error('Missing SLURP intent or entity columns');
    const rows = [...entities.matchAll(/^\s*(Multi-SLURP|SLURP|Google|Multi)\/(HerMiT|SF-ID)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/gm)].map(match => {
      const [, setting, model, word, char, slu, entity] = match;
      const label = setting + '/' + model;
      const intent = [...intents.matchAll(/(?:^|\s)([\w-]+\/(?:HerMiT|SF-ID))\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/gm)]
        .find(m => m[1] === label);
      if (!intent) throw new Error('Missing intent scores for ' + label);
      return { model, setting: setting + ' ASR', score: Number(intent[4]),
        metrics: { scenario: Number(intent[2]), action: Number(intent[3]), wordF1: Number(word),
          charF1: Number(char), sluF1: Number(slu), entityF1: Number(entity) } };
    });
    return checked(rows, 6);
  },
} satisfies Leaderboard;
