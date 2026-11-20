// WISE_Verified changes prompts, judge and scoring. Coordinator must migrate Verified rows from wise-t2i.
import board from './wise-t2i.ts';
export default {
  ...board,
  benchmark: 'wise-verified',
  parts: {
    culture: { name: 'Culture', group: 'Domain' },
    space: { name: 'Space', group: 'Domain' },
    biology: { name: 'Biology', group: 'Domain' },
    physics: { name: 'Physics', group: 'Domain' },
    chemistry: { name: 'Chemistry', group: 'Domain' },
  },
};
