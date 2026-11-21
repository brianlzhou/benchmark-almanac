// SuperCLUE-TTS evaluates Chinese text-to-speech systems.
// The headline is 总分 from the current workbook's 总榜 sheet, with basic and scenario scores in metrics.
// This importer reads the workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: 'superclue-tts',
  url: 'https://www.superclueai.com/multimodal/TTS',
  feed: 'https://www.superclueai.com/data/multimodal_list/TTS/2026%E5%B9%B410%E6%9C%88.xlsx',
  sheet: '总榜',
  model: '模型名称',
  score: '总分',
  minimum: 17,
  parts: ['基础能力得分', '场景应用得分'],
  details: [
    { sheet: '基础能力', model: '模型名称', parts: ['分数', '内容一致性', '内容准确性', '副语言', '情感表达', '韵律'] },
    { sheet: '场景应用', model: '模型名称', parts: ['分数', '互动陪伴', '内容配音', '有声读物', '电商营销', '语音导航', '语音播报'] },
  ],
});
