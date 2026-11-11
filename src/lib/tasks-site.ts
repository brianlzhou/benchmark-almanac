// The open tasks for the site build: src/lib/tasks.ts run on the records src/lib/data.ts already loaded.
// The /contribute/ page and /contribute/tasks.json both read this, and scripts/tasks.ts builds the same input
// from the JSON files.
import discoveredJson from '../../data/discovered.json';
import reviewedJson from '../../data/reviewed.json';
import auditFindsJson from '../../data/discovered-audits.json';
import { benchmarks, models, cards, systemCards, LEADERBOARDS, epochScores, viaBoardScores, collectedScores, leaderboardScores, cardScores, featuredModels } from './data.ts';
import { LEVELS } from './taxonomy.ts';
import { openTasks, type AuditFind, type Find, type TaskGroup } from './tasks.ts';

export const SITE = String(import.meta.env.SITE ?? 'https://benchmarks.brianzhou.org').replace(/\/$/, '');

let cached: TaskGroup[] | null = null;

export function siteTasks(): TaskGroup[] {
  if (cached) return cached;
  const modelScores = new Map<string, number>();
  for (const s of [...epochScores, ...collectedScores, ...leaderboardScores, ...cardScores]) modelScores.set(s.model, (modelScores.get(s.model) ?? 0) + 1);
  cached = openTasks({
    site: SITE,
    benchmarks,
    models,
    docs: [...cards, ...systemCards],
    boards: LEADERBOARDS,
    // independent runs from Epoch AI: its own, and boards it copied. Claims it collected don't count.
    epoch: new Set([...epochScores, ...viaBoardScores].map((s) => s.benchmark)),
    modelPages: new Set(featuredModels.map((m) => m.id)),
    modelScores,
    levels: LEVELS.map((l) => l.name),
    finds: (discoveredJson as unknown as { items: Find[] }).items,
    rejected: (reviewedJson as unknown as { rejected: { name: string }[] }).rejected.map((r) => r.name),
    audits: (auditFindsJson as unknown as { items: AuditFind[] }).items,
  });
  return cached;
}
