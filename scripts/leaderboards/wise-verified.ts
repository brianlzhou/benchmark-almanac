// WISE_Verified changes prompts, judge and scoring. Coordinator must migrate Verified rows from wise-t2i.
import board from './wise-t2i.ts';
export default {
  ...board,
  benchmark: 'wise-verified',
  terms: 'The authors publish this public results feed. No separate score-reuse license is stated, and attribution remains with the authors.',
  stats: {},
  parts: {
    culture: { name: 'Culture', group: 'Domain' },
    space: { name: 'Space', group: 'Domain' },
    biology: { name: 'Biology', group: 'Domain' },
    physics: { name: 'Physics', group: 'Domain' },
    chemistry: { name: 'Chemistry', group: 'Domain' },
    time: { name: 'Time', group: 'Domain' },
  },
  async fetch() {
    return (await board.fetch()).map(row => {
      if (row.metrics) delete row.metrics.samples;
      return { ...row, setting: row.setting?.replace(/;\s*/g, ', ') };
    });
  },
};
