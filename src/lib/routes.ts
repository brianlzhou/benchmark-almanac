import { featuredModels } from './data.ts';

/** Models that get their own page. Everything else is named without a link. */
export const featuredIds = new Set(featuredModels.map((m) => m.id));
