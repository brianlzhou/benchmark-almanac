// Co-Design Bench official leaderboard from codesignbench.github.io/data/site-data.json.
// Every model is evaluated inside the benchmark's reference Claude Code harness across ME and RE tracks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const URL = 'https://codesignbench.github.io/#leaderboard';
const FEED = 'https://codesignbench.github.io/data/site-data.json';

interface TrackMetrics {
  strict?: number;
  graded?: number;
  full?: number;
  turns?: number;
  tokensM?: number;
}

interface SiteData {
  models: { id: string; name?: string }[];
  overall: Record<string, { strict: number; graded?: number; full?: number }>;
  me: Record<string, TrackMetrics>;
  re: Record<string, TrackMetrics>;
  groups: { id: string; values: Record<string, number> }[];
}

const GROUP_MAP: Record<string, string> = {
  'cap-grounded-understanding': 'capGroundedUnderstanding',
  'cap-visual-understanding': 'capVisualUnderstanding',
  'cap-audio-temporal-understanding': 'capAudioTemporalUnderstanding',
  'cap-evidence-integration': 'capEvidenceIntegration',
  'cap-ui-transformation': 'capUiTransformation',
  'cap-content-assets': 'capContentAssets',
  'cap-style-layout': 'capStyleLayout',
  'cap-motion-adaptation': 'capMotionAdaptation',
  'cap-functional-implementation': 'capFunctionalImplementation',
  'cap-interaction-behaviors': 'capInteractionBehaviors',
  'cap-data-logic': 'capDataLogic',
  'cap-engineering-integration': 'capEngineeringIntegration',
  'mod-none': 'modNone',
  'mod-image': 'modImage',
  'mod-video': 'modVideo',
  'mod-audio': 'modAudio',
  'mod-document': 'modDocument',
  'breadth-b12': 'breadthB12',
  'breadth-b34': 'breadthB34',
};

const pct = { unit: '%' as const, better: 'higher' as const };

const board: Leaderboard = {
  benchmark: 'co-design-bench',
  static: 'paper',
  url: URL,
  feed: FEED,
  terms: 'The authors publish the benchmark and its results at https://github.com/Wiselnn570/Co-Design-Bench',
  reference: ['Claude Code'],
  aliases: {
    'opus-4-8': 'claude-opus-4-8',
    'opus-5': 'claude-opus-5',
    'qwen3.8-27b': 'qwen-3-8-27b',
  },
  parts: {
    graded: { name: 'Graded completion' },
    full: { name: 'Full pass' },
  },
  stats: {
    mestrict: { name: 'ME strict completion', ...pct },
    megraded: { name: 'ME graded completion', ...pct },
    mefull: { name: 'ME full-pass rate', ...pct },
    meTurns: { name: 'ME turns', unit: 'count', better: 'lower' },
    meTokens: { name: 'ME tokens', unit: 'tokens', better: 'lower' },
    restrict: { name: 'RE strict completion', ...pct },
    regraded: { name: 'RE graded completion', ...pct },
    refull: { name: 'RE full-pass rate', ...pct },
    reTurns: { name: 'RE turns', unit: 'count', better: 'lower' },
    reTokens: { name: 'RE tokens', unit: 'tokens', better: 'lower' },
    capGroundedUnderstanding: { name: 'Grounded Understanding completion', ...pct },
    capVisualUnderstanding: { name: 'Visual Understanding completion', ...pct },
    capAudioTemporalUnderstanding: { name: 'Audio Temporal Understanding completion', ...pct },
    capEvidenceIntegration: { name: 'Evidence Integration completion', ...pct },
    capUiTransformation: { name: 'UI Transformation completion', ...pct },
    capContentAssets: { name: 'Content Assets completion', ...pct },
    capStyleLayout: { name: 'Style and Layout completion', ...pct },
    capMotionAdaptation: { name: 'Motion Adaptation completion', ...pct },
    capFunctionalImplementation: { name: 'Functional Implementation completion', ...pct },
    capInteractionBehaviors: { name: 'Interaction Behaviors completion', ...pct },
    capDataLogic: { name: 'Data Logic completion', ...pct },
    capEngineeringIntegration: { name: 'Engineering Integration completion', ...pct },
    modNone: { name: 'No-attachment completion', ...pct },
    modImage: { name: 'Image-attachment completion', ...pct },
    modVideo: { name: 'Video-attachment completion', ...pct },
    modAudio: { name: 'Audio-attachment completion', ...pct },
    modDocument: { name: 'Document-attachment completion', ...pct },
    breadthB12: { name: 'One or two edit types completion', ...pct },
    breadthB34: { name: 'Three or four edit types completion', ...pct },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<SiteData>(FEED);
    if (!Array.isArray(data.models) || !data.overall) {
      throw new Error('Unexpected Co-Design Bench site-data.json payload');
    }

    const groupById = new Map((data.groups ?? []).map((g) => [g.id, g.values]));
    const rows: LeaderboardRow[] = [];

    for (const m of data.models) {
      const ov = data.overall[m.id];
      if (!ov || !Number.isFinite(ov.strict)) continue;

      const metrics: Record<string, number> = {};
      if (typeof ov.graded === 'number' && Number.isFinite(ov.graded)) {
        metrics.graded = Number((ov.graded * 100).toFixed(1));
      }
      if (typeof ov.full === 'number' && Number.isFinite(ov.full)) {
        metrics.full = ov.full;
      }

      const addTrack = (prefix: 'me' | 're', track: TrackMetrics | undefined) => {
        if (!track) return;
        if (typeof track.strict === 'number') metrics[`${prefix}strict`] = Number((track.strict * 100).toFixed(1));
        if (typeof track.graded === 'number') metrics[`${prefix}graded`] = Number((track.graded * 100).toFixed(1));
        if (typeof track.full === 'number') metrics[`${prefix}full`] = track.full;
        if (typeof track.turns === 'number') metrics[`${prefix}Turns`] = track.turns;
        if (typeof track.tokensM === 'number') metrics[`${prefix}Tokens`] = Math.round(track.tokensM * 1e6);
      };
      addTrack('me', data.me?.[m.id]);
      addTrack('re', data.re?.[m.id]);

      for (const [groupId, key] of Object.entries(GROUP_MAP)) {
        const val = groupById.get(groupId)?.[m.id];
        if (typeof val === 'number' && Number.isFinite(val)) {
          metrics[key] = val;
        }
      }

      rows.push({
        model: m.name || m.id,
        harness: 'Claude Code',
        score: Number((ov.strict * 100).toFixed(1)),
        metrics,
      });
    }

    if (rows.length < 10) {
      throw new Error(`Expected at least 10 rows from Co-Design Bench site-data.json, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
