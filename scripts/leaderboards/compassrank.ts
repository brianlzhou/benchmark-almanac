import {compassBoard} from '../lib/boards/compassrank.ts';
const board = compassBoard('compassrank',1);
board.parts = {
  Knowledge: { name: 'Knowledge', group: 'Domain' },
  Reasoning: { name: 'Reasoning', group: 'Domain' },
  Math: { name: 'Math', group: 'Domain' },
  Code: { name: 'Code', group: 'Domain' },
  Knowledge_Humanity: { name: 'Humanities knowledge', group: 'Domain' },
  Knowledge_Social_Science: { name: 'Social science knowledge', group: 'Domain' },
  Knowledge_Engineering: { name: 'Engineering knowledge', group: 'Domain' },
  Knowledge_Science: { name: 'Science knowledge', group: 'Domain' },
  Knowledge_CommonSense: { name: 'Common sense knowledge', group: 'Domain' },
  Common_Reasoning: { name: 'Common reasoning', group: 'Domain' },
  Academic_Reasoning: { name: 'Academic reasoning', group: 'Domain' },
  Math_College: { name: 'College math', group: 'Domain' },
  Math_Competition: { name: 'Competition math', group: 'Domain' },
  Comprehensive_Coding_Ability: { name: 'Comprehensive coding ability', group: 'Domain' },
};
export default board;