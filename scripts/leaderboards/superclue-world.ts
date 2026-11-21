// SuperCLUE-World ranks entries by 总分 on its 总榜成绩 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-world",
  url: "https://www.superclueai.com/multimodal/World",
  feed: "https://www.superclueai.com/data/multimodal_list/World/2026%E5%B9%B41%E6%9C%88.xlsx",
  roundFolder: "World",
  sheet: "总榜成绩",
  model: "模型名称",
  score: "总分",
  minimum: 8,
  parts: ["基础能力", "应用能力"],
  settings: ["使用方式"],
  details: [{"sheet": "基础能力", "model": "模型名称", "parts": ["几何 一致性", "视觉 真实感", "相机控制", "动态 性"]}, {"sheet": "应用能力", "model": "模型名称", "parts": ["商业领域", "创意设计"]}],
});
