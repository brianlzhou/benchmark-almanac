// SuperCLUE-Voice (speech interaction) ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-voice-speech-interaction",
  url: "https://www.superclueai.com/multimodal/Voice_talk",
  feed: "https://www.superclueai.com/data/multimodal_list/Voice_talk/2024%E5%B9%B412%E6%9C%88.xlsx",
  roundFolder: "Voice_talk",
  sheet: "总榜",
  model: "产品名称",
  score: "总分",
  minimum: 8,
  parts: ["语音交互", "通用能力", "场景应用", "响应速度"],
  details: [{"sheet": "语音交互", "model": "产品名称", "parts": ["打断", "说话风格", "语言理解", "语音自然度"]}, {"sheet": "通用能力", "model": "产品名称", "parts": ["记忆能力", "联网能力", "传统安全", "推理能力", "指令遵循"]}, {"sheet": "场景应用", "model": "产品名称", "parts": ["实时翻译", "教育辅导", "情感咨询", "健康咨询", "购物客服"]}, {"sheet": "响应速度", "model": "产品名称", "parts": ["延迟（ms）"]}, {"sheet": "十五大能力", "model": "产品名称", "parts": ["总成绩"]}, {"sheet": "测评产品列表", "model": "产品名称", "parts": []}],
});
