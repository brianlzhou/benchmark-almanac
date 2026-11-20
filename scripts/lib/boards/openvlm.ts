// Read one score and its model metadata from the OpenCompass multimodal results file.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

export const OPENVLM_FEED = 'http://opencompass.openxlab.space/assets/OpenVLM.json';

export type OpenVlmEntry = Record<string, Record<string, number> | undefined> & {
  META?: { Method?: [string, string?]; Time?: string; Parameters?: string; Verified?: string; OpenSource?: string };
};

/** Keep only explicit board marks and numeric sizes. */
export function openvlmInfo(meta: OpenVlmEntry['META']) {
  const params = meta?.Parameters?.match(/^(\d+(?:\.\d+)?)B$/);
  return {

    verified: meta?.Verified === 'Yes' ? true : meta?.Verified === 'No' ? false : undefined,
    open: meta?.OpenSource === 'Yes' ? true : meta?.OpenSource === 'No' ? false : undefined,
    params: params ? Number(params[1]) : undefined,
  };
}

let cache: Promise<Record<string, OpenVlmEntry>> | undefined;
const load = () => (cache ??= fetchJson<{ results: Record<string, OpenVlmEntry> }>(OPENVLM_FEED).then((d) => d.results));

/** One row per model whose `pick` returns a number, with the name, date and setting read as mmbench.ts does. */
export async function openvlmRows(pick: (e: OpenVlmEntry) => number | undefined,
  metricsOf?: (e: OpenVlmEntry) => Record<string, number>): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const e of Object.values(await load())) {
    const score = pick(e);
    let model = e.META?.Method?.[0]?.trim();
    if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;
    // the registry's only Reka Edge is the 2026 release, not the 2024 model on this board
    if (/^RekaEdge$/i.test(model)) continue;
    let date = e.META?.Time?.replace(/\//g, '-').replace(/-(\d)(?=-|$)/g, '-0$1');
    let setting: string | undefined;
    // "GPT-4o (0513, detail-high)": snapshot month and day, and the image detail level
    const snap = model.match(/\s*\((\d\d)(\d\d), (detail-\w+)\)$/);
    if (snap && date) {
      date = `${date.slice(0, 4)}-${snap[1]}-${snap[2]}`;
      setting = snap[3];
      model = model.slice(0, snap.index).trim();
    }
    rows.push({ model, score, setting, date, ...openvlmInfo(e.META), metrics: metricsOf?.(e) });
  }
  return rows;
}
