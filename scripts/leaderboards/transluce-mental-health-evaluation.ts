// Transluce reports rates of 14 behaviors during simulated mental health conversations.
// The results table puts Safety monitoring first and mixes helpful and harmful behaviors.
// The roster names the model settings. The aggregate file holds the rates and intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://behaviors.transluce.org/api/mental-health/data/';
const feed = base + '~agg.main';

// The public API encodes each record as a CBOR byte string inside a CBOR map.
function decode(bytes: Buffer): any {
  let pos = 0;
  function read(): any {
    const prefix = bytes.readUInt8(pos++);
    const type = prefix >> 5;
    const info = prefix & 31;
    if (type === 7) {
      if (info === 20 || info === 21) return info === 21;
      if (info === 22) return null;
      if (info === 27) { pos += 8; return bytes.readDoubleBE(pos - 8); }
      if (info === 26) { pos += 4; return bytes.readFloatBE(pos - 4); }
      if (info === 25) {
        const word = bytes.readUInt16BE(pos); pos += 2;
        const exponent = (word >> 10) & 31;
        return (word & 32768 ? -1 : 1) * (exponent ? 1024 + (word & 1023) : word & 1023) * 2 ** ((exponent || 1) - 25);
      }
      throw new Error('Unsupported CBOR simple value');
    }
    let size = info;
    if (info >= 24) {
      if (info > 26) throw new Error('Unsupported CBOR length');
      const width = 2 ** (info - 24);
      size = bytes.readUIntBE(pos, width); pos += width;
    }
    if (type === 0) return size;
    if (type === 1) return -1 - size;
    if (type === 2 || type === 3) {
      pos += size;
      if (pos > bytes.length) throw new Error('Truncated CBOR string');
      const data = bytes.subarray(pos - size, pos);
      return type === 2 ? data : data.toString('utf8');
    }
    if (type === 4) return Array.from({ length: size }, read);
    if (type === 5) {
      const obj = Object.create(null);
      for (let i = 0; i < size; i++) obj[read()] = read();
      return obj;
    }
    if (type === 6) return read();
    throw new Error('Invalid CBOR record');
  }
  const result = read();
  if (pos !== bytes.length) throw new Error('Unexpected trailing bytes');
  return result;
}

async function record(url: string) {
  return decode(decode(Buffer.from(await fetchBytes(url))).bytes);
}
const board: Leaderboard = {
  benchmark: 'transluce-mental-health-evaluation',
  url: 'https://behaviors.transluce.org/mental-health#table-of-results', feed,
  terms: 'Transluce publishes the report at https://behaviors.transluce.org/mental-health.',
  headline: 'The report gives no overall score. The headline is its first displayed behavior, Safety monitoring.',
  async fetch() {
    const roster = await record(base + '~roster.main');
    const { cells } = await record(feed);
    const axes = [...roster.axes.primary, ...roster.axes.additional];
    const first = roster.axes.primary.find((a: any) => a.higher_is_better);
    if (axes.length !== 14 || first?.behavior_id !== 'safety-monitoring') throw new Error('Behavior table changed');
    board.parts = Object.fromEntries(axes.map(a => [a.behavior_id, {
      name: a.display_name, unit: '%', better: a.higher_is_better ? 'higher' : 'lower',
    }]));
    const rows: LeaderboardRow[] = [];
    for (const group of roster.subsets.all.groups) {
      for (const entry of group.entries) {
        const rates = cells[entry.subj_id];
        const iv = rates[first.behavior_id].interval;
        const metrics: Record<string, number> = {};
        for (const axis of axes) {
          const interval = rates[axis.behavior_id]?.interval;
          if (interval && Number.isFinite(interval.center)) metrics[axis.behavior_id] = interval.center * 100;
        }
        rows.push({ model: entry.subj_id.replace(/^browser-/, '').replace(/-(?:thinking|reasoning|candid|cynical|efficient|friendly|professional|quirky)$/, ''),
          setting: entry.label.replace(' · ', ', ').replace('browser*', 'browser'), score: iv.center * 100,
          low: iv.lo * 100, high: iv.hi * 100, metrics });
      }
    }
    return checked(rows, 77);
  },
};
export default board;
