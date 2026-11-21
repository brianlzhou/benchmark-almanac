// MedGenVidQA ranks visual answer localization by the percentage of predictions reaching 0.7 temporal overlap.
// Table 5 of the organizers' overview reports each team's best run and the TimeLens baseline.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.bionlp-1.88.pdf";

const board: Leaderboard = {
  benchmark: "medgenvidqa-2026-visual-answer-localization", static: 'paper',
  url: "https://www.codabench.org/competitions/14015/",
  feed,
  terms: "The organizers publish the task overview in the ACL Anthology. The host has no robots.txt.",
  stats: { iou03: { name: 'Intersection over union at 0.3', unit: '%', better: 'higher' }, iou05: { name: 'Intersection over union at 0.5', unit: '%', better: 'higher' }, meanIoU: { name: 'Mean intersection over union', unit: '%', better: 'higher' } },
  async fetch() {
    const doc = await pdfText(feed);
    const table = doc.match(/Rank\s+Team\s+Run\/Model\s+IoU@0\.3\s+IoU@0\.5\s+IoU@0\.7\s+mIoU([\s\S]*?)Table 5:/)?.[1];
    if (!table) throw new Error('Missing visual localization results');
    const rows = [...table.matchAll(/^\s*(?:–|\d+)\s{2,}(.+?)\s{2,}(Best Run|TimeLens-7B)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/gm)].map(m => {
      const team = m[1].replace('S EA H AWK', 'SeaHawk');
      return { model: team === 'Baseline' ? m[2] : team, submitter: team === 'Baseline' ? undefined : team,
        score: Number(m[5]), metrics: { iou03: Number(m[3]), iou05: Number(m[4]), meanIoU: Number(m[6]) } };
    });
    if (rows.length !== 7) throw new Error('Expected six participant teams and one baseline');
    return rows;
  },
};
export default board;
