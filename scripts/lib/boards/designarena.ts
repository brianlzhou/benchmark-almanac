// Design Arena (designarena.ai, run by Intelligence): people give a prompt, two anonymous models answer, and
// people vote for the better result. Votes become Bradley-Terry ratings on an Elo scale, one board per task
// (websites, 3D scenes, images, video, slides, agents and more).
//
// Every board reads the JSON the site's own leaderboard pages load: /api/leaderboard?arenaType=&category=
// (with inputModality for the image and video versions of a board). Model names come from /api/registry, which
// also says when an entry is one effort setting of a model ("Claude Opus 5.5 (high)" is a mode of Claude Opus
// 5.5), so the effort goes in `setting`. The score is the board's Elo. Win rate, battles and the rating's 95%
// interval (Elo plus or minus 1.96 standard errors, when the board gives one) go in metrics.
//
// Design Arena's terms bar automated access, and its robots.txt disallows /api/. The almanac imports it anyway
// (decided 2026-11-10) with credit and a link, as Design Arena's own API license asks of data shown publicly. The
// importer sends the almanac's user agent and reads each endpoint once per run.
import { fetchText } from '../util.ts';
import type { LeaderboardRow } from '../../leaderboards/types.ts';

/** Board names the shared resolver cannot place, when the name pins one snapshot. */
export const DA_ALIASES: Record<string, string> = {
  'Mistral Large 3 (2512)': 'mistral-large-3',
  'Mistral Medium 3.1 (2508)': 'mistral-medium-3-1',
};

export const DA_TERMS =
  "Design Arena's terms bar automated access and its robots.txt disallows /api/. The almanac reads the JSON its leaderboard pages load, once a day, and credits and links designarena.ai, as its API license asks.";

const BASE = 'https://www.designarena.ai';

export interface DaBoard {
  arenaType: 'models' | 'agents' | 'builders';
  category: string;
  inputModality?: 'text' | 'image' | 'video';
}

export const daFeed = (b: DaBoard) => {
  const q = new URLSearchParams({ arenaType: b.arenaType, category: b.category });
  if (b.inputModality) q.set('inputModality', b.inputModality);
  return `${BASE}/api/leaderboard?${q}`;
};

interface Entry {
  modelId: string;
  wins?: number;
  losses?: number;
  battles?: number;
  winRate?: number;
  elo?: number;
  btStdErr?: number | null;
}
interface RegistryModel {
  id: string;
  displayName?: string;
  modeOf?: string;
}

let registry: Promise<Record<string, RegistryModel>> | undefined;
function models(): Promise<Record<string, RegistryModel>> {
  registry ??= fetchText(`${BASE}/api/registry`).then((t) => (JSON.parse(t) as { models?: Record<string, RegistryModel> }).models ?? {});
  return registry;
}

// The effort a mode adds to its base model: "(high)" in "Claude Opus 5.5 (high)", else the id's extra suffix.
function effort(entry: RegistryModel, base: RegistryModel): string | undefined {
  const paren = entry.displayName?.match(/\(([^)]+)\)\s*$/)?.[1];
  if (paren) return paren.toLowerCase();
  const extra = entry.id.startsWith(`${base.id}-`) ? entry.id.slice(base.id.length + 1) : undefined;
  return extra || undefined;
}

export async function daRows(b: DaBoard): Promise<LeaderboardRow[]> {
  const [reg, body] = await Promise.all([models(), fetchText(daFeed(b))]);
  const d = JSON.parse(body) as { success?: boolean; data?: Entry[]; message?: string };
  if (!d.success || !Array.isArray(d.data)) throw new Error(`Design Arena ${b.arenaType}/${b.category}: ${d.message ?? 'no rows'}`);
  const rows: LeaderboardRow[] = [];
  for (const e of d.data) {
    if (typeof e.elo !== 'number') continue;
    const self = reg[e.modelId] ?? { id: e.modelId };
    const base = self.modeOf ? (reg[self.modeOf] ?? { id: self.modeOf }) : undefined;
    const metrics: Record<string, number> = {};
    if (typeof e.winRate === 'number') metrics.winRate = e.winRate;
    if (typeof e.battles === 'number') metrics.battles = e.battles;
    if (typeof e.btStdErr === 'number') {
      metrics.ciLow = Math.round((e.elo - 1.96 * e.btStdErr) * 10) / 10;
      metrics.ciHigh = Math.round((e.elo + 1.96 * e.btStdErr) * 10) / 10;
    }
    let model = (base ?? self).displayName ?? (base ?? self).id;
    let setting = base ? effort(self, base) : undefined;
    // a name that carries its own settings, "GPT Image 2.6 Sunburst (quality: max, complexity: high)" or
    // "Muse Glimmer 30B (xhigh)", keeps them as the setting. A date or version in parentheses stays in the name.
    const own = model.match(/^(.*\S)\s*\(([^)]*:[^)]*|minimal|low|medium|high|xhigh|max|thinking)\)$/i);
    if (own) {
      model = own[1];
      setting = [own[2].toLowerCase(), setting].filter(Boolean).join(', ');
    }
    rows.push({
      model,
      setting,
      score: e.elo,
      metrics,
    });
  }
  return rows;
}
