import { featuredModels } from './data.ts';

/** Models that get their own page. Everything else is named without a link. */
export const featuredIds = new Set(featuredModels.map((m) => m.id));

export const benchHref = (id: string) => `/benchmarks/${id}/`;
export const modelHref = (id: string) => (featuredIds.has(id) ? `/models/${id}/` : undefined);
export const labHref = (id: string) => `/labs/${id}/`;
