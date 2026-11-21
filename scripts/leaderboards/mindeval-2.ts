// MindEval 2 ranks models by the severity of clinical issues over three simulated counseling sessions. Read the headline score and breakdowns from the page data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const FEED = "https://mheval.slingshotai.com/mindeval2/";
const board: Leaderboard = {
  benchmark: "mindeval-2",
  url: "https://mheval.slingshotai.com/mindeval2/",
  feed: FEED,
  terms: "The results repository uses the MIT license. The original authors retain rights to their benchmark materials. https://github.com/slingshot-ai/mheval-leaderboard/blob/main/README.md#license The host has no published robots directives at /robots.txt.",
  parts: {
  "no_concern": {
    "name": "No concern",
    "group": "Share of replies by severity",
    "unit": "score"
  },
  "minor": {
    "name": "Minor",
    "group": "Share of replies by severity",
    "unit": "score"
  },
  "major": {
    "name": "Major",
    "group": "Share of replies by severity",
    "unit": "score"
  },
  "critical": {
    "name": "Critical",
    "group": "Share of replies by severity",
    "unit": "score"
  },
  "under_guiding": {
    "name": "Under-guiding",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "over_exploring": {
    "name": "Over-exploring",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "formulaic_responding": {
    "name": "Formulaic",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "missed_shared_context": {
    "name": "Missed shared context",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "overstatement": {
    "name": "Overstatement",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "uncritical_endorsement": {
    "name": "Uncritical endorsement",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "anthropomorphizing": {
    "name": "Anthropomorphizing",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "treating_perspective_as_fact": {
    "name": "Perspective as fact",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "gives_bad_advice": {
    "name": "Bad advice",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "false_memory": {
    "name": "False memory",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "false_fact": {
    "name": "False fact",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "excessive_verbosity": {
    "name": "Verbosity",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "out_of_scope_responding": {
    "name": "Out of scope",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "other": {
    "name": "Other",
    "group": "Share of replies flagged per issue",
    "unit": "score",
    "better": "lower"
  },
  "ep000": {
    "name": "Session 1",
    "group": "MHQR by session",
    "unit": "score",
    "better": "lower"
  },
  "ep001": {
    "name": "Session 2",
    "group": "MHQR by session",
    "unit": "score",
    "better": "lower"
  },
  "ep002": {
    "name": "Session 3",
    "group": "MHQR by session",
    "unit": "score",
    "better": "lower"
  }
},
  async fetch() {
    interface Entry {
      displayName: string; access: string; scores: { mindeval2?: number };
      settings: { mindeval2?: Record<string, string> }; views: { mindeval2?: Record<string, number>[] };
    }
    const models = jsonAfter<Entry[]>(nextFlight(await fetchText(FEED)), '"models":');
    const rows = models.filter(m => m.scores.mindeval2 != null).map(m => {
      const score = m.scores.mindeval2!;
      const metrics = Object.assign({}, ...(m.views.mindeval2 ?? []));
      if (!m.displayName || !Number.isFinite(score) || Object.keys(board.parts!).some(key => !Number.isFinite(metrics[key]))) throw new Error('Incomplete MindEval 2 result');
      return { model: m.displayName, score, open: m.access === 'open-weights', metrics,
        setting: Object.entries(m.settings.mindeval2 ?? {}).map(([k,v]) => k.replaceAll('_',' ') + ' ' + v).join(', ') || undefined };
    });
    if (rows.length < 9) throw new Error('Missing MindEval 2 scores');
    return rows;
  },
};
export default board;
