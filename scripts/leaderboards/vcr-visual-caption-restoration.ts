// VCR (Visual Caption Restoration) on the OpenCompass VLM leaderboard, which the almanac links as its board.
// The VCR authors supplied the runs (the Space credits them) on 500-sample subsets of each track. The
// Space's VCR tab sorts by "Overall-Jaccard", the Jaccard similarity over the English and Chinese, easy and
// hard tracks (0 to 100), so that is the score. Read through openvlmRows in openvlm-leaderboard.ts.
import type { Leaderboard } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_TERMS, OPENVLM_URL, openvlmRows } from './openvlm-leaderboard.ts';

const VCR_METRICS = [
  ['enEasy', 'EN_EASY-Jaccard'],
  ['enHard', 'EN_HARD-Jaccard'],
  ['zhEasy', 'ZH_EASY-Jaccard'],
  ['zhHard', 'ZH_HARD-Jaccard'],
  ['overallEm', 'Overall-EM'],
  ['enEasyEm', 'EN_EASY-EM'],
  ['enHardEm', 'EN_HARD-EM'],
  ['zhEasyEm', 'ZH_EASY-EM'],
  ['zhHardEm', 'ZH_HARD-EM'],
] as const;

const board: Leaderboard = {
  benchmark: 'vcr-visual-caption-restoration',
  parts: {
    enEasy: { name: 'English easy', group: 'Track' },
    enHard: { name: 'English hard', group: 'Track' },
    zhEasy: { name: 'Chinese easy', group: 'Track' },
    zhHard: { name: 'Chinese hard', group: 'Track' },
  },
  stats: {
    overallEm: { name: 'Overall exact match', unit: '%', better: 'higher' },
    enEasyEm: { name: 'English easy exact match', unit: '%', better: 'higher' },
    enHardEm: { name: 'English hard exact match', unit: '%', better: 'higher' },
    zhEasyEm: { name: 'Chinese easy exact match', unit: '%', better: 'higher' },
    zhHardEm: { name: 'Chinese hard exact match', unit: '%', better: 'higher' },
  },
  verified: 'marked verified by OpenCompass',
  url: OPENVLM_URL,
  feed: `${OPENVLM_FEED} (VCR.Overall-Jaccard)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openvlmRows(
    (e) => e.VCR?.['Overall-Jaccard'],
    (e) => {
      const m: Record<string, number> = {};
      for (const [key, field] of VCR_METRICS) {
        const v = e.VCR?.[field];
        if (typeof v === 'number' && Number.isFinite(v)) m[key] = v;
      }
      return m;
    },
  ),
};
export default board;
