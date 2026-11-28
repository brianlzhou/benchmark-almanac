import { voiceArenaStt } from '../lib/boards/voicearena-stt.ts';
export default voiceArenaStt({
  language: 'US English',
  slug: 'us-english',
  ageBands: ['25-34', '35-44', '45-54', '55+'],
  hasHfWer: true,
});
