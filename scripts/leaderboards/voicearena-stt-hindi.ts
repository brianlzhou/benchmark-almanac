import { voiceArenaStt } from '../lib/boards/voicearena-stt.ts';
export default voiceArenaStt({
  language: 'Hindi',
  slug: 'hindi',
  ageBands: ['18-22', '23-30', '31-45', '46-65'],
  hasPublicErrorBreakdown: true,
});
