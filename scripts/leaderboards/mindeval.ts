// MindEval scores simulated therapy conversations. The page data includes the overall score and five clinical criteria.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const FEED = "https://mheval.slingshotai.com/mindeval/";
const board: Leaderboard = {
  benchmark: "mindeval",
  url: FEED,
  feed: FEED,
  terms: "The results repository uses the MIT license. The original authors retain rights to their benchmark materials. https://github.com/slingshot-ai/mheval-leaderboard/blob/main/README.md#license The host has no published robots directives at /robots.txt.",
  parts: {"clinical_accuracy_and_competence":"Clinical accuracy","ethical_and_professional_conduct":"Professional conduct","assessment_and_response":"Assessment and response","therapeutic_relationship_and_alliance":"Therapeutic alliance","ai_specific_communication_quality":"AI communication"},
  async fetch() {
    interface Entry {
      displayName: string; access: string; scores: { mindeval?: number };
      settings: { mindeval?: Record<string, string> }; views: { mindeval?: Record<string, number>[] };
    }
    const models = jsonAfter<Entry[]>(nextFlight(await fetchText(FEED)), '"models":');
    const rows = models.filter(m => m.scores.mindeval != null).map(m => {
      const score = m.scores.mindeval!;
      const metrics = Object.assign({}, ...(m.views.mindeval ?? []));
      if (!m.displayName || !Number.isFinite(score) || Object.keys(board.parts!).some(key => !Number.isFinite(metrics[key]))) throw new Error('Incomplete MindEval result');
      return { model: m.displayName, score, open: m.access === 'open-weights', metrics,
        setting: Object.entries(m.settings.mindeval ?? {}).map(([k,v]) => k.replaceAll('_',' ') + ' ' + v).join(', ') || undefined };
    });
    if (rows.length < 10) throw new Error('Missing MindEval scores');
    return rows;
  },
};
export default board;
