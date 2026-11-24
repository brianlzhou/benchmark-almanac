// VIPSeg evaluates large-scale video panoptic segmentation in the wild across 124 thing and
// stuff categories. This importer reads Table 3(b) (test set) and Table 3(a) (validation set)
// of the official CVPR 2022 paper from CVF Open Access, using test-set VPQ in percent as the
// headline alongside thing/stuff VPQ breakdowns, window-length VPQ1..VPQ6, test STQ, and
// validation VPQ/STQ stats.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://openaccess.thecvf.com/content/CVPR2022/papers/Miao_Large-Scale_Video_Panoptic_Segmentation_in_the_Wild_A_Benchmark_CVPR_2022_paper.pdf';

type ParsedSplitRow = {
  model: string;
  vpq: number;
  vpqThing: number;
  vpqStuff: number;
  vpq1: number;
  vpq2: number;
  vpq4: number;
  vpq6: number;
  stq: number;
};

function parseSplit(block: string): ParsedSplitRow[] {
  const rows: ParsedSplitRow[] = [];
  const triple = '(\\d+\\.\\d+)\\|(\\d+\\.\\d+)\\|(\\d+\\.\\d+)';
  const re = new RegExp(
    `^\\s*([A-Za-z][A-Za-z0-9-]+)(?:\\s*\\[\\d+\\])?\\s+(ResNet-\\d+)\\s+${triple}\\s+${triple}\\s+${triple}\\s+${triple}\\s+${triple}\\s+(\\d+\\.\\d+)\\s*$`
  );
  for (const line of block.split('\n')) {
    const m = line.match(re);
    if (!m) continue;
    rows.push({
      model: `${m[1]} (${m[2]})`,
      vpq: Number(m[15]),
      vpqThing: Number(m[16]),
      vpqStuff: Number(m[17]),
      vpq1: Number(m[3]),
      vpq2: Number(m[6]),
      vpq4: Number(m[9]),
      vpq6: Number(m[12]),
      stq: Number(m[18]),
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'vipseg',
  static: 'paper',
  url: 'https://openaccess.thecvf.com/content/CVPR2022/html/Miao_Large-Scale_Video_Panoptic_Segmentation_in_the_Wild_A_Benchmark_CVPR_2022_paper.html',
  feed: FEED,
  terms: 'Open-access CVF CVPR 2022 paper PDF. Scores remain credited to Miao et al.',
  headline: 'Headline is test-set Video Panoptic Quality (VPQ) in percent from Table 3(b), with validation VPQ and STQ from Table 3(a) reported as stats.',
  parts: {
    vpqThing: { name: 'VPQ (things)', group: 'Class type', unit: '%', better: 'higher' },
    vpqStuff: { name: 'VPQ (stuff)', group: 'Class type', unit: '%', better: 'higher' },
  },
  stats: {
    stq: { name: 'STQ', unit: '%', better: 'higher' },
    vpq1: { name: 'VPQ (k=1)', unit: '%', better: 'higher' },
    vpq2: { name: 'VPQ (k=2)', unit: '%', better: 'higher' },
    vpq4: { name: 'VPQ (k=4)', unit: '%', better: 'higher' },
    vpq6: { name: 'VPQ (k=6)', unit: '%', better: 'higher' },
    valVpq: { name: 'Validation VPQ', unit: '%', better: 'higher' },
    valStq: { name: 'Validation STQ', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const valStart = text.indexOf('(a) Results on the validation set.');
    const testStart = text.indexOf('(b) Results on the test set.', valStart);
    const end = text.indexOf('Figure 8.', testStart);
    if (valStart < 0 || testStart < 0 || end < 0) {
      throw new Error('VIPSeg Table 3 missing in CVPR 2022 PDF');
    }

    const testParsed = parseSplit(text.slice(testStart, end));
    const valParsed = parseSplit(text.slice(valStart, testStart));
    if (testParsed.length !== 4 || valParsed.length !== 4) {
      throw new Error(`VIPSeg unexpected row counts: test=${testParsed.length}, val=${valParsed.length}`);
    }

    const valByModel = new Map(valParsed.map((r) => [r.model, r]));
    const rows: LeaderboardRow[] = testParsed.map((t) => {
      const v = valByModel.get(t.model);
      return {
        model: t.model,
        score: t.vpq,
        metrics: {
          vpqThing: t.vpqThing,
          vpqStuff: t.vpqStuff,
          vpq1: t.vpq1,
          vpq2: t.vpq2,
          vpq4: t.vpq4,
          vpq6: t.vpq6,
          stq: t.stq,
          ...(v ? { valVpq: v.vpq, valStq: v.stq } : {}),
        },
      };
    });

    return checked(rows, 4);
  },
};

export default board;
