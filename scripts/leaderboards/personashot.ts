// PersonaShot measures narrative continuity in video. The leaderboard embeds aggregate and criterion scores for two prompt settings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://rain152.github.io/PersonaShot/#leaderboard";
const parts = {
  vf: 'Visual Fidelity', tva: 'Text-Video Alignment', id: 'Identity', ss: 'Scene/Style', slc: 'Spatial Layout',
  osp: 'Object State Persistence', gsc: 'Geometric Scale', en: 'Expression Naturalness', fatc: 'Facial-Action Temporal Coherence',
  ena: 'Emotion-Narrative Alignment', eac: 'Emotional Arc', st: 'Shot Transition', tra: 'Transition Rhythm',
  r180: '180° Rule', em: 'Eyeline Match',
};
type Entry = Record<keyof typeof parts, number> & { method: string; aggr: number };

const board: Leaderboard = {
  benchmark: "personashot",
  url: "https://rain152.github.io/PersonaShot/#leaderboard",
  feed: FEED,
  terms: "The leaderboard page gives no separate reuse license. https://rain152.github.io/PersonaShot/#leaderboard",
  parts,
  async fetch() {
    const page = await fetchText(FEED);
    return ([['LB_SHOT', 'Shot-Level Prompt Conditioning', 9], ['LB_GLOBAL', 'Global-Prompt Conditioning', 3]] as const)
      .flatMap(([name, setting, minimum]) => {
        const source = page.split('const ' + name + ' = ')[1];
        if (!source?.startsWith('[')) throw new Error('Missing ' + name);
        const entries = jsLiteral<Entry[]>(source.replace(/:\s*\.(?=\d)/g, ':0.'), 0);
        if (entries.length < minimum) throw new Error('Incomplete ' + name);
        return entries.map(({ method, aggr, ...metrics }) => {
          if (!method || !Number.isFinite(aggr) || !Object.keys(parts).every(k => Number.isFinite(metrics[k as keyof typeof parts])))
            throw new Error('Missing PersonaShot score');
          return { model: method, score: aggr, setting, metrics };
        });
      });
  },
};
export default board;
