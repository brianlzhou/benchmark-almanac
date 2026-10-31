// Headlines that state what the data shows, written from the numbers at build time.
import type { BenchSummary, ModelSummary } from './data.ts';
import { benchById, modelById, SATURATED } from './data.ts';
import { monthYear, score } from './format.ts';

const name = (id: string) => modelById.get(id)?.name ?? id;

export function leaderLine(s: BenchSummary, testedUntil?: string): string {
  const top = s.best;
  if (!top) return 'No scores yet';
  const tie = s.board.filter((x) => x.value === top.value).length;
  const v = score(top.value, s.b.unit ?? '%');
  const lead = tie > 1 ? `${tie} models share the top score of ${v}` : `${name(top.model)} leads with ${v}`;
  return testedUntil ? `${lead} among models released by ${monthYear(testedUntil)}` : lead;
}

export function lifeLine(s: BenchSummary): string {
  switch (s.status) {
    case 'in use': {
      const recent = new Set(s.cites.filter((c) => monthsAgo(c.card.date) < 6).map((c) => c.card.lab)).size;
      return recent > 1 ? `${recent} labs reported it in the last six months` : recent === 1 ? 'One lab reported it in the last six months' : 'New this year';
    }
    case 'fading':
      return `Fewer labs report it now. The last card was in ${monthYear(s.last)}`;
    case 'dropped':
      if (s.why === 'saturated') return `Labs dropped it once the best score passed ${SATURATED}%`;
      if (s.why === 'replaced' && s.b.successor) return `Labs moved on to ${benchById.get(s.b.successor)?.name}`;
      return `No lab has reported it since ${monthYear(s.last)}`;
    default:
      return 'No lab model card reports it yet';
  }
}

let asOf = '';
export function setAsOf(d: string) {
  asOf = d;
}
function monthsAgo(d: string) {
  const [ay, am] = d.split('-').map(Number);
  const [by, bm] = asOf.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function modelLine(m: ModelSummary): string {
  const firsts = m.results.filter((r) => r.rank === 1 && r.of >= 5);
  const n = m.m.name;
  if (firsts.length >= 2) return `${n} ranks first on ${firsts.length} of the ${m.results.filter((r) => r.of >= 5).length} benchmarks it has scores on`;
  if (firsts.length === 1) return `${n} ranks first on ${firsts[0].benchmark.name}`;
  if (m.eciRank && m.eciRank <= 10) return `${n} is number ${m.eciRank} on the Epoch Capabilities Index`;
  const top3 = m.results.filter((r) => r.rank <= 3 && r.of >= 5);
  if (top3.length) return `${n} places in the top three on ${top3.length === 1 ? top3[0].benchmark.name : `${top3.length} benchmarks`}`;
  return n;
}
