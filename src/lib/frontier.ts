// Which board entries count as frontier: from a frontier lab, or a frontier model when it came out. A row on a board
// carries `frontierAttrs(model)`: data-brow marks it as a board row, data-fl says its model comes from a frontier lab,
// and data-fm says the model was a frontier model when it came out. A reader settings menu ("Frontier labs only",
// "Frontier models only") will hide the rest. It is not on the site yet, so the marks change nothing for now. An entry
// with no model record keeps neither mark.
import { models, modelById } from './data.ts';
import { FRONTIER } from './reporting-view.ts';
import { isFrontierRelease } from './reporting.ts';

let fm: Set<string> | null = null;
/** True for a model that ranked in the top ten on Epoch AI's Capabilities Index among the models out on its release day. */
export function isFrontierModel(id: string | null | undefined): boolean {
  fm ??= new Set(models.filter((m) => m.released && isFrontierRelease(m.id, m.released)).map((m) => m.id));
  return !!id && fm.has(id);
}

/** True for a model from one of the frontier labs. */
export const isFrontierLab = (id: string | null | undefined): boolean => !!id && FRONTIER.has(modelById.get(id)?.lab ?? '');

/** The attributes that let the frontier settings hide a board row: spread them onto the row. */
export function frontierAttrs(model: string | null | undefined): Record<string, string> {
  return { 'data-brow': '', ...(isFrontierLab(model) ? { 'data-fl': '' } : {}), ...(isFrontierModel(model) ? { 'data-fm': '' } : {}) };
}
