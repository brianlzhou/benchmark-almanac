// AIRIS: 45-VLM social embodied intelligence leaderboard over egocentric streaming videos (0 to 1 scale).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://airis-bench.github.io/data.js';

interface AirisEntry {
  name: string;
  category: string;
  url?: string;
  overall: number;
  att: {
    all: number;
    nonverbal: number;
    target: number;
    ground: number;
    spatial: number;
    joint: number;
    multimodal: number;
  };
  int: {
    all: number;
    key: number;
    online: number;
    evidence: number;
    fcr: number;
    ias: number;
  };
  rea: {
    all: number;
    engage: number;
    domain: number;
    subspeak: number;
    joint: number;
    comm: number;
    nav: number;
    manip: number;
    idle: number;
  };
  inter: {
    all: number;
    state: number;
    outcome: number;
    comp: number;
    viol: number;
  };
}

function extractAssignedJsonArray(js: string, varName: string): unknown[] {
  const marker = `${varName}`;
  const pos = js.indexOf(marker);
  if (pos === -1) throw new Error(`Missing ${varName} in AIRIS data.js`);
  const start = js.indexOf('[', pos + marker.length);
  if (start === -1) throw new Error(`Missing array start for ${varName}`);
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < js.length; i++) {
    const ch = js[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        return JSON.parse(js.slice(start, i + 1)) as unknown[];
      }
    }
  }
  throw new Error(`Unterminated array for ${varName}`);
}

const board: Leaderboard = {
  benchmark: 'airis',
  url: 'https://airis-bench.github.io/#leaderboard',
  feed: FEED,
  terms: 'Public leaderboard data published by Tencent Robotics X Lab on the AIRIS project site.',
  parts: {
    attAll: { name: 'Attention overall', group: 'Stage' },
    intAll: { name: 'Intention overall', group: 'Stage' },
    reaAll: { name: 'Reaction overall', group: 'Stage' },
    interAll: { name: 'Interaction overall', group: 'Stage' },
    attNonverbal: { name: 'Nonverbal state', group: 'Attention' },
    attTarget: { name: 'Semantic target', group: 'Attention' },
    attGround: { name: 'Attention grounding', group: 'Attention' },
    attSpatial: { name: 'Spatial localization', group: 'Attention' },
    attJoint: { name: 'Joint identification and localization', group: 'Attention' },
    attMultimodal: { name: 'Multimodal attribution', group: 'Attention' },
    intKey: { name: 'Key moment', group: 'Intention' },
    intOnline: { name: 'Online prefix', group: 'Intention' },
    intEvidence: { name: 'Evidence grounding', group: 'Intention' },
    intIas: { name: 'Intention anticipation score', group: 'Intention' },
    reaEngage: { name: 'Engage F1', group: 'Reaction' },
    reaDomain: { name: 'Action domain', group: 'Reaction' },
    reaSubspeak: { name: 'Subaction and speech', group: 'Reaction' },
    reaJoint: { name: 'Joint exact match', group: 'Reaction' },
    reaComm: { name: 'Communication', group: 'Reaction' },
    reaNav: { name: 'Navigation', group: 'Reaction' },
    reaManip: { name: 'Manipulation', group: 'Reaction' },
    reaIdle: { name: 'Refrain and idle', group: 'Reaction' },
    interState: { name: 'Online state', group: 'Interaction' },
    interOutcome: { name: 'Task outcome', group: 'Interaction' },
    interComp: { name: 'Completion', group: 'Interaction' },
    interViol: { name: 'Social norm violation detection', group: 'Interaction' },
  },
  stats: {
    intFcr: {
      name: 'Pre-T1 false commitment rate',
      unit: 'score',
      better: 'lower',
      note: 'Premature intention commitment rate before the earliest decidable moment T1.',
    },
  },

  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const entries = extractAssignedJsonArray(js, 'window.AIRIS_LEADERBOARD') as AirisEntry[];
    if (entries.length < 30) throw new Error(`Expected AIRIS models, got ${entries.length}`);

    return entries
      .filter((m) => Boolean(m.name) && Number.isFinite(m.overall))
      .map((m) => {
        const metrics: Record<string, number> = {};
        const pairs: [string, number | undefined][] = [
          ['attAll', m.att?.all],
          ['intAll', m.int?.all],
          ['reaAll', m.rea?.all],
          ['interAll', m.inter?.all],
          ['attNonverbal', m.att?.nonverbal],
          ['attTarget', m.att?.target],
          ['attGround', m.att?.ground],
          ['attSpatial', m.att?.spatial],
          ['attJoint', m.att?.joint],
          ['attMultimodal', m.att?.multimodal],
          ['intKey', m.int?.key],
          ['intOnline', m.int?.online],
          ['intEvidence', m.int?.evidence],
          ['intFcr', m.int?.fcr],
          ['intIas', m.int?.ias],
          ['reaEngage', m.rea?.engage],
          ['reaDomain', m.rea?.domain],
          ['reaSubspeak', m.rea?.subspeak],
          ['reaJoint', m.rea?.joint],
          ['reaComm', m.rea?.comm],
          ['reaNav', m.rea?.nav],
          ['reaManip', m.rea?.manip],
          ['reaIdle', m.rea?.idle],
          ['interState', m.inter?.state],
          ['interOutcome', m.inter?.outcome],
          ['interComp', m.inter?.comp],
          ['interViol', m.inter?.viol],
        ];
        for (const [k, v] of pairs) {
          if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
        }
        return {
          model: m.name.trim(),
          score: m.overall,
          open: m.category !== 'closed',
          link: typeof m.url === 'string' && m.url.startsWith('http') ? m.url : undefined,
          metrics,
        };
      });
  },
};

export default board;
