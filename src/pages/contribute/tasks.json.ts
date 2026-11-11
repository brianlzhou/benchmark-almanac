// Every open task on the Contribute page, for anyone who wants the whole list or a tool that picks one.
// Each task has a stable id ("<kind>:<record id>"), the page it's about, the gap, and a prefilled issue form.
import { siteTasks } from '../../lib/tasks-site.ts';

export function GET() {
  const groups = siteTasks().map((g) => ({ kind: g.kind, title: g.title, how: g.how, count: g.tasks.length, tasks: g.tasks }));
  return new Response(JSON.stringify({ groups }), { headers: { 'Content-Type': 'application/json' } });
}
