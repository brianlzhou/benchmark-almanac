// SuperCLUE-OnDevice ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-ondevice",
  url: "https://www.superclueai.com/specialized/Ondevice",
  feed: "https://www.superclueai.com/data/specialized_list/Ondevice/2026%E5%B9%B48%E6%9C%88.xlsx",
  roundFolder: "Ondevice",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: [],
  settings: ["类型"],
  details: [{"sheet": "文本理解", "model": "模型名称", "parts": ["分数", "事件抽取", "文档总结", "会话总结", "NER", "问答"]}, {"sheet": "图像理解", "model": "模型名称", "parts": ["分数", "视觉QA", "OCR", "信息提取", "视觉定位", "表格提取"]}, {"sheet": "视频理解", "model": "模型名称", "parts": ["分数", "视频QA", "视频时序定位"]}],
});
