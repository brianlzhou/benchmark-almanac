// SuperCLUE-Voice (audiovisual interaction) ranks entries by 总分 on its 总分排名 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-voice-audiovisual-interaction",
  url: "https://www.superclueai.com/multimodal/Voice_video",
  feed: "https://www.superclueai.com/data/multimodal_list/Voice_video/2025%E5%B9%B41%E6%9C%88.xlsx",
  roundFolder: "Voice_video",
  sheet: "总分排名",
  model: "产品名称",
  score: "总分",
  minimum: 5,
  parts: ["基础认知能力", "视觉推理能力", "记忆能力", "语音交互能力", "应用场景"],
  details: [{"sheet": "测评产品列表", "model": "产品名称", "parts": []}],
});
