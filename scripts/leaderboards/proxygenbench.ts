// ProxyGenBench: proxy-guided video generation leaderboard ranked by Strict score, with without-audio and with-audio reference splits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://2kxx.github.io/ProxyGenBench/app.js';

type RawTuple = [string, number, number, number, number, number, number];

function parseGroupTuples(block: string): RawTuple[] {
  const out: RawTuple[] = [];
  const re = /\[\s*"([^"]+)"\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    out.push([
      m[1],
      Number(m[2]),
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6]),
      Number(m[7]),
    ]);
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'proxygenbench',
  url: 'https://2kxx.github.io/ProxyGenBench/#results',
  feed: FEED,
  static: 'paper',
  terms: 'Public paper results published by the ProxyGenBench authors on the official project site.',
  aliases: {
    'Seedance-2.5': 'dreamina-seedance-2-5',
    'Seedance-2.0': 'dreamina-seedance-2-0',
  },
  parts: {
    preserve: { name: 'Preserve', group: 'Without audio references' },
    complete: { name: 'Complete', group: 'Without audio references' },
    bind: { name: 'Bind', group: 'Without audio references' },
    average: { name: 'Average', group: 'Without audio references' },
    audioStrict: { name: 'Strict (with audio)', group: 'With audio references' },
    audioPreserve: { name: 'Preserve (with audio)', group: 'With audio references' },
    audioComplete: { name: 'Complete (with audio)', group: 'With audio references' },
    audioBind: { name: 'Bind (with audio)', group: 'With audio references' },
    audioAverage: { name: 'Average (with audio)', group: 'With audio references' },
  },
  stats: {
    joint: {
      name: 'Joint pass rate',
      unit: '%',
      better: 'higher',
      note: 'Percentage of outputs passing all critical Preserve checks without audio references.',
    },
    audioJoint: {
      name: 'Joint pass rate (with audio)',
      unit: '%',
      better: 'higher',
      note: 'Percentage of outputs passing all critical Preserve checks with audio references.',
    },
  },

  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const blockMatch = js.match(/const\s+rows\s*=\s*\{([\s\S]*?)\n\s*\};/);
    if (!blockMatch) throw new Error('Missing rows object in ProxyGenBench app.js');
    const body = blockMatch[1];
    const audioIdx = body.search(/\baudio\s*:/);
    const noAudioBlock = audioIdx >= 0 ? body.slice(0, audioIdx) : body;
    const audioBlock = audioIdx >= 0 ? body.slice(audioIdx) : '';

    const noAudioRows = parseGroupTuples(noAudioBlock);
    const audioByModel = new Map<string, RawTuple>();
    if (audioBlock) {
      for (const t of parseGroupTuples(audioBlock)) {
        audioByModel.set(t[0], t);
      }
    }

    if (noAudioRows.length < 4) {
      throw new Error(`Expected ProxyGenBench rows, got ${noAudioRows.length}`);
    }

    return noAudioRows.map(([model, preserve, complete, bind, average, strict, joint]) => {
      const metrics: Record<string, number> = {
        preserve,
        complete,
        bind,
        average,
        joint,
      };
      const audio = audioByModel.get(model);
      if (audio) {
        metrics.audioPreserve = audio[1];
        metrics.audioComplete = audio[2];
        metrics.audioBind = audio[3];
        metrics.audioAverage = audio[4];
        metrics.audioStrict = audio[5];
        metrics.audioJoint = audio[6];
      }
      return {
        model,
        score: strict,
        metrics,
      };
    });
  },
};

export default board;
