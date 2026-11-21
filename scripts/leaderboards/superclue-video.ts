// SuperCLUE-Video ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-video",
  url: "https://www.superclueai.com/multimodal/T2V",
  feed: "https://www.superclueai.com/data/multimodal_list/T2V/2026%E5%B9%B42%E6%9C%88.xlsx",
  roundFolder: "T2V",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 32,
  parts: ["通用能力", "场景应用"],
  settings: ["使用方式"],
  details: [{"sheet": "通用能力榜单", "model": "模型名称", "parts": ["视频画质渲染", "要素搭建能力", "动态塑造能力"]}, {"sheet": "场景应用榜单", "model": "模型名称", "parts": ["世界模拟", "影视素材", "应用设计", "中国文化"]}],
});
